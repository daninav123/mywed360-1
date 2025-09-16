import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

// Contexto mínimo y estable para compatibilidad con código legacy y tests
const UserContext = createContext({ user: null, role: null, isAuthenticated: false, loading: true });

export const useUserContext = () => useContext(UserContext);

export default function UserProvider({ children }) {
  const { currentUser, userProfile, isAuthenticated, isLoading } = useAuth();

  const value = {
    user: currentUser || null,
    role: userProfile?.role || null,
    isAuthenticated: !!isAuthenticated,
    loading: !!isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

