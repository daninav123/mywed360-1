import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { performanceMonitor } from '../services/PerformanceMonitor';

const DEFAULT_ITEMS = [
  {
    id: 'legal_documents',
    label: 'Documentación legal completa',
    category: 'Documentos',
    status: 'pending',
    dueDate: '',
    notes: 'Actas de nacimiento, identificaciones y licencia de matrimonio.',
    relatedDocType: 'legal',
  },
  {
    id: 'course_certificate',
    label: 'Certificado curso prematrimonial',
    category: 'Documentos',
    status: 'pending',
    dueDate: '',
    notes: '',
    relatedDocType: 'curso',
  },
  {
    id: 'ceremony_rehearsal',
    label: 'Ensayo general agendado',
    category: 'Ensayos',
    status: 'pending',
    dueDate: '',
    notes: '',
  },
  {
    id: 'supplier_confirmation',
    label: 'Confirmación proveedores ceremonia',
    category: 'Proveedores',
    status: 'pending',
    dueDate: '',
    notes: 'Música, decoración, sonido, fotografía.',
  },
  {
    id: 'contingency_plan',
    label: 'Plan de contingencia definido',
    category: 'Plan B',
    status: 'pending',
    dueDate: '',
    notes: 'Clima, transporte, alternativas de montaje.',
  },
];

export default function useCeremonyChecklist() {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentsIndex, setDocumentsIndex] = useState({});

  useEffect(() => {
    let unsubscribe = () => {};
    async function listen() {
      try {
        if (!activeWedding) {
          setItems(DEFAULT_ITEMS);
          setDocumentsIndex({});
          setLoading(false);
          return;
        }
        // preload ceremony documents metadata for matching
        preloadDocuments(activeWedding).then(setDocumentsIndex).catch(() => {});
        const ref = doc(db, 'weddings', activeWedding, 'ceremonyChecklist', 'main');
        unsubscribe = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() || {};
              const list = Array.isArray(data.items) && data.items.length ? data.items : DEFAULT_ITEMS;
              setItems(mergeItems(list));
            } else {
              setItems(DEFAULT_ITEMS);
            }
            setLoading(false);
          },
          (err) => {
            // console.warn('[useCeremonyChecklist] onSnapshot error', err);
            setError(err);
            setLoading(false);
          },
        );
      } catch (err) {
        // console.warn('[useCeremonyChecklist] listen error', err);
        setError(err);
        setLoading(false);
      }
    }
    listen();
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, [activeWedding]);

  const saveItems = useCallback(
    async (nextItems) => {
      if (!activeWedding) {
        // console.warn('[useCeremonyChecklist] saveItems without active wedding');
        return;
      }
      const ref = doc(db, 'weddings', activeWedding, 'ceremonyChecklist', 'main');
      const sanitized = mergeItems(nextItems);
      setItems(sanitized);
      try {
        await setDoc(
          ref,
          {
            items: sanitized,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        const summary = sanitized.reduce(
          (acc, item) => {
            const status = String(item.status || 'pending').toLowerCase();
            if (status === 'done') acc.done += 1;
            else if (status === 'in-progress') acc.inProgress += 1;
            else acc.pending += 1;
            return acc;
          },
          { done: 0, inProgress: 0, pending: 0 },
        );
        performanceMonitor.logEvent('ceremony_checklist_checked', {
          weddingId: activeWedding,
          ...summary,
          total: sanitized.length,
        });
      } catch (err) {
        // console.warn('[useCeremonyChecklist] saveItems error', err);
        setError(err);
      }
    },
    [activeWedding],
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      documentsIndex,
      saveItems,
      defaults: DEFAULT_ITEMS,
    }),
    [items, loading, error, documentsIndex, saveItems],
  );

  return value;
}

async function preloadDocuments(weddingId) {
  try {
    const docsCol = collection(db, 'weddings', weddingId, 'documents');
    const snap = await getDocs(docsCol);
    const map = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      if (!data) return;
      const relatedId = data.relatedCeremonyId || 'general';
      if (!map[relatedId]) map[relatedId] = [];
      map[relatedId].push({
        id: docSnap.id,
        name: data.name || data.filename || 'Documento',
        type: data.type || data.category || '',
        status: data.status || 'uploaded',
        url: data.url || '',
      });
    });
    return map;
  } catch (err) {
    // console.warn('[useCeremonyChecklist] preloadDocuments error', err);
    return {};
  }
}

function mergeItems(candidate) {
  const templateMap = new Map(DEFAULT_ITEMS.map((item) => [item.id, item]));
  const unique = [];
  const seen = new Set();

  (Array.isArray(candidate) ? candidate : []).forEach((item) => {
    if (!item) return;
    const id = item.id || crypto.randomUUID?.();
    if (!id) return;
    seen.add(id);
    const base = templateMap.get(id) || {};
    unique.push({
      id,
      label: item.label || base.label || 'Checklist',
      category: item.category || base.category || 'General',
      status: item.status || base.status || 'pending',
      dueDate: item.dueDate || base.dueDate || '',
      notes: item.notes || base.notes || '',
      relatedDocType: item.relatedDocType || base.relatedDocType || '',
    });
  });

  // include defaults not present
  DEFAULT_ITEMS.forEach((item) => {
    if (seen.has(item.id)) return;
    unique.push({ ...item });
  });

  return unique;
}
