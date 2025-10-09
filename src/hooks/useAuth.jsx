/**
 * Hook centralizado para la autenticación en MyWed360
 * Este hook proporciona funcionalidades de autenticación y gestión de perfil de usuario
 */

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  getAdditionalUserInfo,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

import { auth } from '../firebaseConfig';
import { setAuthContext as registerEmailAuthContext } from '../services/emailService';
import { setAuthContext as registerNotificationAuthContext } from '../services/notificationService';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { initReminderService, stopReminderService } from '../services/reminderService';
import { setAuthContext as registerWhatsappAuthContext } from '../services/whatsappService';
import errorLogger from '../utils/errorLogger';

// Crear contexto de autenticación
const AuthContext = createContext(null);
// Evitar spam de consola si un componente usa el hook fuera del provider (HMR, rutas públicas, etc.)
let __authWarnedOutside = false;

const getEnv = (key, fallback) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
      return import.meta.env[key] ?? fallback;
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && key in process.env) {
      return process.env[key] ?? fallback;
    }
  } catch {}
  return fallback;
};

const ADMIN_EMAIL = getEnv('VITE_ADMIN_EMAIL', 'admin@lovenda.com');
const ADMIN_PASSWORD = getEnv('VITE_ADMIN_PASSWORD', 'AdminPass123!');
const ADMIN_PROFILE_KEY = 'MyWed360_admin_profile';
const ADMIN_SESSION_FLAG = 'isAdminAuthenticated';

const DEFAULT_PROFILE_PREFERENCES = {
  emailNotifications: true,
  emailSignature: 'Enviado desde MyWed360',
  theme: 'light',
  remindersEnabled: true,
  reminderDays: 3,
};

const SOCIAL_PROVIDER_FACTORIES = {
  google: () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
  },
  facebook: () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    provider.setCustomParameters({ display: 'popup' });
    return provider;
  },
  apple: () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    provider.setCustomParameters({ locale: 'es_ES' });
    return provider;
  },
};

const SOCIAL_PROVIDER_READABLE = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

const SOCIAL_AUTH_ERROR_MESSAGES = {
  'auth/account-exists-with-different-credential':
    'Ya existe una cuenta con este correo asociada a otro proveedor. Inicia sesión con el proveedor original y vincúlalo desde tu perfil.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permite las ventanas emergentes e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'La ventana de autenticación se cerró antes de completar el proceso.',
  'auth/cancelled-popup-request': 'Se canceló un intento previo de inicio de sesión. Vuelve a intentarlo.',
  'auth/unauthorized-domain':
    'Este dominio no está autorizado en la consola de Firebase. Contacta con soporte técnico.',
};

const getReadableProvider = (providerId = '') =>
  SOCIAL_PROVIDER_READABLE[providerId] || providerId;

const getReadableAuthMethod = (providerId = '') => {
  if (!providerId) return 'otro proveedor';
  if (providerId === 'password') return 'correo y contraseña';
  const key = providerId.replace('.com', '');
  return getReadableProvider(key) || providerId;
};

/**
 * Proveedor del contexto de autenticación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijo
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistProfileForUser = useCallback(
    (firebaseUser, { role, forceRole = false, preferences = {} } = {}) => {
      if (!firebaseUser) return null;

      if (typeof window === 'undefined') {
        return null;
      }

      const storedRaw = window.localStorage.getItem('MyWed360_user_profile');
      let storedProfile = null;

      if (storedRaw) {
        try {
          storedProfile = JSON.parse(storedRaw);
        } catch (parseError) {
          console.warn('[useAuth] No se pudo parsear el perfil guardado. Se generará uno nuevo.');
          window.localStorage.removeItem('MyWed360_user_profile');
        }
      }

      if (storedProfile && storedProfile.id && storedProfile.id !== firebaseUser.uid) {
        // Perfil de otro usuario: limpiar para evitar fugas de datos entre sesiones
        storedProfile = null;
        window.localStorage.removeItem('MyWed360_user_profile');
      }

      const providerData =
        firebaseUser.providerData?.map(({ providerId, uid, email, displayName, photoURL }) => ({
          providerId,
          uid,
          email,
          displayName,
          photoURL,
        })) || [];

      const resolvedRole =
        (forceRole && role) ||
        storedProfile?.role ||
        role ||
        (firebaseUser.email?.endsWith('@mywed360.com') ? 'assistant' : 'particular');

      const baseProfile = storedProfile || {};
      const baseName =
        firebaseUser.displayName ||
        baseProfile.name ||
        (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Usuario');

      const mergedPreferences = {
        ...DEFAULT_PROFILE_PREFERENCES,
        ...(baseProfile.preferences || {}),
        ...preferences,
      };

      const profile = {
        id: firebaseUser.uid,
        email: firebaseUser.email || baseProfile.email || '',
        name: baseName,
        role: resolvedRole,
        avatarUrl: firebaseUser.photoURL || baseProfile.avatarUrl || null,
        phoneNumber: firebaseUser.phoneNumber || baseProfile.phoneNumber || null,
        providerData,
        preferences: mergedPreferences,
        createdAt: firebaseUser.metadata?.creationTime || baseProfile.createdAt || null,
        lastLoginAt:
          firebaseUser.metadata?.lastSignInTime ||
          firebaseUser.metadata?.creationTime ||
          baseProfile.lastLoginAt ||
          null,
        myWed360Email: baseProfile.myWed360Email || null,
      };

      if (!profile.myWed360Email) {
        const loginPrefix = (firebaseUser.email || '').split('@')[0]?.slice(0, 4)?.toLowerCase();
        if (loginPrefix) {
          profile.myWed360Email = `${loginPrefix}@mywed360.com`;
        }
      }

      try {
        window.localStorage.setItem('MyWed360_user_profile', JSON.stringify(profile));
      } catch (storageError) {
        console.warn('[useAuth] No se pudo guardar el perfil en localStorage:', storageError);
      }

      setUserProfile(profile);
      return profile;
    },
    []
  );

  const mapAuthErrorMessage = useCallback(async (error) => {
    if (!error) {
      return 'Se produjo un error de autenticación. Inténtalo de nuevo.';
    }

    const code = error.code;
    const defaultMessage =
      SOCIAL_AUTH_ERROR_MESSAGES[code] ||
      error.message ||
      'Se produjo un error de autenticación. Inténtalo de nuevo.';

    if (code === 'auth/account-exists-with-different-credential' && error.customData?.email) {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, error.customData.email);
        if (methods && methods.length) {
          const providersReadable = methods.map(getReadableAuthMethod).join(', ');
          return `Ya existe una cuenta con este correo asociada a ${providersReadable}. Inicia sesión con ese proveedor y vincúlalo desde tu perfil.`;
        }
      } catch (fetchError) {
        console.warn('[useAuth] No se pudieron obtener los métodos de acceso asociados:', fetchError);
      }
    }

    return defaultMessage;
  }, []);

  // Integrar con Firebase Auth real y soportar sesiones admin/local mock (tests)
  useEffect(() => {
    const restoreAdminSession = () => {
      try {
        const isAdminSession = localStorage.getItem(ADMIN_SESSION_FLAG);
        const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
        if (!isAdminSession || !rawProfile) return false;
        const profile = JSON.parse(rawProfile);
        if (!profile || profile.role !== 'admin') return false;
        const adminUser = {
          uid: profile.id || 'admin-local',
          email: profile.email || ADMIN_EMAIL,
          displayName: profile.name || 'Administrador Lovenda',
        };
        setCurrentUser(adminUser);
        setUserProfile(profile);
        try {
          performanceMonitor?.setUserContext?.({
            uid: adminUser.uid,
            email: adminUser.email,
            role: 'admin',
            provider: 'admin-local',
          });
        } catch {}
        return true;
      } catch (error) {
        console.warn('[useAuth] No se pudo restaurar la sesión admin:', error);
        return false;
      }
    };

    const restoreMockSession = () => {
      try {
        if (typeof window === 'undefined') return false;
        const { localStorage: ls } = window;
        if (!ls) return false;

        const rawUser = ls.getItem('lovenda_user') || ls.getItem('mywed360_user');
        const isLoggedFlag = ls.getItem('isLoggedIn') === 'true';
        let parsedUser = null;
        if (rawUser) {
          try {
            parsedUser = JSON.parse(rawUser);
          } catch (err) {
            console.warn('[useAuth] No se pudo parsear lovenda_user:', err);
          }
        }
        const fallbackEmail = ls.getItem('userEmail');
        const email = (parsedUser && parsedUser.email) || fallbackEmail;
        if (!email && !isLoggedFlag) return false;
        if (!email) return false;

        const uid = (parsedUser && parsedUser.uid) || 'local-mock-user';
        const displayName =
          (parsedUser && (parsedUser.displayName || parsedUser.name)) ||
          (email ? email.split('@')[0] : 'Usuario');

        const mockUser = { uid, email, displayName };
        setCurrentUser(mockUser);

        let storedProfile = null;
        const rawProfile = ls.getItem('MyWed360_user_profile');
        if (rawProfile) {
          try {
            storedProfile = JSON.parse(rawProfile);
          } catch (err) {
            console.warn('[useAuth] No se pudo parsear el perfil almacenado:', err);
          }
        }

        const resolvedProfile = {
          id: (storedProfile && storedProfile.id) || uid,
          email: (storedProfile && storedProfile.email) || email,
          name: (storedProfile && storedProfile.name) || displayName,
          role:
            (storedProfile && storedProfile.role) ||
            (parsedUser && parsedUser.role) ||
            'particular',
          avatarUrl: (storedProfile && storedProfile.avatarUrl) || null,
          preferences: {
            ...DEFAULT_PROFILE_PREFERENCES,
            ...((storedProfile && storedProfile.preferences) || {}),
          },
        };

        setUserProfile(resolvedProfile);
        try {
          ls.setItem('MyWed360_user_profile', JSON.stringify(resolvedProfile));
        } catch (err) {
          console.warn('[useAuth] No se pudo persistir el perfil mock en localStorage:', err);
        }
        try {
          performanceMonitor?.setUserContext?.({
            uid: mockUser.uid,
            email: mockUser.email,
            role: resolvedProfile.role,
            provider: 'local-mock',
          });
        } catch {}
        return true;
      } catch (error) {
        console.warn('[useAuth] No se pudo restaurar la sesión mock de pruebas:', error);
        return false;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[useAuth] Firebase auth state changed:', firebaseUser?.email || 'No user');

      if (firebaseUser) {
        const user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName:
            firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          photoURL: firebaseUser.photoURL || null,
        };
        console.log('[useAuth] Usuario autenticado:', user.uid);
        setCurrentUser(user);

        const profile = persistProfileForUser(firebaseUser) || null;

        try {
          performanceMonitor?.setUserContext?.({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: profile?.role || 'particular',
            provider:
              firebaseUser.providerData?.map(({ providerId }) => providerId).join(',') || null,
          });
        } catch (perfError) {
          if (import.meta?.env?.DEV) {
            console.warn('[useAuth] No se pudo actualizar el contexto de performance:', perfError);
          }
        }
        localStorage.removeItem(ADMIN_SESSION_FLAG);
        localStorage.removeItem(ADMIN_PROFILE_KEY);
      } else {
        console.log('[useAuth] No hay usuario Firebase autenticado');
        const restored = restoreAdminSession();
        if (!restored) {
          const mockRestored = restoreMockSession();
          if (!mockRestored) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [persistProfileForUser]);
// Actualizar diagnóstico de autenticación
  useEffect(() => {
    if (loading) return;
    if (currentUser) {
      errorLogger.setAuthInfo({
        uid: currentUser.uid,
        email: currentUser.email,
        profile: userProfile,
      });
      // Relanzar diagnósticos ahora que existe sesión, para limpiar errores previos sin auth
      errorLogger.startDiagnostics();
    } else {
      errorLogger.setAuthInfo(null);
      try {
        performanceMonitor.setUserContext(null);
      } catch {}
    }
  }, [loading, currentUser, userProfile]);

  // Iniciar o detener el servicio de recordatorios cuando cambie el perfil
  useEffect(() => {
    if (loading) return;
    if (!userProfile) return;
    const { remindersEnabled = true, reminderDays = 3 } = userProfile.preferences || {};
    // En desarrollo, desactivar recordatorios salvo que se fuerce por env
    const env =
      typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env
        : typeof process !== 'undefined'
          ? process.env
          : {};
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
  const register = useCallback(
    async (email, password, role = 'particular') => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('[useAuth] Registro exitoso:', user.uid);

        persistProfileForUser(user, { role, forceRole: true });

        return { success: true, user };
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        return { success: false, error: error.message };
      }
    },
    [persistProfileForUser]
  );

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado del inicio de sesión
   */
  // -----------------------------
  // LOGIN
  // -----------------------------
  const login = useCallback(
    async (email, password) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('[useAuth] Login exitoso con Firebase Auth:', user.uid);

        persistProfileForUser(user, { role: userProfile?.role });

        return { success: true, user };
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return { success: false, error: error.message };
      }
    },
    [persistProfileForUser, userProfile?.role]
  );

  const loginAdmin = useCallback(async (email, password) => {
    try {
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Credenciales inválidas' };
      }

      const adminUser = {
        uid: 'admin-local',
        email: ADMIN_EMAIL,
        displayName: 'Administrador Lovenda',
      };

      const adminProfile = {
        id: 'admin-local',
        email: ADMIN_EMAIL,
        name: 'Administrador Lovenda',
        role: 'admin',
        isAdmin: true,
        preferences: {
          theme: 'dark',
          emailNotifications: false,
        },
      };

      setCurrentUser(adminUser);
      setUserProfile(adminProfile);
      try {
        performanceMonitor?.setUserContext?.({
          uid: adminUser.uid,
          email: adminUser.email,
          role: 'admin',
          provider: 'admin-local',
        });
      } catch {}

      localStorage.setItem(ADMIN_SESSION_FLAG, 'true');
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));

      return { success: true, user: adminUser };
    } catch (error) {
      console.error('Error al iniciar sesión admin:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const socialSignIn = useCallback(
    async (providerKey, { role, forceRole = false, fallbackToRedirect = true } = {}) => {
      const factory = SOCIAL_PROVIDER_FACTORIES[providerKey];
      if (!factory) {
        return {
          success: false,
          error: `Proveedor de autenticación no soportado: ${providerKey}`,
          code: 'auth/provider-not-supported',
        };
      }

      const provider = factory();

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo?.(result);
        const isNewUser = additionalInfo?.isNewUser ?? false;

        persistProfileForUser(user, {
          role: role || userProfile?.role || 'particular',
          forceRole: forceRole || isNewUser,
        });

        return {
          success: true,
          user,
          isNewUser,
          providerId: provider.providerId || providerKey,
        };
      } catch (popupError) {
        if (
          fallbackToRedirect &&
          (popupError.code === 'auth/popup-blocked' ||
            popupError.code === 'auth/cancelled-popup-request')
        ) {
          try {
            await signInWithRedirect(auth, provider);
            return {
              success: true,
              pendingRedirect: true,
              providerId: provider.providerId || providerKey,
            };
          } catch (redirectError) {
            const message = await mapAuthErrorMessage(redirectError);
            return { success: false, error: message, code: redirectError.code };
          }
        }

        const message = await mapAuthErrorMessage(popupError);
        return { success: false, error: message, code: popupError.code };
      }
    },
    [mapAuthErrorMessage, persistProfileForUser, userProfile?.role]
  );

  const loginWithProvider = useCallback(
    (providerKey, options = {}) =>
      socialSignIn(providerKey, {
        ...options,
        role: options.role || userProfile?.role,
        forceRole: Boolean(options.forceRole && options.role),
      }),
    [socialSignIn, userProfile?.role]
  );

  const registerWithProvider = useCallback(
    (providerKey, options = {}) =>
      socialSignIn(providerKey, {
        ...options,
        forceRole: options.forceRole ?? true,
      }),
    [socialSignIn]
  );

  /**
   * Enviar email de restablecimiento de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<void>}
   */
  const sendPasswordReset = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar restablecimiento de contraseña:', error);
      throw error;
    }
  }, []);

  /**
   * Obtener token de autenticación
   * @param {boolean} forceRefresh - Forzar actualización del token
   * @returns {Promise<string>} Token de autenticación
   */
  const getIdToken = useCallback(
    async (forceRefresh = false) => {
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
    },
    [currentUser]
  );

  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del cierre de sesión
   */
  const logout = useCallback(async () => {
    let signOutError = null;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      signOutError = error;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storage = window.localStorage;
        const legacyKeys = [
          'MyWed360_user_profile',
          ADMIN_PROFILE_KEY,
          ADMIN_SESSION_FLAG,
          'lovenda_user',
          'mywed360_user',
          'userEmail',
          'isLoggedIn',
          'mywed360_notif_seen',
          'mywed360_notifications',
        ];
        legacyKeys.forEach((key) => {
          try {
            storage.removeItem(key);
          } catch {}
        });
        try {
          storage.setItem('isLoggedIn', 'false');
        } catch {}
      }
    } catch (storageError) {
      console.warn('No se pudieron limpiar las claves de sesión legacy:', storageError);
    }

    stopReminderService();
    setCurrentUser(null);
    setUserProfile(null);

    if (!signOutError) {
      console.log('✅ Sesión cerrada correctamente');
      return { success: true };
    }

    throw signOutError;
  }, [setCurrentUser, setUserProfile]);

  /**
   * Actualizar el perfil del usuario
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  const updateUserProfile = async (profileData) => {
    try {
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      localStorage.setItem('MyWed360_user_profile', JSON.stringify(updatedProfile));
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Derivar estado de autenticación y alias legibles
  const isAuthenticated = !!currentUser;
  const isLoading = loading;
  const isAdmin = userProfile?.role === 'admin';

  // Valor del contexto que se proveerá a los componentes
  const value = {
    currentUser,
    user: currentUser, // alias de compatibilidad
    userProfile,
    loading: isLoading,
    isLoading,
    isAuthenticated,
    isAdmin,
    // Roles básicos desde el perfil (compatibilidad con MainLayout)
    hasRole: (...roles) => {
      try {
        const currentRole = userProfile?.role || 'particular';
        if (!roles || roles.length === 0) return !!currentRole;
        return roles.some((r) => r === currentRole);
      } catch {
        return false;
      }
    },
    login,
    loginAdmin,
    logout,
    register,
    socialSignIn,
    loginWithProvider,
    registerWithProvider,
    sendPasswordReset,
    getIdToken,
    updateUserProfile,
    availableSocialProviders: Object.keys(SOCIAL_PROVIDER_FACTORIES),
    getProviderLabel: getReadableProvider,
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

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {Object} El contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    try {
      if (import.meta?.env?.DEV && !__authWarnedOutside) {
        __authWarnedOutside = true;
        console.debug('[useAuth] Llamado fuera de AuthProvider. Usando fallback no-auth.');
      }
    } catch {}
    // Fallback seguro para evitar crasheos en rutas pblicas o durante HMR
    return {
      currentUser: null,
      user: null,
      userProfile: null,
      loading: false,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      hasRole: () => false,
      login: async () => ({ success: false, error: 'auth_unavailable' }),
      loginAdmin: async () => ({ success: false, error: 'auth_unavailable' }),
      loginWithProvider: async () => ({ success: false, error: 'auth_unavailable' }),
      logout: async () => ({ success: true }),
      register: async () => ({ success: false, error: 'auth_unavailable' }),
      registerWithProvider: async () => ({ success: false, error: 'auth_unavailable' }),
      socialSignIn: async () => ({ success: false, error: 'auth_unavailable' }),
      sendPasswordReset: async () => {
        throw new Error('auth_unavailable');
      },
      getIdToken: async () => '',
      updateUserProfile: async () => ({ success: false, error: 'auth_unavailable' }),
      availableSocialProviders: [],
      getProviderLabel: (providerId) => providerId,
    };
  }
  return context;
};
export default useAuth;
