import React, { createContext, useContext } from 'react';

/**
 * Contexto para compartir datos de la boda con los componentes Craft.js
 */
const WeddingDataContext = createContext(null);

/**
 * Provider para los datos de la boda
 */
export const WeddingDataProvider = ({ children, weddingData }) => {
  return <WeddingDataContext.Provider value={weddingData}>{children}</WeddingDataContext.Provider>;
};

/**
 * Hook para acceder a los datos de la boda desde cualquier componente
 */
export const useWeddingDataContext = () => {
  const context = useContext(WeddingDataContext);
  return context || {}; // Devolver objeto vacío si no hay contexto
};
