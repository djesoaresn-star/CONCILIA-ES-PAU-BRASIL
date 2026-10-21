/**
 * High-reliability persistence engine using IndexedDB with localStorage fallback.
 * Solves browser 5MB quota exhaustion and ensures 02.05.02 and all manual alterations
 * persist across page reloads, prompt executions, and container restarts.
 */

import persistedCodeData from '../data/persistedCodeData.json';

const DB_NAME = 'GestaoEstoqueDB_v1';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

// In-memory memory cache for lightning-fast reads
const memoryCache = new Map<string, any>();

// Singleton connection promise to prevent concurrent open conflicts and exhaustion
let dbInstancePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbInstancePromise) {
    dbInstancePromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            dbInstancePromise = null;
          };
          resolve(db);
        };

        request.onerror = () => {
          dbInstancePromise = null;
          reject(request.error);
        };
      } catch (err) {
        dbInstancePromise = null;
        reject(err);
      }
    });
  }

  return dbInstancePromise;
}

export interface CompactStockItem {
  d: string;
  p: string;
  dr: string;
  ir: string;
  r?: number;
  a?: string;
}

export function compressStockPositions(items: any[]): CompactStockItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    d: String(item.deposito || '01'),
    p: String(item.produto || ''),
    dr: String(item.disponivelRaw || '0/00'),
    ir: String(item.inventarioRaw || '0/00'),
    r: item.recontado ? 1 : 0,
    a: item.armazem || '01'
  }));
}

/**
 * Safely writes to localStorage without ever throwing QuotaExceededError.
 * Automatically clears legacy caches if quota is reached.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    try {
      localStorage.removeItem('gestao_estoque_v3_posicoes');
      localStorage.removeItem('gestao_estoque_v3_grade_posicoes');
      localStorage.removeItem('gestao_estoque_v4_trocas');
      localStorage.removeItem('gestao_estoque_v3_quebras');
      localStorage.removeItem('gestao_estoque_v2_quebras');
      localStorage.removeItem('gestao_estoque_v3_vales');
      localStorage.setItem(key, value);
      return true;
    } catch {
      // Quota exceeded: data is safely kept in IndexedDB and memoryCache
      console.warn(`[PersistentStorage] Quota exceeded for "${key}". Data safely held in IndexedDB/RAM.`);
      return false;
    }
  }
}

/**
 * Persist an item to IndexedDB, memory cache, and safely to localStorage.
 */
export async function persistData<T>(key: string, value: T): Promise<void> {
  // 1. Update memory cache
  memoryCache.set(key, value);

  // 2. Extra reliability: If stock positions, always store compact lightweight representation in localStorage
  if (key === STORAGE_KEYS.STOCK_POSITIONS_020502 || key === STORAGE_KEYS.STOCK_POSITIONS_LEGACY) {
    try {
      if (Array.isArray(value) && value.length > 0) {
        const compact = compressStockPositions(value);
        safeLocalStorageSet(STORAGE_KEYS.STOCK_POSITIONS_COMPACT, JSON.stringify(compact));
      }
    } catch {}
  } else if (key === STORAGE_KEYS.GRADE_POSITIONS || key === STORAGE_KEYS.GRADE_POSITIONS_LEGACY) {
    try {
      if (Array.isArray(value) && value.length > 0) {
        const compact = compressStockPositions(value);
        safeLocalStorageSet(STORAGE_KEYS.GRADE_POSITIONS_COMPACT, JSON.stringify(compact));
      }
    } catch {}
  }

  // 3. Safely attempt localStorage write (ignore quota errors)
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (localStorageError) {
    // Quota exceeded in localStorage is expected for large bases.
    // Clean up redundant legacy keys to reclaim space
    try {
      localStorage.removeItem('gestao_estoque_v3_posicoes');
      localStorage.removeItem('gestao_estoque_v3_grade_posicoes');
      localStorage.removeItem('gestao_estoque_v4_trocas');
      localStorage.removeItem('gestao_estoque_v3_quebras');
      localStorage.removeItem('gestao_estoque_v2_quebras');
    } catch {}
    console.warn(`[PersistentStorage] LocalStorage quota reached for key "${key}". Persisting via IndexedDB.`);
  }

  // 4. Persist to IndexedDB
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (idbError) {
    console.error(`[PersistentStorage] IndexedDB write failed for key "${key}":`, idbError);
  }
}

/**
 * Retrieve an item asynchronously from IndexedDB, falling back to localStorage and memory.
 */
export async function retrieveData<T>(key: string, defaultValue: T): Promise<T> {
  // 1. Try memory cache first
  if (memoryCache.has(key)) {
    const val = memoryCache.get(key) as T;
    if (val !== undefined && val !== null && (!Array.isArray(val) || val.length > 0)) {
      return val;
    }
  }

  // 2. Try IndexedDB
  try {
    const db = await openDatabase();
    const result = await new Promise<T | undefined>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (result !== undefined && result !== null) {
      if (!Array.isArray(result) || result.length > 0) {
        memoryCache.set(key, result);
        return result;
      }
    }
  } catch (idbError) {
    console.warn(`[PersistentStorage] IndexedDB read failed for key "${key}":`, idbError);
  }

  // 3. Fallback to localStorage full key
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as T;
      if (parsed !== undefined && parsed !== null && (!Array.isArray(parsed) || parsed.length > 0)) {
        memoryCache.set(key, parsed);
        persistData(key, parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (lsError) {
    console.warn(`[PersistentStorage] LocalStorage read failed for key "${key}":`, lsError);
  }

  // 4. Special Fallback for Stock Positions: check compact localStorage representation
  if (key === STORAGE_KEYS.STOCK_POSITIONS_020502 || key === STORAGE_KEYS.STOCK_POSITIONS_LEGACY) {
    try {
      const compactSaved = localStorage.getItem(STORAGE_KEYS.STOCK_POSITIONS_COMPACT);
      if (compactSaved) {
        const compactList = JSON.parse(compactSaved);
        if (Array.isArray(compactList) && compactList.length > 0) {
          const reconstructed = compactList.map((c: any) => ({
            id: `${c.d || '01'}-${c.p}`,
            deposito: c.d || '01',
            produto: c.p,
            descricao: `Produto ${c.p}`,
            disponivelRaw: c.dr || '0/00',
            inventarioRaw: c.ir || '0/00',
            recontado: Boolean(c.r),
            armazem: c.a || '01'
          })) as unknown as T;
          memoryCache.set(key, reconstructed);
          persistData(key, reconstructed).catch(() => {});
          return reconstructed;
        }
      }
    } catch {}
  } else if (key === STORAGE_KEYS.GRADE_POSITIONS || key === STORAGE_KEYS.GRADE_POSITIONS_LEGACY) {
    try {
      const compactSaved = localStorage.getItem(STORAGE_KEYS.GRADE_POSITIONS_COMPACT);
      if (compactSaved) {
        const compactList = JSON.parse(compactSaved);
        if (Array.isArray(compactList) && compactList.length > 0) {
          const reconstructed = compactList.map((c: any) => ({
            id: `${c.d || '01'}-${c.p}`,
            deposito: c.d || '01',
            produto: c.p,
            descricao: `Produto ${c.p}`,
            disponivelRaw: c.dr || '0/00',
            inventarioRaw: c.ir || '0/00',
            recontado: Boolean(c.r),
            armazem: c.a || '01'
          })) as unknown as T;
          memoryCache.set(key, reconstructed);
          persistData(key, reconstructed).catch(() => {});
          return reconstructed;
        }
      }
    } catch {}
  }

  // 5. Code Storage Fallback (persisted in codebase JSON)
  try {
    if (key === STORAGE_KEYS.STOCK_POSITIONS_020502 || key === STORAGE_KEYS.STOCK_POSITIONS_LEGACY) {
      if (Array.isArray(persistedCodeData.stockPositions) && persistedCodeData.stockPositions.length > 0) {
        return persistedCodeData.stockPositions as unknown as T;
      }
    } else if (key === STORAGE_KEYS.GRADE_POSITIONS || key === STORAGE_KEYS.GRADE_POSITIONS_LEGACY) {
      if (Array.isArray(persistedCodeData.gradeStockPositions) && persistedCodeData.gradeStockPositions.length > 0) {
        return persistedCodeData.gradeStockPositions as unknown as T;
      }
    } else if (key === STORAGE_KEYS.QUEBRAS) {
      if (Array.isArray(persistedCodeData.quebras) && persistedCodeData.quebras.length > 0) {
        return persistedCodeData.quebras as unknown as T;
      }
    } else if (key === STORAGE_KEYS.VALES) {
      if (Array.isArray(persistedCodeData.vales) && persistedCodeData.vales.length > 0) {
        return persistedCodeData.vales as unknown as T;
      }
    } else if (key === STORAGE_KEYS.TROCAS || key === STORAGE_KEYS.TROCAS_V4) {
      if (Array.isArray(persistedCodeData.trocas) && persistedCodeData.trocas.length > 0) {
        return persistedCodeData.trocas as unknown as T;
      }
    } else if (key === STORAGE_KEYS.FALTAS) {
      if (Array.isArray(persistedCodeData.faltasMapeadas) && persistedCodeData.faltasMapeadas.length > 0) {
        return persistedCodeData.faltasMapeadas as unknown as T;
      }
    }
  } catch {}

  return defaultValue;
}

/**
 * Synchronous retrieval for initial React state initialization.
 * Reads from memory cache or localStorage.
 */
export function retrieveSync<T>(key: string, defaultValue: T): T {
  if (memoryCache.has(key)) {
    const val = memoryCache.get(key) as T;
    if (val !== undefined && val !== null && (!Array.isArray(val) || val.length > 0)) {
      return val;
    }
  }

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as T;
      if (parsed !== undefined && parsed !== null && (!Array.isArray(parsed) || parsed.length > 0)) {
        memoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch (e) {}

  // Synchronous compact fallback for stock positions
  if (key === STORAGE_KEYS.STOCK_POSITIONS_020502 || key === STORAGE_KEYS.STOCK_POSITIONS_LEGACY) {
    try {
      const compactSaved = localStorage.getItem(STORAGE_KEYS.STOCK_POSITIONS_COMPACT);
      if (compactSaved) {
        const compactList = JSON.parse(compactSaved);
        if (Array.isArray(compactList) && compactList.length > 0) {
          const reconstructed = compactList.map((c: any) => ({
            id: `${c.d || '01'}-${c.p}`,
            deposito: c.d || '01',
            produto: c.p,
            descricao: `Produto ${c.p}`,
            disponivelRaw: c.dr || '0/00',
            inventarioRaw: c.ir || '0/00',
            recontado: Boolean(c.r),
            armazem: c.a || '01'
          })) as unknown as T;
          memoryCache.set(key, reconstructed);
          return reconstructed;
        }
      }
    } catch {}
  } else if (key === STORAGE_KEYS.GRADE_POSITIONS || key === STORAGE_KEYS.GRADE_POSITIONS_LEGACY) {
    try {
      const compactSaved = localStorage.getItem(STORAGE_KEYS.GRADE_POSITIONS_COMPACT);
      if (compactSaved) {
        const compactList = JSON.parse(compactSaved);
        if (Array.isArray(compactList) && compactList.length > 0) {
          const reconstructed = compactList.map((c: any) => ({
            id: `${c.d || '01'}-${c.p}`,
            deposito: c.d || '01',
            produto: c.p,
            descricao: `Produto ${c.p}`,
            disponivelRaw: c.dr || '0/00',
            inventarioRaw: c.ir || '0/00',
            recontado: Boolean(c.r),
            armazem: c.a || '01'
          })) as unknown as T;
          memoryCache.set(key, reconstructed);
          return reconstructed;
        }
      }
    } catch {}
  }

  // Code Storage fallback
  try {
    if (key === STORAGE_KEYS.STOCK_POSITIONS_020502 || key === STORAGE_KEYS.STOCK_POSITIONS_LEGACY) {
      if (Array.isArray(persistedCodeData.stockPositions) && persistedCodeData.stockPositions.length > 0) {
        return persistedCodeData.stockPositions as unknown as T;
      }
    } else if (key === STORAGE_KEYS.GRADE_POSITIONS || key === STORAGE_KEYS.GRADE_POSITIONS_LEGACY) {
      if (Array.isArray(persistedCodeData.gradeStockPositions) && persistedCodeData.gradeStockPositions.length > 0) {
        return persistedCodeData.gradeStockPositions as unknown as T;
      }
    } else if (key === STORAGE_KEYS.QUEBRAS) {
      if (Array.isArray(persistedCodeData.quebras) && persistedCodeData.quebras.length > 0) {
        return persistedCodeData.quebras as unknown as T;
      }
    } else if (key === STORAGE_KEYS.VALES) {
      if (Array.isArray(persistedCodeData.vales) && persistedCodeData.vales.length > 0) {
        return persistedCodeData.vales as unknown as T;
      }
    } else if (key === STORAGE_KEYS.TROCAS || key === STORAGE_KEYS.TROCAS_V4) {
      if (Array.isArray(persistedCodeData.trocas) && persistedCodeData.trocas.length > 0) {
        return persistedCodeData.trocas as unknown as T;
      }
    } else if (key === STORAGE_KEYS.FALTAS) {
      if (Array.isArray(persistedCodeData.faltasMapeadas) && persistedCodeData.faltasMapeadas.length > 0) {
        return persistedCodeData.faltasMapeadas as unknown as T;
      }
    }
  } catch {}

  return defaultValue;
}

/**
 * Remove an item from all stores
 */
export async function removePersistedData(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {}

  if (key === STORAGE_KEYS.STOCK_POSITIONS_020502) {
    try {
      localStorage.removeItem(STORAGE_KEYS.STOCK_POSITIONS_COMPACT);
    } catch {}
  } else if (key === STORAGE_KEYS.GRADE_POSITIONS) {
    try {
      localStorage.removeItem(STORAGE_KEYS.GRADE_POSITIONS_COMPACT);
    } catch {}
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

/**
 * Storage Keys standardized across the platform
 */
export const STORAGE_KEYS = {
  STOCK_POSITIONS_020502: 'gestao_estoque_v4_posicoes_020502',
  STOCK_POSITIONS_COMPACT: 'gestao_estoque_v4_posicoes_compact',
  STOCK_POSITIONS_LEGACY: 'gestao_estoque_v3_posicoes',
  GRADE_POSITIONS: 'gestao_estoque_v4_grade_posicoes',
  GRADE_POSITIONS_COMPACT: 'gestao_estoque_v4_grade_compact',
  GRADE_POSITIONS_LEGACY: 'gestao_estoque_v3_grade_posicoes',
  GRADE_IMPORT_LABEL: 'gestao_estoque_v3_grade_data_importacao',
  QUEBRAS: 'gestao_estoque_v4_quebras',
  VALES: 'gestao_estoque_v3_vales',
  TROCAS: 'gestao_estoque_v5_trocas_doc',
  TROCAS_V4: 'gestao_estoque_v4_trocas',
  FALTAS: 'gestao_estoque_v3_faltas',
  FROZEN: 'gestao_estoque_v3_frozen',
  WEEKLY_BILLING: 'gestao_estoque_faturamento_semanal_v2',
  ACTIVE_USER: 'gestao_estoque_v3_usuario_ativo',
  USERS: 'gestao_estoque_v3_usuarios',
  PRODUCTS: 'gestao_estoque_v3_produtos',
};
