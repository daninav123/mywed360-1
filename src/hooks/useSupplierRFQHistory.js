import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';

export default function useSupplierRFQHistory(supplierId) {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeWedding || !supplierId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const col = collection(db, 'weddings', activeWedding, 'suppliers', supplierId, 'rfqHistory');
    const q = query(col, orderBy('sentAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [activeWedding, supplierId]);

  return { items, loading, error };
}
