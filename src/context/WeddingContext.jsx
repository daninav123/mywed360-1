import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { db, firebaseReady, getFirebaseAuth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';
import errorLogger from '../utils/errorLogger';
import { ensureWeddingAccessMetadata } from '../utils/weddingPermissions';
import {
  loadLocalWeddings,
  LOCAL_WEDDINGS_EVENT,
  setLocalActiveWedding,
  upsertLocalWedding,
} from '../services/localWeddingStore';

const defaultContextValue = {
  weddings: [],
  activeWedding: '',
  setActiveWedding: () => {},
  weddingsReady: false,
  activeWeddingData: null,
  activeWeddingRole: 'guest',
  activeWeddingPermissions: [],
  canAccess: () => false,
};

const WeddingContext = createContext(defaultContextValue);

export const useWedding = () => useContext(WeddingContext);

async function ensureFinance(weddingId) {
  try {
    const financeRef = doc(db, 'weddings', weddingId, 'finance', 'main');
    const financeSnap = await getDoc(financeRef);
    if (!financeSnap.exists()) {
      await setDoc(
        financeRef,
        {
          movements: [],
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (import.meta.env.DEV) {
        console.debug('[WeddingContext] finance/main creado para', weddingId);
      }
    }
  } catch (error) {
    console.warn('[WeddingContext] No se pudo asegurar finance/main', weddingId, error);
  }
}

const readSafeJson = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export function WeddingProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  
  // Detectar si estamos en modo test y cargar datos mock
  const isTestMode = typeof window !== 'undefined' && (window.Cypress || window.__MALOVEAPP_TEST_MODE__);
  
  // Cargar bodas mock de localStorage si estamos en tests
  const loadTestWeddings = () => {
    if (!isTestMode) return { weddings: [], activeWedding: '' };
    try {
      const storedWeddings = window.localStorage.getItem('MaLoveApp_weddings');
      const storedActive = window.localStorage.getItem('MaLoveApp_active_wedding');
      const weddings = storedWeddings ? JSON.parse(storedWeddings) : [];
      const activeWedding = storedActive ? JSON.parse(storedActive) : null;
      return {
        weddings: Array.isArray(weddings) ? weddings : [],
        activeWedding: activeWedding?.id || ''
      };
    } catch (e) {
      console.warn('Error loading test weddings:', e);
      return { weddings: [], activeWedding: '' };
    }
  };
  
  const testData = loadTestWeddings();
  
  // Estado inicial - usar datos de test si están disponibles
  const [weddings, setWeddings] = useState(testData.weddings);
  const [weddingsReady, setWeddingsReady] = useState(isTestMode);
  const [activeWedding, setActiveWeddingState] = useState(testData.activeWedding);
  const [localMirror, setLocalMirror] = useState({
    weddings: testData.weddings,
    activeWeddingId: testData.activeWedding,
    uid: '',
  });
  const [usingFirestore, setUsingFirestore] = useState(false);

  const getLocalProfileUid = useCallback(() => {
    try {
      const raw = window.localStorage.getItem('MaLoveApp_user_profile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?.uid || null;
    } catch {
      return null;
    }
  }, []);

  const storageKeyForUser = useCallback(
    (uid) => (uid ? `maloveapp_active_wedding_user_${uid}` : 'maloveapp_active_wedding'),
    []
  );

  const resolveActiveWeddingFromStorage = useCallback(
    (uid) => {
      if (typeof window === 'undefined') return '';
      const key = storageKeyForUser(uid);
      try {
        const stored = window.localStorage.getItem(key);
        if (typeof stored === 'string' && stored) return stored;
      } catch {}
      return '';
    },
    [storageKeyForUser]
  );

  // Inicializar activeWedding cuando cambie el usuario
  useEffect(() => {
    const uid = currentUser?.uid || getLocalProfileUid();
    if (!uid) {
      setActiveWeddingState('');
      return;
    }
    const stored = resolveActiveWeddingFromStorage(uid);
    if (stored) {
      setActiveWeddingState(stored);
    }
  }, [currentUser, getLocalProfileUid, resolveActiveWeddingFromStorage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const uid = currentUser?.uid || getLocalProfileUid() || 'anonymous';

    const readLocal = () => {
      const { weddings: localWeddings, activeWeddingId } = loadLocalWeddings(uid);
      if (cancelled) return;
      setLocalMirror({
        weddings: Array.isArray(localWeddings) ? localWeddings : [],
        activeWeddingId: activeWeddingId || '',
        uid,
      });
    };

    readLocal();
    const handleUpdate = () => readLocal();
    window.addEventListener(LOCAL_WEDDINGS_EVENT, handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(LOCAL_WEDDINGS_EVENT, handleUpdate);
    };
  }, [currentUser, getLocalProfileUid]);

  useEffect(() => {
    if (!localMirror.uid) return;
    if (usingFirestore) return;
    setWeddings(localMirror.weddings);
    setWeddingsReady(true);
    const nextActive =
      localMirror.activeWeddingId ||
      (localMirror.weddings.length ? localMirror.weddings[0].id : '');
    if (nextActive) {
      setActiveWeddingState(nextActive);
    } else {
      setActiveWeddingState('');
    }
  }, [localMirror, usingFirestore]);

  // Suscribirse a Firestore usando subcolección users/{uid}/weddings
  useEffect(() => {
    // Si estamos en modo test, no usar Firestore
    if (isTestMode) {
      setWeddingsReady(true);
      return;
    }
    
    let unsub = null;
    let cancelled = false;

    const applyLocal = (uid) => {
      const { weddings: localWeddings, activeWeddingId } = loadLocalWeddings(uid);
      setUsingFirestore(false);
      setWeddings(localWeddings);
      setWeddingsReady(true);
      const nextActive =
        activeWeddingId || (localWeddings.length ? localWeddings[0].id : '');
      if (nextActive) {
        setActiveWeddingState(nextActive);
      } else {
        setActiveWeddingState('');
      }
    };

    const listen = async () => {
      // Siempre preferir el UID real de Firebase Auth para cumplir reglas de Firestore
      const activeAuth = (typeof getFirebaseAuth === 'function' ? getFirebaseAuth() : null);
      const authUid = activeAuth?.currentUser?.uid || null;
      const localUid = authUid || currentUser?.uid || getLocalProfileUid() || 'anonymous';
      if (!localUid) {
        setWeddings([]);
        setWeddingsReady(true);
        setActiveWeddingState('');
        return;
      }

      try {
        await firebaseReady;
      } catch (error) {
        console.warn('[WeddingContext] firebaseReady rejected', error);
      }

      if (!db || !authUid) {
        applyLocal(localUid);
        return;
      }

      try {
        const subcolRef = collection(db, 'users', authUid, 'weddings');
        unsub = onSnapshot(
          subcolRef,
          async (snap) => {
            if (cancelled) return;
            const entries = [];
            for (const docSnap of snap.docs) {
              const subData = docSnap.data() || {};
              const id = docSnap.id;
              let merged = { id, ...subData };
              try {
                const mainRef = doc(db, 'weddings', id);
                const mainSnap = await getDoc(mainRef);
                if (mainSnap.exists()) {
                  const raw = { id, ...mainSnap.data() };
                  const role = subData.role || 'owner';
                  merged = ensureWeddingAccessMetadata(raw, role);
                }
              } catch (e) {
                // mantener subData si no es accesible
              }
              entries.push(merged);
              upsertLocalWedding(localUid, merged);
            }
            if (cancelled) return;
            setUsingFirestore(true);
            setWeddings(entries);
            setWeddingsReady(true);
            entries.forEach((w) => ensureFinance(w.id));
            if (!activeWedding && entries.length) {
              setActiveWeddingState(entries[0].id);
              setLocalActiveWedding(localUid, entries[0].id);
            } else if (activeWedding) {
              setLocalActiveWedding(localUid, activeWedding);
            }
          },
          (error) => {
            console.warn('[WeddingContext] users/{uid}/weddings snapshot error', error);
            applyLocal(localUid);
          }
        );
      } catch (error) {
        console.warn('[WeddingContext] listen subcollection weddings failed', error);
        applyLocal(localUid);
      }
    };

    listen();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [currentUser, getLocalProfileUid, activeWedding]);

  // Asegurar activeWedding válido cuando cambia la lista
  useEffect(() => {
    if (!weddingsReady) return;
    if (!weddings.length) {
      setActiveWeddingState('');
      return;
    }
    if (!activeWedding) {
      setActiveWeddingState(weddings[0].id);
      return;
    }
    const exists = weddings.some((w) => w.id === activeWedding);
    if (!exists) {
      setActiveWeddingState(weddings[0].id);
    }
  }, [weddings, weddingsReady, activeWedding]);

  // Actualizar diagnóstico y helpers globales
  useEffect(() => {
    try {
      window.weddingContext = {
        weddings,
        activeWedding,
        weddingsReady,
      };
    } catch {}
  }, [weddings, activeWedding, weddingsReady]);

  useEffect(() => {
    if (!currentUser) {
      errorLogger.setWeddingInfo(null);
      return;
    }
    try {
      errorLogger.setWeddingInfo({
        count: weddings.length,
        list: weddings.map((w) => ({ id: w.id, name: w.name || w.slug || 'Boda' })),
        activeWedding,
      });
    } catch {}
  }, [weddings, activeWedding, currentUser]);

  const activeWeddingData = useMemo(
    () => weddings.find((w) => w.id === activeWedding) || null,
    [weddings, activeWedding]
  );

  const activeWeddingPermissions = useMemo(() => {
    const perms = activeWeddingData?.permissions;
    if (Array.isArray(perms)) return perms;
    if (Array.isArray(activeWeddingData?.allowedActions)) return activeWeddingData.allowedActions;
    return [];
  }, [activeWeddingData]);

  const activeWeddingRole = useMemo(() => {
    if (activeWeddingData?.role) return activeWeddingData.role;
    if (userProfile?.role) return userProfile.role;
    return 'guest';
  }, [activeWeddingData, userProfile]);

  const canAccess = useCallback(
    (permission) => {
      if (!permission) return true;
      const set = new Set(activeWeddingPermissions);
      if (set.has('*')) return true;
      return set.has(permission);
    },
    [activeWeddingPermissions]
  );

  const persistActiveWedding = useCallback(
    (uid, nextId) => {
      if (typeof window === 'undefined') return;
      const key = storageKeyForUser(uid);
      try {
        window.localStorage.setItem(key, nextId || '');
      } catch {}
    },
    [storageKeyForUser]
  );

  const setActiveWedding = useCallback(
    (id) => {
      const nextId = id || '';
      const uid = currentUser?.uid || getLocalProfileUid();

      setActiveWeddingState(nextId);
      if (uid) persistActiveWedding(uid, nextId);

      if (uid) {
        try {
          setLocalActiveWedding(uid, nextId);
        } catch {}
      }

      if (nextId) {
        ensureFinance(nextId);
      }

      const activeAuth = (typeof getFirebaseAuth === 'function' ? getFirebaseAuth() : null);
      const authUid = activeAuth?.currentUser?.uid || null;
      if (uid && db && authUid && uid === authUid) {
        try {
          const userRef = doc(db, 'users', uid);
          void setDoc(
            userRef,
            {
              activeWeddingId: nextId || null,
              hasActiveWedding: Boolean(nextId),
              lastActiveWeddingAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
          if (nextId) {
            const subRef = doc(db, 'users', uid, 'weddings', nextId);
            void setDoc(
              subRef,
              {
                active: true,
                lastAccessedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch(() => {});
          }
        } catch (error) {
          console.warn('[WeddingContext] No se pudo sincronizar activeWeddingId', error);
        }
      }

      if ((nextId || '') !== (activeWedding || '')) {
        try {
          performanceMonitor.logEvent('wedding_switched', {
            fromWeddingId: activeWedding || null,
            toWeddingId: nextId || null,
            userUid: uid || null,
          });
        } catch {}
      }
    },
    [activeWedding, currentUser, getLocalProfileUid, persistActiveWedding]
  );

  const contextValue = useMemo(
    () => ({
      weddings,
      activeWedding,
      setActiveWedding,
      weddingsReady,
      activeWeddingData,
      activeWeddingRole,
      activeWeddingPermissions,
      canAccess,
    }),
    [
      weddings,
      activeWedding,
      setActiveWedding,
      weddingsReady,
      activeWeddingData,
      activeWeddingRole,
      activeWeddingPermissions,
      canAccess,
    ]
  );

  return <WeddingContext.Provider value={contextValue}>{children}</WeddingContext.Provider>;
}

export default WeddingProvider;
