import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { weddingInfoAPI } from '../services/apiService';

export default function useWeddingData() {
  const { activeWedding } = useWedding();
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWeddingData = useCallback(async () => {
    if (!activeWedding) {
      setWeddingData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await weddingInfoAPI.get(activeWedding);
      setWeddingData(data);
    } catch (err) {
      console.error('[useWeddingData] Error loading wedding data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadWeddingData();
  }, [loadWeddingData]);

  const updateWeddingData = useCallback(async (updates) => {
    if (!activeWedding) return null;

    try {
      const updated = await weddingInfoAPI.update(activeWedding, updates);
      setWeddingData(updated);
      return updated;
    } catch (err) {
      console.error('[useWeddingData] Error updating wedding data:', err);
      throw err;
    }
  }, [activeWedding]);

  const updateWeddingInfo = useCallback(async (infoUpdates) => {
    if (!activeWedding) return null;

    try {
      const updated = await weddingInfoAPI.updateInfo(activeWedding, infoUpdates);
      setWeddingData(updated);
      return updated;
    } catch (err) {
      console.error('[useWeddingData] Error updating wedding info:', err);
      throw err;
    }
  }, [activeWedding]);

  return {
    weddingData,
    loading,
    error,
    loadWeddingData,
    updateWeddingData,
    updateWeddingInfo,
  };
}
