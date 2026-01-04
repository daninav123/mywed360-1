import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useWedding } from '../context/WeddingContext';
import { put as apiPut } from '../services/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function useSupplierBudgets(supplierId) {
  const { activeWedding } = useWedding();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadBudgets = async () => {
      if (!activeWedding || !supplierId) {
        setBudgets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/supplier-budgets/${activeWedding}/${supplierId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!cancelled && response.data.success) {
          setBudgets(response.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando presupuestos proveedor:', err);
          setError(err.message);
          setBudgets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBudgets();

    return () => {
      cancelled = true;
    };
  }, [activeWedding, supplierId]);

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
        console.error('Error actualizando presupuesto:', err);
        return { success: false, error: err.message };
      }
    },
    [activeWedding, supplierId]
  );

  return { budgets, loading, error, updateBudgetStatus };
}
