import React, { useState, createContext, useContext } from 'react';
import GlobalSearch from './GlobalSearch';
import { useCmdK } from '../../hooks/useKeyboardShortcut';

/**
 * Context para la búsqueda global
 */
const GlobalSearchContext = createContext({
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
});

/**
 * Provider de búsqueda global
 * Maneja el estado y shortcuts de teclado
 */
export const GlobalSearchProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => setIsOpen(false);

  // Registrar Cmd/Ctrl + K
  useCmdK(openSearch);

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
      {children}
      <GlobalSearch isOpen={isOpen} onClose={closeSearch} />
    </GlobalSearchContext.Provider>
  );
};

/**
 * Hook para usar la búsqueda global
 */
export const useGlobalSearchContext = () => {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearchContext must be used within GlobalSearchProvider');
  }
  return context;
};

export default GlobalSearchProvider;
