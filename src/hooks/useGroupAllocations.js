import { useEffect, useState, useCallback } from 'react';
import { collection, addDoc, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';

// Manages allocations under weddings/{wId}/supplierGroups/{groupId}/allocations
export default function useGroupAllocations(groupId) {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeWedding || !groupId) { setItems([]); return; }
    setLoading(true);
    const col = collection(db, 'weddings', activeWedding, 'supplierGroups', groupId, 'allocations');
    const unsub = onSnapshot(col, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { setError(err.message); setLoading(false); });
    return () => unsub();
  }, [activeWedding, groupId]);

  const addAllocation = useCallback(async (payload) => {
    if (!activeWedding || !groupId) return { success: false };
    try {
      const col = collection(db, 'weddings', activeWedding, 'supplierGroups', groupId, 'allocations');
      const docRef = await addDoc(col, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      return { success: true, id: docRef.id };
    } catch (e) { return { success: false, error: e.message }; }
  }, [activeWedding, groupId]);

  const updateAllocation = useCallback(async (id, payload) => {
    if (!activeWedding || !groupId || !id) return { success: false };
    try {
      const ref = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId, 'allocations', id);
      await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }, [activeWedding, groupId]);

  const removeAllocation = useCallback(async (id) => {
    if (!activeWedding || !groupId || !id) return { success: false };
    try {
      const ref = doc(db, 'weddings', activeWedding, 'supplierGroups', groupId, 'allocations', id);
      await deleteDoc(ref);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  }, [activeWedding, groupId]);

  return { items, loading, error, addAllocation, updateAllocation, removeAllocation };
}

