import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';

/**
 * Carga presupuestos de un conjunto de proveedores (una sola vez por cambio de miembros)
 * Retorna un objeto { [supplierId]: Budget[] }
 */
export default function useGroupBudgets(memberIds = []) {
  const { activeWedding } = useWedding();
  const [budgetsBySupplier, setBudgetsBySupplier] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!activeWedding || !Array.isArray(memberIds) || memberIds.length === 0) {
        setBudgetsBySupplier({});
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = {};
        for (const pid of memberIds) {
          try {
            const col = collection(db, 'weddings', activeWedding, 'suppliers', pid, 'budgets');
            const snap = await getDocs(col);
            result[pid] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch (_) {
            result[pid] = [];
          }
        }
        if (!cancelled) setBudgetsBySupplier(result);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [activeWedding, JSON.stringify(memberIds)]);

  return { budgetsBySupplier, loading, error };
}
