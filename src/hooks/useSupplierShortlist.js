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

  const load = useCallback(async () => {
    if (!collectionRef) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setItems(list);
    } catch (err) {
      console.warn('[useSupplierShortlist] load failed', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [collectionRef]);

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
        setItems((prev) => [{ id: ref.id, ...entry }, ...prev]);
        return ref.id;
      } catch (err) {
        console.warn('[useSupplierShortlist] addEntry failed', err);
        throw err;
      }
    },
    [collectionRef]
  );

  const markReviewed = useCallback(
    async (id) => {
      if (!collectionRef || !id) return;
      try {
        const ref = doc(collectionRef, id);
        await updateDoc(ref, { reviewedAt: serverTimestamp() });
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, reviewedAt: new Date().toISOString() } : item
          )
        );
      } catch (err) {
        console.warn('[useSupplierShortlist] markReviewed failed', err);
      }
    },
    [collectionRef]
  );

  const removeEntry = useCallback(
    async (id) => {
      if (!collectionRef || !id) return;
      try {
        const ref = doc(collectionRef, id);
        await deleteDoc(ref);
        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.warn('[useSupplierShortlist] removeEntry failed', err);
      }
    },
    [collectionRef]
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
