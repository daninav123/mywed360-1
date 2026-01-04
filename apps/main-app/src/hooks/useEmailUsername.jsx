import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004/api';

const useEmailUsername = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/email-username/check/${username}`
      );

      if (response.data.error) {
        setError(response.data.error);
        return false;
      }

      return response.data.available;
    } catch (err) {
      setError('Error al verificar disponibilidad');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reserveUsername = useCallback(
    async (username) => {
      if (!username) return false;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.post(
          `${API_URL}/email-username/reserve`,
          { username },
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.data.success) {
          setError(response.data.error || 'Error al reservar username');
          return false;
        }

        return true;
      } catch (err) {
        setError('Error al guardar el nombre de usuario');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCurrentUsername = useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_URL}/email-username/current`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      return response.data.username || null;
    } catch (err) {
      setError('Error al cargar información de usuario');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkUsernameAvailability,
    reserveUsername,
    getCurrentUsername,
    loading,
    error,
  };
};

export default useEmailUsername;
