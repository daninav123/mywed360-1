import { useEffect, useMemo, useState, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { loadData, saveData } from '../services/SyncService';

// Simple RFQ templates manager stored per wedding in Firestore (and local fallback)
// Shape: { id, name, service, subject, body, updatedAt }
export default function useRFQTemplates() {
  const { activeWedding } = useWedding();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const docPath = useMemo(() => (activeWedding ? `weddings/${activeWedding}` : undefined), [activeWedding]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await loadData('rfqTemplates', { docPath, fallbackToLocal: true });
        if (!cancelled && Array.isArray(data)) setTemplates(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [docPath]);

  const persist = useCallback(async (arr) => {
    setTemplates(arr);
    try {
      await saveData('rfqTemplates', arr, { docPath, showNotification: false });
    } catch {}
  }, [docPath]);

  const saveTemplate = useCallback(async (tpl) => {
    const now = new Date().toISOString();
    const id = tpl.id || Math.random().toString(36).slice(2);
    const next = [...templates.filter(t => t.id !== id), { ...tpl, id, updatedAt: now }];
    await persist(next);
    return id;
  }, [templates, persist]);

  const removeTemplate = useCallback(async (id) => {
    await persist(templates.filter(t => t.id !== id));
  }, [templates, persist]);

  return { templates, loading, error, saveTemplate, removeTemplate };
}

