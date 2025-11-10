import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';

export default function useSupplierShortlist() {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const collectionRef = useMemo(() => {
    if (!db || !activeWedding) return null;
    return collection(db, 'weddings', activeWedding, 'supplierShortlist');
  }, [activeWedding]);

  const storageKey = useMemo(() => {
    if (!activeWedding) return 'supplierShortlist_cache';
    return `supplierShortlist_cache_${activeWedding}`;
  }, [activeWedding]);

  const persistLocal = useCallback(
    (nextItems) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextItems));
      } catch (err) {
        console.warn('[useSupplierShortlist] persistLocal failed', err);
      }
    },
    [storageKey]
  );

  const loadFromCache = useCallback(() => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems(parsed);
        return parsed;
      }
      return null;
    } catch (err) {
      console.warn('[useSupplierShortlist] loadFromCache failed', err);
      return null;
    }
  }, [storageKey]);

  const load = useCallback(async () => {
    if (!collectionRef) {
      setItems([]);
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setItems(list);
      persistLocal(list);
    } catch (err) {
      console.warn('[useSupplierShortlist] load failed', err);
      const cached = loadFromCache();
      if (!cached) setError(err);
    } finally {
      setLoading(false);
    }
  }, [collectionRef, loadFromCache, persistLocal, storageKey]);

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
        console.warn('[useSupplierShortlist] addEntry failed', err);
        throw err;
      }
    },
    [collectionRef, persistLocal]
  );

  const markReviewed = useCallback(
    async (id) => {
      if (!collectionRef || !id) return;
      try {
        const ref = doc(collectionRef, id);
        await updateDoc(ref, { reviewedAt: serverTimestamp() });
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === id ? { ...item, reviewedAt: new Date().toISOString() } : item
          );
          persistLocal(next);
          return next;
        });
      } catch (err) {
        console.warn('[useSupplierShortlist] markReviewed failed', err);
      }
    },
    [collectionRef, persistLocal]
  );

  const removeEntry = useCallback(
    async (id) => {
      if (!collectionRef || !id) return;
      try {
        const ref = doc(collectionRef, id);
        await deleteDoc(ref);
        setItems((prev) => {
          const next = prev.filter((item) => item.id !== id);
          persistLocal(next);
          return next;
        });
      } catch (err) {
        console.warn('[useSupplierShortlist] removeEntry failed', err);
      }
    },
    [collectionRef, persistLocal]
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
