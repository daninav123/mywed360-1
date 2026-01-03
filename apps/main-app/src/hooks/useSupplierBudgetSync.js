/**
 * Hook para sincronizar automáticamente proveedores confirmados con presupuesto
 * Cuando se añade un proveedor con precio, actualiza el presupuesto de la categoría
 */

import { useEffect, useCallback } from 'react';
import { useWeddingServices } from './useWeddingServices';
import useFinance from './useFinance';
import { normalizeBudgetCategoryKey } from '../utils/budgetCategories';
import { toast } from 'react-toastify';

export function useSupplierBudgetSync() {
  const { services } = useWeddingServices();
  const { budget, setBudget } = useFinance();

  /**
   * Sincronizar precio de proveedores con presupuesto de categoría
   * @param {string} categoryId - ID de la categoría (ej: 'joyeria')
   * @param {number} totalPrice - Precio total de todos los proveedores
   */
  const syncCategoryBudget = useCallback(
    async (categoryId, totalPrice) => {
      if (!categoryId || !totalPrice || totalPrice <= 0) return;

      try {
        const budgetKey = normalizeBudgetCategoryKey(categoryId);
        const currentCategories = budget?.categories || [];
        
        // Buscar si la categoría ya existe en el presupuesto
        const existingCategoryIndex = currentCategories.findIndex(
          (cat) => normalizeBudgetCategoryKey(cat.name) === budgetKey
        );

        let updatedCategories = [...currentCategories];

        if (existingCategoryIndex >= 0) {
          // Actualizar categoría existente
          updatedCategories[existingCategoryIndex] = {
            ...updatedCategories[existingCategoryIndex],
            amount: totalPrice,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Crear nueva categoría en el presupuesto
          updatedCategories.push({
            name: categoryId,
            amount: totalPrice,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Actualizar presupuesto
        setBudget((prev) => ({
          ...prev,
          categories: updatedCategories,
        }));

        console.log(`💰 [BudgetSync] Presupuesto actualizado: ${categoryId} = ${totalPrice}€`);
        
        return true;
      } catch (error) {
        console.error('[BudgetSync] Error sincronizando presupuesto:', error);
        return false;
      }
    },
    [budget, setBudget]
  );

  /**
   * Calcular total de proveedores de un servicio
   */
  const calculateServiceTotal = useCallback((service) => {
    const providers = service.assignedSuppliers || [];
    return providers.reduce((sum, provider) => sum + (provider.price || 0), 0);
  }, []);

  /**
   * Efecto para sincronizar automáticamente cuando cambian los servicios
   */
  useEffect(() => {
    if (!services || services.length === 0) return;

    services.forEach((service) => {
      const providers = service.assignedSuppliers || [];
      if (providers.length > 0) {
        const total = calculateServiceTotal(service);
        if (total > 0) {
          // Sincronizar de forma silenciosa
          syncCategoryBudget(service.category || service.id, total);
        }
      }
    });
  }, [services, calculateServiceTotal, syncCategoryBudget]);

  return {
    syncCategoryBudget,
    calculateServiceTotal,
  };
}

export default useSupplierBudgetSync;
