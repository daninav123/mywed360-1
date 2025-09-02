import React, { createContext, useContext, useState, useEffect } from 'react';
import errorLogger from '../utils/errorLogger';
import { useAuth } from '../hooks/useAuthUnified';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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

async function ensureFinance(weddingId){
  try{
    const fRef = doc(db,'weddings',weddingId,'finance','main');
    const fSnap = await getDoc(fRef);
    if(!fSnap.exists()){
      await setDoc(fRef,{movements:[],createdAt:serverTimestamp()},{merge:true});
      console.log('🆕 finance/main creado para',weddingId);
    }
  }catch(e){
    console.warn('No se pudo asegurar finance para',weddingId,e);
  }
}

export default function WeddingProvider({ children }) {
  const [weddings, setWeddings] = useState([]);
  const { currentUser } = useAuth();
  const [activeWedding, setActiveWeddingState] = useState(() => {
    return localStorage.getItem('lovenda_active_wedding') || '';
  });

  // Actualizar diagnóstico cuando cambian bodas o la boda activa
  useEffect(() => {
    if (currentUser) {
      errorLogger.setWeddingInfo({
        count: weddings.length,
        list: weddings.map(w => ({ id: w.id, name: w.name || w.slug || 'Boda' })),
        activeWedding
      });
    } else {
      errorLogger.setWeddingInfo(null);
    }
  }, [weddings, activeWedding, currentUser]);

  // Cargar lista de bodas del planner desde Firestore
  useEffect(() => {
    let unsubscribe;
    async function listenWeddings() {
      if (!currentUser) return; // espera a que cargue usuario
      try {
        const { db } = await import('../firebaseConfig');
        const { collection, onSnapshot } = await import('firebase/firestore');

        const userWeddingsCol = collection(db, 'users', currentUser.uid, 'weddings');

        const handleSnap = (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (import.meta.env.DEV) console.debug('[WeddingContext] bodas cargadas', list.map(l=>l.id));
          setWeddings(list);
          list.forEach(w => ensureFinance(w.id));
          if (!activeWedding && list.length) setActiveWeddingState(list[0].id);
        };

        const unsub = onSnapshot(userWeddingsCol, (snap) => {
          if (import.meta.env.DEV) console.debug('[WeddingContext] user weddings snapshot', snap.size);
          handleSnap(snap);
        });
        unsubscribe = () => unsub();
      } catch (err) {
        console.warn('No se pudo cargar bodas del planner:', err);
      }
    }
    listenWeddings();
  }, [currentUser]);

  const setActiveWedding = (id) => {
    setActiveWeddingState(id);
    localStorage.setItem('lovenda_active_wedding', id);
  };

  return (
    <WeddingContext.Provider value={{ weddings, activeWedding, setActiveWedding }}>
      {children}
    </WeddingContext.Provider>
  );
}
