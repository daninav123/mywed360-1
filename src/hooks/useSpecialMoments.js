import { useTranslations } from '../../hooks/useTranslations';
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
  {
  const { t } = useTranslations();
 id: 'ceremonia', name: 'Ceremonia' },
  // Nota: en Momentos Especiales histricamente se usa "coctail" mientras en Timing aparece "coctel".
  // Conservamos la clave "coctail" por compatibilidad y normalizamos en los componentes cuando sea necesario.
  { id: 'coctail', name: 'Cctel' },
  { id: 'banquete', name: 'Banquete' },
  { id: 'disco', name: 'Disco' },
];

export const MAX_MOMENTS_PER_BLOCK = 200;
export const RESPONSABLES_LIMIT = 12;
export const SUPPLIERS_LIMIT = 12;

// Estructura inicial por defecto
const withRecipientDefaults = (list = []) =>
  (Array.isArray(list) ? list : []).map((item = {}) => ({
    ...item,
    recipientId: item.recipientId ?? '',
    recipientName: item.recipientName ?? '',
    recipientRole: item.recipientRole ?? '',
  }));

const defaultData = {
  blocks: DEFAULT_BLOCKS,
  moments: {
    ceremonia: withRecipientDefaults([
      {
        id: 1,
        order: 1,
        title: 'Entrada Novio',
        song: 'Canon in D - Pachelbel',
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
        song: 'Bridal Chorus - Wagner',
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
      { id: 13, order: 3, title: t('common.ultimo_tema'), song: '', time: '', duration: '', type: 'otro', location: '', responsables: [], requirements: '', suppliers: [], optional: false, state: 'pendiente', key: '' },
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
      const currentList = prev[blockId] || [];
      if (currentList.length >= MAX_MOMENTS_PER_BLOCK) {
        console.warn('[useSpecialMoments] se alcanzó el límite de momentos para el bloque', blockId);
        return prev;
      }
      const next = { ...prev };
      next[blockId] = [
        ...currentList,
        {
          // defaults seguros para nuevo modelo
          id: Date.now(),
          order: currentList.length + 1,
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
          recipientRole: '',
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
      if (destList.length >= MAX_MOMENTS_PER_BLOCK) {
        console.warn('[useSpecialMoments] no se puede duplicar, bloque completo', targetBlock);
        return prev;
      }

      const cloned = {
        ...moment,
        responsables: Array.isArray(moment.responsables)
          ? moment.responsables.map((responsable, index) => ({
              id: responsable?.id ?? `${Date.now()}-${index}`,
              role: responsable?.role || '',
              name: responsable?.name || '',
              contact: responsable?.contact || '',
            }))
          : [],
        suppliers: Array.isArray(moment.suppliers) ? [...moment.suppliers] : [],
        recipientId: moment.recipientId || '',
        recipientName: moment.recipientName || '',
        recipientRole: moment.recipientRole || '',
      };

      // Si se duplica dentro del mismo bloque, insertar tras el original; si no, al final
      if (targetBlock === fromBlock) {
        const idx = sourceList.findIndex((m) => m.id === momentId);
        if (idx === -1) return prev;
        const copy = { ...cloned, id: Date.now() };
        const newList = [...sourceList];
        newList.splice(idx + 1, 0, copy);
        const reOrdered = newList.map((m, i) => ({ ...m, order: i + 1 }));
        return { ...prev, [fromBlock]: reOrdered };
      }

      const copy = { ...cloned, id: Date.now(), order: destList.length + 1 };
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

  // Mover momento entre bloques diferentes (para drag & drop)
  const moveMomentBetweenBlocks = useCallback((fromBlockId, toBlockId, momentId, toIndex) => {
    setMoments((prev) => {
      const sourceList = prev[fromBlockId] || [];
      const moment = sourceList.find((m) => m.id === momentId);
      if (!moment) return prev;

      const destList = prev[toBlockId] || [];
      if (toBlockId !== fromBlockId && destList.length >= MAX_MOMENTS_PER_BLOCK) {
        console.warn('[useSpecialMoments] no se puede mover, bloque destino completo', toBlockId);
        return prev;
      }

      const next = { ...prev };
      
      // Remover del bloque origen
      next[fromBlockId] = sourceList.filter((m) => m.id !== momentId);
      
      // Añadir al bloque destino
      const updatedMoment = { ...moment };
      if (toBlockId === fromBlockId) {
        // Mismo bloque, solo reordenar
        const reordered = [...sourceList];
        const idx = sourceList.findIndex((m) => m.id === momentId);
        const [item] = reordered.splice(idx, 1);
        reordered.splice(toIndex, 0, item);
        next[fromBlockId] = reordered.map((m, i) => ({ ...m, order: i + 1 }));
      } else {
        // Diferente bloque
        const newList = [...destList];
        newList.splice(toIndex, 0, updatedMoment);
        next[toBlockId] = newList.map((m, i) => ({ ...m, order: i + 1 }));
        next[fromBlockId] = next[fromBlockId].map((m, i) => ({ ...m, order: i + 1 }));
      }
      
      return next;
    });
  }, []);

  // Validar un momento y devolver errores
  const validateMoment = useCallback((moment) => {
    const errors = [];
    
    // Campos críticos para ciertos tipos de momentos
    if (!moment.title || moment.title.trim() === '') {
      errors.push(t('common.titulo_requerido'));
    }
    
    // Validar según el tipo
    if (moment.type === 'entrada' || moment.type === 'salida') {
      if (!moment.song || moment.song.trim() === '') {
        errors.push(t('common.musica_requerida_para_entradas_salidas'));
      }
    }
    
    if (moment.type === 'lectura' || moment.type === 'votos') {
      if (!moment.responsables || moment.responsables.length === 0) {
        errors.push('Se requiere al menos un responsable para lecturas y votos');
      }
    }
    
    if (moment.type === 'baile' && moment.key === 'primer_baile') {
      if (!moment.song || moment.song.trim() === '') {
        errors.push(t('common.cancion_del_primer_baile_requerida'));
      }
    }
    
    // Validar coherencia de tiempos si existen
    if (moment.time && moment.duration) {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(moment.time)) {
        errors.push(t('common.formato_hora_invalido_use_hhmm'));
      }
    }
    
    // Validar límites
    if (moment.responsables && moment.responsables.length > RESPONSABLES_LIMIT) {
      errors.push(`Máximo ${RESPONSABLES_LIMIT} responsables permitidos`);
    }
    
    if (moment.suppliers && moment.suppliers.length > SUPPLIERS_LIMIT) {
      errors.push(`Máximo ${SUPPLIERS_LIMIT} proveedores permitidos`);
    }
    
    return errors;
  }, []);

  // Obtener todos los errores de validación para un bloque
  const getMomentValidationErrors = useCallback((blockId) => {
    const blockMoments = moments[blockId] || [];
    const errors = {};
    
    blockMoments.forEach((moment) => {
      const momentErrors = validateMoment(moment);
      if (momentErrors.length > 0) {
        errors[moment.id] = momentErrors;
      }
    });
    
    return errors;
  }, [moments, validateMoment]);

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
    moveMomentBetweenBlocks,
    duplicateMoment,
    // bloques
    addBlock,
    renameBlock,
    removeBlock,
    reorderBlocks,
    // validación
    validateMoment,
    getMomentValidationErrors,
    maxMomentsPerBlock: MAX_MOMENTS_PER_BLOCK,
  };
}
