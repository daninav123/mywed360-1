import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useWedding } from '../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function useGroupAllocations(groupId) {
  const { activeWedding } = useWedding();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAllocations = useCallback(async () => {
    if (!activeWedding || !groupId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/group-allocations/${activeWedding}/${groupId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setItems(response.data.data || []);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeWedding, groupId]);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  const addAllocation = useCallback(
    async (payload) => {
      if (!activeWedding || !groupId) return { success: false };
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
          `${API_URL}/group-allocations/${activeWedding}/${groupId}`,
          payload,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        await loadAllocations();
        return { success: true, id: response.data.data.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    [activeWedding, groupId, loadAllocations]
  );

  const updateAllocation = useCallback(
    async (id, payload) => {
      if (!activeWedding || !groupId || !id) return { success: false };
      try {
        const token = localStorage.getItem('authToken');
        await axios.put(
          `${API_URL}/group-allocations/${activeWedding}/${groupId}/${id}`,
          payload,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        await loadAllocations();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    [activeWedding, groupId, loadAllocations]
  );

  const removeAllocation = useCallback(
    async (id) => {
      if (!activeWedding || !groupId || !id) return { success: false };
      try {
        const token = localStorage.getItem('authToken');
        await axios.delete(
          `${API_URL}/group-allocations/${activeWedding}/${groupId}/${id}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        await loadAllocations();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    [activeWedding, groupId, loadAllocations]
  );

  return { items, loading, error, addAllocation, updateAllocation, removeAllocation };
}
