import { useState, useEffect, useCallback, useRef } from 'react';
import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

/*
  Hook: useSpecialMoments
  Gestiona los momentos especiales de la boda de forma compartida entre las páginas
  Momentos Especiales y Timing. La información se almacena en localStorage y se
  sincroniza entre pestañas mediante el evento 'moments-updated'.
*/
const STORAGE_KEY = 'lovendaSpecialMoments';

// Estructura inicial por defecto
const defaultData = {
  ceremonia: [
    { id: 1, order: 1, title: 'Entrada Novio', song: 'Canon in D – Pachelbel' },
    { id: 2, order: 2, title: 'Entrada Novia', song: 'Bridal Chorus – Wagner' },
    { id: 3, order: 3, title: 'Lectura 1', song: 'A Thousand Years' },
    { id: 4, order: 4, title: 'Lectura 2', song: '' },
    { id: 5, order: 5, title: 'Intercambio de Anillos', song: '' },
    { id: 6, order: 6, title: 'Salida', song: '' },
  ],
  coctail: [
    { id: 7, order: 1, title: 'Entrada', song: '' },
  ],
  banquete: [
    { id: 8, order: 1, title: 'Entrada Novios', song: '' },
    { id: 9, order: 2, title: 'Corte Pastel', song: '' },
    { id: 10, order: 3, title: 'Discursos', song: '' },
  ],
  disco: [
    { id: 11, order: 1, title: 'Primer Baile', song: '' },
    { id: 12, order: 2, title: 'Animar pista', song: '' },
    { id: 13, order: 3, title: 'Último tema', song: '' },
  ],
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultData;
}

export default function useSpecialMoments() {
  const { activeWedding } = useWedding();
  const [moments, setMoments] = useState(load);
  const lastRemoteRef = useRef(null);
  const unsubRef = useRef(null);

  // Persistir en localStorage y Firestore (si hay boda activa)
  useEffect(() => {
    // LocalStorage siempre
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(moments));
      window.dispatchEvent(new Event('moments-updated'));
    } catch {}

    // Firestore: evitar loops comparando con último snapshot remoto
    const json = (() => { try { return JSON.stringify(moments); } catch { return null; } })();
    if (!activeWedding || !json) return;
    if (lastRemoteRef.current === json) return; // Sin cambios efectivos respecto a remoto

    (async () => {
      try {
        const ref = doc(db, 'weddings', activeWedding, 'specialMoments', 'main');
        await setDoc(ref, { ...moments, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) {
        console.warn('No se pudieron guardar Momentos Especiales en Firestore:', e?.message || e);
      }
    })();
  }, [moments, activeWedding]);

  // Escuchar cambios desde otras pestañas/componentes y Firestore
  useEffect(() => {
    const handler = () => setMoments(load());
    window.addEventListener('moments-updated', handler);
    return () => window.removeEventListener('moments-updated', handler);
  }, []);

  // Suscribirse a Firestore para sincronización en vivo
  useEffect(() => {
    if (!activeWedding) {
      // Si no hay boda activa, cancelar cualquier suscripción previa
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
      return;
    }

    const ref = doc(db, 'weddings', activeWedding, 'specialMoments', 'main');
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      // El documento guarda el objeto directamente con claves de bloques
      const { updatedAt, ...payload } = data;
      try {
        const json = JSON.stringify(payload);
        lastRemoteRef.current = json;
      } catch {
        lastRemoteRef.current = null;
      }
      setMoments((prev) => ({ ...prev, ...payload }));
    });
    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        try { unsubRef.current(); } catch {}
        unsubRef.current = null;
      }
    };
  }, [activeWedding]);

  const addMoment = useCallback((blockId, moment) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = [...(prev[blockId] || []), { ...moment, id: Date.now() }];
      return next;
    });
  }, []);

  const removeMoment = useCallback((blockId, momentId) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = prev[blockId].filter(m => m.id !== momentId);
      return next;
    });
  }, []);

  const updateMoment = useCallback((blockId, momentId, changes) => {
    setMoments(prev => {
      const next = { ...prev };
      next[blockId] = (prev[blockId] || []).map(m => m.id === momentId ? { ...m, ...changes } : m);
      return next;
    });
  }, []);

  // Reordenar (arriba/abajo) un momento dentro de su bloque
  const reorderMoment = useCallback((blockId, momentId, direction='up') => {
    setMoments(prev => {
      const current = prev[blockId] || [];
      const idx = current.findIndex(m => m.id === momentId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= current.length) return prev;
      const swapped = [...current];
      [swapped[idx], swapped[newIdx]] = [swapped[newIdx], swapped[idx]];
      // Recalcular order
      const updatedList = swapped.map((m, i) => ({ ...m, order: i + 1 }));
      return { ...prev, [blockId]: updatedList };
    });
  }, []);

  
  // Mover un momento a una posición concreta dentro de su mismo bloque
  const moveMoment = useCallback((blockId, momentId, toIndex) => {
    setMoments(prev => {
      const list = prev[blockId] || [];
      const idx = list.findIndex(m => m.id === momentId);
      if (idx === -1 || toIndex < 0 || toIndex >= list.length) return prev;
      const reordered = [...list];
      const [item] = reordered.splice(idx, 1);
      reordered.splice(toIndex, 0, item);
      // Recalcular order
      const updated = reordered.map((m, i) => ({ ...m, order: i + 1 }));
      return { ...prev, [blockId]: updated };
    });
  }, []);

  const duplicateMoment = useCallback((fromBlock, momentId, toBlock) => {
    if (fromBlock === toBlock) return;
    setMoments(prev => {
      const sourceList = prev[fromBlock] || [];
      const moment = sourceList.find(m => m.id === momentId);
      if (!moment) return prev;
      const destList = prev[toBlock] || [];
      const copy = { ...moment, id: Date.now(), order: destList.length + 1 };
      return { ...prev, [toBlock]: [...destList, copy] };
    });
  }, []);

  return { moments, addMoment, removeMoment, updateMoment, reorderMoment, moveMoment, duplicateMoment };
}
