import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

const localKey = (name) => `mywed360User_${name}`;
const lsGet = (name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (name, data) => {
  localStorage.setItem(localKey(name), JSON.stringify(data));
  window.dispatchEvent(new Event(`mywed360-user-${name}`));
};

export function useUserCollection(collectionName, fallback = []) {
  const { currentUser } = useAuth();
  const [data, setData] = useState(() => lsGet(collectionName, fallback));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCollection = async () => {
      if (!currentUser) {
        setData(lsGet(collectionName, fallback));
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          `${API_URL}/user-collections/${collectionName}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!cancelled && response.data.success) {
          const arr = response.data.data || [];
          setData(arr);
          lsSet(collectionName, arr);
        }
      } catch (err) {
        if (!cancelled) {
          setData(lsGet(collectionName, fallback));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCollection();

    const handler = () => setData(lsGet(collectionName, fallback));
    window.addEventListener(`mywed360-user-${collectionName}`, handler);

    return () => {
      cancelled = true;
      window.removeEventListener(`mywed360-user-${collectionName}`, handler);
    };
  }, [collectionName, currentUser, fallback]);

  const addItem = useCallback(
    async (item) => {
      if (currentUser) {
        try {
          const token = localStorage.getItem('authToken');
          const response = await axios.post(
            `${API_URL}/user-collections/${collectionName}`,
            item,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (response.data.success) {
            const next = [...data, response.data.data];
            setData(next);
            lsSet(collectionName, next);
          }
        } catch (err) {
          console.error('Error adding item:', err);
        }
      } else {
        const next = [...data, { ...item, id: Date.now().toString() }];
        setData(next);
        lsSet(collectionName, next);
      }
    },
    [collectionName, data, currentUser]
  );

  const updateItem = useCallback(
    async (id, changes) => {
      if (currentUser) {
        try {
          const token = localStorage.getItem('authToken');
          await axios.put(
            `${API_URL}/user-collections/${collectionName}/${id}`,
            changes,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
        } catch (err) {
          console.error('Error updating item:', err);
        }
      }
      
      const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
      setData(next);
      lsSet(collectionName, next);
    },
    [collectionName, data, currentUser]
  );

  const deleteItem = useCallback(
    async (id) => {
      if (currentUser) {
        try {
          const token = localStorage.getItem('authToken');
          await axios.delete(
            `${API_URL}/user-collections/${collectionName}/${id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
        } catch (err) {
          console.error('Error deleting item:', err);
        }
      }
      
      const next = data.filter((d) => d.id !== id);
      setData(next);
      lsSet(collectionName, next);
    },
    [collectionName, data, currentUser]
  );

  return { data, loading, addItem, updateItem, deleteItem };
}
