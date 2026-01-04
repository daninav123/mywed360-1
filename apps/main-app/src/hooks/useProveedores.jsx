import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';
import computeSupplierScore from '../utils/supplierScore';
import {
  normalizeStatus,
  isConfirmedStatus,
  isDiscardedStatus,
  isTrackingStatus,
} from '../utils/supplierStatus';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const TAB_ALL = 'todos';
const TAB_TRACKING = 'seguimiento';
const TAB_CONFIRMED = 'confirmados';
const TAB_FAVORITES = 'favoritos';

/**
 * Hook para gestionar proveedores desde PostgreSQL
 * Versión migrada desde Firebase
 */
export const useProveedores = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderIds, setSelectedProviderIds] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ratingMin, setRatingMin] = useState(0);
  const [tab, setTab] = useState(TAB_ALL);

  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const providersRef = useRef(providers);

  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);

  /**
   * Obtener token de autenticación
   */
  const getAuthToken = () => localStorage.getItem('authToken');

  /**
   * Aplicar filtros a los proveedores
   */
  const applyFilters = useCallback(
    (providersToFilter) => {
      const source = Array.isArray(providersToFilter) ? providersToFilter : providersRef.current;
      let filtered = Array.isArray(source) ? [...source] : [];

      // Filtro de búsqueda
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name?.toLowerCase().includes(searchTermLower) ||
            p.service?.toLowerCase().includes(searchTermLower) ||
            p.contact?.toLowerCase().includes(searchTermLower) ||
            p.status?.toLowerCase().includes(searchTermLower) ||
            p.snippet?.toLowerCase().includes(searchTermLower)
        );
      }

      // Filtro de servicio
      if (serviceFilter) {
        filtered = filtered.filter((p) => p.service === serviceFilter);
      }

      // Filtro de estado
      if (statusFilter) {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }

      // Filtro de fecha desde
      if (dateFrom) {
        filtered = filtered.filter((p) => p.date >= dateFrom);
      }

      // Filtro de fecha hasta
      if (dateTo) {
        filtered = filtered.filter((p) => p.date <= dateTo);
      }

      // Filtro de rating mínimo
      if (ratingMin > 0) {
        filtered = filtered.filter((p) => p.rating >= ratingMin);
      }

      // Filtrar por pestaña
      if (tab === TAB_TRACKING) {
        filtered = filtered.filter((p) => isTrackingStatus(p.status));
      } else if (tab === TAB_CONFIRMED) {
        filtered = filtered.filter((p) => isConfirmedStatus(p.status));
      } else if (tab === TAB_FAVORITES) {
        filtered = filtered.filter((p) => Boolean(p.favorite));
      }

      setFilteredProviders(filtered);
    },
    [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab]
  );

  const applyFiltersRef = useRef(applyFilters);
  useEffect(() => {
    applyFiltersRef.current = applyFilters;
  }, [applyFilters]);

  /**
   * Cargar proveedores desde PostgreSQL
   */
  const loadProviders = useCallback(async () => {
    if (!activeWedding) {
      setProviders([]);
      setFilteredProviders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${API_URL}/api/wedding-suppliers/wedding/${activeWedding}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const suppliers = response.data.data || [];
      
      // Enriquecer con score inteligente
      const enrichedProviders = suppliers.map((prov) => {
        const coverageRatio = prov.serviceLines?.length 
          ? prov.serviceLines.filter(l => l.status?.toLowerCase().includes('confirm')).length / prov.serviceLines.length
          : 0;
        
        const intelligentScore = computeSupplierScore(prov, null, {
          serviceCoverageRatio: coverageRatio,
          recentInteractionDays: null
        });

        return {
          ...prov,
          intelligentScore,
          date: prov.date ? new Date(prov.date).toISOString().split('T')[0] : ''
        };
      });

      setProviders(enrichedProviders);
      applyFiltersRef.current(enrichedProviders);
      setLoading(false);
    } catch (err) {
      console.error('[useProveedores] Error loading providers:', err);
      setError(err.response?.data?.error || 'No se pudieron cargar los proveedores');
      setProviders([]);
      setFilteredProviders([]);
      setLoading(false);
    }
  }, [activeWedding]);

  /**
   * Crear un nuevo proveedor
   */
  const addProvider = useCallback(
    async (providerData) => {
      if (!activeWedding) return null;

      try {
        const token = getAuthToken();
        const response = await axios.post(
          `${API_URL}/api/wedding-suppliers/wedding/${activeWedding}`,
          providerData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const newProvider = response.data.data;
        setProviders((prev) => [newProvider, ...prev]);
        applyFiltersRef.current([newProvider, ...providers]);
        
        // Recargar para obtener datos actualizados
        loadProviders();
        
        return newProvider;
      } catch (err) {
        console.error('[useProveedores] Error adding provider:', err);
        setError('No se pudo añadir el proveedor');
        return null;
      }
    },
    [activeWedding, providers, loadProviders]
  );

  /**
   * Actualizar un proveedor existente
   */
  const updateProvider = useCallback(
    async (providerId, providerData) => {
      if (!activeWedding) return false;

      try {
        const token = getAuthToken();
        const response = await axios.put(
          `${API_URL}/api/wedding-suppliers/${providerId}`,
          providerData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const updated = response.data.data;
        
        setProviders((prev) => {
          const newProviders = prev.map((p) =>
            p.id === providerId ? { ...p, ...updated } : p
          );
          applyFiltersRef.current(newProviders);
          return newProviders;
        });

        setSelectedProvider((prev) =>
          prev && prev.id === providerId ? { ...prev, ...updated } : prev
        );

        setError(null);
        return true;
      } catch (err) {
        console.error('[useProveedores] Error updating provider:', err);
        setError('Error al actualizar el proveedor');
        return false;
      }
    },
    [activeWedding]
  );

  /**
   * Eliminar un proveedor
   */
  const deleteProvider = useCallback(
    async (providerId) => {
      if (!activeWedding) return false;

      try {
        const token = getAuthToken();
        await axios.delete(
          `${API_URL}/api/wedding-suppliers/${providerId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setProviders((prev) => {
          const filtered = prev.filter((p) => p.id !== providerId);
          applyFiltersRef.current(filtered);
          return filtered;
        });

        if (selectedProvider && selectedProvider.id === providerId) {
          setSelectedProvider(null);
        }

        setSelectedProviderIds((prev) => prev.filter((id) => id !== providerId));
        
        return true;
      } catch (err) {
        console.error('[useProveedores] Error deleting provider:', err);
        setError('No se pudo eliminar el proveedor');
        return false;
      }
    },
    [activeWedding, selectedProvider]
  );

  /**
   * Service Lines
   */
  const addServiceLine = useCallback(
    async (providerId, lineData) => {
      if (!activeWedding) return null;

      try {
        const token = getAuthToken();
        const response = await axios.post(
          `${API_URL}/api/wedding-suppliers/${providerId}/service-lines`,
          lineData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const newLine = response.data.data;
        
        // Actualizar localmente
        setProviders((prev) =>
          prev.map((prov) =>
            prov.id === providerId
              ? { ...prov, serviceLines: [...(prov.serviceLines || []), newLine] }
              : prov
          )
        );

        return newLine.id;
      } catch (err) {
        console.error('[useProveedores] Error adding service line:', err);
        throw err;
      }
    },
    [activeWedding]
  );

  const updateServiceLine = useCallback(
    async (providerId, lineId, changes) => {
      if (!activeWedding) return false;

      try {
        const token = getAuthToken();
        await axios.put(
          `${API_URL}/api/wedding-suppliers/${providerId}/service-lines/${lineId}`,
          changes,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Actualizar localmente
        setProviders((prev) =>
          prev.map((prov) =>
            prov.id === providerId
              ? {
                  ...prov,
                  serviceLines: (prov.serviceLines || []).map((line) =>
                    line.id === lineId ? { ...line, ...changes } : line
                  ),
                }
              : prov
          )
        );

        return true;
      } catch (err) {
        console.error('[useProveedores] Error updating service line:', err);
        return false;
      }
    },
    [activeWedding]
  );

  const deleteServiceLine = useCallback(
    async (providerId, lineId) => {
      if (!activeWedding) return false;

      try {
        const token = getAuthToken();
        await axios.delete(
          `${API_URL}/api/wedding-suppliers/${providerId}/service-lines/${lineId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        // Actualizar localmente
        setProviders((prev) =>
          prev.map((prov) =>
            prov.id === providerId
              ? { ...prov, serviceLines: (prov.serviceLines || []).filter((l) => l.id !== lineId) }
              : prov
          )
        );

        return true;
      } catch (err) {
        console.error('[useProveedores] Error deleting service line:', err);
        return false;
      }
    },
    [activeWedding]
  );

  /**
   * Marcar/desmarcar favorito
   */
  const toggleFavoriteProvider = useCallback(
    async (providerId) => {
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return;

      const newFav = !provider.favorite;
      
      // Actualizar localmente primero (optimistic update)
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, favorite: newFav } : p))
      );
      applyFiltersRef.current(
        providers.map((p) => (p.id === providerId ? { ...p, favorite: newFav } : p))
      );

      // Actualizar en servidor
      try {
        await updateProvider(providerId, { favorite: newFav });
      } catch (err) {
        // Revertir si falla
        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? { ...p, favorite: !newFav } : p))
        );
      }
    },
    [providers, updateProvider]
  );

  /**
   * Seleccionar/deseleccionar proveedor
   */
  const toggleSelectProvider = useCallback((providerId) => {
    setSelectedProviderIds((prev) => {
      if (prev.includes(providerId)) {
        return prev.filter((id) => id !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  }, []);

  /**
   * Limpiar selecciones
   */
  const clearSelection = useCallback(() => {
    setSelectedProviderIds([]);
  }, []);

  /**
   * Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setServiceFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setRatingMin(0);
    setTab(TAB_ALL);
  }, []);

  // Cargar proveedores al cambiar de boda
  useEffect(() => {
    if (activeWedding) {
      loadProviders();
    }
  }, [activeWedding, loadProviders]);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFiltersRef.current();
  }, [searchTerm, serviceFilter, statusFilter, dateFrom, dateTo, ratingMin, tab]);

  return {
    // Estado
    providers,
    filteredProviders,
    loading,
    error,
    selectedProvider,
    selectedProviderIds,
    searchTerm,
    serviceFilter,
    statusFilter,
    dateFrom,
    dateTo,
    ratingMin,
    tab,

    // Setters
    setSearchTerm,
    setServiceFilter,
    setStatusFilter,
    setDateFrom,
    setDateTo,
    setRatingMin,
    setTab,
    setSelectedProvider,

    // Acciones
    loadProviders,
    addProvider,
    updateProvider,
    deleteProvider,
    addServiceLine,
    updateServiceLine,
    deleteServiceLine,
    toggleSelectProvider,
    toggleFavoriteProvider,
    clearSelection,
    clearFilters,
  };
};

export default useProveedores;
