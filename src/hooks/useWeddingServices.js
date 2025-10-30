import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';

/**
 * Hook para gestionar servicios de boda y asignación de proveedores
 */
export function useWeddingServices() {
  const { user } = useAuth();
  const { activeWedding } = useWedding();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

  // Cargar servicios
  const loadServices = async () => {
    if (!user || !activeWedding) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const response = await axios.get(`${API_URL}/api/weddings/${activeWedding}/services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Error al cargar servicios');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Asignar proveedor a un servicio
  const assignSupplier = async (
    serviceId,
    supplier,
    price = null,
    notes = '',
    status = 'interesado'
  ) => {
    if (!user || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/assign`,
        {
          supplier: {
            id: supplier.id || supplier.slug,
            name: supplier.name,
            contact: supplier.contact || {},
            email: supplier.email,
            phone: supplier.phone,
            website: supplier.website,
          },
          price,
          currency: 'EUR',
          notes,
          status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar servicios
      await loadServices();
      return response.data;
    } catch (err) {
      console.error('Error assigning supplier:', err);
      throw new Error(err.response?.data?.error || 'Error al asignar proveedor');
    }
  };

  // Actualizar estado de un servicio
  const updateServiceStatus = async (serviceId, status) => {
    if (!user || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      const token = await user.getIdToken();
      await axios.put(
        `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar servicios
      await loadServices();
    } catch (err) {
      console.error('Error updating service status:', err);
      throw new Error(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  // Quitar proveedor asignado de un servicio
  const removeAssignedSupplier = async (serviceId) => {
    if (!user || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      const token = await user.getIdToken();
      await axios.delete(
        `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/assigned`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar servicios
      await loadServices();
    } catch (err) {
      console.error('Error removing assigned supplier:', err);
      throw new Error(err.response?.data?.error || 'Error al eliminar proveedor');
    }
  };

  // Registrar un pago
  const addPayment = async (serviceId, amount, concept, method = 'transferencia', date = null) => {
    if (!user || !activeWedding) {
      throw new Error('Usuario o boda no disponible');
    }

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `${API_URL}/api/weddings/${activeWedding}/services/${serviceId}/payments`,
        {
          amount,
          concept,
          method,
          date: date || new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar servicios
      await loadServices();
      return response.data;
    } catch (err) {
      console.error('Error adding payment:', err);
      throw new Error(err.response?.data?.error || 'Error al registrar pago');
    }
  };

  // Obtener un servicio específico
  const getService = (serviceId) => {
    return services.find((s) => s.id === serviceId);
  };

  // Obtener proveedor asignado a un servicio
  const getAssignedSupplier = (serviceId) => {
    const service = getService(serviceId);
    return service?.assignedSupplier || null;
  };

  // Verificar si un servicio tiene proveedor asignado
  const hasAssignedSupplier = (serviceId) => {
    return !!getAssignedSupplier(serviceId);
  };

  // Cargar servicios cuando cambia el usuario o la boda
  useEffect(() => {
    loadServices();
  }, [user, activeWedding]);

  return {
    services,
    loading,
    error,
    assignSupplier,
    updateServiceStatus,
    removeAssignedSupplier,
    addPayment,
    getService,
    getAssignedSupplier,
    hasAssignedSupplier,
    refreshServices: loadServices,
  };
}
