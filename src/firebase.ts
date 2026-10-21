import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  disableNetwork,
  enableNetwork,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal Firestore SDK retry and backoff logs to prevent noise
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

const customDatabaseId = (firebaseConfig as any).firestoreDatabaseId && 
  (firebaseConfig as any).firestoreDatabaseId !== '(default)' 
    ? (firebaseConfig as any).firestoreDatabaseId 
    : undefined;

// Configure Firestore with long-polling transport to eliminate iframe/sandbox WebSocket connection failures
try {
  if (customDatabaseId) {
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, customDatabaseId);
  } else {
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }
} catch {
  // Safe if already initialized
}

export const db = customDatabaseId ? getFirestore(app, customDatabaseId) : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
  disableNetwork,
  enableNetwork,
  type FirebaseUser
};

let quotaExceededState = false;
let quotaExceededTimestamp = 0;
const QUOTA_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

export function isQuotaExceeded(): boolean {
  if (quotaExceededState) {
    if (Date.now() - quotaExceededTimestamp < QUOTA_COOLDOWN_MS) {
      return true;
    }
    quotaExceededState = false;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem('firestore_quota_exceeded');
      if (stored) {
        const ts = Number(stored);
        if (Date.now() - ts < QUOTA_COOLDOWN_MS) {
          quotaExceededState = true;
          quotaExceededTimestamp = ts;
          return true;
        } else {
          localStorage.removeItem('firestore_quota_exceeded');
        }
      }
    } catch {}
  }
  return false;
}

export function markQuotaExceeded(): void {
  quotaExceededState = true;
  quotaExceededTimestamp = Date.now();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('firestore_quota_exceeded', String(Date.now()));
    } catch {}
  }
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
  }
}

// On startup, immediately disable network if quota was previously exceeded to prevent retry storms
if (isQuotaExceeded()) {
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
  console.warn('[Firebase] Cota diária do Firestore atingida anteriormente. Modo offline ativado com persistência local (IndexedDB/LocalStorage).');
}

// Connection test with strict quota protection
export async function testConnection(): Promise<boolean> {
  // If quota was already exceeded, avoid bombarding backend with failed queries
  if (isQuotaExceeded()) {
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connection to Firestore established successfully.');
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = (error as any)?.code;
    if (code === 'resource-exhausted' || msg.includes('resource-exhausted') || msg.includes('Quota exceeded') || msg.includes('QUOTA_EXCEEDED')) {
      markQuotaExceeded();
      console.warn('[Firebase] Cota diária do Firestore excedida (Quota exceeded). Operando com persistência local.');
      return false;
    }
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable') || error.message.includes('could not be completed'))) {
      console.warn('[Firebase] Client is operating in offline/cached mode:', error.message);
    }
    return false;
  }
}

// Standard Error Handler per Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
