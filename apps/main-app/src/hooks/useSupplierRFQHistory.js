import { useEffect, useState } from 'react';
import axios from 'axios';
import { useWedding } from '../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function useSupplierRFQHistory(supplierId) {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadRFQHistory = async () => {
      if (!activeWedding || !supplierId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/supplier-rfq-history/${activeWedding}/${supplierId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!cancelled && response.data.success) {
          setItems(response.data.data || []);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRFQHistory();

    return () => {
      cancelled = true;
    };
  }, [activeWedding, supplierId]);

  return { items, loading, error };
}
