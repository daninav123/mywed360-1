import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
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

import { db, firebaseReady } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';
import errorLogger from '../utils/errorLogger';
import { ensureWeddingAccessMetadata } from '../utils/weddingPermissions';

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

  // Estado inicial limpio (sin mocks/stubs)
  const [weddings, setWeddings] = useState([]);
  const [weddingsReady, setWeddingsReady] = useState(false);
  const [activeWedding, setActiveWeddingState] = useState('');

  const getLocalProfileUid = useCallback(() => {
    try {
      const raw = window.localStorage.getItem('MyWed360_user_profile');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?.uid || null;
    } catch {
      return null;
    }
  }, []);

  const storageKeyForUser = useCallback(
    (uid) => (uid ? `mywed360_active_wedding_user_${uid}` : 'mywed360_active_wedding'),
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

  // Suscribirse a Firestore para planner/owner
  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    const listen = async () => {
      const uid = currentUser?.uid || getLocalProfileUid();
      if (!uid) {
        setWeddings([]);
        setWeddingsReady(true);
        return;
      }

      try {
        await firebaseReady;
      } catch (error) {
        console.warn('[WeddingContext] firebaseReady rejected', error);
      }

      if (!db) {
        console.warn('[WeddingContext] Firestore no disponible');
        setWeddings([]);
        setWeddingsReady(true);
        return;
      }

      try {
        const plannerQuery = query(
          collection(db, 'weddings'),
          where('plannerIds', 'array-contains', uid)
        );
        const ownerQuery = query(
          collection(db, 'weddings'),
          where('ownerIds', 'array-contains', uid)
        );

        let plannerDocs = [];
        let ownerDocs = [];

        const mergeResults = () => {
          if (cancelled) return;
          const map = new Map();
          for (const docSnap of plannerDocs) {
            const raw = { id: docSnap.id, ...docSnap.data() };
            const entry = ensureWeddingAccessMetadata(raw, 'planner');
            map.set(docSnap.id, entry);
          }
          for (const docSnap of ownerDocs) {
            const raw = { id: docSnap.id, ...docSnap.data() };
            const entry = ensureWeddingAccessMetadata(raw, 'owner');
            map.set(docSnap.id, entry);
          }
          const list = Array.from(map.values());
          setWeddings(list);
          setWeddingsReady(true);
          list.forEach((w) => ensureFinance(w.id));
          if (!activeWedding && list.length) {
            setActiveWeddingState(list[0].id);
          }
        };

        const unsubPlanner = onSnapshot(
          plannerQuery,
          (snap) => {
            plannerDocs = snap.docs;
            mergeResults();
          },
          (error) => {
            console.warn('[WeddingContext] planner snapshot error', error);
          }
        );
        const unsubOwner = onSnapshot(
          ownerQuery,
          (snap) => {
            ownerDocs = snap.docs;
            mergeResults();
          },
          (error) => {
            console.warn('[WeddingContext] owner snapshot error', error);
          }
        );
        unsub = () => {
          unsubPlanner();
          unsubOwner();
        };
      } catch (error) {
        console.warn('[WeddingContext] listen weddings failed', error);
        setWeddingsReady(true);
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

      if (nextId) {
        ensureFinance(nextId);
      }

      if (uid) {
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

  // Sin exponer info de stub

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
