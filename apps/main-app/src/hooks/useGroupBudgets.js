import { useEffect, useState } from 'react';
import axios from 'axios';
import { useWedding } from '../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

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
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
          `${API_URL}/group-budgets/${activeWedding}`,
          { memberIds },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (!cancelled && response.data.success) {
          setBudgetsBySupplier(response.data.data || {});
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[useGroupBudgets] Error:', e);
          setError(e.message);
          setBudgetsBySupplier({});
        }
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
