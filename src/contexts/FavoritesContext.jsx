import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import axios from 'axios';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

  // Cargar favoritos al iniciar
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (activeWedding?.id) {
        headers['x-wedding-id'] = activeWedding.id;
      }

      const response = await axios.get(`${API_URL}/api/favorites`, { headers });

      setFavorites(response.data.favorites || []);
    } catch (err) {
      console.error('[FavoritesContext] Error cargando favoritos:', err);
      setError(err.message);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user, activeWedding, API_URL]);

  // Cargar favoritos cuando cambia el usuario o boda
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Añadir a favoritos
  const addFavorite = async (supplier, notes = '') => {
    if (!user) {
      throw new Error('Debes iniciar sesión para guardar favoritos');
    }

    try {
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (activeWedding?.id) {
        headers['x-wedding-id'] = activeWedding.id;
      }

      const response = await axios.post(
        `${API_URL}/api/favorites`,
        { supplier, notes },
        { headers }
      );

      // Actualizar estado local
      setFavorites((prev) => [response.data.favorite, ...prev]);

      return response.data.favorite;
    } catch (err) {
      console.error('[FavoritesContext] Error añadiendo favorito:', err);

      if (err.response?.status === 409) {
        throw new Error('Este proveedor ya está en tus favoritos');
      }

      throw new Error(err.response?.data?.message || 'Error al guardar favorito');
    }
  };

  // Eliminar de favoritos
  const removeFavorite = async (supplierId) => {
    if (!user) {
      throw new Error('Debes iniciar sesión');
    }

    try {
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (activeWedding?.id) {
        headers['x-wedding-id'] = activeWedding.id;
      }

      await axios.delete(`${API_URL}/api/favorites/${supplierId}`, { headers });

      // Actualizar estado local
      setFavorites((prev) => prev.filter((fav) => fav.supplierId !== supplierId));
    } catch (err) {
      console.error('[FavoritesContext] Error eliminando favorito:', err);
      throw new Error(err.response?.data?.message || 'Error al eliminar favorito');
    }
  };

  // Toggle favorito (añadir o quitar)
  const toggleFavorite = async (supplier, notes = '') => {
    const isFav = isFavorite(supplier.id);

    if (isFav) {
      await removeFavorite(supplier.id);
    } else {
      await addFavorite(supplier, notes);
    }
  };

  // Verificar si un proveedor está en favoritos
  const isFavorite = (supplierId) => {
    return favorites.some((fav) => fav.supplierId === supplierId);
  };

  // Obtener datos del favorito
  const getFavorite = (supplierId) => {
    return favorites.find((fav) => fav.supplierId === supplierId);
  };

  const value = {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavorite,
    refreshFavorites: loadFavorites,
    count: favorites.length,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// Hook personalizado
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider');
  }
  return context;
}
