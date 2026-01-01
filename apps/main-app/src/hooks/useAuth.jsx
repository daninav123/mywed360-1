import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4004';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
        emailVerified: data.user.emailVerified,
      });
      
      setUserProfile({
        ...data.user.profile,
        email: data.user.email,
        name: data.user.name,
        role: data.user.profile?.role || data.user.role,
        weddingId: data.user.weddings?.[0]?.id,
      });
    } catch (error) {
      console.error('[Auth] Error fetching user:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      console.log('[Auth Frontend] Login response:', data);
      console.log('[Auth Frontend] User data:', data.user);
      console.log('[Auth Frontend] Profile data:', data.user?.profile);
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      console.log('[Auth Frontend] Tokens guardados en localStorage');
      
      const userData = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name || data.user.email,
        emailVerified: data.user.emailVerified || false,
      };
      console.log('[Auth Frontend] Setting currentUser:', userData);
      setCurrentUser(userData);
      
      const profileData = {
        ...(data.user.profile || {}),
        email: data.user.email,
        name: data.user.name || data.user.email,
        role: data.user.profile?.role || data.user.role || 'OWNER',
        weddingId: data.user.weddings?.[0]?.id || null,
      };
      console.log('[Auth Frontend] Setting userProfile:', profileData);
      setUserProfile(profileData);
      
      console.log('[Auth Frontend] Login completado, retornando success');
      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw new Error(error.response?.data?.error || 'Error al iniciar sesión');
    }
  }, []);

  // Register
  const register = useCallback(async (email, password, name) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email,
        password,
        name
      });
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setCurrentUser({
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
        emailVerified: data.user.emailVerified,
      });
      
      setUserProfile({
        ...data.user.profile,
        email: data.user.email,
        name: data.user.name,
        role: data.user.profile?.role || data.user.role,
      });
      
      return data.user;
    } catch (error) {
      console.error('[Auth] Register error:', error);
      throw new Error(error.response?.data?.error || 'Error al registrar usuario');
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post(`${API_BASE_URL}/api/auth/logout`, { refreshToken });
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setUserProfile(null);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      return true;
    } catch (error) {
      console.error('[Auth] Reset password error:', error);
      throw new Error(error.response?.data?.error || 'Error al solicitar reset de password');
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${API_BASE_URL}/api/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      console.error('[Auth] Update password error:', error);
      throw new Error(error.response?.data?.error || 'Error al cambiar password');
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    try {
      // TODO: Implementar endpoint de actualización de perfil
      setUserProfile(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      throw error;
    }
  }, []);

  // hasRole - helper para verificar roles
  const hasRole = useCallback((...roles) => {
    if (!userProfile?.role) return false;
    return roles.some(role => 
      userProfile.role.toLowerCase() === role.toLowerCase()
    );
  }, [userProfile]);

  const isAuthenticated = !!currentUser;

  const value = {
    currentUser,
    user: currentUser,
    userProfile,
    profile: userProfile,
    loading,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;
