import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

import { db, firebaseReady } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import errorLogger from '../utils/errorLogger';

/**
 * Contexto para la boda activa que está gestionando el planner.
 * Almacena:
 *  - weddings: listado de bodas disponibles para el planner
 *  - activeWedding: boda activa seleccionada
 *  - setActiveWedding: función para cambiar la boda activa
 *
 * Persistimos la selección en localStorage para mantenerla entre recargas.
 */
const WeddingContext = createContext({
  weddings: [],
  activeWedding: '',
  setActiveWedding: () => {},
});

export const useWedding = () => useContext(WeddingContext);

async function ensureFinance(weddingId) {
  try {
    const fRef = doc(db, 'weddings', weddingId, 'finance', 'main');
    const fSnap = await getDoc(fRef);
    if (!fSnap.exists()) {
      await setDoc(fRef, { movements: [], createdAt: serverTimestamp() }, { merge: true });
      console.log('🆕 finance/main creado para', weddingId);
    }
  } catch (e) {
    console.warn('No se pudo asegurar finance para', weddingId, e);
  }
}

export default function WeddingProvider({ children }) {
  const isCypress = typeof window !== 'undefined' && !!window.Cypress;
  const mock = (typeof window !== 'undefined' && window.__MOCK_WEDDING__) || null;
  const [weddings, setWeddings] = useState(() =>
    isCypress && Array.isArray(mock?.weddings) ? mock.weddings : []
  );
  const { currentUser } = useAuth();
  const [activeWedding, setActiveWeddingState] = useState(() => {
    if (isCypress && mock?.activeWedding?.id) return mock.activeWedding.id;
    return localStorage.getItem('lovenda_active_wedding') || '';
  });

  // Actualizar diagnóstico cuando cambian bodas o la boda activa
  useEffect(() => {
    if (currentUser) {
      errorLogger.setWeddingInfo({
        count: weddings.length,
        list: weddings.map((w) => ({ id: w.id, name: w.name || w.slug || 'Boda' })),
        activeWedding,
      });
    } else {
      errorLogger.setWeddingInfo(null);
    }
  }, [weddings, activeWedding, currentUser]);

  // Sincronizar activeWedding entre pestañas (localStorage)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'lovenda_active_wedding') return;
      try {
        const id = localStorage.getItem('lovenda_active_wedding') || '';
        setActiveWeddingState(id);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Cargar lista de bodas del planner desde Firestore (omitido en Cypress con mock)
  useEffect(() => {
    async function listenWeddings() {
      // Bypass completo en entorno Cypress si se inyectó mock
      if (isCypress && mock) {
        try {
          if (Array.isArray(mock.weddings)) setWeddings(mock.weddings);
          if (mock.activeWedding?.id) {
            setActiveWeddingState(mock.activeWedding.id);
            localStorage.setItem('lovenda_active_wedding', mock.activeWedding.id);
          }
        } catch (_) {}
        return;
      }
      if (!currentUser) {
        console.log('[WeddingContext] Sin usuario autenticado, limpiando bodas');
        setWeddings([]);
        return;
      }

      try {
        // Aseguramos que Firebase esté totalmente inicializado antes de usar Firestore
        await firebaseReady;
        const { collection, getDocs } = await import('firebase/firestore');

        // Cargar bodas desde la subcolección del usuario
        const userWeddingsCol = collection(db, 'users', currentUser.uid, 'weddings');

        console.log(
          '[WeddingContext] Cargando bodas desde users/{uid}/weddings para:',
          currentUser.uid
        );

        let list = [];
        const snap = await getDocs(userWeddingsCol);
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log('[WeddingContext] getDocs subcolección ->', list.length);
        setWeddings(list);

        // Fallback: si no hay bodas en subcolección, intentar recuperar la boda activa desde la subcolección
        if (list.length === 0 && activeWedding) {
          try {
            const { doc: subDoc, getDoc: subGetDoc } = await import('firebase/firestore');
            const wedRefSub = subDoc(db, 'users', currentUser.uid, 'weddings', activeWedding);
            const wedSnapSub = await subGetDoc(wedRefSub);
            if (wedSnapSub.exists()) {
              list = [{ id: wedSnapSub.id, ...wedSnapSub.data() }];
              console.log(
                '[WeddingContext] Boda recuperada manualmente desde subcolección por activeWedding'
              );
            }
          } catch (err) {
            console.warn(
              '[WeddingContext] No se pudo recuperar boda por activeWedding en subcolección:',
              err
            );
          }
        }

        // Fallback adicional controlado por flag: buscar en colección principal por roles (legacy)
        const ENABLE_LEGACY_FALLBACKS = import.meta.env.VITE_ENABLE_LEGACY_FALLBACKS === 'true';
        if (list.length === 0 && ENABLE_LEGACY_FALLBACKS) {
          // Intento adicional: si tenemos activeWedding en localStorage, recuperar manualmente ese doc
          if (activeWedding) {
            try {
              const { doc: fDoc, getDoc: fGetDoc } = await import('firebase/firestore');
              const wedRef = fDoc(db, 'weddings', activeWedding);
              const wedSnap = await fGetDoc(wedRef);
              if (wedSnap.exists()) {
                list = [{ id: wedSnap.id, ...wedSnap.data() }];
                console.log('[WeddingContext] Boda recuperada manualmente por activeWedding');
              }
            } catch (err) {
              console.warn('[WeddingContext] No se pudo recuperar boda manualmente:', err);
            }
          }
          const { where, query: fQuery } = await import('firebase/firestore');
          const globalCol = collection(db, 'weddings');
          const qLegacy = fQuery(globalCol, where('ownerIds', 'array-contains', currentUser.uid));
          const qLegacy2 = fQuery(
            globalCol,
            where('plannerIds', 'array-contains', currentUser.uid)
          );
          const [snap1, snap2] = await Promise.all([getDocs(qLegacy), getDocs(qLegacy2)]);
          const legacyList = [...snap1.docs, ...snap2.docs].map((d) => ({ id: d.id, ...d.data() }));
          list = legacyList;
          if (legacyList.length) {
            console.log(
              '[WeddingContext] Bodas encontradas en colección global (legacy):',
              legacyList.length
            );
          }
        }

        // Ejecutar la carga inicial
        if (import.meta.env.DEV)
          console.debug(
            '[WeddingContext] bodas cargadas',
            list.map((l) => l.id)
          );
        setWeddings(list);
        list.forEach((w) => ensureFinance(w.id));

        // Si la activeWedding no existe o no pertenece al usuario, seleccionamos la primera válida
        const existsInList = list.some((w) => w.id === activeWedding);
        console.log('[WeddingContext] activeWedding actual:', activeWedding);
        console.log('[WeddingContext] existsInList:', existsInList);
        console.log('[WeddingContext] list.length:', list.length);
        console.log(
          '[WeddingContext] list IDs:',
          list.map((w) => w.id)
        );

        if (list.length > 0) {
          if (!activeWedding || !existsInList) {
            console.log('[WeddingContext] Estableciendo nueva activeWedding:', list[0].id);
            // Persistimos también en localStorage para que quede sincronizado
            setActiveWeddingState(list[0].id);
            localStorage.setItem('lovenda_active_wedding', list[0].id);
          } else {
            console.log('[WeddingContext] activeWedding ya existe y es válida:', activeWedding);
          }
        } else {
          console.log('[WeddingContext] No hay bodas disponibles');
        }
      } catch (error) {
        console.error('[WeddingContext] Error cargando bodas:', error);
        setWeddings([]);
      }
    }

    listenWeddings();
  }, [currentUser]);

  const setActiveWedding = useCallback((id) => {
    setActiveWeddingState(id);
    try {
      localStorage.setItem('lovenda_active_wedding', id);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ weddings, activeWedding, setActiveWedding }),
    [weddings, activeWedding, setActiveWedding]
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export { WeddingProvider };
