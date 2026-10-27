import React, { useState, useEffect, useRef } from 'react';
import { 
  ViewTab, 
  DepositoId, 
  ProductMaster, 
  StockPositionItem, 
  QuebraItem, 
  ValeItem, 
  TrocaItem, 
  FaltaMapeadaItem,
  UserAccount,
  FrozenReconciliation
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_STOCK_POSITIONS, 
  INITIAL_QUEBRAS, 
  INITIAL_VALES, 
  INITIAL_TROCAS, 
  INITIAL_FALTAS_MAPEADAS,
  DEPOSITOS
} from './data/initialData';
import { QUEBRAS_SETEMBRO_08_12_2026 } from './data/quebrasSetembroData';
import { INITIAL_USERS } from './data/initialUsers';
import { sanitizeAndDeduplicateQuebras, ensureCompleteHistoricalQuebras, EXCLUDED_QUEBRA_IDS } from './utils/quebrasDeduplicator';
import { getSkuUnitMetrics } from './utils/productCatalog';
import { parseDateSafe } from './utils/quebrasReports';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ConciliacaoView } from './components/ConciliacaoView';
import { GradeEstoqueView } from './components/GradeEstoqueView';
import { CongeladasView } from './components/CongeladasView';
import { DifDiariaView } from './components/DifDiariaView';
import { DifMensalView } from './components/DifMensalView';
import { QuebrasView } from './components/QuebrasView';
import { SEED_FROZEN_RECONCILIATIONS } from './data/initialFrozenData';
import { ValesView } from './components/ValesView';
import { TrocasView } from './components/TrocasView';
import { FaltasView } from './components/FaltasView';
import { ProdutosView } from './components/ProdutosView';
import { LoginView } from './components/LoginView';
import { InitialLoginView } from './components/InitialLoginView';
import { InversaoView } from './components/InversaoView';
import { InversaoErrorBoundary } from './components/InversaoErrorBoundary';
import { ManualFaltaModal } from './components/ManualFaltaModal';
import { ManualCongelamentoModal, CongelamentoType } from './components/ManualCongelamentoModal';
import { ImportModal, ImportFileType } from './components/ImportModal';
import { SaveReconciliationModal } from './components/SaveReconciliationModal';
import { formatCurrency, formatHectoliters, healStockPositions, healProductMasterMap } from './utils/parsers';
import { exportConciliacaoExcel } from './utils/excelReconciliationExport';
import { ReconciliationMode } from './utils/reconciliationEngine';
import { auth, onAuthStateChanged } from './firebase';
import {
  loadWorkspaceMetaFromFirestore,
  subscribeToWorkspaceMeta,
  loadStockPositionsSnapshotDetailed,
  loadGradePositionsSnapshotDetailed,
  loadQuebrasSnapshotDetailed,
  loadValesSnapshotDetailed,
  loadTrocasSnapshotDetailed,
  loadFaltasSnapshotDetailed,
  loadFrozenSnapshotDetailed,
  loadUsersSnapshotDetailed,
  loadProductsSnapshotDetailed,
  loadAppSettingsDetailedFromFirestore,
  saveStockPositionsToFirestore,
  saveGradePositionsToFirestore,
  saveQuebrasToFirestore,
  saveValesToFirestore,
  saveTrocasToFirestore,
  saveFaltasToFirestore,
  saveFrozenReconciliationsSnapshotToFirestore,
  saveFrozenReconciliationToFirestore,
  saveUsersSnapshotToFirestore,
  saveProductsToFirestore,
  saveAppSettingsToFirestore,
  logoutFirebase,
  isQuotaExceeded,
  clearQuotaExceededAndReconnect,
} from './services/firebaseSyncService';
import {
  persistData,
  retrieveData,
  retrieveSync,
  removePersistedData,
  safeLocalStorageSet,
  STORAGE_KEYS,
  getLocalSyncMeta,
  setLocalDatasetStamp,
  markLocalDatasetMutation,
  getOrCreateClientId,
  WorkspaceSyncMeta,
  SyncDatasetKey,
} from './utils/persistentStorage';
import { saveToCodeStorage } from './services/codeStorageService';

export default function App() {
  // Navigation and Filters
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [selectedDeposito, setSelectedDeposito] = useState<DepositoId | 'ALL'>('ALL');
  const [reconciliationMode, setReconciliationMode] = useState<ReconciliationMode>('com_ajuste');
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-02-28');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInitialType, setImportInitialType] = useState<ImportFileType>('020502');
  const [importLockedType, setImportLockedType] = useState<ImportFileType | undefined>(undefined);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [isManualFaltaModalOpen, setIsManualFaltaModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isRecountApplied, setIsRecountApplied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [isQuotaWarningVisible, setIsQuotaWarningVisible] = useState<boolean>(() => isQuotaExceeded());
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'local'>(() =>
    isQuotaExceeded() ? 'local' : 'synced'
  );
  const [lastCloudSyncLabel, setLastCloudSyncLabel] = useState<string | null>(null);
  const isInitialMountRef = useRef(true);
  const isHydratedRef = useRef(false);
  const isExplicitResetRef = useRef(false);
  const isSyncingCloudRef = useRef(false);
  const pendingRemoteMetaRef = useRef<WorkspaceSyncMeta | null>(null);
  const pushTimersRef = useRef<Partial<Record<SyncDatasetKey, ReturnType<typeof setTimeout>>>>({});

  useEffect(() => {
    const handleQuota = () => {
      setIsQuotaWarningVisible(true);
      setCloudSyncStatus('local');
    };
    window.addEventListener('firestore-quota-exceeded', handleQuota);
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 2500);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuota);
      clearTimeout(timer);
    };
  }, []);

  // Core Data States with High-Reliability Persistent Storage (IndexedDB + localStorage + persistedCodeData)
  const [productsMap, setProductsMap] = useState<Map<string, ProductMaster>>(() => {
    try {
      const savedArr = retrieveSync<[string, ProductMaster][]>(STORAGE_KEYS.PRODUCTS, []);
      const legacyRaw = !savedArr.length ? localStorage.getItem('gestao_estoque_v3_produtos') : null;
      const arr = savedArr.length > 0 ? savedArr : legacyRaw ? (JSON.parse(legacyRaw) as [string, ProductMaster][]) : [];
      if (arr.length > 0) {
        const merged = new Map(arr);
        INITIAL_PRODUCTS.forEach((prod, sku) => {
          const existing = merged.get(sku);
          if (!existing) {
            merged.set(sku, prod);
          } else {
            merged.set(sku, {
              ...prod,
              ...existing,
              fatorSku: existing.fatorSku > 1 ? existing.fatorSku : prod.fatorSku,
              valor: existing.valor > 0 ? existing.valor : prod.valor,
              valorUnit: existing.valorUnit > 0 ? existing.valorUnit : prod.valorUnit,
              fatorHl: existing.fatorHl > 0 ? existing.fatorHl : (prod.fatorHl || 0),
              grupo: existing.grupo && existing.grupo !== 'GERAL' ? existing.grupo : (prod.grupo || 'GERAL'),
              descricao: existing.descricao || prod.descricao,
              embalagem: existing.embalagem || prod.embalagem,
            });
          }
        });
        return healProductMasterMap(merged);
      }
    } catch (e) {
      console.error('Error loading products from storage:', e);
    }
    return healProductMasterMap(new Map(INITIAL_PRODUCTS));
  });

  const [stockPositions, setStockPositions] = useState<StockPositionItem[]>(() => {
    try {
      const v4 = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.STOCK_POSITIONS_020502, []);
      if (v4 && v4.length > 0) return healStockPositions(v4, productsMap);
      const v3 = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, []);
      if (v3 && v3.length > 0) return healStockPositions(v3, productsMap);
      // Fallback protetivo: se a base de grade de estoque tiver posições da 02.05.02, preserva-as
      const grade = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.GRADE_POSITIONS, []);
      if (grade && grade.length > 0) return healStockPositions(grade, productsMap);
    } catch (e) {
      console.error('Error loading stock positions:', e);
    }
    return [];
  });

  // Base 02.05.02 INDEPENDENTE E EXCLUSIVA para a Grade de Estoque
  // A Grade de Estoque é a primeira do dia (antes da conciliação física)
  // e NUNCA é sobreposta pelas 02.05.02 importadas posteriormente na conciliação.
  const [gradeStockPositions, setGradeStockPositions] = useState<StockPositionItem[]>(() => {
    try {
      const v4 = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.GRADE_POSITIONS, []);
      if (v4 && v4.length > 0) return healStockPositions(v4, productsMap);
      const v3 = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.GRADE_POSITIONS_LEGACY, []);
      if (v3 && v3.length > 0) return healStockPositions(v3, productsMap);
      // Fallback inicial: se a grade ainda não tiver sua 02.05.02 própria mas houver posições na conciliação
      const regular = retrieveSync<StockPositionItem[]>(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, []);
      if (regular && regular.length > 0) return healStockPositions(regular, productsMap);
    } catch (e) {
      console.error('Error loading grade stock positions:', e);
    }
    return [];
  });

  // Função auxiliar para garantir a regra Ambev: datas anteriores a 31/08/2026 são faturadas (não amortizam)
  const markHistoricalQuebrasAsBilled = (items: QuebraItem[]): QuebraItem[] => {
    return items.map(q => {
      if (q.data) {
        const dt = parseDateSafe(q.data);
        if (dt && dt < new Date(2026, 7, 31)) {
          return {
            ...q,
            faturado: true,
            dataFaturamento: q.dataFaturamento || '30/08/2026'
          };
        }
      }
      return q;
    });
  };

  const [quebras, setQuebras] = useState<QuebraItem[]>(() => {
    try {
      const meta = getLocalSyncMeta();
      const userAuthored = (meta.quebras?.updatedAt || 0) > 0;
      const savedFromStore = retrieveSync<QuebraItem[]>(STORAGE_KEYS.QUEBRAS, []);
      if (meta.quebras?.isExplicitEmpty) {
        return [];
      }
      if (userAuthored && savedFromStore.length > 0) {
        return markHistoricalQuebrasAsBilled(savedFromStore);
      }

      const savedV4 = localStorage.getItem('gestao_estoque_v4_quebras');
      let baseList: QuebraItem[] = savedFromStore.length > 0 ? savedFromStore : INITIAL_QUEBRAS;

      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (userAuthored) {
            return markHistoricalQuebrasAsBilled(parsed);
          }
          const hasDreRaw = parsed.some((q: QuebraItem) => q.id?.startsWith('q-raw-') || q.data === '22/06/2026');
          if (hasDreRaw && parsed.length >= INITIAL_QUEBRAS.length * 0.8) {
            baseList = parsed;
          } else {
            const filteredOld = parsed.filter((q: QuebraItem) => !q.id?.startsWith('q-jul-') && q.id !== 'q-sem-2906' && q.id !== 'q-sem-2306');
            const existingIds = new Set(filteredOld.map((q: QuebraItem) => q.id));
            const missingFromInitial = INITIAL_QUEBRAS.filter(q => !existingIds.has(q.id));
            baseList = [...filteredOld, ...missingFromInitial];
          }
        }
      } else {
        const savedV3 = localStorage.getItem('gestao_estoque_v3_quebras');
        if (savedV3) {
          const parsedV3 = JSON.parse(savedV3);
          if (Array.isArray(parsedV3) && parsedV3.length > 0) {
            baseList = parsedV3;
          }
          localStorage.removeItem('gestao_estoque_v3_quebras');
        }
      }

      const completeData = ensureCompleteHistoricalQuebras(baseList);
      const { cleaned } = sanitizeAndDeduplicateQuebras(completeData);
      const billedCleaned = markHistoricalQuebrasAsBilled(cleaned);

      safeLocalStorageSet('gestao_estoque_v4_quebras', JSON.stringify(billedCleaned));
      safeLocalStorageSet('gestao_estoque_v4_initialized', 'true');
      persistData(STORAGE_KEYS.QUEBRAS, billedCleaned).catch(() => {});

      return billedCleaned;
    } catch (e) {
      console.error('Error loading quebras:', e);
      return markHistoricalQuebrasAsBilled(INITIAL_QUEBRAS);
    }
  });

  const [vales, setVales] = useState<ValeItem[]>(() => {
    try {
      const meta = getLocalSyncMeta();
      if (meta.vales?.isExplicitEmpty) return [];
      const v4 = retrieveSync<ValeItem[]>(STORAGE_KEYS.VALES, []);
      if (v4.length > 0 || (meta.vales?.updatedAt || 0) > 0) return v4;
      const saved = localStorage.getItem('gestao_estoque_v3_vales');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading vales:', e);
    }
    return INITIAL_VALES;
  });

  const [trocas, setTrocas] = useState<TrocaItem[]>(() => {
    try {
      const meta = getLocalSyncMeta();
      if (meta.trocas?.isExplicitEmpty) return [];
      const v4 = retrieveSync<TrocaItem[]>(STORAGE_KEYS.TROCAS, []);
      if (v4.length > 0 || (meta.trocas?.updatedAt || 0) > 0) {
        return v4.map((t: TrocaItem) => ({
          ...t,
          sku: t.sku || t.codigos,
          motivo: t.motivo || t.motivoDeclarado || 'Produto Avariado',
        }));
      }
      const saved = localStorage.getItem('gestao_estoque_v5_trocas_doc');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: TrocaItem) => ({
            ...t,
            sku: t.sku || t.codigos,
            motivo: t.motivo || t.motivoDeclarado || 'Produto Avariado',
          }));
        }
      }
    } catch (e) {
      console.error('Error loading trocas:', e);
    }
    try {
      localStorage.removeItem('gestao_estoque_v3_trocas');
      localStorage.removeItem('gestao_estoque_v4_trocas');
      safeLocalStorageSet('gestao_estoque_v5_trocas_doc', JSON.stringify(INITIAL_TROCAS));
    } catch (e) {}
    return INITIAL_TROCAS;
  });

  const [faltasMapeadas, setFaltasMapeadas] = useState<FaltaMapeadaItem[]>(() => {
    try {
      const meta = getLocalSyncMeta();
      if (meta.faltasMapeadas?.isExplicitEmpty) return [];
      const v4 = retrieveSync<FaltaMapeadaItem[]>(STORAGE_KEYS.FALTAS, []);
      if (v4.length > 0 || (meta.faltasMapeadas?.updatedAt || 0) > 0) return v4;
      const saved = localStorage.getItem('gestao_estoque_v3_faltas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading faltas:', e);
    }
    return INITIAL_FALTAS_MAPEADAS;
  });

  const [frozenReconciliations, setFrozenReconciliations] = useState<FrozenReconciliation[]>(() => {
    try {
      const v4 = retrieveSync<FrozenReconciliation[]>(STORAGE_KEYS.FROZEN, []);
      if (v4.length > 0) return v4;
      const saved = localStorage.getItem('gestao_estoque_v3_frozen');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading frozen reconciliations:', e);
    }
    return SEED_FROZEN_RECONCILIATIONS;
  });

  // Mapa persistido de faturamento semanal de quebras ('PENDENTE' | 'OK')
  // Regra Ambev solicitada pelo usuário: apenas a semana corrente de quebras (31/08 - 05/09)
  // e datas restantes inseridas são pendentes. Todo o histórico anterior já foi faturado.
  const [weeklyBillingStatus, setWeeklyBillingStatus] = useState<Record<string, 'PENDENTE' | 'OK'>>(() => {
    const defaultStatus: Record<string, 'PENDENTE' | 'OK'> = {
      '07/09 - 11/09': 'PENDENTE',
      '31/08 - 05/09': 'PENDENTE',
      '24/08 - 28/08': 'OK',
      '17/08 - 21/08': 'OK',
      '10/08 - 14/08': 'OK',
      '03/08 - 07/08': 'OK',
      '27/07 - 31/07': 'OK',
      '20/07 - 24/07': 'OK',
      '13/07 - 17/07': 'OK',
      '06/07 - 10/07': 'OK',
      '29/06 - 03/07': 'OK',
      '23/06 - 28/06': 'OK',
      '15/06 - 20/06': 'OK',
      '08/06 - 12/06': 'OK',
      '01/06 - 05/06': 'OK',
      '25/05 - 30/05': 'OK',
    };

    try {
      const saved = localStorage.getItem('gestao_estoque_faturamento_semanal_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          const merged: Record<string, 'PENDENTE' | 'OK'> = { ...defaultStatus, ...parsed };
          // Força estritamente que semanas anteriores a 31/08/2026 sejam 'OK' (já faturadas/baixadas)
          const historicalWeeks = [
            '24/08 - 28/08', '17/08 - 21/08', '10/08 - 14/08', '03/08 - 07/08',
            '27/07 - 31/07', '20/07 - 24/07', '13/07 - 17/07', '06/07 - 10/07',
            '29/06 - 03/07', '23/06 - 28/06', '15/06 - 20/06', '08/06 - 12/06',
            '01/06 - 05/06', '25/05 - 30/05'
          ];
          historicalWeeks.forEach(w => {
            merged[w] = 'OK';
          });
          merged['31/08 - 05/09'] = parsed['31/08 - 05/09'] || 'PENDENTE';
          return merged;
        }
      }
    } catch (e) {
      console.error('Error loading weekly billing status:', e);
    }
    return defaultStatus;
  });

  // User Accounts & Authentication Session
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('gestao_estoque_v3_usuarios');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasG1002 = parsed.some(
            (u: any) =>
              (u.matricula && u.matricula.toUpperCase() === 'G1002') ||
              (u.usuario && u.usuario.toUpperCase() === 'G1002')
          );
          const normalized = parsed.map((u: any) => ({
            ...u,
            matricula: u.matricula || (u.usuario?.includes('@') ? 'G1002' : u.usuario) || 'G1002',
            usuario: u.usuario || u.matricula || 'G1002',
          }));
          if (!hasG1002) {
            normalized.unshift(INITIAL_USERS[0]);
          }
          return normalized;
        }
      }
    } catch (e) {
      console.error('Error loading users from storage:', e);
    }
    return INITIAL_USERS;
  });

  const [showLogoutNotice, setShowLogoutNotice] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Check active user session (localStorage first for persistence across reloads/prompts)
      const savedLocal = localStorage.getItem('gestao_estoque_v3_usuario_ativo');
      if (savedLocal) return JSON.parse(savedLocal);
      const savedSession = sessionStorage.getItem('gestao_estoque_v3_usuario_ativo');
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {
      console.error('Error loading active user from storage:', e);
    }
    return null;
  });

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setShowLogoutNotice(false);
    try {
      sessionStorage.setItem('gestao_estoque_v3_usuario_ativo', JSON.stringify(user));
      localStorage.setItem('gestao_estoque_v3_usuario_ativo', JSON.stringify(user));
      persistData(STORAGE_KEYS.ACTIVE_USER, user);
    } catch (e) {}
  };

  const handleLogout = () => {
    if (auth.currentUser) {
      logoutFirebase().catch(() => {});
    }
    setCurrentUser(null);
    setShowLogoutNotice(true);
    try {
      sessionStorage.removeItem('gestao_estoque_v3_usuario_ativo');
      localStorage.removeItem('gestao_estoque_v3_usuario_ativo');
      removePersistedData(STORAGE_KEYS.ACTIVE_USER);
    } catch (e) {}
  };

  const latestStateRef = useRef({
    productsMap,
    stockPositions,
    gradeStockPositions,
    quebras,
    vales,
    trocas,
    faltasMapeadas,
    frozenReconciliations,
    weeklyBillingStatus,
    users,
  });
  latestStateRef.current = {
    productsMap,
    stockPositions,
    gradeStockPositions,
    quebras,
    vales,
    trocas,
    faltasMapeadas,
    frozenReconciliations,
    weeklyBillingStatus,
    users,
  };

  const formatSyncClock = () =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const scheduleCloudDatasetPush = (
    datasetKey: SyncDatasetKey,
    payload: any,
    updatedAt: number,
    isExplicitEmpty: boolean = false
  ) => {
    if (pushTimersRef.current[datasetKey]) {
      clearTimeout(pushTimersRef.current[datasetKey]);
    }
    if (!isQuotaExceeded()) {
      setCloudSyncStatus('syncing');
    }

    pushTimersRef.current[datasetKey] = setTimeout(async () => {
      const syncMeta = getLocalSyncMeta();
      try {
        // Persist in code repository file when running in AI Studio dev environment
        if (datasetKey === 'stockPositions') {
          saveToCodeStorage({ type: '020502', stockPositions: payload, syncMeta });
        } else if (datasetKey === 'gradePositions') {
          saveToCodeStorage({ type: 'grade', gradeStockPositions: payload, syncMeta });
        } else if (datasetKey === 'quebras') {
          saveToCodeStorage({ type: 'quebras', quebras: payload, syncMeta });
        } else if (datasetKey === 'vales') {
          saveToCodeStorage({ type: 'vales', vales: payload, syncMeta });
        } else if (datasetKey === 'trocas') {
          saveToCodeStorage({ type: 'trocas', trocas: payload, syncMeta });
        } else if (datasetKey === 'faltasMapeadas') {
          saveToCodeStorage({ type: 'faltas', faltasMapeadas: payload, syncMeta });
        } else if (datasetKey === 'frozenReconciliations') {
          saveToCodeStorage({ type: 'frozen', frozenReconciliations: payload, syncMeta });
        } else if (datasetKey === 'products') {
          saveToCodeStorage({ type: 'products', products: payload, syncMeta });
        } else if (datasetKey === 'weeklyBillingStatus') {
          saveToCodeStorage({ type: 'billing', weeklyBillingStatus: payload, syncMeta });
        }

        if (isQuotaExceeded()) {
          setCloudSyncStatus('local');
          return;
        }

        let ok = false;
        if (datasetKey === 'stockPositions') {
          ok = await saveStockPositionsToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'gradePositions') {
          ok = await saveGradePositionsToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'quebras') {
          ok = await saveQuebrasToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'vales') {
          ok = await saveValesToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'trocas') {
          ok = await saveTrocasToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'faltasMapeadas') {
          ok = await saveFaltasToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'frozenReconciliations') {
          ok = await saveFrozenReconciliationsSnapshotToFirestore(payload, { updatedAt, isExplicitEmpty });
        } else if (datasetKey === 'products') {
          const list = Array.isArray(payload)
            ? payload.map((entry: any) => (Array.isArray(entry) ? entry[1] : entry))
            : [];
          ok = await saveProductsToFirestore(list, { updatedAt });
        } else if (datasetKey === 'weeklyBillingStatus') {
          ok = await saveAppSettingsToFirestore('weeklyBillingStatus', payload, { updatedAt });
        } else if (datasetKey === 'users') {
          ok = await saveUsersSnapshotToFirestore(payload, { updatedAt });
        }

        if (ok) {
          setLastCloudSyncLabel(formatSyncClock());
          setCloudSyncStatus('synced');
        } else {
          setCloudSyncStatus(isQuotaExceeded() ? 'local' : 'synced');
        }
      } catch (err) {
        console.warn(`[Sync] Falha ao enviar ${datasetKey} para nuvem:`, err);
        setCloudSyncStatus(isQuotaExceeded() ? 'local' : 'synced');
      }
    }, 450);
  };

  // Wrapped Setters: Every user edit/import/delete stamps updatedAt and syncs locally + Cloud + GitHub CodeStorage
  const updateProductsMap: React.Dispatch<React.SetStateAction<Map<string, ProductMaster>>> = (action) => {
    setProductsMap((prev) => {
      const rawNext = typeof action === 'function' ? action(prev) : action;
      const next = healProductMasterMap(rawNext);
      const entries = Array.from(next.entries());
      safeLocalStorageSet('gestao_estoque_v3_produtos', JSON.stringify(entries));
      persistData(STORAGE_KEYS.PRODUCTS, entries);
      const stamp = markLocalDatasetMutation('products', entries.length);
      scheduleCloudDatasetPush('products', entries, stamp.updatedAt);
      return next;
    });
  };

  const updateStockPositions: React.Dispatch<React.SetStateAction<StockPositionItem[]>> = (action) => {
    setStockPositions((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.STOCK_POSITIONS_020502, next);
      persistData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, next);
      safeLocalStorageSet(STORAGE_KEYS.STOCK_POSITIONS_020502, JSON.stringify(next));
      const stamp = markLocalDatasetMutation('stockPositions', next.length, isEmpty);
      scheduleCloudDatasetPush('stockPositions', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateGradeStockPositions: React.Dispatch<React.SetStateAction<StockPositionItem[]>> = (action) => {
    setGradeStockPositions((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.GRADE_POSITIONS, next);
      persistData(STORAGE_KEYS.GRADE_POSITIONS_LEGACY, next);
      safeLocalStorageSet(STORAGE_KEYS.GRADE_POSITIONS, JSON.stringify(next));
      const stamp = markLocalDatasetMutation('gradePositions', next.length, isEmpty);
      scheduleCloudDatasetPush('gradePositions', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateQuebras: React.Dispatch<React.SetStateAction<QuebraItem[]>> = (action) => {
    setQuebras((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.QUEBRAS, next);
      safeLocalStorageSet(STORAGE_KEYS.QUEBRAS, JSON.stringify(next));
      const stamp = markLocalDatasetMutation('quebras', next.length, isEmpty);
      scheduleCloudDatasetPush('quebras', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateVales: React.Dispatch<React.SetStateAction<ValeItem[]>> = (action) => {
    setVales((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.VALES, next);
      safeLocalStorageSet(STORAGE_KEYS.VALES, JSON.stringify(next));
      safeLocalStorageSet('gestao_estoque_v3_vales', JSON.stringify(next));
      const stamp = markLocalDatasetMutation('vales', next.length, isEmpty);
      scheduleCloudDatasetPush('vales', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateTrocas: React.Dispatch<React.SetStateAction<TrocaItem[]>> = (action) => {
    setTrocas((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.TROCAS, next);
      persistData(STORAGE_KEYS.TROCAS_V4, next);
      safeLocalStorageSet(STORAGE_KEYS.TROCAS, JSON.stringify(next));
      safeLocalStorageSet('gestao_estoque_v5_trocas_doc', JSON.stringify(next));
      const stamp = markLocalDatasetMutation('trocas', next.length, isEmpty);
      scheduleCloudDatasetPush('trocas', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateFaltasMapeadas: React.Dispatch<React.SetStateAction<FaltaMapeadaItem[]>> = (action) => {
    setFaltasMapeadas((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.FALTAS, next);
      safeLocalStorageSet(STORAGE_KEYS.FALTAS, JSON.stringify(next));
      safeLocalStorageSet('gestao_estoque_v3_faltas', JSON.stringify(next));
      const stamp = markLocalDatasetMutation('faltasMapeadas', next.length, isEmpty);
      scheduleCloudDatasetPush('faltasMapeadas', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateFrozenReconciliations: React.Dispatch<React.SetStateAction<FrozenReconciliation[]>> = (action) => {
    setFrozenReconciliations((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      const isEmpty = next.length === 0;
      persistData(STORAGE_KEYS.FROZEN, next);
      safeLocalStorageSet(STORAGE_KEYS.FROZEN, JSON.stringify(next));
      safeLocalStorageSet('gestao_estoque_v3_frozen', JSON.stringify(next));
      const stamp = markLocalDatasetMutation('frozenReconciliations', next.length, isEmpty);
      scheduleCloudDatasetPush('frozenReconciliations', next, stamp.updatedAt, isEmpty);
      return next;
    });
  };

  const updateWeeklyBillingStatus: React.Dispatch<React.SetStateAction<Record<string, 'PENDENTE' | 'OK'>>> = (action) => {
    setWeeklyBillingStatus((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      persistData(STORAGE_KEYS.WEEKLY_BILLING, next);
      safeLocalStorageSet(STORAGE_KEYS.WEEKLY_BILLING, JSON.stringify(next));
      const stamp = markLocalDatasetMutation('weeklyBillingStatus', Object.keys(next || {}).length);
      scheduleCloudDatasetPush('weeklyBillingStatus', next, stamp.updatedAt);
      return next;
    });
  };

  const updateUsers: React.Dispatch<React.SetStateAction<UserAccount[]>> = (action) => {
    setUsers((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      safeLocalStorageSet('gestao_estoque_v3_usuarios', JSON.stringify(next));
      persistData(STORAGE_KEYS.USERS, next);
      const stamp = markLocalDatasetMutation('users', next.length);
      scheduleCloudDatasetPush('users', next, stamp.updatedAt);
      return next;
    });
  };

  // Bidirectional Timestamped Cloud Reconciliation (AI Studio <-> GitHub Pages)
  const reconcileWithCloud = async (
    incomingMeta?: WorkspaceSyncMeta,
    isManualTrigger: boolean = false
  ) => {
    if (!isHydratedRef.current) return;
    if (isQuotaExceeded()) {
      setCloudSyncStatus('local');
      return;
    }
    if (isSyncingCloudRef.current) {
      if (incomingMeta) {
        pendingRemoteMetaRef.current = incomingMeta;
      }
      return;
    }

    isSyncingCloudRef.current = true;
    setCloudSyncStatus('syncing');

    try {
      const cloudMeta = incomingMeta ?? (await loadWorkspaceMetaFromFirestore());
      if (isQuotaExceeded()) {
        setCloudSyncStatus('local');
        return;
      }

      const localMeta = getLocalSyncMeta();
      const myClientId = getOrCreateClientId();
      const cur = latestStateRef.current;
      let activeProductsMap = cur.productsMap;

      // Ignore live echo of our own client write unless manually triggered
      const isEchoOnly =
        Boolean(incomingMeta) &&
        !isManualTrigger &&
        Object.keys(cloudMeta).every((k) => {
          const key = k as SyncDatasetKey;
          const cStamp = cloudMeta[key];
          const lStamp = localMeta[key];
          if (!cStamp) return true;
          if (cStamp.clientId === myClientId && cStamp.updatedAt <= (lStamp?.updatedAt || 0)) {
            return true;
          }
          return cStamp.updatedAt <= (lStamp?.updatedAt || 0);
        });

      if (isEchoOnly) {
        setCloudSyncStatus('synced');
        return;
      }

      // 1. Products Catalog (sync first so stock healing uses up-to-date catalog)
      {
        const lStamp = localMeta.products;
        const cStamp = cloudMeta.products;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadProductsSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && res.items.length > 0 && effTs > localTs) {
            const nextMap = new Map(activeProductsMap);
            res.items.forEach((cp) => {
              const code = cp?.codigo || (cp as any)?.sku;
              if (code) {
                const existing = nextMap.get(code);
                nextMap.set(code, { ...existing, ...cp, codigo: code });
              }
            });
            activeProductsMap = healProductMasterMap(nextMap);
            const entries = Array.from(activeProductsMap.entries());
            setProductsMap(activeProductsMap);
            persistData(STORAGE_KEYS.PRODUCTS, entries);
            safeLocalStorageSet('gestao_estoque_v3_produtos', JSON.stringify(entries));
            const appliedStamp = cStamp || { updatedAt: effTs, count: entries.length, clientId: 'cloud' };
            setLocalDatasetStamp('products', appliedStamp);
            saveToCodeStorage({ type: 'products', products: entries, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && localTs > 0 && activeProductsMap.size > 0) {
            await saveProductsToFirestore(Array.from(activeProductsMap.values()), { updatedAt: localTs });
          }
        } else if (localTs > cloudTs && activeProductsMap.size > 0) {
          await saveProductsToFirestore(Array.from(activeProductsMap.values()), { updatedAt: localTs });
        }
      }

      // 2. Stock Positions (02.05.02 Conciliação)
      {
        const lStamp = localMeta.stockPositions;
        const cStamp = cloudMeta.stockPositions;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        const localNeedsHeal = !lStamp?.isExplicitEmpty && (lStamp?.count || 0) > 0 && cur.stockPositions.length === 0;
        if (cloudTs > localTs || localNeedsHeal || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadStockPositionsSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          const shouldApplyCloud =
            res.exists &&
            (effTs > localTs ||
              localNeedsHeal ||
              (localTs === 0 && cur.stockPositions.length === 0 && res.items.length > 0));
          if (shouldApplyCloud) {
            const nextStock = res.isExplicitEmpty ? [] : healStockPositions(res.items, activeProductsMap);
            setStockPositions(nextStock);
            persistData(STORAGE_KEYS.STOCK_POSITIONS_020502, nextStock);
            persistData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, nextStock);
            safeLocalStorageSet(STORAGE_KEYS.STOCK_POSITIONS_020502, JSON.stringify(nextStock));
            const appliedStamp = cStamp || {
              updatedAt: effTs || Date.now(),
              count: nextStock.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('stockPositions', appliedStamp);
            saveToCodeStorage({ type: '020502', stockPositions: nextStock, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.stockPositions.length > 0) {
            await saveStockPositionsToFirestore(cur.stockPositions, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.stockPositions.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveStockPositionsToFirestore(cur.stockPositions, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        } else if (!cStamp && cur.stockPositions.length > 0) {
          await saveStockPositionsToFirestore(cur.stockPositions, { updatedAt: localTs || Date.now() });
        }
      }

      // 3. Grade de Estoque (02.05.02 da Grade)
      {
        const lStamp = localMeta.gradePositions;
        const cStamp = cloudMeta.gradePositions;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        const localNeedsHeal = !lStamp?.isExplicitEmpty && (lStamp?.count || 0) > 0 && cur.gradeStockPositions.length === 0;
        if (cloudTs > localTs || localNeedsHeal || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadGradePositionsSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          const shouldApplyCloud =
            res.exists &&
            (effTs > localTs ||
              localNeedsHeal ||
              (localTs === 0 && cur.gradeStockPositions.length === 0 && res.items.length > 0));
          if (shouldApplyCloud) {
            const nextGrade = res.isExplicitEmpty ? [] : healStockPositions(res.items, activeProductsMap);
            setGradeStockPositions(nextGrade);
            persistData(STORAGE_KEYS.GRADE_POSITIONS, nextGrade);
            persistData(STORAGE_KEYS.GRADE_POSITIONS_LEGACY, nextGrade);
            safeLocalStorageSet(STORAGE_KEYS.GRADE_POSITIONS, JSON.stringify(nextGrade));
            const appliedStamp = cStamp || {
              updatedAt: effTs || Date.now(),
              count: nextGrade.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('gradePositions', appliedStamp);
            saveToCodeStorage({ type: 'grade', gradeStockPositions: nextGrade, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.gradeStockPositions.length > 0) {
            await saveGradePositionsToFirestore(cur.gradeStockPositions, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.gradeStockPositions.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveGradePositionsToFirestore(cur.gradeStockPositions, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        } else if (!cStamp && cur.gradeStockPositions.length > 0) {
          await saveGradePositionsToFirestore(cur.gradeStockPositions, { updatedAt: localTs || Date.now() });
        }
      }

      // 4. Quebras
      {
        const lStamp = localMeta.quebras;
        const cStamp = cloudMeta.quebras;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadQuebrasSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && effTs > localTs) {
            const nextQuebras = res.isExplicitEmpty ? [] : markHistoricalQuebrasAsBilled(res.items);
            setQuebras(nextQuebras);
            persistData(STORAGE_KEYS.QUEBRAS, nextQuebras);
            safeLocalStorageSet(STORAGE_KEYS.QUEBRAS, JSON.stringify(nextQuebras));
            const appliedStamp = cStamp || {
              updatedAt: effTs,
              count: nextQuebras.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('quebras', appliedStamp);
            saveToCodeStorage({ type: 'quebras', quebras: nextQuebras, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.quebras.length > 0) {
            await saveQuebrasToFirestore(cur.quebras, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.quebras.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveQuebrasToFirestore(cur.quebras, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        }
      }

      // 5. Vales
      {
        const lStamp = localMeta.vales;
        const cStamp = cloudMeta.vales;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadValesSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && effTs > localTs) {
            const nextVales = res.isExplicitEmpty ? [] : res.items;
            setVales(nextVales);
            persistData(STORAGE_KEYS.VALES, nextVales);
            safeLocalStorageSet(STORAGE_KEYS.VALES, JSON.stringify(nextVales));
            safeLocalStorageSet('gestao_estoque_v3_vales', JSON.stringify(nextVales));
            const appliedStamp = cStamp || {
              updatedAt: effTs,
              count: nextVales.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('vales', appliedStamp);
            saveToCodeStorage({ type: 'vales', vales: nextVales, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.vales.length > 0) {
            await saveValesToFirestore(cur.vales, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.vales.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveValesToFirestore(cur.vales, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        }
      }

      // 6. Trocas
      {
        const lStamp = localMeta.trocas;
        const cStamp = cloudMeta.trocas;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadTrocasSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && effTs > localTs) {
            const nextTrocas = res.isExplicitEmpty
              ? []
              : res.items.map((t) => ({
                  ...t,
                  sku: t.sku || t.codigos,
                  motivo: t.motivo || t.motivoDeclarado || 'Produto Avariado',
                }));
            setTrocas(nextTrocas);
            persistData(STORAGE_KEYS.TROCAS, nextTrocas);
            persistData(STORAGE_KEYS.TROCAS_V4, nextTrocas);
            safeLocalStorageSet(STORAGE_KEYS.TROCAS, JSON.stringify(nextTrocas));
            safeLocalStorageSet('gestao_estoque_v5_trocas_doc', JSON.stringify(nextTrocas));
            const appliedStamp = cStamp || {
              updatedAt: effTs,
              count: nextTrocas.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('trocas', appliedStamp);
            saveToCodeStorage({ type: 'trocas', trocas: nextTrocas, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.trocas.length > 0) {
            await saveTrocasToFirestore(cur.trocas, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.trocas.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveTrocasToFirestore(cur.trocas, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        }
      }

      // 7. Faltas Mapeadas
      {
        const lStamp = localMeta.faltasMapeadas;
        const cStamp = cloudMeta.faltasMapeadas;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadFaltasSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && effTs > localTs) {
            const nextFaltas = res.isExplicitEmpty ? [] : res.items;
            setFaltasMapeadas(nextFaltas);
            persistData(STORAGE_KEYS.FALTAS, nextFaltas);
            safeLocalStorageSet(STORAGE_KEYS.FALTAS, JSON.stringify(nextFaltas));
            safeLocalStorageSet('gestao_estoque_v3_faltas', JSON.stringify(nextFaltas));
            const appliedStamp = cStamp || {
              updatedAt: effTs,
              count: nextFaltas.length,
              clientId: 'cloud',
              isExplicitEmpty: res.isExplicitEmpty,
            };
            setLocalDatasetStamp('faltasMapeadas', appliedStamp);
            saveToCodeStorage({ type: 'faltas', faltasMapeadas: nextFaltas, syncMeta: getLocalSyncMeta() });
          } else if (!res.exists && cur.faltasMapeadas.length > 0) {
            await saveFaltasToFirestore(cur.faltasMapeadas, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && (cur.faltasMapeadas.length > 0 || lStamp?.isExplicitEmpty)) {
          await saveFaltasToFirestore(cur.faltasMapeadas, {
            updatedAt: localTs,
            isExplicitEmpty: lStamp?.isExplicitEmpty,
          });
        }
      }

      // 8. Fechamentos Congelados
      {
        const lStamp = localMeta.frozenReconciliations;
        const cStamp = cloudMeta.frozenReconciliations;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadFrozenSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && res.items.length > 0 && effTs > localTs) {
            setFrozenReconciliations(res.items);
            persistData(STORAGE_KEYS.FROZEN, res.items);
            safeLocalStorageSet(STORAGE_KEYS.FROZEN, JSON.stringify(res.items));
            safeLocalStorageSet('gestao_estoque_v3_frozen', JSON.stringify(res.items));
            const appliedStamp = cStamp || { updatedAt: effTs, count: res.items.length, clientId: 'cloud' };
            setLocalDatasetStamp('frozenReconciliations', appliedStamp);
            saveToCodeStorage({
              type: 'frozen',
              frozenReconciliations: res.items,
              syncMeta: getLocalSyncMeta(),
            });
          } else if (!res.exists && cur.frozenReconciliations.length > 0) {
            await saveFrozenReconciliationsSnapshotToFirestore(cur.frozenReconciliations, {
              updatedAt: localTs || Date.now(),
            });
          }
        } else if (localTs > cloudTs && cur.frozenReconciliations.length > 0) {
          await saveFrozenReconciliationsSnapshotToFirestore(cur.frozenReconciliations, {
            updatedAt: localTs,
          });
        }
      }

      // 9. Status de Faturamento Semanal
      {
        const lStamp = localMeta.weeklyBillingStatus;
        const cStamp = cloudMeta.weeklyBillingStatus;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadAppSettingsDetailedFromFirestore<Record<string, 'PENDENTE' | 'OK'>>(
            'weeklyBillingStatus'
          );
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.value && Object.keys(res.value).length > 0 && effTs > localTs) {
            const mergedBilling = { ...cur.weeklyBillingStatus, ...res.value };
            setWeeklyBillingStatus(mergedBilling);
            persistData(STORAGE_KEYS.WEEKLY_BILLING, mergedBilling);
            safeLocalStorageSet(STORAGE_KEYS.WEEKLY_BILLING, JSON.stringify(mergedBilling));
            const appliedStamp = cStamp || {
              updatedAt: effTs,
              count: Object.keys(mergedBilling).length,
              clientId: 'cloud',
            };
            setLocalDatasetStamp('weeklyBillingStatus', appliedStamp);
            saveToCodeStorage({
              type: 'billing',
              weeklyBillingStatus: mergedBilling,
              syncMeta: getLocalSyncMeta(),
            });
          } else if (!res.value && cur.weeklyBillingStatus) {
            await saveAppSettingsToFirestore('weeklyBillingStatus', cur.weeklyBillingStatus, {
              updatedAt: localTs || Date.now(),
            });
          }
        } else if (localTs > cloudTs && cur.weeklyBillingStatus) {
          await saveAppSettingsToFirestore('weeklyBillingStatus', cur.weeklyBillingStatus, {
            updatedAt: localTs,
          });
        }
      }

      // 10. Usuários
      {
        const lStamp = localMeta.users;
        const cStamp = cloudMeta.users;
        const localTs = lStamp?.updatedAt || 0;
        const cloudTs = cStamp?.updatedAt || 0;
        if (cloudTs > localTs || (!incomingMeta && cloudTs === 0 && localTs === 0)) {
          const res = await loadUsersSnapshotDetailed();
          const effTs = Math.max(cloudTs, res.updatedAt || 0);
          if (res.exists && res.items.length > 0 && effTs > localTs) {
            setUsers((prev) => {
              const merged = [...prev];
              res.items.forEach((cu) => {
                const idx = merged.findIndex((m) => m.id === cu.id || m.matricula === cu.matricula);
                if (idx >= 0) {
                  merged[idx] = { ...merged[idx], ...cu };
                } else {
                  merged.push(cu);
                }
              });
              safeLocalStorageSet('gestao_estoque_v3_usuarios', JSON.stringify(merged));
              persistData(STORAGE_KEYS.USERS, merged);
              return merged;
            });
            setLocalDatasetStamp('users', cStamp || { updatedAt: effTs, count: res.items.length, clientId: 'cloud' });
          } else if (!res.exists && cur.users.length > 0) {
            await saveUsersSnapshotToFirestore(cur.users, { updatedAt: localTs || Date.now() });
          }
        } else if (localTs > cloudTs && cur.users.length > 0) {
          await saveUsersSnapshotToFirestore(cur.users, { updatedAt: localTs });
        }
      }

      setLastCloudSyncLabel(formatSyncClock());
      setCloudSyncStatus(isQuotaExceeded() ? 'local' : 'synced');

      if (isManualTrigger && !isQuotaExceeded()) {
        setToastMessage({
          type: 'success',
          text: 'Sincronização completa entre plataforma e nuvem (GitHub Pages / AI Studio) concluída sem erros.',
        });
      }
    } catch (err) {
      console.warn('[Firebase] Aviso na sincronização automática:', err);
      setCloudSyncStatus(isQuotaExceeded() ? 'local' : 'synced');
    } finally {
      isSyncingCloudRef.current = false;
      if (pendingRemoteMetaRef.current) {
        const queued = pendingRemoteMetaRef.current;
        pendingRemoteMetaRef.current = null;
        reconcileWithCloud(queued);
      }
    }
  };

  const handleForceCloudSync = async () => {
    if (isQuotaExceeded()) {
      await clearQuotaExceededAndReconnect();
      setIsQuotaWarningVisible(false);
    }
    await reconcileWithCloud(undefined, true);
  };

  // 1. Startup Hydration from IndexedDB -> Followed Immediately by Cloud Sync + Real-Time Listener
  useEffect(() => {
    let isMounted = true;
    let unsubscribeMeta: (() => void) | null = null;

    async function hydrateAndStartCloudSync() {
      try {
        const [
          savedStock,
          savedGrade,
          savedQuebras,
          savedVales,
          savedTrocas,
          savedFaltas,
          savedFrozen,
          savedUser,
          savedBilling,
          savedProducts,
        ] = await Promise.all([
          retrieveData<StockPositionItem[]>(STORAGE_KEYS.STOCK_POSITIONS_020502, []),
          retrieveData<StockPositionItem[]>(STORAGE_KEYS.GRADE_POSITIONS, []),
          retrieveData<QuebraItem[]>(STORAGE_KEYS.QUEBRAS, []),
          retrieveData<ValeItem[]>(STORAGE_KEYS.VALES, []),
          retrieveData<TrocaItem[]>(STORAGE_KEYS.TROCAS, []),
          retrieveData<FaltaMapeadaItem[]>(STORAGE_KEYS.FALTAS, []),
          retrieveData<FrozenReconciliation[]>(STORAGE_KEYS.FROZEN, []),
          retrieveData<UserAccount | null>(STORAGE_KEYS.ACTIVE_USER, null),
          retrieveData<Record<string, 'PENDENTE' | 'OK'> | null>(STORAGE_KEYS.WEEKLY_BILLING, null),
          retrieveData<[string, ProductMaster][]>(STORAGE_KEYS.PRODUCTS, []),
        ]);

        if (!isMounted) return;
        const localMeta = getLocalSyncMeta();

        let currentProductsMap: Map<string, ProductMaster>;
        if (savedProducts && savedProducts.length > 0) {
          const merged = new Map(savedProducts);
          INITIAL_PRODUCTS.forEach((prod, sku) => {
            const existing = merged.get(sku);
            if (!existing) {
              merged.set(sku, prod);
            } else {
              merged.set(sku, {
                ...prod,
                ...existing,
                fatorSku: existing.fatorSku > 1 ? existing.fatorSku : prod.fatorSku,
                valor: existing.valor > 0 ? existing.valor : prod.valor,
                valorUnit: existing.valorUnit > 0 ? existing.valorUnit : prod.valorUnit,
                fatorHl: existing.fatorHl > 0 ? existing.fatorHl : (prod.fatorHl || 0),
                grupo: existing.grupo && existing.grupo !== 'GERAL' ? existing.grupo : (prod.grupo || 'GERAL'),
                descricao: existing.descricao || prod.descricao,
                embalagem: existing.embalagem || prod.embalagem,
              });
            }
          });
          currentProductsMap = healProductMasterMap(merged);
          setProductsMap(currentProductsMap);
        } else {
          currentProductsMap = healProductMasterMap(new Map(INITIAL_PRODUCTS));
          setProductsMap(currentProductsMap);
        }

        if (localMeta.stockPositions?.isExplicitEmpty) {
          setStockPositions([]);
        } else if (savedStock && savedStock.length > 0) {
          const healedStock = healStockPositions(savedStock, currentProductsMap);
          setStockPositions(healedStock);
          persistData(STORAGE_KEYS.STOCK_POSITIONS_020502, healedStock);
          persistData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, healedStock);
        } else if (savedGrade && savedGrade.length > 0 && !localMeta.stockPositions?.updatedAt) {
          const healedStock = healStockPositions(savedGrade, currentProductsMap);
          setStockPositions(healedStock);
          persistData(STORAGE_KEYS.STOCK_POSITIONS_020502, healedStock);
          persistData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY, healedStock);
        }

        if (localMeta.gradePositions?.isExplicitEmpty) {
          setGradeStockPositions([]);
        } else if (savedGrade && savedGrade.length > 0) {
          const healedGrade = healStockPositions(savedGrade, currentProductsMap);
          setGradeStockPositions(healedGrade);
          persistData(STORAGE_KEYS.GRADE_POSITIONS, healedGrade);
          persistData(STORAGE_KEYS.GRADE_POSITIONS_LEGACY, healedGrade);
        }

        if (localMeta.quebras?.isExplicitEmpty) {
          setQuebras([]);
        } else if (savedQuebras && savedQuebras.length > 0) {
          if ((localMeta.quebras?.updatedAt || 0) > 0) {
            setQuebras(markHistoricalQuebrasAsBilled(savedQuebras));
          } else {
            const hasDreRaw = savedQuebras.some(
              (q: QuebraItem) => q.id?.startsWith('q-raw-') || q.data === '22/06/2026'
            );
            if (hasDreRaw && savedQuebras.length >= INITIAL_QUEBRAS.length * 0.8) {
              setQuebras(savedQuebras);
            } else {
              const filteredOld = savedQuebras.filter(
                (q: QuebraItem) =>
                  !q.id?.startsWith('q-jul-') && q.id !== 'q-sem-2906' && q.id !== 'q-sem-2306'
              );
              const existingIds = new Set(filteredOld.map((q: QuebraItem) => q.id));
              const missing = INITIAL_QUEBRAS.filter((q) => !existingIds.has(q.id));
              const merged = [...filteredOld, ...missing];
              const guaranteed = ensureCompleteHistoricalQuebras(merged);
              const { cleaned } = sanitizeAndDeduplicateQuebras(guaranteed);
              const billedCleaned = markHistoricalQuebrasAsBilled(cleaned);
              setQuebras(billedCleaned);
              persistData(STORAGE_KEYS.QUEBRAS, billedCleaned);
              safeLocalStorageSet('gestao_estoque_v4_quebras', JSON.stringify(billedCleaned));
            }
          }
        }

        if (localMeta.vales?.isExplicitEmpty) {
          setVales([]);
        } else if (savedVales && (savedVales.length > 0 || (localMeta.vales?.updatedAt || 0) > 0)) {
          setVales(savedVales);
        }

        if (localMeta.trocas?.isExplicitEmpty) {
          setTrocas([]);
        } else if (savedTrocas && (savedTrocas.length > 0 || (localMeta.trocas?.updatedAt || 0) > 0)) {
          setTrocas(savedTrocas);
        }

        if (localMeta.faltasMapeadas?.isExplicitEmpty) {
          setFaltasMapeadas([]);
        } else if (
          savedFaltas &&
          (savedFaltas.length > 0 || (localMeta.faltasMapeadas?.updatedAt || 0) > 0)
        ) {
          setFaltasMapeadas(savedFaltas);
        }

        if (savedFrozen && savedFrozen.length > 0) {
          setFrozenReconciliations(savedFrozen);
        }
        if (savedUser && !currentUser) {
          setCurrentUser(savedUser);
        }
        if (savedBilling) {
          setWeeklyBillingStatus((prev) => ({ ...prev, ...savedBilling }));
        }
      } catch (err) {
        console.warn('[PersistentStorage] Hydration completed with notes:', err);
      } finally {
        if (isMounted) {
          isHydratedRef.current = true;
          // Allow React state updates from IndexedDB to commit, then reconcile with Firestore & subscribe live
          setTimeout(() => {
            if (!isMounted) return;
            reconcileWithCloud().then(() => {
              if (!isMounted) return;
              unsubscribeMeta = subscribeToWorkspaceMeta((remoteMeta) => {
                if (!isMounted) return;
                reconcileWithCloud(remoteMeta);
              });
            });
          }, 80);
        }
      }
    }

    hydrateAndStartCloudSync();

    // Also reconcile whenever browser tab regains focus (e.g. switching between AI Studio and GitHub Pages tabs)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isHydratedRef.current && !isQuotaExceeded()) {
        reconcileWithCloud();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (unsubscribeMeta) unsubscribeMeta();
    };
  }, []);

  // Keep Active User session synced locally
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('gestao_estoque_v3_usuario_ativo', JSON.stringify(currentUser));
        localStorage.setItem('gestao_estoque_v3_usuario_ativo', JSON.stringify(currentUser));
        persistData(STORAGE_KEYS.ACTIVE_USER, currentUser);
      } else {
        sessionStorage.removeItem('gestao_estoque_v3_usuario_ativo');
        localStorage.removeItem('gestao_estoque_v3_usuario_ativo');
        removePersistedData(STORAGE_KEYS.ACTIVE_USER);
      }
    } catch (e) {}
  }, [currentUser]);

  const handleConfirmSaveAndReset = (savedInfo: { filename: string; frozenRecord: FrozenReconciliation; method: string }) => {
    // 1. Salva a conciliação no histórico de congeladas (com sincronização imediata Local + Nuvem + GitHub)
    updateFrozenReconciliations((prev) => [savedInfo.frozenRecord, ...prev]);
    saveFrozenReconciliationToFirestore(savedInfo.frozenRecord).catch((e) => {
      console.warn('[Firebase] Aviso ao salvar reconciliação individual:', e);
    });

    // 2. Preserva as posições 02.05.02 do estoque sem zerar a base
    setIsSaveModalOpen(false);
    setToastMessage({
      type: 'success',
      text: `Conciliação "${savedInfo.frozenRecord.nome}" salva e sincronizada! A diferença foi congelada na Diferença Diária e na Diferença Mensal. A base 02.05.02 foi preservada.`,
    });

    // 3. Navega para a guia de Diferença Diária para conferência imediata
    setCurrentTab('dif_diaria');
  };

  // Open confirmation modal to reset data (Zerar Base) without window.confirm/alert
  const handleResetData = () => {
    setIsResetConfirmModalOpen(true);
  };

  const executeConfirmedResetData = () => {
    isExplicitResetRef.current = true;
    setIsRecountApplied(false);

    localStorage.removeItem('gestao_estoque_v3_posicoes');
    localStorage.removeItem('gestao_estoque_v3_quebras');
    localStorage.removeItem('gestao_estoque_v3_vales');
    localStorage.removeItem('gestao_estoque_v5_trocas_doc');
    localStorage.removeItem('gestao_estoque_v4_trocas');
    localStorage.removeItem('gestao_estoque_v3_trocas');
    localStorage.removeItem('gestao_estoque_v3_faltas');

    removePersistedData(STORAGE_KEYS.STOCK_POSITIONS_020502);
    removePersistedData(STORAGE_KEYS.STOCK_POSITIONS_LEGACY);
    removePersistedData(STORAGE_KEYS.GRADE_POSITIONS);
    removePersistedData(STORAGE_KEYS.GRADE_POSITIONS_LEGACY);
    removePersistedData(STORAGE_KEYS.QUEBRAS);
    removePersistedData(STORAGE_KEYS.VALES);
    removePersistedData(STORAGE_KEYS.TROCAS);
    removePersistedData(STORAGE_KEYS.FALTAS);

    updateStockPositions([]);
    updateGradeStockPositions([]);
    updateQuebras([]);
    updateVales([]);
    updateTrocas([]);
    updateFaltasMapeadas([]);

    setIsResetConfirmModalOpen(false);
    setToastMessage({
      type: 'info',
      text: 'Plataforma zerada e sincronizada com sucesso! Base limpa para novas importações manuais.',
    });
  };

  // Open import modal strictly locked to the requested file type and mode
  const handleOpenImportModal = (
    fileType: ImportFileType = '020502', 
    locked: boolean = true, 
    mode: 'replace' | 'append' = 'replace'
  ) => {
    setImportInitialType(fileType);
    setImportLockedType(locked ? fileType : undefined);
    setImportMode(mode);
    setIsImportModalOpen(true);
  };

  // State and handlers for all manual congelamentos (quebras, vales, trocas, faltas)
  const [isManualCongelamentoModalOpen, setIsManualCongelamentoModalOpen] = useState(false);
  const [manualCongelamentoType, setManualCongelamentoType] = useState<CongelamentoType>('quebra');

  const handleOpenManualCongelamentoModal = (type: CongelamentoType = 'quebra') => {
    setManualCongelamentoType(type);
    setIsManualCongelamentoModalOpen(true);
  };

  const handleSaveManualQuebra = (novaQuebra: QuebraItem) => {
    updateQuebras((prev) => [novaQuebra, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Quebra (${novaQuebra.quantidade} cx de SKU ${novaQuebra.sku}) lançada e sincronizada com sucesso no depósito ${novaQuebra.deposito}.`,
    });
  };

  const handleSaveManualVale = (novoVale: ValeItem) => {
    updateVales((prev) => [novoVale, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Vale (${novoVale.quantidade} cx de SKU ${novoVale.codigo}) lançado e sincronizado com sucesso no depósito ${novoVale.deposito}.`,
    });
  };

  const handleSaveManualTroca = (novaTroca: TrocaItem) => {
    updateTrocas((prev) => [novaTroca, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Troca (${novaTroca.quantidade} cx de SKU ${novaTroca.sku}) lançada e sincronizada com sucesso no depósito ${novaTroca.deposito}.`,
    });
  };

  // Handler for adding a new manual falta
  const handleSaveManualFalta = (novaFalta: FaltaMapeadaItem) => {
    updateFaltasMapeadas((prev) => [novaFalta, ...prev]);
    setToastMessage({
      type: 'success',
      text: `Falta de doca (${novaFalta.quantidade} cx de SKU ${novaFalta.codigo || novaFalta.produto}) lançada e sincronizada com sucesso.`,
    });
  };

  // Exportação oficial do Relatório de Conciliação em Excel (Sem Ajustes e Com Ajustes)
  const handleExportConsolidatedReport = async () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `Relatorio_Conciliacao_Estoque_Ambev_Dep_${selectedDeposito}_${dateStr}_${timeStr}.xlsx`;

      const result = await exportConciliacaoExcel({
        stockPositions,
        quebras,
        vales,
        trocas,
        faltasMapeadas,
        selectedDeposito,
        filename,
        weeklyBillingStatus,
        productsMap,
      });

      if (result.success) {
        setToastMessage({
          type: 'success',
          text: `Relatório Excel exportado com sucesso! Arquivo: ${result.filename}`,
        });
      }
    } catch (err) {
      console.error('Erro ao exportar conciliação em Excel:', err);
      setToastMessage({
        type: 'error',
        text: 'Ocorreu um erro ao gerar a planilha Excel da conciliação.',
      });
    }
  };

  // Dedicated Initial Screen for Log In when user is not authenticated
  if (!currentUser) {
    return (
      <InitialLoginView
        users={users}
        onLogin={handleLogin}
        logoutNotice={showLogoutNotice}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Left Navigation Sidebar (Posicionada na Lateral Esquerda) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isRecountApplied={isRecountApplied}
        onResetData={handleResetData}
        onClearAllData={handleResetData}
        onExportReport={handleExportConsolidatedReport}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F3F4F6]">
        {/* Geometric Balance Top Header */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          selectedDeposito={selectedDeposito}
          setSelectedDeposito={setSelectedDeposito}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onOpenImportModal={() => handleOpenImportModal('020502')}
          onOpenManualFaltaModal={() => setIsManualFaltaModalOpen(true)}
          onOpenManualModal={handleOpenManualCongelamentoModal}
          onResetData={handleResetData}
          onExportReport={handleExportConsolidatedReport}
          isRecountApplied={isRecountApplied}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          currentUser={currentUser}
          onNavigateLogin={() => setCurrentTab('login')}
          onLogout={handleLogout}
          cloudSyncStatus={cloudSyncStatus}
          lastCloudSyncLabel={lastCloudSyncLabel}
          onForceCloudSync={handleForceCloudSync}
        />

        {/* Quota Exceeded Informative Banner */}
        {isQuotaWarningVisible && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 font-bold shrink-0">!</span>
              <span>
                <strong>Aviso de Cota do Firestore:</strong> A cota diária gratuita do Cloud Firestore foi atingida. A plataforma continua funcionando normalmente com <strong>armazenamento local persistente (LocalStorage / IndexedDB)</strong>, mantendo 100% de seus dados preservados.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleForceCloudSync}
                className="px-2.5 py-1 bg-white border border-amber-400 hover:bg-amber-50 text-amber-900 font-semibold rounded transition-colors text-xs cursor-pointer"
              >
                Tentar Reconectar
              </button>
              <a
                href="https://console.firebase.google.com/project/scenic-year-l5xj8/firestore/databases/ai-studio-conciliaodeestoq-3b77108f-dfc6-4120-9722-24391951064c/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded transition-colors text-xs inline-flex items-center gap-1"
              >
                Ver Cota no Firebase
              </a>
              <button
                onClick={() => setIsQuotaWarningVisible(false)}
                className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5 rounded cursor-pointer"
                title="Fechar aviso"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Main Views Section */}
        <main className="flex-1 overflow-y-auto space-y-6 p-3 sm:p-5 lg:p-6">
          <div className="max-w-[1780px] mx-auto w-full">
            {currentTab === 'dashboard' && (
              <DashboardView
                stockPositions={stockPositions}
                quebras={quebras}
                vales={vales}
                trocas={trocas}
                faltasMapeadas={faltasMapeadas}
                selectedDeposito={selectedDeposito}
                onNavigateTab={(tab) => {
                  if (tab === 'conciliacao_ajustes') {
                    setReconciliationMode('com_ajuste');
                  }
                  setCurrentTab(tab);
                }}
                onOpenManualFaltaModal={() => setIsManualFaltaModalOpen(true)}
                onOpenManualModal={handleOpenManualCongelamentoModal}
                weeklyBillingStatus={weeklyBillingStatus}
                frozenReconciliations={frozenReconciliations}
                productsMap={productsMap}
                reconciliationMode={reconciliationMode}
                onChangeReconciliationMode={setReconciliationMode}
              />
            )}

            {(currentTab === 'conciliacao' || currentTab === 'conciliacao_ajustes') && (
              <ConciliacaoView
                stockPositions={stockPositions}
                setStockPositions={updateStockPositions}
                selectedDeposito={selectedDeposito}
                setSelectedDeposito={setSelectedDeposito}
                onOpenImportModal={(initial) => handleOpenImportModal(initial || '020502')}
                productsMap={productsMap}
                isRecountApplied={isRecountApplied}
                quebras={quebras}
                vales={vales}
                trocas={trocas}
                faltasMapeadas={faltasMapeadas}
                initialSubTab={currentTab === 'conciliacao_ajustes' ? 'ajustes' : (reconciliationMode === 'com_ajuste' ? 'ajustes' : 'padrao')}
                reconciliationMode={currentTab === 'conciliacao_ajustes' ? 'com_ajuste' : reconciliationMode}
                onChangeReconciliationMode={setReconciliationMode}
                onNavigateTab={(tab) => {
                  if (tab === 'conciliacao_ajustes') {
                    setReconciliationMode('com_ajuste');
                    setCurrentTab('conciliacao');
                  } else {
                    setCurrentTab(tab);
                  }
                }}
                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                onOpenManualModal={handleOpenManualCongelamentoModal}
                weeklyBillingStatus={weeklyBillingStatus}
              />
            )}

            {currentTab === 'grade_estoque' && (
              <GradeEstoqueView
                stockPositions={gradeStockPositions}
                setStockPositions={updateGradeStockPositions}
                generalStockPositions={stockPositions}
                setGeneralStockPositions={updateStockPositions}
                productsMap={productsMap}
                quebras={quebras}
                vales={vales}
                trocas={trocas}
                faltasMapeadas={faltasMapeadas}
                weeklyBillingStatus={weeklyBillingStatus}
                frozenReconciliations={frozenReconciliations}
                onNavigateTab={setCurrentTab}
                onOpenImportModal={handleOpenImportModal}
              />
            )}

            {(currentTab === 'dif_diaria' || currentTab === 'congeladas') && (
              <DifDiariaView
                stockPositions={stockPositions}
                quebras={quebras}
                vales={vales}
                trocas={trocas}
                faltasMapeadas={faltasMapeadas}
                selectedDeposito={selectedDeposito}
                setSelectedDeposito={setSelectedDeposito}
                productsMap={productsMap}
                frozenReconciliations={frozenReconciliations}
                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                onNavigateTab={setCurrentTab}
                weeklyBillingStatus={weeklyBillingStatus}
                reconciliationMode={reconciliationMode}
                onChangeReconciliationMode={setReconciliationMode}
              />
            )}

            {currentTab === 'dif_mensal' && (
              <DifMensalView
                stockPositions={stockPositions}
                selectedDeposito={selectedDeposito}
                setSelectedDeposito={setSelectedDeposito}
                productsMap={productsMap}
                frozenReconciliations={frozenReconciliations}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'inversao' && (
              <InversaoErrorBoundary>
                <InversaoView
                  stockPositions={stockPositions}
                  quebras={quebras}
                  vales={vales}
                  trocas={trocas}
                  faltasMapeadas={faltasMapeadas}
                  selectedDeposito={selectedDeposito}
                  setSelectedDeposito={setSelectedDeposito}
                  currentUser={currentUser}
                  productsMap={productsMap}
                  onUpdateProductsMap={updateProductsMap}
                  onUpdateStockPositions={updateStockPositions}
                  onUpdateGradeStockPositions={updateGradeStockPositions}
                  onOpenImportModal={handleOpenImportModal}
                />
              </InversaoErrorBoundary>
            )}

            {currentTab === 'quebras' && (
              <QuebrasView
                quebras={quebras}
                selectedDeposito={selectedDeposito}
                onOpenImportModal={() => handleOpenImportModal('quebras')}
                onOpenManualQuebra={() => handleOpenManualCongelamentoModal('quebra')}
                onUpdateQuebras={updateQuebras}
                weeklyBillingStatus={weeklyBillingStatus}
                onUpdateWeeklyBillingStatus={updateWeeklyBillingStatus}
              />
            )}

            {currentTab === 'vales' && (
              <ValesView
                vales={vales}
                selectedDeposito={selectedDeposito}
                onOpenImportModal={() => handleOpenImportModal('vales')}
                onOpenManualVale={() => handleOpenManualCongelamentoModal('vale')}
                onUpdateVales={updateVales}
                weeklyBillingStatus={weeklyBillingStatus}
              />
            )}

            {currentTab === 'trocas' && (
              <TrocasView
                trocas={trocas}
                selectedDeposito={selectedDeposito}
                onOpenImportModal={() => handleOpenImportModal('trocas')}
                onOpenManualTroca={() => handleOpenManualCongelamentoModal('troca')}
                onUpdateTrocas={updateTrocas}
                weeklyBillingStatus={weeklyBillingStatus}
              />
            )}

            {currentTab === 'faltas' && (
              <FaltasView
                faltasMapeadas={faltasMapeadas}
                setFaltasMapeadas={updateFaltasMapeadas}
                selectedDeposito={selectedDeposito}
                onOpenManualFaltaModal={() => handleOpenManualCongelamentoModal('falta')}
                onOpenImportModal={() => handleOpenImportModal('faltas')}
                weeklyBillingStatus={weeklyBillingStatus}
                productsMap={productsMap}
              />
            )}

            {currentTab === 'produtos' && (
              <ProdutosView
                productsMap={productsMap}
                setProductsMap={updateProductsMap}
                stockPositions={stockPositions}
                setStockPositions={updateStockPositions}
                onOpenImportModal={() => handleOpenImportModal('cadastro')}
                onExportReport={handleExportConsolidatedReport}
                onClearAllData={handleResetData}
              />
            )}

            {currentTab === 'login' && (
              <LoginView
                users={users}
                setUsers={updateUsers}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                onNavigateTab={setCurrentTab}
                onLogout={handleLogout}
                onExportReport={handleExportConsolidatedReport}
                onClearAllData={handleResetData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Universal Manual Congelamento Modal (Quebras, Vales, Trocas, Faltas) */}
      <ManualCongelamentoModal
        isOpen={isManualCongelamentoModalOpen}
        onClose={() => setIsManualCongelamentoModalOpen(false)}
        initialType={manualCongelamentoType}
        defaultDeposito={selectedDeposito === 'ALL' ? '01' : selectedDeposito}
        productsMap={productsMap}
        onSaveQuebra={handleSaveManualQuebra}
        onSaveVale={handleSaveManualVale}
        onSaveTroca={handleSaveManualTroca}
        onSaveFalta={handleSaveManualFalta}
      />

      {/* Manual Falta Modal (Backward Compatibility) */}
      <ManualFaltaModal
        isOpen={isManualFaltaModalOpen}
        onClose={() => setIsManualFaltaModalOpen(false)}
        productsMap={productsMap}
        onSaveFalta={handleSaveManualFalta}
        defaultDeposito={selectedDeposito === 'ALL' ? '01' : selectedDeposito}
      />

      {/* Universal Import Modal for 02.05.02, 01.11, Cadastro, Quebras, Vales, Trocas, Faltas */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialFileType={importInitialType}
        lockedFileType={importLockedType}
        selectedDeposito={selectedDeposito}
        productsMap={productsMap}
        setProductsMap={updateProductsMap}
        stockPositions={stockPositions}
        setStockPositions={updateStockPositions}
        gradeStockPositions={gradeStockPositions}
        setGradeStockPositions={updateGradeStockPositions}
        setQuebras={updateQuebras}
        setVales={updateVales}
        setTrocas={updateTrocas}
        setFaltasMapeadas={updateFaltasMapeadas}
        setIsRecountApplied={setIsRecountApplied}
      />

      {/* Save Reconciliation & Freeze Confirmation Modal */}
      <SaveReconciliationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirmSaveAndReset={handleConfirmSaveAndReset}
        stockPositions={stockPositions}
        quebras={quebras}
        vales={vales}
        trocas={trocas}
        faltasMapeadas={faltasMapeadas}
        selectedDeposito={selectedDeposito}
        productsMap={productsMap}
        currentUser={currentUser}
        weeklyBillingStatus={weeklyBillingStatus}
      />

      {/* Inline Reset Platform Confirmation Modal (No window.confirm/alert) */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Zerar Bases Operacionais da Plataforma?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Todas as posições de estoque (02.05.02 e Grade), quebras, vales, trocas e faltas serão limpas localmente e sincronizadas na nuvem para que você possa importar uma nova base do zero.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedResetData}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Confirmar Limpeza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-200">
              {toastMessage.type === 'error' ? 'Atenção' : 'Sincronização & Sistema'}
            </div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{toastMessage.text}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
