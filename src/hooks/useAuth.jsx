/**
 * Hook centralizado para la autenticación en Lovenda
 * Este hook proporciona funcionalidades de autenticación y gestión de perfil de usuario
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initReminderService, stopReminderService } from '../services/reminderService';
import errorLogger from '../utils/errorLogger';
import { setAuthContext as registerEmailAuthContext } from '../services/emailService';
import { setAuthContext as registerNotificationAuthContext } from '../services/notificationService';
import { setAuthContext as registerWhatsappAuthContext } from '../services/whatsappService';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

// Crear contexto de autenticación
const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijo
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Integrar con Firebase Auth real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[useAuth] Firebase auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser) {
        // Usuario autenticado en Firebase
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
        };
        console.log('[useAuth] Usuario autenticado:', user.uid);
        setCurrentUser(user);
        
        // Crear o cargar perfil
        const savedProfile = localStorage.getItem('lovenda_user_profile');
        let profile;
        
        if (savedProfile) {
          profile = JSON.parse(savedProfile);
        } else {
          profile = {
            id: user.uid,
            name: user.displayName || 'Usuario',
            email: user.email,
            preferences: {
              emailNotifications: true,
              emailSignature: 'Enviado desde MyWed360',
              theme: 'light',
              remindersEnabled: true,
              reminderDays: 3
            }
          };
        }
        
        // Generar myWed360Email si no existe
        if (!profile.myWed360Email && user.email) {
          const loginPrefix = user.email.split('@')[0].slice(0,4).toLowerCase();
          profile.myWed360Email = `${loginPrefix}@mywed360.com`;
        }
        
        setUserProfile(profile);
        localStorage.setItem('lovenda_user_profile', JSON.stringify(profile));
      } else {
        // No hay usuario autenticado
        console.log('[useAuth] No hay usuario Firebase autenticado');
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Actualizar diagnóstico de autenticación
  useEffect(() => {
    if (loading) return;
    if (currentUser) {
      errorLogger.setAuthInfo({ uid: currentUser.uid, email: currentUser.email, profile: userProfile });
    } else {
      errorLogger.setAuthInfo(null);
    }
  }, [loading, currentUser, userProfile]);

  // Iniciar o detener el servicio de recordatorios cuando cambie el perfil
  useEffect(() => {
    if (loading) return;
    if (!userProfile) return;
    const { remindersEnabled = true, reminderDays = 3 } = userProfile.preferences || {};
    // En desarrollo, desactivar recordatorios salvo que se fuerce por env
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
    const isDev = String(env?.MODE || env?.NODE_ENV || '').toLowerCase() !== 'production';
    const enableFlag = /^true$/i.test(String(env?.VITE_ENABLE_REMINDERS || ''));
    const shouldEnable = remindersEnabled && (enableFlag || !isDev);
    if (shouldEnable) {
      initReminderService({ days: reminderDays, enabled: true });
    } else {
      stopReminderService();
    }
    return () => stopReminderService();
  }, [loading, userProfile]);
  
  // -----------------------------
  // REGISTER / SIGNUP
  // -----------------------------
  const register = useCallback(async (email, password, role = 'particular') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('[useAuth] Registro exitoso:', user.uid);
      // Generar perfil inicial
      const profile = {
        id: user.uid,
        name: email.split('@')[0],
        email: user.email,
        role,
        preferences: {
          emailNotifications: true,
          theme: 'light'
        }
      };
      setUserProfile(profile);
      localStorage.setItem('lovenda_user_profile', JSON.stringify(profile));
      return { success: true, user };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado del inicio de sesión
   */
  // -----------------------------
  // LOGIN
  // -----------------------------
  const login = async (email, password) => {
    try {
      // Usar Firebase Auth real en lugar de mock
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('[useAuth] Login exitoso con Firebase Auth:', user.uid);
      
      // El estado se actualiza automáticamente por onAuthStateChanged
      // No necesitamos setCurrentUser aquí
      
      // Crear perfil por defecto si no existe
      if (!userProfile) {
        const defaultProfile = {
          id: user.uid,
          name: user.displayName || 'Usuario Lovenda',
          email: user.email,
          preferences: {
            emailNotifications: true,
            emailSignature: 'Enviado desde Lovenda',
            theme: 'light',
            remindersEnabled: true,
            reminderDays: 3
          }
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('lovenda_user_profile', JSON.stringify(defaultProfile));
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Obtener token de autenticación
   * @param {boolean} forceRefresh - Forzar actualización del token
   * @returns {Promise<string>} Token de autenticación
   */
  const getIdToken = useCallback(async (forceRefresh = false) => {
    try {
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Para usuarios mock/test, generar token compatible
      if (currentUser.uid === 'cypress-test' || currentUser.uid.startsWith('mock-')) {
        const mockToken = `mock-${currentUser.uid}-${currentUser.email}`;
        console.log(' Token mock generado para:', currentUser.email);
        return mockToken;
      }

      // Para usuarios reales: usar el usuario real de Firebase Auth
      const fbUser = auth?.currentUser;
      if (fbUser?.getIdToken) {
        const token = await fbUser.getIdToken(forceRefresh);
        console.log(' Token Firebase obtenido');
        return token;
      }

      // Fallback: generar token mock si no hay método getIdToken
      const fallbackToken = `mock-${currentUser.uid}-${currentUser.email}`;
      console.log(' Token fallback generado para:', currentUser.email);
      return fallbackToken;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del cierre de sesión
   */
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // El estado se limpia automáticamente por onAuthStateChanged
      localStorage.removeItem('lovenda_user_profile');
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }, []);

  /**
   * Actualizar el perfil del usuario
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  const updateUserProfile = async (profileData) => {
    try {
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      localStorage.setItem('lovenda_user_profile', JSON.stringify(updatedProfile));
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Derivar estado de autenticación y alias legibles
  const isAuthenticated = !!currentUser;
  const isLoading = loading;

  // Valor del contexto que se proveerá a los componentes
  const value = {
    currentUser,
    user: currentUser, // alias de compatibilidad
    userProfile,
    loading: isLoading,
    isLoading,
    isAuthenticated,
    // Roles básicos desde el perfil (compatibilidad con MainLayout)
    hasRole: ((...roles) => {
      try {
        const currentRole = userProfile?.role || 'particular';
        if (!roles || roles.length === 0) return !!currentRole;
        return roles.some(r => r === currentRole);
      } catch {
        return false;
      }
    }),
    login,
    logout,
    register,
    getIdToken,
    updateUserProfile,
  };

  // Registrar el contexto en emailService para que pueda obtener el token
  useEffect(() => {
    registerEmailAuthContext({
      currentUser,
      getIdToken,
    });
    // Registrar también en notificationService
    registerNotificationAuthContext({
      currentUser,
      getIdToken,
    });
    // Registrar en whatsappService para poder autenticar llamadas
    registerWhatsappAuthContext({
      currentUser,
      getIdToken,
    });
  }, [currentUser, getIdToken]);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {Object} El contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
export default useAuth;
