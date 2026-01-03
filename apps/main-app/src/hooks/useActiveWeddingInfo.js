/**
 * Hook para obtener información de la boda activa desde PostgreSQL
 * Migrado de Firebase a PostgreSQL
 */
import { useEffect, useState } from 'react';
import { useWedding } from '../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function useActiveWeddingInfo() {
  const { activeWedding } = useWedding();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeWedding) {
        setInfo(null);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/wedding-info/${activeWedding}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error al cargar información de boda');
        }
        
        const data = await response.json();
        if (!cancelled) setInfo(data ? { id: data.id, ...data } : null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWedding]);

  return { info, loading, error };
}
