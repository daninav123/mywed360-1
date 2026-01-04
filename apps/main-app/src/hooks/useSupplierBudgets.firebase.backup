import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { put as apiPut } from '../services/apiClient';

/**
 * Hook para escuchar los presupuestos de un proveedor específico.
 * @param {string} supplierId
 */
export default function useSupplierBudgets(supplierId) {
  const { activeWedding } = useWedding();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeWedding || !supplierId) return;
    const q = query(
      collection(db, 'weddings', activeWedding, 'suppliers', supplierId, 'budgets'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        // console.error('Error cargando presupuestos proveedor:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [activeWedding, supplierId]);

  // Aceptar o rechazar
  const updateBudgetStatus = useCallback(
    async (budgetId, action) => {
      try {
        const resp = await apiPut(
          `/api/weddings/${activeWedding}/suppliers/${supplierId}/budget`,
          { action, budgetId },
          { auth: true }
        );
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || 'Error');
        return { success: true };
      } catch (err) {
        // console.error('Error actualizando presupuesto:', err);
        return { success: false, error: err.message };
      }
    },
    [activeWedding, supplierId]
  );

  return { budgets, loading, error, updateBudgetStatus };
}
