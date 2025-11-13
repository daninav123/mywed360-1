import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import { auth } from '../firebaseConfig';
import useTranslations from '../hooks/useTranslations';
import axios from 'axios';

const FavoritesContext = createContext();

// Helper para obtener token (soporta Firebase User y sesión admin)
async function getAuthToken() {
  try {
    // Intentar obtener usuario de Firebase
    const firebaseUser = auth?.currentUser;

    if (firebaseUser && typeof firebaseUser.getIdToken === 'function') {
      return await firebaseUser.getIdToken();
    }

    // Si no hay usuario Firebase, verificar sesión admin en localStorage
    try {
      const adminSession = localStorage.getItem('adminSession');
      if (adminSession) {
        const session = JSON.parse(adminSession);
        if (session.token) {
          return session.token;
        }
      }
    } catch {}

    return null;
  } catch (err) {
    // console.error('[FavoritesContext] Error obteniendo token:', err);
    return null;
  }
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslations();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';
  const hasLoadedRef = useRef(false); // Para cargar SOLO UNA VEZ
  const currentUserRef = useRef(null);
  const currentWeddingRef = useRef(null);

  // Función de carga (no depende de nada, se llama manualmente)
  const loadFavorites = useCallback(
    async (forceReload = false) => {
      const userId = user?.uid;

      if (!userId || !activeWedding) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Si ya se cargó y no es forzado, no recargar
      if (
        hasLoadedRef.current &&
        !forceReload &&
        currentUserRef.current === userId &&
        currentWeddingRef.current === activeWedding
      ) {
        return;
      }

      currentUserRef.current = userId;
      currentWeddingRef.current = activeWedding;
      hasLoadedRef.current = true;

      try {
        setLoading(true);
        setError(null);

        const token = await getAuthToken();

        if (!token) {
          // console.warn('[FavoritesContext] No se pudo obtener token');
          setFavorites([]);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'x-wedding-id': activeWedding,
        };

        const response = await axios.get(`${API_URL}/api/favorites`, { headers });
        setFavorites(response.data.favorites || []);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 500) {
          // console.warn('[FavoritesContext] Favoritos no disponibles (error auth)');
          setFavorites([]);
        } else {
          // console.error('[FavoritesContext] Error cargando favoritos:', err);
          setError('Error al cargar favoritos');
          setFavorites([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [user, activeWedding, API_URL]
  ); // Sin t para evitar recreaciones

  // Cargar SOLO cuando hay user Y wedding (una sola vez)
  useEffect(() => {
    if (user?.uid && activeWedding && !hasLoadedRef.current) {
      loadFavorites();
    }
  }, [user?.uid, activeWedding]); // loadFavorites no incluido para evitar loop

  // Añadir a favoritos
  const addFavorite = async (supplier, notes = '') => {
    if (!user) {
      throw new Error(t('suppliers.favorites.errors.loginRequired'));
    }

    const weddingId = activeWedding;

    if (!weddingId) {
      throw new Error(t('suppliers.favorites.errors.activeWeddingRequired'));
    }

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(t('suppliers.favorites.errors.authToken'));
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'x-wedding-id': weddingId, // Usar el ID directamente
      };

      const response = await axios.post(
        `${API_URL}/api/favorites`,
        { supplier, notes },
        { headers }
      );

      // Actualizar estado local
      setFavorites((prev) => [response.data.favorite, ...prev]);

      return response.data.favorite;
    } catch (err) {
      // console.error('[FavoritesContext] Error añadiendo favorito:', err);

      if (err.response?.status === 409) {
        throw new Error(t('suppliers.favorites.errors.alreadyExists'));
      }

      throw new Error(err.response?.data?.message || t('suppliers.favorites.errors.saveFailed'));
    }
  };

  // Eliminar de favoritos
  const removeFavorite = async (supplierId) => {
    if (!user) {
      throw new Error(t('suppliers.favorites.errors.loginRequired'));
    }

    const weddingId = activeWedding;

    if (!weddingId) {
      throw new Error(t('suppliers.favorites.errors.activeWeddingRequired'));
    }

    try {
      const token = await getAuthToken();

      if (!token) {
        throw new Error(t('suppliers.favorites.errors.authToken'));
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'x-wedding-id': weddingId, // Usar el ID directamente
      };

      await axios.delete(`${API_URL}/api/favorites/${supplierId}`, { headers });

      // Actualizar estado local
      setFavorites((prev) => prev.filter((fav) => fav.supplierId !== supplierId));
    } catch (err) {
      // console.error('[FavoritesContext] Error eliminando favorito:', err);
      throw new Error(err.response?.data?.message || t('suppliers.favorites.errors.removeFailed'));
    }
  };

  // Toggle favorito (añadir o quitar)
  const toggleFavorite = async (supplier, notes = '') => {
    const isFav = isFavorite(supplier.id);

    if (isFav) {
      await removeFavorite(supplier.id);
    } else {
      try {
        await addFavorite(supplier, notes);
      } catch (error) {
        // Si ya existe (409), recargar favoritos para sincronizar
        if (error.message?.includes('already') || error.message?.includes('existe')) {
          await loadFavorites(true); // Forzar recarga
        } else {
          throw error; // Re-lanzar otros errores
        }
      }
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
