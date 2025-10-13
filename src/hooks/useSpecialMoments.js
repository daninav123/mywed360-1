import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { performanceMonitor } from '../services/PerformanceMonitor';

/*
  Hook: useSpecialMoments
  Gestiona los momentos especiales de la boda de forma compartida entre las pginas
  Momentos Especiales y Timing. La informacin se almacena en localStorage y se
  sincroniza entre pestaas mediante el evento 'moments-updated'.
*/
const STORAGE_KEY = 'mywed360SpecialMoments';

// Bloques por defecto (alineados con pginas existentes)
const DEFAULT_BLOCKS = [
  { id: 'ceremonia', name: 'Ceremonia' },
  // Nota: en Momentos Especiales histricamente se usa "coctail" mientras en Timing aparece "coctel".
  // Conservamos la clave "coctail" por compatibilidad y normalizamos en los componentes cuando sea necesario.
  { id: 'coctail', name: 'Cctel' },
  { id: 'banquete', name: 'Banquete' },
  { id: 'disco', name: 'Disco' },
];

// Estructura inicial por defecto
const withRecipientDefaults = (list = []) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    recipientId: '',
    recipientName: '',
    ...item,
  }));

const defaultData = {
  blocks: DEFAULT_BLOCKS,
  moments: {
    ceremonia: withRecipientDefaults([
      {
        id: 1,
        order: 1,
        title: 'Entrada Novio',
        song: 'Canon in D � Pachelbel',
        time: '', // Hora (hh:mm)
        duration: '', // Duración (min) o texto corto
        type: 'entrada', // entrada | lectura | votos | anillos | baile | corte_pastel | discurso | otro
        location: '',
        responsables: [], // [{ role, name, contact }]
        requirements: '', // necesidades especiales (sonido, proyección...)
        suppliers: [], // referencias/proveedores asociados (ids o strings)
        optional: false,
        state: 'pendiente', // pendiente | confirmado | ensayo
        key: '', // primer_baile | corte_tarta | ramo | liga | ...
      },
      {
        id: 2,
        order: 2,
        title: 'Entrada Novia',
        song: 'Bridal Chorus � Wagner',
        time: '',
        duration: '',
        type: 'entrada',
        location: '',
        responsables: [],
        requirements: '',
        suppliers: [],
        optional: false,
        state: 'pendiente',
        key: '',
      },
      {
        id: 3,
        order: 3,
        title: 'Lectura 1',
        song: 'A Thousand Years',
        time: '',
        duration: '',
        type: 'lectura',
        location: '',
        responsables: [],
        requirements: '',
        suppliers: [],
        optional: false,
        state: 'pendiente',
        key: '',
      },
      { id: 4, order: 4, title: 'Lectura 2', song: '', time: '', duration: '', type: 'lectura', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
      { id: 5, order: 5, title: 'Intercambio de Anillos', song: '', time: '', duration: '', type: 'anillos', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
      { id: 6, order: 6, title: 'Salida', song: '', time: '', duration: '', type: 'salida', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
    ]),
    coctail: withRecipientDefaults([{ id: 7, order: 1, title: 'Entrada', song: '', time: '', duration: '', type: 'entrada', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' }]),
    banquete: withRecipientDefaults([
      { id: 8, order: 1, title: 'Entrada Novios', song: '', time: '', duration: '', type: 'entrada', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
      { id: 9, order: 2, title: 'Corte Pastel', song: '', time: '', duration: '', type: 'corte_pastel', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: 'corte_tarta' },
      { id: 10, order: 3, title: 'Discursos', song: '', time: '', duration: '', type: 'discurso', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
    ]),
    disco: withRecipientDefaults([
      { id: 11, order: 1, title: 'Primer Baile', song: '', time: '', duration: '', type: 'baile', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: 'primer_baile' },
      { id: 12, order: 2, title: 'Animar pista', song: '', time: '', duration: '', type: 'otro', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
      { id: 13, order: 3, title: 'Último tema', song: '', time: '', duration: '', type: 'otro', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
    ]),
  },
};

const normalizeMomentsStructure = (momentsObj = {}) => {
  const normalized = {};
  Object.entries(momentsObj || {}).forEach(([blockId, list]) => {
    normalized[blockId] = withRecipientDefaults(Array.isArray(list) ? list : []);
  });
  return normalized;
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Compatibilidad hacia atrs: si viene plano (con claves de bloques), migrar a { moments, blocks }
      if (parsed && !parsed.moments) {
        const keys = Object.keys(parsed || {});
        const known = new Set(['ceremonia', 'coctail', 'banquete', 'disco']);
        const legacyMoments = {};
        keys.forEach((k) => {
          if (known.has(k) && Array.isArray(parsed[k])) legacyMoments[k] = parsed[k];
        });
        return {
          blocks: DEFAULT_BLOCKS,
          moments: Object.keys(legacyMoments).length ? legacyMoments : defaultData.moments,
        };
      }
      // Asegurar blocks por defecto si faltan
      return {
        blocks: Array.isArray(parsed.blocks) && parsed.blocks.length ? parsed.blocks : DEFAULT_BLOCKS,
        moments: parsed.moments || defaultData.moments,
      };
    }
  } catch {}
  return defaultData;
}

export default function useSpecialMoments() {
  const { activeWedding } = useWedding();
  const initial = load();
  const initialBlocks =
    Array.isArray(initial.blocks) && initial.blocks.length ? initial.blocks : DEFAULT_BLOCKS;
  const initialMoments =
    initial.moments ? normalizeMomentsStructure(initial.moments) : defaultData.moments;
  const [blocks, setBlocks] = useState(initialBlocks);
  const [moments, setMoments] = useState(initialMoments);
  const lastRemoteRef = useRef(null);
  const unsubRef = useRef(null);

  // Persistir en localStorage y Firestore (si hay boda activa)
  useEffect(() => {
    // LocalStorage siempre
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ blocks, moments }));
    } catch {}

    // Firestore: evitar loops comparando con Último snapshot remoto
    const json = (() => {
      try {
        return JSON.stringify({ blocks, moments });
      } catch {
        return null;
      }
    })();
    if (!activeWedding || !json) return;
    if (lastRemoteRef.current === json) return; // Sin cambios efectivos respecto a remoto

    (async () => {
      try {
        const ref = doc(db, 'weddings', activeWedding, 'specialMoments', 'main');
        await setDoc(
          ref,
          { blocks, moments, updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.warn('No se pudieron guardar Momentos Especiales en Firestore:', e?.message || e);
      }
    })();
  }, [blocks, moments, activeWedding]);

  // Escuchar cambios de localStorage desde otras pestaas (evento 'storage' no se dispara en la pestaa emisora)
  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (e && e.key === STORAGE_KEY && typeof e.newValue === 'string') {
          const parsed = JSON.parse(e.newValue);
          setBlocks(parsed.blocks || DEFAULT_BLOCKS);
          setMoments(parsed.moments ? normalizeMomentsStructure(parsed.moments) : defaultData.moments);
        }
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

    // Migracin puntual desde 'momentosEspeciales' a 'specialMoments'
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding) return;
        const refNew = doc(db, 'weddings', activeWedding, 'specialMoments', 'main');
        const snapNew = await getDoc(refNew);
        if (snapNew.exists()) return;
        const refOld = doc(db, 'weddings', activeWedding, 'momentosEspeciales', 'main');
        const snapOld = await getDoc(refOld);
        if (!snapOld.exists()) return;
        const data = snapOld.data() || {};
        if (data.moments) {
          const nextBlocks = Array.isArray(data.blocks) && data.blocks.length ? data.blocks : DEFAULT_BLOCKS;
          const nextMoments = normalizeMomentsStructure(data.moments || {});
          setBlocks(nextBlocks);
          setMoments((prev) => ({ ...prev, ...nextMoments }));
          await setDoc(refNew, { blocks: nextBlocks, moments: nextMoments, migratedFrom: 'momentosEspeciales', updatedAt: serverTimestamp() }, { merge: true });
        } else {
          const { updatedAt: _updatedAt, ...payload } = data;
          setBlocks(DEFAULT_BLOCKS);
          const normalizedPayload = normalizeMomentsStructure(payload);
          setMoments((prev) => ({ ...prev, ...normalizedPayload }));
          await setDoc(refNew, { blocks: DEFAULT_BLOCKS, moments: payload, migratedFrom: 'momentosEspeciales', updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch {}
    })();
  }, [activeWedding]);// Suscribirse a Firestore para sincronización en vivo
  useEffect(() => {
    if (!activeWedding) {
      // Si no hay boda activa, cancelar cualquier suscripcin previa
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch {}
        unsubRef.current = null;
      }
      return;
    }

    const ref = doc(db, 'weddings', activeWedding, 'specialMoments', 'main');
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      // Compatibilidad: aceptar tanto forma nueva { moments, blocks } como la antigua plana
      if (data.moments) {
        const nextBlocks = Array.isArray(data.blocks) && data.blocks.length ? data.blocks : DEFAULT_BLOCKS;
        const nextMoments = normalizeMomentsStructure(data.moments || {});
        setBlocks(nextBlocks);
        setMoments((prev) => {
          const merged = { ...prev };
          Object.entries(nextMoments).forEach(([blockId, list]) => {
            merged[blockId] = list;
          });
          try { lastRemoteRef.current = JSON.stringify({ blocks: nextBlocks, moments: merged }); } catch { lastRemoteRef.current = null; }
          return merged;
        });
      } else {
        // Antigua: data contiene directamente las claves de cada bloque
        const { updatedAt: _updatedAt, ...payload } = data;
        setBlocks(DEFAULT_BLOCKS);
        const normalizedPayload = normalizeMomentsStructure(payload);
        setMoments((prev) => {
          const merged = { ...prev };
          Object.entries(normalizedPayload).forEach(([blockId, list]) => {
            merged[blockId] = list;
          });
          try { lastRemoteRef.current = JSON.stringify({ blocks: DEFAULT_BLOCKS, moments: merged }); } catch { lastRemoteRef.current = null; }
          return merged;
        });
      }
    });
    unsubRef.current = unsub;
    return () => {
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch {}
        unsubRef.current = null;
      }
    };
  }, [activeWedding]);

  const addMoment = useCallback((blockId, moment) => {
    setMoments((prev) => {
      const next = { ...prev };
      next[blockId] = [
        ...(prev[blockId] || []),
        {
          // defaults seguros para nuevo modelo
          id: Date.now(),
          order: (prev[blockId]?.length || 0) + 1,
          title: 'Nuevo momento',
          song: '',
          time: '',
          duration: '',
          type: 'otro',
          location: '',
          responsables: [],
          requirements: '',
          suppliers: [],
          optional: false,
          state: 'pendiente',
          key: '',
          recipientId: '',
          recipientName: '',
          ...moment,
        },
      ];
      try {
        performanceMonitor.logEvent('special_moment_added', {
          weddingId: activeWedding,
          blockId,
          momentType: moment?.type || 'otro',
        });
      } catch {}
      return next;
    });
  }, [activeWedding]);

  const removeMoment = useCallback((blockId, momentId) => {
    setMoments((prev) => {
      const next = { ...prev };
      next[blockId] = prev[blockId].filter((m) => m.id !== momentId);
      try {
        performanceMonitor.logEvent('special_moment_removed', {
          weddingId: activeWedding,
          blockId,
        });
      } catch {}
      return next;
    });
  }, [activeWedding]);

  const updateMoment = useCallback((blockId, momentId, changes) => {
    setMoments((prev) => {
      const next = { ...prev };
      next[blockId] = (prev[blockId] || []).map((m) =>
        m.id === momentId ? { ...m, ...changes } : m
      );
      if (changes?.state) {
        try {
          performanceMonitor.logEvent('special_moment_state_changed', {
            weddingId: activeWedding,
            blockId,
            state: changes.state,
          });
        } catch {}
      }
      return next;
    });
  }, [activeWedding]);

  // Reordenar (arriba/abajo) un momento dentro de su bloque
  const reorderMoment = useCallback((blockId, momentId, direction = 'up') => {
    setMoments((prev) => {
      const current = prev[blockId] || [];
      const idx = current.findIndex((m) => m.id === momentId);
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

  // Mover un momento a una posicin concreta dentro de su mismo bloque
  const moveMoment = useCallback((blockId, momentId, toIndex) => {
    setMoments((prev) => {
      const list = prev[blockId] || [];
      const idx = list.findIndex((m) => m.id === momentId);
      if (idx === -1 || toIndex < 0 || toIndex >= list.length) return prev;
      const reordered = [...list];
      const [item] = reordered.splice(idx, 1);
      reordered.splice(toIndex, 0, item);
      // Recalcular order
      const updated = reordered.map((m, i) => ({ ...m, order: i + 1 }));
      return { ...prev, [blockId]: updated };
    });
  }, []);

  const duplicateMoment = useCallback((fromBlock, momentId, toBlock = null) => {
    setMoments((prev) => {
      const sourceList = prev[fromBlock] || [];
      const moment = sourceList.find((m) => m.id === momentId);
      if (!moment) return prev;

      const targetBlock = toBlock || fromBlock;
      const destList = prev[targetBlock] || [];

      // If duplicating within the same block, insert after the original index; else append
      if (targetBlock === fromBlock) {
        const idx = sourceList.findIndex((m) => m.id === momentId);
        if (idx === -1) return prev;
        const copy = { ...moment, id: Date.now() };
        const newList = [...sourceList];
        newList.splice(idx + 1, 0, copy);
        const reOrdered = newList.map((m, i) => ({ ...m, order: i + 1 }));
        return { ...prev, [fromBlock]: reOrdered };
      }

      const copy = { ...moment, id: Date.now(), order: destList.length + 1 };
      return { ...prev, [targetBlock]: [...destList, copy] };
    });
  }, []);

  // --- Gestin de bloques/secciones ---
  const addBlock = useCallback((name) => {
    const slug = String(name)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = slug || `bloque-${Date.now()}`;
    setBlocks((prev) => [...prev, { id, name }]);
    setMoments((prev) => ({ ...prev, [id]: [] }));
  }, []);

  const renameBlock = useCallback((id, newName) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, name: newName } : b)));
  }, []);

  const removeBlock = useCallback((id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setMoments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    setBlocks((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  }, []);

  return {
    // datos
    blocks,
    moments,
    // momentos
    addMoment,
    removeMoment,
    updateMoment,
    reorderMoment,
    moveMoment,
    duplicateMoment,
    // bloques
    addBlock,
    renameBlock,
    removeBlock,
    reorderBlocks,
  };
}
