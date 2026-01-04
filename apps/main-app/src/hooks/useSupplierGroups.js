import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useWedding } from '../context/WeddingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

export default function useSupplierGroups() {
  const { activeWedding } = useWedding();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGroups = useCallback(async () => {
    if (!activeWedding) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/supplier-groups/${activeWedding}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setGroups(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('Error loading supplier groups:', err);
      setError(err.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = useCallback(
    async ({ name, memberIds = [], notes = '' }) => {
      if (!activeWedding) return { success: false, error: 'No wedding' };
      if (!name || memberIds.length < 1)
        return { success: false, error: 'Nombre y al menos 1 proveedor' };
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
          `${API_URL}/supplier-groups/${activeWedding}`,
          { name, memberIds, notes },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        await loadGroups(); // Recargar lista
        return { success: true, id: response.data.id };
      } catch (e) {
        console.error('Error creando grupo proveedores:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding, loadGroups]
  );

  const dissolveGroup = useCallback(
    async (groupId) => {
      if (!activeWedding || !groupId) return { success: false, error: 'Missing params' };
      try {
        const token = localStorage.getItem('authToken');
        await axios.delete(
          `${API_URL}/supplier-groups/${activeWedding}/${groupId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        await loadGroups(); // Recargar lista
        return { success: true };
      } catch (e) {
        console.error('Error disolviendo grupo:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding, loadGroups]
  );

  const updateGroup = useCallback(
    async (groupId, { name, memberIds, notes }) => {
      if (!activeWedding || !groupId) return { success: false, error: 'Missing params' };
      try {
        const token = localStorage.getItem('authToken');
        await axios.put(
          `${API_URL}/supplier-groups/${activeWedding}/${groupId}`,
          { name, memberIds, notes },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        await loadGroups(); // Recargar lista
        return { success: true };
      } catch (e) {
        console.error('Error actualizando grupo:', e);
        return { success: false, error: e.message };
      }
    },
    [activeWedding, loadGroups]
  );

  return {
    groups,
    loading,
    error,
    reload: loadGroups,
    createGroup,
    dissolveGroup,
    updateGroup,
  };
}
