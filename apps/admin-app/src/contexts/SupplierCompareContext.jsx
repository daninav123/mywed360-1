import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

const SupplierCompareContext = createContext();

const MAX_COMPARE = 4;

export function SupplierCompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]);

  const addToCompare = useCallback((supplier) => {
    setCompareList((prev) => {
      if (prev.find((s) => s.id === supplier.id || s.slug === supplier.slug)) {
        toast.info('Este proveedor ya está en tu lista de comparación');
        return prev;
      }

      if (prev.length >= MAX_COMPARE) {
        toast.warning(`Solo puedes comparar hasta ${MAX_COMPARE} proveedores a la vez`);
        return prev;
      }

      return [...prev, supplier];
    });
  }, []);

  const removeFromCompare = useCallback((supplierId) => {
    setCompareList((prev) => prev.filter((s) => s.id !== supplierId && s.slug !== supplierId));
  }, []);

  const clearCompareList = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompareList = useCallback(
    (supplierId) => {
      return compareList.some((s) => s.id === supplierId || s.slug === supplierId);
    },
    [compareList]
  );

  const value = {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompareList,
    isInCompareList,
    canAddMore: compareList.length < MAX_COMPARE,
    maxCompare: MAX_COMPARE,
  };

  return (
    <SupplierCompareContext.Provider value={value}>{children}</SupplierCompareContext.Provider>
  );
}

export function useSupplierCompare() {
  const context = useContext(SupplierCompareContext);
  if (!context) {
    throw new Error('useSupplierCompare must be used within SupplierCompareProvider');
  }
  return context;
}
