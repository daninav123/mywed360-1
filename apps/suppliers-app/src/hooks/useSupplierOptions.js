import { useState, useEffect, useMemo } from 'react';
import { SPEC_LABELS } from '../utils/supplierRequirementsTemplate';

export function useSupplierOptions(category) {
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!category) {
      setIsLoading(false);
      return;
    }

    loadDynamicOptions();
  }, [category]);

  const loadDynamicOptions = async () => {
    try {
      setIsLoading(true);
      console.log(`🔍 [useSupplierOptions] Cargando opciones dinámicas para: ${category}`);
      const response = await fetch(`/api/supplier-options/dynamic/${category}`);
      
      if (!response.ok) {
        throw new Error('Error cargando opciones dinámicas');
      }

      const data = await response.json();
      console.log(`✅ [useSupplierOptions] Opciones dinámicas cargadas para ${category}:`, data.dynamicOptions);
      setDynamicOptions(data.dynamicOptions || {});
      setError(null);
    } catch (err) {
      console.error(`❌ [useSupplierOptions] Error cargando opciones dinámicas para ${category}:`, err);
      setError(err.message);
      setDynamicOptions({});
    } finally {
      setIsLoading(false);
    }
  };

  const staticOptions = useMemo(() => {
    return SPEC_LABELS[category] || {};
  }, [category]);

  const allOptions = useMemo(() => {
    return { ...staticOptions, ...dynamicOptions };
  }, [staticOptions, dynamicOptions]);

  const suggestOption = async (optionData) => {
    try {
      const response = await fetch('/api/supplier-options/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          ...optionData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar sugerencia');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (err) {
      console.error('Error sugiriendo opción:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    staticOptions,
    dynamicOptions,
    allOptions,
    suggestOption,
    isLoading,
    error,
    reload: loadDynamicOptions
  };
}
