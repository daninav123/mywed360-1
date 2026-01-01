import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { ceremonyAPI } from '../services/apiService';

export default function useCeremonyChecklist() {
  const { activeWedding } = useWedding();
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChecklist = useCallback(async () => {
    if (!activeWedding) {
      setChecklist([]);
      return;
    }

    setLoading(true);
    try {
      const ceremonyData = await ceremonyAPI.get(activeWedding);
      setChecklist(ceremonyData?.checklist?.items || []);
    } catch (error) {
      console.error('[useCeremonyChecklist] Error loading:', error);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const updateChecklist = useCallback(async (newChecklist) => {
    if (!activeWedding) return;

    try {
      await ceremonyAPI.updateChecklist(activeWedding, { items: newChecklist });
      setChecklist(newChecklist);
    } catch (error) {
      console.error('[useCeremonyChecklist] Error updating:', error);
      throw error;
    }
  }, [activeWedding]);

  const addItem = useCallback(async (item) => {
    const newChecklist = [...checklist, item];
    return updateChecklist(newChecklist);
  }, [checklist, updateChecklist]);

  const updateItem = useCallback(async (itemId, updates) => {
    const newChecklist = checklist.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    return updateChecklist(newChecklist);
  }, [checklist, updateChecklist]);

  const removeItem = useCallback(async (itemId) => {
    const newChecklist = checklist.filter(item => item.id !== itemId);
    return updateChecklist(newChecklist);
  }, [checklist, updateChecklist]);

  return {
    checklist,
    loading,
    loadChecklist,
    updateChecklist,
    addItem,
    updateItem,
    removeItem,
  };
}
