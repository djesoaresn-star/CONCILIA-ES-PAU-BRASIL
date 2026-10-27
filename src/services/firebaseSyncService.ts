import {
  db,
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  OperationType,
  handleFirestoreError,
  isQuotaExceeded,
  markQuotaExceeded,
  clearQuotaExceededAndReconnect,
  disableNetwork,
  onSnapshot,
} from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import type {
  StockPositionItem,
  QuebraItem,
  ValeItem,
  TrocaItem,
  FaltaMapeadaItem,
  FrozenReconciliation,
  UserAccount,
  ProductMaster,
} from '../types';
import {
  SyncDatasetKey,
  DatasetSyncStamp,
  WorkspaceSyncMeta,
  getOrCreateClientId,
  setLocalDatasetStamp,
} from '../utils/persistentStorage';

export { isQuotaExceeded, markQuotaExceeded, clearQuotaExceededAndReconnect };

export interface InversaoSyncPayload {
  deposito: string;
  baseMode: string;
  fullPairs?: any[];
  customPairs?: Record<string, { qtdSobra: number; qtdSaida: number }>;
  deletedKeys?: string[];
  atualizadoEm?: string;
}

export interface SnapshotLoadResult<T> {
  items: T[];
  updatedAt: number;
  isExplicitEmpty: boolean;
  exists: boolean;
}

const MAX_CHUNK_BYTES = 480_000; // Safe margin well below Firestore's 1MB (1,048,576 bytes) document limit

function sanitizeDocId(rawId: string, fallback: string = 'doc'): string {
  const sanitized = String(rawId || '')
    .replace(/[^a-zA-Z0-9_\-\.:]/g, '_')
    .substring(0, 120);
  return sanitized || `${fallback}_${Date.now()}`;
}

export function checkAndHandleQuotaError(error: unknown, path: string): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  if (
    code === 'resource-exhausted' ||
    msg.includes('resource-exhausted') ||
    msg.includes('Quota exceeded') ||
    msg.includes('QUOTA_EXCEEDED') ||
    msg.includes('maximum backoff delay')
  ) {
    markQuotaExceeded();
    try {
      disableNetwork(db).catch(() => {});
    } catch {}
    console.warn(
      `[Firebase] Quota limite do Firestore atingido (${path}). Operando em modo local persistente.`
    );
    return true;
  }
  return false;
}

function safeHandleFirestoreError(error: unknown, op: OperationType, path: string): void {
  if (checkAndHandleQuotaError(error, path)) return;
  const msg = error instanceof Error ? error.message : String(error);
  if (
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('client is offline')
  ) {
    console.warn(`[Firebase] Conexão indisponível (${path}):`, msg);
    return;
  }
  try {
    handleFirestoreError(error, op, path);
  } catch (e) {
    console.warn(`[Firebase] Operação tratada localmente (${path}):`, e);
  }
}

function cleanObjectForFirestore(obj: any): any {
  if (obj === undefined || obj === null) return null;
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) return 0;
    return obj;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanObjectForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    result[key] = cleanObjectForFirestore(value);
  }
  return result;
}

function splitIntoByteSafeChunks<T>(items: T[]): T[][] {
  if (!items || items.length === 0) return [[]];
  const chunks: T[][] = [];
  let currentChunk: T[] = [];
  let currentBytes = 0;

  for (const item of items) {
    const serializedLen = JSON.stringify(item).length + 4;
    if (currentChunk.length > 0 && currentBytes + serializedLen > MAX_CHUNK_BYTES) {
      chunks.push(currentChunk);
      currentChunk = [item];
      currentBytes = serializedLen;
    } else {
      currentChunk.push(item);
      currentBytes += serializedLen;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  return chunks.length > 0 ? chunks : [[]];
}

async function updateWorkspaceMetaStamp(
  datasetKey: SyncDatasetKey,
  stamp: DatasetSyncStamp
): Promise<void> {
  if (isQuotaExceeded()) return;
  try {
    await setDoc(
      doc(db, 'systemSnapshots', 'workspaceMeta'),
      cleanObjectForFirestore({
        datasets: {
          [datasetKey]: stamp,
        },
        updatedAt: stamp.updatedAt,
        atualizadoEm: new Date(stamp.updatedAt).toISOString(),
        clientId: stamp.clientId,
      }),
      { merge: true }
    );
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.WRITE, 'systemSnapshots/workspaceMeta');
  }
}

export async function loadWorkspaceMetaFromFirestore(): Promise<WorkspaceSyncMeta> {
  if (isQuotaExceeded()) return {};
  const path = 'systemSnapshots/workspaceMeta';
  try {
    const snap = await getDoc(doc(db, 'systemSnapshots', 'workspaceMeta'));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.datasets && typeof data.datasets === 'object') {
        return data.datasets as WorkspaceSyncMeta;
      }
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.GET, path);
  }
  return {};
}

export function subscribeToWorkspaceMeta(
  onMetaUpdate: (meta: WorkspaceSyncMeta) => void
): () => void {
  if (isQuotaExceeded()) return () => {};
  const path = 'systemSnapshots/workspaceMeta';
  try {
    const unsubscribe = onSnapshot(
      doc(db, 'systemSnapshots', 'workspaceMeta'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.datasets && typeof data.datasets === 'object') {
            onMetaUpdate(data.datasets as WorkspaceSyncMeta);
          }
        }
      },
      (error) => {
        safeHandleFirestoreError(error, OperationType.GET, path);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

async function saveChunkedSnapshot<T>(
  snapshotKey: string,
  datasetKey: SyncDatasetKey,
  rawItems: T[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  if ((!rawItems || rawItems.length === 0) && !options?.isExplicitEmpty) {
    return false;
  }

  const path = `systemSnapshots/${snapshotKey}`;
  try {
    const cleanedAll = (rawItems || []).map((item) => cleanObjectForFirestore(item));
    const chunks = splitIntoByteSafeChunks(cleanedAll);
    const nowMs = options?.updatedAt ?? Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const clientId = getOrCreateClientId();

    // Write primary document (chunk 0 + manifest metadata)
    await setDoc(doc(db, 'systemSnapshots', snapshotKey), {
      items: chunks[0] || [],
      chunkCount: chunks.length,
      totalCount: cleanedAll.length,
      isExplicitEmpty: Boolean(options?.isExplicitEmpty && cleanedAll.length === 0),
      updatedAt: nowMs,
      atualizadoEm: nowIso,
      clientId,
    });

    // Write additional chunks if payload > 480KB
    if (chunks.length > 1) {
      const partPromises: Promise<void>[] = [];
      for (let idx = 1; idx < chunks.length; idx++) {
        partPromises.push(
          setDoc(doc(db, 'systemSnapshots', `${snapshotKey}_part_${idx}`), {
            items: chunks[idx],
            partIndex: idx,
            updatedAt: nowMs,
            atualizadoEm: nowIso,
          })
        );
      }
      await Promise.all(partPromises);
    }

    const stamp: DatasetSyncStamp = {
      updatedAt: nowMs,
      count: cleanedAll.length,
      clientId,
      isExplicitEmpty: options?.isExplicitEmpty || undefined,
    };

    setLocalDatasetStamp(datasetKey, stamp);
    await updateWorkspaceMetaStamp(datasetKey, stamp);
    return true;
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function loadChunkedSnapshot<T>(
  snapshotKey: string
): Promise<SnapshotLoadResult<T>> {
  if (isQuotaExceeded()) {
    return { items: [], updatedAt: 0, isExplicitEmpty: false, exists: false };
  }
  const path = `systemSnapshots/${snapshotKey}`;
  try {
    const mainSnap = await getDoc(doc(db, 'systemSnapshots', snapshotKey));
    if (!mainSnap.exists()) {
      return { items: [], updatedAt: 0, isExplicitEmpty: false, exists: false };
    }
    const data = mainSnap.data() || {};
    const firstChunk: T[] = Array.isArray(data.items) ? (data.items as T[]) : [];
    const chunkCount = typeof data.chunkCount === 'number' && data.chunkCount > 1 ? data.chunkCount : 1;
    const updatedAt =
      typeof data.updatedAt === 'number'
        ? data.updatedAt
        : data.atualizadoEm
        ? Date.parse(data.atualizadoEm) || 0
        : 0;
    const isExplicitEmpty = Boolean(data.isExplicitEmpty);

    if (chunkCount <= 1) {
      return {
        items: firstChunk,
        updatedAt,
        isExplicitEmpty,
        exists: true,
      };
    }

    const partPromises: Promise<T[]>[] = [];
    for (let idx = 1; idx < chunkCount; idx++) {
      partPromises.push(
        getDoc(doc(db, 'systemSnapshots', `${snapshotKey}_part_${idx}`)).then((pSnap) => {
          if (pSnap.exists()) {
            const pData = pSnap.data();
            return Array.isArray(pData?.items) ? (pData.items as T[]) : [];
          }
          return [];
        })
      );
    }
    const extraParts = await Promise.all(partPromises);
    const combined = firstChunk.concat(...extraParts);

    return {
      items: combined,
      updatedAt,
      isExplicitEmpty,
      exists: true,
    };
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.GET, path);
    return { items: [], updatedAt: 0, isExplicitEmpty: false, exists: false };
  }
}

/**
 * Authentication with Google via Firebase Auth
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

export async function logoutFirebase() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Erro ao sair do Firebase:', error);
    throw error;
  }
}

function serializeStockItem(item: StockPositionItem): Record<string, any> {
  return {
    id: item.id,
    deposito: String(item.deposito || '01').substring(0, 10),
    armazem: String(item.armazem || item.deposito || '01').substring(0, 10),
    produto: String(item.produto || '').substring(0, 50),
    descricao: String(item.descricao || '').substring(0, 220),
    grupo: String(item.grupo || 'GERAL').substring(0, 60),
    disponivelRaw: String(item.disponivelRaw || '0/00').substring(0, 50),
    inventarioRaw: String(item.inventarioRaw || '0/00').substring(0, 50),
    disponivelSkus: Number(item.disponivelSkus || 0),
    disponivelLooseUnits: Number(item.disponivelLooseUnits || 0),
    disponivelTotalUnits: Number(item.disponivelTotalUnits || 0),
    inventarioSkus: Number(item.inventarioSkus || 0),
    inventarioLooseUnits: Number(item.inventarioLooseUnits || 0),
    inventarioTotalUnits: Number(item.inventarioTotalUnits || 0),
    diferencaSkus: Number(item.diferencaSkus || 0),
    diferencaLooseUnits: Number(item.diferencaLooseUnits || 0),
    diferencaTotalUnits: Number(item.diferencaTotalUnits || 0),
    diferencaRaw: String(item.diferencaRaw || '0/00').substring(0, 50),
    status: item.status || 'OK',
    custoMedio: Number(item.custoMedio || 0),
    valorUnitario: Number(item.valorUnitario || 0),
    valorCaixa: Number(item.valorCaixa || 0),
    impactoFinanceiro: Number(item.impactoFinanceiro || 0),
    prejuizoFinanceiro: Number(item.prejuizoFinanceiro || 0),
    sobraFinanceira: Number(item.sobraFinanceira || 0),
    impactoHl: Number(item.impactoHl || 0),
    fatorSku: Number(item.fatorSku || 1),
    fatorHl: Number(item.fatorHl || 0),
    recontado: Boolean(item.recontado),
    saldoNegativoDesconsiderado: Boolean(item.saldoNegativoDesconsiderado),
  };
}

/**
 * Cloud Sync for Stock Positions (Conciliação 02.05.02)
 */
export async function saveStockPositionsToFirestore(
  items: StockPositionItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  const mapped = (items || []).map(serializeStockItem);
  return saveChunkedSnapshot('stockPositionsSnapshot', 'stockPositions', mapped, options);
}

export async function loadStockPositionsSnapshotDetailed(): Promise<
  SnapshotLoadResult<StockPositionItem>
> {
  const res = await loadChunkedSnapshot<StockPositionItem>('stockPositionsSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  // Legacy fallback
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'stockPositions'));
    const list: StockPositionItem[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.produto) list.push(d as StockPositionItem);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (err) {
    safeHandleFirestoreError(err, OperationType.LIST, 'stockPositions');
  }
  return res;
}

export async function loadStockPositionsFromFirestore(): Promise<StockPositionItem[]> {
  const res = await loadStockPositionsSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Grade de Estoque Positions (02.05.02 da Grade)
 */
export async function saveGradePositionsToFirestore(
  items: StockPositionItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  const mapped = (items || []).map(serializeStockItem);
  return saveChunkedSnapshot('gradePositionsSnapshot', 'gradePositions', mapped, options);
}

export async function loadGradePositionsSnapshotDetailed(): Promise<
  SnapshotLoadResult<StockPositionItem>
> {
  const res = await loadChunkedSnapshot<StockPositionItem>('gradePositionsSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const gradeSnap = await getDoc(doc(db, 'gradePositions', 'gradePositionsSnapshot')).catch(
      () => null
    );
    if (gradeSnap && gradeSnap.exists()) {
      const data = gradeSnap.data();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        const ts = data.atualizadoEm ? Date.parse(data.atualizadoEm) || 1 : 1;
        return {
          items: data.items as StockPositionItem[],
          updatedAt: ts,
          isExplicitEmpty: false,
          exists: true,
        };
      }
    }
  } catch (err) {
    safeHandleFirestoreError(err, OperationType.GET, 'gradePositions');
  }
  return res;
}

export async function loadGradePositionsFromFirestore(): Promise<StockPositionItem[]> {
  const res = await loadGradePositionsSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Quebras (Snapshot Consolidado)
 */
export async function saveQuebrasToFirestore(
  quebras: QuebraItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  return saveChunkedSnapshot('quebrasSnapshot', 'quebras', quebras || [], options);
}

export async function loadQuebrasSnapshotDetailed(): Promise<SnapshotLoadResult<QuebraItem>> {
  const res = await loadChunkedSnapshot<QuebraItem>('quebrasSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'quebras'));
    const list: QuebraItem[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && item.sku) list.push(item as QuebraItem);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'quebras');
  }
  return res;
}

export async function loadQuebrasFromFirestore(): Promise<QuebraItem[]> {
  const res = await loadQuebrasSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Vales (Snapshot Consolidado)
 */
export async function saveValesToFirestore(
  vales: ValeItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  return saveChunkedSnapshot('valesSnapshot', 'vales', vales || [], options);
}

export async function loadValesSnapshotDetailed(): Promise<SnapshotLoadResult<ValeItem>> {
  const res = await loadChunkedSnapshot<ValeItem>('valesSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'vales'));
    const list: ValeItem[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && (item.codigo || item.id)) list.push(item as ValeItem);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'vales');
  }
  return res;
}

export async function loadValesFromFirestore(): Promise<ValeItem[]> {
  const res = await loadValesSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Trocas (Snapshot Consolidado)
 */
export async function saveTrocasToFirestore(
  trocas: TrocaItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  return saveChunkedSnapshot('trocasSnapshot', 'trocas', trocas || [], options);
}

export async function loadTrocasSnapshotDetailed(): Promise<SnapshotLoadResult<TrocaItem>> {
  const res = await loadChunkedSnapshot<TrocaItem>('trocasSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'trocas'));
    const list: TrocaItem[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && (item.codigos || item.sku || item.id)) list.push(item as TrocaItem);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'trocas');
  }
  return res;
}

export async function loadTrocasFromFirestore(): Promise<TrocaItem[]> {
  const res = await loadTrocasSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Faltas Mapeadas (Snapshot Consolidado)
 */
export async function saveFaltasToFirestore(
  faltas: FaltaMapeadaItem[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  return saveChunkedSnapshot('faltasSnapshot', 'faltasMapeadas', faltas || [], options);
}

export async function deleteFaltaFromFirestore(id: string): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  try {
    await deleteDoc(doc(db, 'faltasMapeadas', sanitizeDocId(id, 'f'))).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export async function deleteFaltasBatchFromFirestore(ids: string[]): Promise<boolean> {
  if (isQuotaExceeded() || !ids || ids.length === 0) return false;
  try {
    await Promise.all(
      ids.map((id) => deleteDoc(doc(db, 'faltasMapeadas', sanitizeDocId(id, 'f'))).catch(() => {}))
    );
    return true;
  } catch {
    return false;
  }
}

export async function loadFaltasSnapshotDetailed(): Promise<
  SnapshotLoadResult<FaltaMapeadaItem>
> {
  const res = await loadChunkedSnapshot<FaltaMapeadaItem>('faltasSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'faltasMapeadas'));
    const list: FaltaMapeadaItem[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && (item.codigo || item.id)) list.push(item as FaltaMapeadaItem);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'faltasMapeadas');
  }
  return res;
}

export async function loadFaltasFromFirestore(): Promise<FaltaMapeadaItem[]> {
  const res = await loadFaltasSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Frozen Reconciliations (Snapshot Consolidado + Individual)
 */
export async function saveFrozenReconciliationsSnapshotToFirestore(
  items: FrozenReconciliation[],
  options?: { updatedAt?: number; isExplicitEmpty?: boolean }
): Promise<boolean> {
  return saveChunkedSnapshot('frozenSnapshot', 'frozenReconciliations', items || [], options);
}

export async function saveFrozenReconciliationToFirestore(
  item: FrozenReconciliation
): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  const path = 'frozenReconciliations';
  try {
    const docId = sanitizeDocId(item.id, 'fr');
    await setDoc(doc(db, path, docId), cleanObjectForFirestore(item), { merge: true });
    return true;
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function loadFrozenSnapshotDetailed(): Promise<
  SnapshotLoadResult<FrozenReconciliation>
> {
  const res = await loadChunkedSnapshot<FrozenReconciliation>('frozenSnapshot');
  if (res.exists && (res.items.length > 0 || res.isExplicitEmpty)) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'frozenReconciliations'));
    const list: FrozenReconciliation[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && (item.nome || item.id)) list.push(item as FrozenReconciliation);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'frozenReconciliations');
  }
  return res;
}

export async function loadFrozenReconciliationsFromFirestore(): Promise<FrozenReconciliation[]> {
  const res = await loadFrozenSnapshotDetailed();
  return res.items;
}

export async function deleteFrozenReconciliationFromFirestore(id: string): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  try {
    const docId = sanitizeDocId(id, 'fr');
    await deleteDoc(doc(db, 'frozenReconciliations', docId));
    return true;
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.DELETE, 'frozenReconciliations');
    return false;
  }
}

/**
 * Cloud Sync for User Profiles
 */
export async function saveUsersSnapshotToFirestore(
  users: UserAccount[],
  options?: { updatedAt?: number }
): Promise<boolean> {
  return saveChunkedSnapshot('usersSnapshot', 'users', users || [], options);
}

export async function saveUserToFirestore(user: UserAccount): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  const path = 'users';
  try {
    const docId = sanitizeDocId(user.id, 'u');
    await setDoc(doc(db, path, docId), cleanObjectForFirestore(user), { merge: true });
    return true;
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function loadUsersSnapshotDetailed(): Promise<SnapshotLoadResult<UserAccount>> {
  const res = await loadChunkedSnapshot<UserAccount>('usersSnapshot');
  if (res.exists && res.items.length > 0) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserAccount[] = [];
    snap.forEach((d) => {
      const item = d.data();
      if (item && (item.nome || item.matricula || item.usuario)) list.push(item as UserAccount);
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (error) {
    safeHandleFirestoreError(error, OperationType.LIST, 'users');
  }
  return res;
}

export async function loadUsersFromFirestore(): Promise<UserAccount[]> {
  const res = await loadUsersSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for Inversão (Table of Inversions, Custom Quantities & Excluded Pairs)
 */
export async function saveInversoesToFirestore(payload: InversaoSyncPayload): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  const path = 'inversoes';
  const docId = sanitizeDocId(
    `${payload.deposito || 'ALL'}_${payload.baseMode || 'conciliacao'}`,
    'inversao_state'
  );
  try {
    const docRef = doc(db, path, docId);
    const cleaned = cleanObjectForFirestore({
      id: docId,
      deposito: String(payload.deposito || 'ALL'),
      baseMode: String(payload.baseMode || 'conciliacao'),
      deletedKeys: Array.isArray(payload.deletedKeys) ? payload.deletedKeys : [],
      customPairs: payload.customPairs ? JSON.stringify(payload.customPairs) : '{}',
      fullPairs: payload.fullPairs ? JSON.stringify(payload.fullPairs) : '[]',
      atualizadoEm: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (error) {
    if (checkAndHandleQuotaError(error, path)) return false;
    console.warn('[Firebase] Warning saving inversoes to Firestore:', error);
    return false;
  }
}

export async function loadInversoesFromFirestore(
  deposito: string = 'ALL',
  baseMode: string = 'conciliacao'
): Promise<InversaoSyncPayload | null> {
  if (isQuotaExceeded()) return null;
  const path = 'inversoes';
  const docId = sanitizeDocId(
    `${deposito || 'ALL'}_${baseMode || 'conciliacao'}`,
    'inversao_state'
  );
  try {
    const docRef = doc(db, path, docId);
    const snap = await getDoc(docRef).catch(() => null);
    if (snap && snap.exists()) {
      const data = snap.data();
      let customPairs = {};
      let fullPairs = [];
      try {
        if (typeof data.customPairs === 'string') customPairs = JSON.parse(data.customPairs);
      } catch {}
      try {
        if (typeof data.fullPairs === 'string') fullPairs = JSON.parse(data.fullPairs);
      } catch {}
      return {
        deposito: data.deposito,
        baseMode: data.baseMode,
        deletedKeys: Array.isArray(data.deletedKeys) ? data.deletedKeys : [],
        customPairs,
        fullPairs,
        atualizadoEm: data.atualizadoEm,
      };
    }
  } catch (error) {
    if (checkAndHandleQuotaError(error, path)) return null;
    console.warn('[Firebase] Warning loading inversoes from Firestore:', error);
  }
  return null;
}

export async function loadAllInversoesFromFirestore(): Promise<InversaoSyncPayload[]> {
  if (isQuotaExceeded()) return [];
  const path = 'inversoes';
  try {
    const snap = await getDocs(collection(db, path));
    const list: InversaoSyncPayload[] = [];
    snap.forEach((d) => {
      const data = d.data();
      let customPairs = {};
      let fullPairs = [];
      try {
        if (typeof data.customPairs === 'string') customPairs = JSON.parse(data.customPairs);
      } catch {}
      try {
        if (typeof data.fullPairs === 'string') fullPairs = JSON.parse(data.fullPairs);
      } catch {}
      list.push({
        deposito: data.deposito,
        baseMode: data.baseMode,
        deletedKeys: Array.isArray(data.deletedKeys) ? data.deletedKeys : [],
        customPairs,
        fullPairs,
        atualizadoEm: data.atualizadoEm,
      });
    });
    return list;
  } catch (error) {
    if (checkAndHandleQuotaError(error, path)) return [];
    console.warn('[Firebase] Warning loading all inversoes from Firestore:', error);
    return [];
  }
}

/**
 * Cloud Sync for Products Master Catalog (Snapshot Consolidado)
 */
export async function saveProductsToFirestore(
  products: ProductMaster[],
  options?: { updatedAt?: number }
): Promise<boolean> {
  const cleanedProducts = (products || []).map((prod) => ({
    codigo: String(prod.codigo || (prod as any).sku || ''),
    descricao: String(prod.descricao || ''),
    fatorSku: Number(prod.fatorSku || 1),
    fatorPallet: Number(prod.fatorPallet || 1),
    embalagem: String(prod.embalagem || ''),
    grupo: String(prod.grupo || 'GERAL'),
    valor: Number(prod.valor || 0),
    valorUnit: Number(prod.valorUnit || 0),
    fatorHl: Number(prod.fatorHl || 0),
    idade: Number(prod.idade || 180),
  }));
  return saveChunkedSnapshot('productsSnapshot', 'products', cleanedProducts, options);
}

export async function loadProductsSnapshotDetailed(): Promise<SnapshotLoadResult<ProductMaster>> {
  const res = await loadChunkedSnapshot<ProductMaster>('productsSnapshot');
  if (res.exists && res.items.length > 0) {
    return res;
  }
  if (isQuotaExceeded()) return res;
  try {
    const snap = await getDocs(collection(db, 'products'));
    const list: ProductMaster[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data && (data.codigo || data.sku)) {
        list.push({
          codigo: data.codigo || data.sku,
          descricao: data.descricao || '',
          fatorSku: Number(data.fatorSku || 1),
          fatorPallet: Number(data.fatorPallet || 1),
          embalagem: data.embalagem || '',
          grupo: data.grupo || 'GERAL',
          valor: Number(data.valor || 0),
          valorUnit: Number(data.valorUnit || 0),
          fatorHl: Number(data.fatorHl || 0),
          idade: Number(data.idade || 180),
        });
      }
    });
    if (list.length > 0) {
      return { items: list, updatedAt: 1, isExplicitEmpty: false, exists: true };
    }
  } catch (err) {
    safeHandleFirestoreError(err, OperationType.LIST, 'products');
  }
  return res;
}

export async function loadProductsFromFirestore(): Promise<ProductMaster[]> {
  const res = await loadProductsSnapshotDetailed();
  return res.items;
}

/**
 * Cloud Sync for App Settings (e.g. Weekly Billing Status)
 */
export async function saveAppSettingsToFirestore(
  key: string,
  data: any,
  options?: { updatedAt?: number }
): Promise<boolean> {
  if (isQuotaExceeded()) return false;
  const path = 'appSettings';
  const nowMs = options?.updatedAt ?? Date.now();
  const clientId = getOrCreateClientId();
  try {
    const docRef = doc(db, path, sanitizeDocId(key, 'setting'));
    const cleaned = cleanObjectForFirestore({
      key,
      payload: typeof data === 'object' ? JSON.stringify(data) : data,
      updatedAt: nowMs,
      atualizadoEm: new Date(nowMs).toISOString(),
      clientId,
    });
    await setDoc(docRef, cleaned, { merge: true });

    if (key === 'weeklyBillingStatus') {
      const stamp: DatasetSyncStamp = {
        updatedAt: nowMs,
        count: data && typeof data === 'object' ? Object.keys(data).length : 1,
        clientId,
      };
      setLocalDatasetStamp('weeklyBillingStatus', stamp);
      await updateWorkspaceMetaStamp('weeklyBillingStatus', stamp);
    }
    return true;
  } catch (err) {
    if (checkAndHandleQuotaError(err, path)) return false;
    console.warn('[Firebase] Warning saving appSettings to Firestore:', err);
    return false;
  }
}

export async function loadAppSettingsDetailedFromFirestore<T>(
  key: string
): Promise<{ value: T | null; updatedAt: number }> {
  if (isQuotaExceeded()) return { value: null, updatedAt: 0 };
  const path = 'appSettings';
  try {
    const docSnap = await getDoc(doc(db, path, sanitizeDocId(key, 'setting')));
    if (docSnap.exists()) {
      const d = docSnap.data();
      const updatedAt =
        typeof d.updatedAt === 'number'
          ? d.updatedAt
          : d.atualizadoEm
          ? Date.parse(d.atualizadoEm) || 1
          : 1;
      let parsedVal: T | null = null;
      if (typeof d.payload === 'string') {
        try {
          parsedVal = JSON.parse(d.payload) as T;
        } catch {
          parsedVal = d.payload as unknown as T;
        }
      } else {
        parsedVal = (d.payload ?? null) as T | null;
      }
      return { value: parsedVal, updatedAt };
    }
  } catch (err) {
    if (checkAndHandleQuotaError(err, path)) return { value: null, updatedAt: 0 };
    console.warn('[Firebase] Warning loading appSettings from Firestore:', err);
  }
  return { value: null, updatedAt: 0 };
}

export async function loadAppSettingsFromFirestore<T>(key: string): Promise<T | null> {
  const res = await loadAppSettingsDetailedFromFirestore<T>(key);
  return res.value;
}
