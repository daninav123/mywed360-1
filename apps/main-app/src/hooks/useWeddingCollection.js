/**
 * @deprecated Hook genérico migrado a PostgreSQL
 * RECOMENDACIÓN: Usa hooks específicos en su lugar:
 * - useGuests() para guests
 * - useChecklist() para tasks
 * - useWeddingData() para info de boda
 * 
 * Este hook retorna datos vacíos como placeholder.
 * Migrar componentes que lo usan a hooks específicos.
 */
import { useState, useCallback } from 'react';

export const useWeddingCollection = (subName, weddingId, fallback = [], options = {}) => {
  const [data] = useState(fallback);
  const [loading] = useState(false);
  const [error] = useState(null);

  const reload = useCallback(() => {
    console.warn(`[useWeddingCollection] Deprecado - usa hooks específicos para ${subName}`);
  }, [subName]);

  return {
    data,
    loading,
    error,
    reload,
  };
};
