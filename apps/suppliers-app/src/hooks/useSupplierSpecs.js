/**
 * Hook para cargar y usar especificaciones dinámicas de proveedores
 * Carga las specs desde Firestore al iniciar la app
 */

import { useState, useEffect } from 'react';
import { loadSupplierSpecs } from '../services/supplierSpecsService';
import { setDynamicSpecs } from '../utils/supplierRequirementsTemplate';

export function useSupplierSpecs() {
  const [specs, setSpecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSpecs = await loadSupplierSpecs();
      setSpecs(loadedSpecs);
      setDynamicSpecs(loadedSpecs); // Actualizar cache global
    } catch (err) {
      console.error('Error loading supplier specs:', err);
      setError(err);
      // No lanzar error, usar specs por defecto
    } finally {
      setLoading(false);
    }
  };

  const reloadSpecs = async () => {
    await loadSpecs();
  };

  return {
    specs,
    loading,
    error,
    reloadSpecs,
    isCustomized: specs?._customized || false,
  };
}

export default useSupplierSpecs;
