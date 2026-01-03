import { useState, useEffect, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { seatingPlanAPI } from '../services/apiService';
import { toast } from 'react-toastify';

export default function useSeatingPlan() {
  const { activeWedding } = useWedding();
  const [seatingPlan, setSeatingPlan] = useState({ tables: [], layout: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSeatingPlan = useCallback(async () => {
    if (!activeWedding) {
      setSeatingPlan({ tables: [], layout: null });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await seatingPlanAPI.get(activeWedding);
      setSeatingPlan(data || { tables: [], layout: null });
    } catch (err) {
      console.error('[useSeatingPlan] Error loading seating plan:', err);
      setError(err.message);
      toast.error('Error cargando plan de mesas');
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadSeatingPlan();
  }, [loadSeatingPlan]);

  const updateSeatingPlan = useCallback(async (newSeatingPlan) => {
    if (!activeWedding) return null;

    try {
      const updated = await seatingPlanAPI.update(activeWedding, newSeatingPlan);
      setSeatingPlan(updated);
      toast.success('Plan de mesas actualizado');
      return updated;
    } catch (err) {
      console.error('[useSeatingPlan] Error updating seating plan:', err);
      toast.error('Error al actualizar plan de mesas');
      throw err;
    }
  }, [activeWedding]);

  const updateTables = useCallback(async (tables) => {
    if (!activeWedding) return null;

    try {
      const updated = await seatingPlanAPI.updateTables(activeWedding, tables);
      setSeatingPlan(updated);
      return updated;
    } catch (err) {
      console.error('[useSeatingPlan] Error updating tables:', err);
      throw err;
    }
  }, [activeWedding]);

  const addTable = useCallback(async (table) => {
    const newTables = [...(seatingPlan.tables || []), table];
    return updateTables(newTables);
  }, [seatingPlan.tables, updateTables]);

  const removeTable = useCallback(async (tableId) => {
    const newTables = (seatingPlan.tables || []).filter(t => t.id !== tableId);
    return updateTables(newTables);
  }, [seatingPlan.tables, updateTables]);

  const updateTable = useCallback(async (tableId, updates) => {
    const newTables = (seatingPlan.tables || []).map(t => 
      t.id === tableId ? { ...t, ...updates } : t
    );
    return updateTables(newTables);
  }, [seatingPlan.tables, updateTables]);

  return {
    seatingPlan,
    tables: seatingPlan.tables || [],
    layout: seatingPlan.layout,
    loading,
    error,
    loadSeatingPlan,
    updateSeatingPlan,
    updateTables,
    addTable,
    removeTable,
    updateTable,
  };
}
