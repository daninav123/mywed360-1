import { useCallback, useEffect, useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { favoritesAPI } from '../services/apiService';

export default function useSupplierShortlist() {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!activeWedding) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await favoritesAPI.getAll(activeWedding);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      // Silently handle favorites error (Firebase disabled)
      setItems([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (entry) => {
      if (!collectionRef) return null;
      try {
        const payload = {
          ...entry,
          createdAt: serverTimestamp(),
          reviewedAt: null,
        };
        const ref = await addDoc(collectionRef, payload);
        setItems((prev) => {
          const next = [{ id: ref.id, ...entry }, ...prev];
          persistLocal(next);
          return next;
        });
        return ref.id;
      } catch (err) {
        // console.warn('[useSupplierShortlist] addEntry failed', err);
        throw err;
      }
    },
    [activeWedding]
  );

  const markReviewed = useCallback(
    async (id) => {
      if (!activeWedding) return;
      try {
        await favoritesAPI.update(activeWedding, id, { reviewed: true });
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === id ? { ...item, reviewed: true } : item
          );
          return next;
        });
      } catch (err) {
        console.error('[useSupplierShortlist] markReviewed failed', err);
      }
    },
    [activeWedding]
  );

  const removeEntry = useCallback(
    async (id) => {
      if (!activeWedding) return;
      try {
        await favoritesAPI.remove(activeWedding, id);
        setItems((prev) => {
          const next = prev.filter((item) => item.id !== id);
          return next;
        });
      } catch (err) {
        console.error('[useSupplierShortlist] removeEntry failed', err);
      }
    },
    [activeWedding]
  );

  return {
    shortlist: items,
    loading,
    error,
    addEntry,
    markReviewed,
    removeEntry,
    reload: load,
  };
}
