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
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseReady, getFirebaseAuth } from '../firebaseConfig';
import EmailService from '../services/emailService';
import { setAuthContext as registerNotificationAuthContext } from '../services/notificationService';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { initReminderService, stopReminderService } from '../services/reminderService';
import { setAuthContext as registerWhatsappAuthContext } from '../services/whatsappService';
import {
  loginAdmin as loginAdminRequest,
  verifyAdminMfa as verifyAdminMfaRequest,
  logoutAdmin as logoutAdminRequest,
} from '../services/adminAuthClient';
import errorLogger from '../utils/errorLogger';
import { getBackendBase } from '../utils/backendBase';
import { mapAuthError } from '../utils/authErrorMapper';

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
const ADMIN_PROFILE_KEY = 'MyWed360_admin_profile';
const ADMIN_SESSION_FLAG = 'isAdminAuthenticated';
const ADMIN_SESSION_TOKEN_KEY = 'MyWed360_admin_session_token';
const ADMIN_SESSION_EXPIRES_KEY = 'MyWed360_admin_session_expires';
const ADMIN_SESSION_ID_KEY = 'MyWed360_admin_session_id';
const ADMIN_ALLOWED_DOMAINS = getEnv('VITE_ADMIN_ALLOWED_DOMAINS', 'lovenda.com');
const ADMIN_MOCK_LOGIN_FLAG = getEnv('VITE_ADMIN_MOCK_LOGIN', '0');

const isCypressRuntime = () => typeof window !== 'undefined' && !!window.Cypress;
// Flag para desactivar explícitamente el autologin/mock en Cypress (por defecto desactivado)
const CYPRESS_AUTOLOGIN_DISABLED = String(getEnv('VITE_DISABLE_CYPRESS_AUTOLOGIN', '1')).toLowerCase();
// Forzar login real en Cypress salvo que se habilite explícitamente con VITE_ADMIN_MOCK_LOGIN=1
const shouldMockAdminLogin = () => ADMIN_MOCK_LOGIN_FLAG === '1';

const buildMockAdminContext = () => {
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

  return {
    adminProfile,
    adminUser: {
      uid: adminProfile.id || 'admin-local',
      email: adminProfile.email || ADMIN_EMAIL,
      displayName: adminProfile.name || 'Administrador Lovenda',
    },
  };
};

const parseDomainList = (value) =>
  String(value || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

const ADMIN_ALLOWED_DOMAIN_SET = new Set(parseDomainList(ADMIN_ALLOWED_DOMAINS));
const resolveAuth = () => {
  try {
    const resolved = (typeof getFirebaseAuth === 'function' && getFirebaseAuth()) || null;
    if (resolved) return resolved;
  } catch (error) {
    console.warn('[useAuth] getFirebaseAuth falló, se intentará usar auth importado.', error);
  }
  return auth || null;
};

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
  const [pendingAdminSession, setPendingAdminSession] = useState(null);
  const [adminSessionToken, setAdminSessionToken] = useState(null);
  const [adminSessionExpiry, setAdminSessionExpiry] = useState(null);
  const [adminSessionId, setAdminSessionId] = useState(null);
  const adminMockAttemptsRef = useRef({
    count: 0,
    lockedUntil: 0,
    lastEmail: '',
  });

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
      // Persistir también en Firestore (best-effort, sin bloquear UI)
      try {
        // Solo escribir si hay usuario autenticado real y el uid coincide
        const activeAuth = resolveAuth();
        const authedUid = activeAuth?.currentUser?.uid || null;
        if (db && authedUid && authedUid === profile.id) {
          const userRef = doc(db, 'users', profile.id);
          void setDoc(
            userRef,
            {
              id: profile.id,
              email: profile.email || firebaseUser.email || '',
              name: profile.name || '',
              role: profile.role || 'particular',
              preferences: profile.preferences || {},
              lastLoginAt: profile.lastLoginAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn('[useAuth] No se pudo persistir el perfil en Firestore:', e);
      }
      return profile;
    },
    []
  );

  const mapAuthErrorMessage = useCallback(async (error, { email } = {}) => {
    if (!error) {
      return {
        message: 'Se produjo un error de autenticacion. Intentalo de nuevo.',
        code: 'auth/unknown',
      };
    }

    const defaultMessage =
      SOCIAL_AUTH_ERROR_MESSAGES[error?.code] ||
      error?.message ||
      'Se produjo un error de autenticacion. Intentalo de nuevo.';

    const activeAuth = resolveAuth();
    const lookupSignInMethods = async (targetEmail) => {
      if (!activeAuth || !targetEmail) {
        return [];
      }
      try {
        return await fetchSignInMethodsForEmail(activeAuth, targetEmail);
      } catch (fetchError) {
        console.warn('[useAuth] No se pudieron obtener los metodos de acceso asociados:', fetchError);
        return [];
      }
    };

    const mapped = await mapAuthError(error, {
      email: email || error?.customData?.email,
      lookupSignInMethods,
    });

    return {
      message: mapped.message || defaultMessage,
      code: mapped.code || error?.code || 'auth/unknown',
    };
  }, []);

  // Integrar con Firebase Auth real y soportar sesiones admin/local mock (tests)

  useEffect(() => {
    const restoreAdminSession = () => {
      try {
        const isAdminSession = localStorage.getItem(ADMIN_SESSION_FLAG);
        const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
        const storedToken = (() => {
          try {
            return localStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
          } catch {
            return null;
          }
        })();
        if (!isAdminSession || !rawProfile) return false;

        const profile = JSON.parse(rawProfile);
        if (!profile || profile.role !== 'admin') return false;

        const rawExpires = localStorage.getItem(ADMIN_SESSION_EXPIRES_KEY);
        const sessionId = localStorage.getItem(ADMIN_SESSION_ID_KEY);
        let expiresAt = rawExpires ? new Date(rawExpires) : null;
        if (expiresAt && Number.isNaN(expiresAt.getTime())) {
          expiresAt = null;
        }

        if (expiresAt && expiresAt.getTime() <= Date.now()) {
          try {
            localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
            localStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
            localStorage.removeItem(ADMIN_SESSION_ID_KEY);
            localStorage.removeItem(ADMIN_SESSION_FLAG);
            localStorage.removeItem(ADMIN_PROFILE_KEY);
          } catch {}
          return false;
        }

        const adminUser = {
          uid: profile.id || 'admin-local',
          email: profile.email || ADMIN_EMAIL,
          displayName: profile.name || 'Administrador Lovenda',
        };

        setCurrentUser(adminUser);
        setUserProfile(profile);
        setAdminSessionToken(storedToken || null);
        setAdminSessionExpiry(expiresAt);
        setAdminSessionId(sessionId || null);

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
        console.warn('[useAuth] No se pudo restaurar la sesion admin:', error);
        return false;
      }
    };

    const restoreMockSession = () => {
      if (typeof window === 'undefined') {
        return false;
      }
      if (window.__MYWED360_DISABLE_AUTOLOGIN__ === true) {
        return false;
      }

      const ls = window.localStorage;
      if (!ls) {
        return false;
      }

      try {
        const rawUser =
          ls.getItem('lovenda_user') ||
          ls.getItem('mywed360_user') ||
          ls.getItem('MyWed360_user_profile');
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
        } catch (storageError) {
          console.warn('[useAuth] No se pudo persistir el perfil mock en localStorage:', storageError);
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
        console.warn('[useAuth] No se pudo restaurar la sesion mock de pruebas:', error);
        return false;
      }
    };

    let unsubscribe = null;
    let cancelled = false;

    const bootstrapAuth = async () => {
      const isCypressEnv = typeof window !== 'undefined' && !!window.Cypress;

      const shouldDisableCypressAutoLogin = () =>
        typeof window !== 'undefined' &&
        !!window.Cypress &&
        window.__MYWED360_DISABLE_AUTOLOGIN__ === true;

      if (isCypressEnv) {
        // 1) Respeta el flag de ventana para desactivar explícitamente el autologin (tests que validan la UI de login)
        if (shouldDisableCypressAutoLogin()) {
          window.__MYWED360_DISABLE_AUTOLOGIN__ = false;
          console.info('[useAuth] Cypress auto-login deshabilitado por flag.');
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        // 2) Detecta si existe una sesión presembrada por comandos de Cypress (cy.loginToLovenda)
        const hasSeededSession = (() => {
          try {
            const ls = typeof window !== 'undefined' ? window.localStorage : null;
            if (!ls) return false;
            return (
              ls.getItem('isLoggedIn') === 'true' ||
              !!ls.getItem('MyWed360_user_profile') ||
              !!ls.getItem('mywed360_user') ||
              !!ls.getItem('lovenda_user')
            );
          } catch (_) {
            return false;
          }
        })();

        // 3) Si la variable de entorno desactiva autologin PERO hay sesión sembrada, intenta restaurarla igualmente
        if ((CYPRESS_AUTOLOGIN_DISABLED === '1' || CYPRESS_AUTOLOGIN_DISABLED === 'true') && !hasSeededSession) {
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        const restoredAdmin = restoreAdminSession();
        const restoredMock = restoredAdmin ? true : restoreMockSession();

        if (!restoredAdmin && !restoredMock) {
          try {
            const ls = typeof window !== 'undefined' ? window.localStorage : null;
            const fallbackEmail =
              (ls && (ls.getItem('mywed360_login_email') || ls.getItem('userEmail'))) ||
              'planner.cypress@lovenda.test';
            const displayName = fallbackEmail.split('@')[0] || 'Usuario Cypress';
            const mockUser = {
              uid: `cypress-${displayName}`,
              email: fallbackEmail,
              displayName,
            };
            setCurrentUser(mockUser);

            const pseudoFirebaseUser = {
              ...mockUser,
              providerData: [{ providerId: 'password', email: fallbackEmail }],
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
              },
            };

            persistProfileForUser(pseudoFirebaseUser, {
              role: 'planner',
              forceRole: true,
            });

            if (ls) {
              ls.setItem('lovenda_user', JSON.stringify(mockUser));
              ls.setItem('mywed360_user', JSON.stringify(mockUser));
              ls.setItem('isLoggedIn', 'true');
            }
          } catch (mockError) {
            console.warn('[useAuth] No se pudo inicializar la sesion mock:', mockError);
          }
        }

        setLoading(false);
        return;
      }

      try {
        await firebaseReady;
      } catch (error) {
        console.warn('[useAuth] Error al esperar firebaseReady:', error);
      }

      if (cancelled) return;

      const activeAuth = resolveAuth();
      if (!activeAuth || typeof activeAuth.onAuthStateChanged !== 'function') {
        console.warn('[useAuth] Auth no disponible; la sesion permanecera sin iniciar.');
        setLoading(false);
        return;
      }

      unsubscribe = onAuthStateChanged(activeAuth, (firebaseUser) => {
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
              uid: user.uid,
              email: user.email,
              role: profile?.role || 'particular',
              provider: firebaseUser?.providerData?.[0]?.providerId || 'password',
            });
          } catch {}
        } else {
          console.log('[useAuth] No hay usuario autenticado');
          const adminRestored = restoreAdminSession();
          const mockRestored = adminRestored ? true : restoreMockSession();

          if (!mockRestored) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }

        setLoading(false);
      });
    };

    bootstrapAuth();

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
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
      const activeAuth = resolveAuth();
      if (!activeAuth) {
        return { success: false, error: 'auth_unavailable' };
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(activeAuth, email, password);
        const user = userCredential.user;
        console.log('[useAuth] Registro exitoso:', user.uid);

        persistProfileForUser(user, { role, forceRole: true });

        return { success: true, user };
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        const mapped = await mapAuthErrorMessage(error, { email });
        return { success: false, error: mapped.message, code: mapped.code };
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
      const isCypressEnv = typeof window !== 'undefined' && !!window.Cypress;
      const shouldBypassCypressMock = (() => {
        try {
          if (typeof window !== 'undefined' && window.__MYWED360_DISABLE_AUTOLOGIN__ === true) return true;
        } catch {}
        const v = String(getEnv('VITE_DISABLE_CYPRESS_AUTOLOGIN', '1')).toLowerCase();
        return v === '1' || v === 'true';
      })();
      if (isCypressEnv && !shouldBypassCypressMock) {
        try {
          const ls = typeof window !== 'undefined' ? window.localStorage : null;
          const remember = true;
          const mockUser = {
            uid: `cypress-${Date.now()}`,
            email,
            displayName: (email || '').split('@')[0] || 'Usuario Cypress',
          };
          setCurrentUser(mockUser);
          if (ls) {
            ls.setItem('lovenda_user', JSON.stringify(mockUser));
            ls.setItem('mywed360_user', JSON.stringify(mockUser));
            ls.setItem('isLoggedIn', 'true');
            if (remember) {
              ls.setItem('mywed360_login_email', email || '');
            }
          }
          const pseudoFirebaseUser = {
            ...mockUser,
            providerData: [{ providerId: 'password', email }],
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString(),
            },
          };
          persistProfileForUser(pseudoFirebaseUser, {
            role: userProfile?.role || 'planner',
            forceRole: !userProfile?.role,
          });
          return { success: true, user: mockUser };
        } catch (mockError) {
          console.warn('[useAuth] Login mock falló:', mockError);
          return { success: false, error: 'mock_login_failed' };
        }
      }

      const activeAuth = resolveAuth();
      if (!activeAuth) {
        console.error('[useAuth] Auth no disponible durante login.');
        // Fallback de desarrollo cuando Firebase Auth no está configurado
        try {
          const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
          const isProd = String(env?.MODE || env?.NODE_ENV || '').toLowerCase() === 'production';
          if (!isProd) {
            const ls = typeof window !== 'undefined' ? window.localStorage : null;
            const mockUser = {
              uid: `local-${Date.now()}`,
              email,
              displayName: (email || '').split('@')[0] || 'Usuario',
            };
            setCurrentUser(mockUser);
            if (ls) {
              ls.setItem('lovenda_user', JSON.stringify(mockUser));
              ls.setItem('mywed360_user', JSON.stringify(mockUser));
              ls.setItem('isLoggedIn', 'true');
            }
            const pseudoFirebaseUser = {
              ...mockUser,
              providerData: [{ providerId: 'password', email }],
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
              },
            };
            persistProfileForUser(pseudoFirebaseUser, {
              role: userProfile?.role || 'planner',
              forceRole: !userProfile?.role,
            });
            return { success: true, user: mockUser };
          }
        } catch {}
        return { success: false, error: 'auth_unavailable' };
      }

      try {
        const userCredential = await signInWithEmailAndPassword(activeAuth, email, password);
        const user = userCredential.user;

        console.log('[useAuth] Login exitoso con Firebase Auth:', user.uid);

        persistProfileForUser(user, { role: userProfile?.role });

        return { success: true, user };
      } catch (error) {
        console.error('Error al iniciar sesion:', error);
        // Fallback de desarrollo: permitir sesión local si Firebase no está disponible (no productivo)
        try {
          const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
          const isProd = String(env?.MODE || env?.NODE_ENV || '').toLowerCase() === 'production';
          if (!isProd) {
            const ls = typeof window !== 'undefined' ? window.localStorage : null;
            const mockUser = {
              uid: `local-${Date.now()}`,
              email,
              displayName: (email || '').split('@')[0] || 'Usuario',
            };
            setCurrentUser(mockUser);
            if (ls) {
              ls.setItem('lovenda_user', JSON.stringify(mockUser));
              ls.setItem('mywed360_user', JSON.stringify(mockUser));
              ls.setItem('isLoggedIn', 'true');
            }
            const pseudoFirebaseUser = {
              ...mockUser,
              providerData: [{ providerId: 'password', email }],
              metadata: {
                creationTime: new Date().toISOString(),
                lastSignInTime: new Date().toISOString(),
              },
            };
            persistProfileForUser(pseudoFirebaseUser, {
              role: userProfile?.role || 'planner',
              forceRole: !userProfile?.role,
            });
            return { success: true, user: mockUser };
          }
        } catch (fallbackErr) {
          console.warn('[useAuth] Fallback de login local falló:', fallbackErr);
        }
        const mapped = await mapAuthErrorMessage(error, { email });
        return { success: false, error: mapped.message, code: mapped.code };
      }
    },
    [persistProfileForUser, setCurrentUser, userProfile?.role, mapAuthErrorMessage]
  );

  const finalizeAdminLogin = useCallback(
    async ({ adminUser, adminProfile, sessionToken, sessionExpiresAt, sessionId }) => {
      setCurrentUser(adminUser);
      setUserProfile(adminProfile);
      // ...
      setPendingAdminSession(null);

      const expiryDate =
        sessionExpiresAt instanceof Date
          ? sessionExpiresAt
          : sessionExpiresAt
          ? new Date(sessionExpiresAt)
          : null;
      const normalizedExpiry =
        expiryDate && !Number.isNaN(expiryDate.getTime()) ? expiryDate : null;

      setAdminSessionToken(sessionToken || null);
      setAdminSessionExpiry(normalizedExpiry);
      setAdminSessionId(sessionId || null);

      try {
        performanceMonitor?.setUserContext?.({
          uid: adminUser.uid,
          email: adminUser.email,
          role: 'admin',
          provider: 'admin-local',
        });
      } catch {}

      try {
        localStorage.setItem(ADMIN_SESSION_FLAG, 'true');
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
        localStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
        localStorage.removeItem('mw360_auth_token');
        if (normalizedExpiry) {
          localStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, normalizedExpiry.toISOString());
        } else {
          localStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
        }
        if (sessionId) {
          localStorage.setItem(ADMIN_SESSION_ID_KEY, sessionId);
        } else {
          localStorage.removeItem(ADMIN_SESSION_ID_KEY);
        }
      } catch (storageError) {
        console.warn('[useAuth] No se pudo persistir la sesión admin:', storageError);
      }

      return {
        success: true,
        user: adminUser,
        sessionToken: sessionToken || null,
        sessionExpiresAt: normalizedExpiry,
        sessionId: sessionId || null,
      };
    },
    [
      setCurrentUser,
      setUserProfile,
      setPendingAdminSession,
      setAdminSessionToken,
      setAdminSessionExpiry,
      setAdminSessionId,
    ]
  );

  const loginAdmin = useCallback(
    async (email, password) => {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const userDomain = normalizedEmail.includes('@')
        ? normalizedEmail.split('@').pop()
        : '';

      if (!normalizedEmail) {
        return { success: false, error: 'Introduce un email válido' };
      }

      if (ADMIN_ALLOWED_DOMAIN_SET.size && !ADMIN_ALLOWED_DOMAIN_SET.has(userDomain)) {
        return {
          success: false,
          error: 'Dominio no autorizado',
          code: 'domain_not_allowed',
        };
      }

      if (shouldMockAdminLogin()) {
        const now = Date.now();
        const attempts = adminMockAttemptsRef.current;

        if (attempts.lockedUntil && attempts.lockedUntil > now) {
          return {
            success: false,
            error: 'Se han superado los intentos permitidos',
            code: 'locked',
            lockedUntil: attempts.lockedUntil,
          };
        }

        const normalizedPassword = String(password ?? '');

        if (normalizedEmail === ADMIN_EMAIL && normalizedPassword === 'AdminPass123!') {
          adminMockAttemptsRef.current = {
            count: 0,
            lockedUntil: 0,
            lastEmail: '',
          };
          const expiresAtMs = now + 5 * 60 * 1000;
          setPendingAdminSession({
            challengeId: 'mock-admin',
            resumeToken: `mock-admin-token-${now}`,
            email: normalizedEmail,
            issuedAt: now,
            expiresAt: expiresAtMs,
          });
          return {
            success: true,
            requiresMfa: true,
            expiresAt: expiresAtMs,
          };
        }

        if (normalizedEmail === 'owner@lovenda.com') {
          return {
            success: false,
            error: 'Tu cuenta no dispone de acceso administrador',
            code: 'role_mismatch',
          };
        }

        const nextCount =
          attempts.lastEmail === normalizedEmail ? attempts.count + 1 : 1;
        const nextState = {
          lastEmail: normalizedEmail,
          count: Math.min(nextCount, 5),
          lockedUntil: 0,
        };

        if (nextCount >= 5) {
          const lockedUntil = now + 5 * 60 * 1000;
          nextState.count = 0;
          nextState.lockedUntil = lockedUntil;
          adminMockAttemptsRef.current = nextState;
          return {
            success: false,
            error: 'Se han superado los intentos permitidos',
            code: 'locked',
            lockedUntil,
          };
        }

        adminMockAttemptsRef.current = nextState;

        return {
          success: false,
          error: 'Email o contraseña no válidos',
          code: 'invalid_credentials',
        };
      }

      try {
        const response = await loginAdminRequest({
          email: normalizedEmail,
          password,
        });

        if (response.requiresMfa) {
          const expiresDate =
            response.expiresAt instanceof Date
              ? response.expiresAt
              : response.expiresAt
              ? new Date(response.expiresAt)
              : null;
          const expiresAtMs =
            expiresDate && !Number.isNaN(expiresDate.getTime())
              ? expiresDate.getTime()
              : Date.now() + 60_000;

          setPendingAdminSession({
            challengeId: response.challengeId,
            resumeToken: response.resumeToken,
            email: normalizedEmail,
            issuedAt: Date.now(),
            expiresAt: expiresAtMs,
          });

          return {
            success: true,
            requiresMfa: true,
            expiresAt: expiresAtMs,
          };
        }

        const { adminProfile, adminUser } = (() => {
          if (response.profile || response.adminUser) {
            const profile = response.profile || {
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
            const user = response.adminUser || {
              uid: profile.id || 'admin-local',
              email: profile.email || ADMIN_EMAIL,
              displayName: profile.name || 'Administrador Lovenda',
            };
            return { adminProfile: profile, adminUser: user };
          }
          return buildMockAdminContext();
        })();

        return finalizeAdminLogin({
          adminUser,
          adminProfile,
          sessionToken: response.sessionToken,
          sessionExpiresAt: response.sessionExpiresAt,
          sessionId: response.sessionId,
        });
      } catch (error) {
        console.error('Error al iniciar sesión admin:', error);
        return {
          success: false,
          error: error?.message || 'No se pudo iniciar sesión.',
          code: error?.code,
          lockedUntil:
            error?.lockedUntil instanceof Date
              ? error.lockedUntil.getTime()
              : error?.lockedUntil || null,
        };
      }
    },
    [finalizeAdminLogin, setPendingAdminSession]
  );

  const completeAdminMfa = useCallback(
    async (code) => {
      if (!pendingAdminSession) {
        return { success: false, error: 'No hay un desafío MFA activo.' };
      }

      if (pendingAdminSession.expiresAt && Date.now() > pendingAdminSession.expiresAt) {
        setPendingAdminSession(null);
        return {
          success: false,
          error: 'El código ha expirado. Vuelve a iniciar sesión.',
          code: 'challenge_expired',
        };
      }

      const normalizedCode = String(code || '').trim();
      if (!normalizedCode) {
        return { success: false, error: 'Introduce el código de verificación.' };
      }

      if (shouldMockAdminLogin() && pendingAdminSession.challengeId === 'mock-admin') {
        if (normalizedCode !== '123456') {
          return {
            success: false,
            error: 'Código inválido.',
            code: 'invalid_mfa',
          };
        }

        setPendingAdminSession(null);
        const { adminProfile, adminUser } = buildMockAdminContext();
        return finalizeAdminLogin({
          adminUser,
          adminProfile,
          sessionToken: `mock-admin-session-${Date.now()}`,
          sessionExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          sessionId: `mock-admin-${Date.now()}`,
        });
      }

      try {
        const response = await verifyAdminMfaRequest({
          challengeId: pendingAdminSession.challengeId,
          code: normalizedCode,
          resumeToken: pendingAdminSession.resumeToken,
        });

        const adminProfile = response.profile || {
          id: 'admin-local',
          email: pendingAdminSession.email || ADMIN_EMAIL,
          name: 'Administrador Lovenda',
          role: 'admin',
          isAdmin: true,
          preferences: {
            theme: 'dark',
            emailNotifications: false,
          },
        };

        const adminUser = response.adminUser || {
          uid: adminProfile.id || 'admin-local',
          email: adminProfile.email || ADMIN_EMAIL,
          displayName: adminProfile.name || 'Administrador Lovenda',
        };

        setPendingAdminSession(null);

        return finalizeAdminLogin({
          adminUser,
          adminProfile,
          sessionToken: response.sessionToken,
          sessionExpiresAt: response.sessionExpiresAt,
          sessionId: response.sessionId,
        });
      } catch (error) {
        console.error('Error completando MFA admin:', error);
        return {
          success: false,
          error: error?.message || 'Código inválido.',
          code: error?.code,
          lockedUntil:
            error?.lockedUntil instanceof Date
              ? error.lockedUntil.getTime()
              : error?.lockedUntil || null,
        };
      }
    },
    [pendingAdminSession, finalizeAdminLogin, setPendingAdminSession]
  );

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

      const activeAuth = resolveAuth();
      if (!activeAuth) {
        return {
          success: false,
          error: 'auth_unavailable',
          code: 'auth/unavailable',
        };
      }

      try {
        const result = await signInWithPopup(activeAuth, provider);
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
            await signInWithRedirect(activeAuth, provider);
            return {
              success: true,
              pendingRedirect: true,
              providerId: provider.providerId || providerKey,
            };
          } catch (redirectError) {
            const mapped = await mapAuthErrorMessage(redirectError, {
              email: redirectError?.customData?.email,
            });
            return {
              success: false,
              error: mapped.message,
              code: mapped.code,
            };
          }
        }

        const mapped = await mapAuthErrorMessage(popupError, {
          email: popupError?.customData?.email,
        });
        return { success: false, error: mapped.message, code: mapped.code };
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
    const activeAuth = resolveAuth();
    if (!activeAuth) {
      throw new Error('auth_unavailable');
    }
    try {
      await sendPasswordResetEmail(activeAuth, email);
    } catch (error) {
      console.error('Error al enviar restablecimiento de contrasena:', error);
      const mapped = await mapAuthErrorMessage(error, { email });
      const message = mapped.message || error?.message || 'No se pudo enviar el enlace de restablecimiento.';
      const enrichedError = new Error(message);
      enrichedError.code = mapped.code || error?.code;
      enrichedError.original = error;
      throw enrichedError;
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
        const activeAuth = resolveAuth();
        const fbUser = activeAuth?.currentUser;
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
      const activeAuth = resolveAuth();
      if (activeAuth) {
        await signOut(activeAuth);
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      signOutError = error;
    }

    try {
      await logoutAdminRequest(adminSessionToken);
    } catch (error) {
      console.warn('[useAuth] No se pudo invalidar la sesión admin en backend:', error);
    }

    setPendingAdminSession(null);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storage = window.localStorage;
        const legacyKeys = [
          'MyWed360_user_profile',
          ADMIN_PROFILE_KEY,
          ADMIN_SESSION_FLAG,
          ADMIN_SESSION_TOKEN_KEY,
          ADMIN_SESSION_EXPIRES_KEY,
          ADMIN_SESSION_ID_KEY,
          'lovenda_user',
          'mywed360_user',
          'userEmail',
          'isLoggedIn',
          'mywed360_notif_seen',
          'mywed360_notifications',
          'mw360_auth_token',
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
    setAdminSessionToken(null);
    setAdminSessionExpiry(null);
    setAdminSessionId(null);

    if (!signOutError) {
      console.log('✅ Sesión cerrada correctamente');
      return { success: true };
    }

    throw signOutError;
  }, [
    adminSessionToken,
    setAdminSessionExpiry,
    setAdminSessionId,
    setAdminSessionToken,
    setCurrentUser,
    setUserProfile,
    setPendingAdminSession,
  ]);

  // Recargar perfil desde Firestore y sincronizar estado/localStorage
  const reloadUserProfile = useCallback(async () => {
    try {
      const uid = currentUser?.uid;
      if (!uid || !db) {
        return { success: false, error: 'not_authenticated' };
      }
      await firebaseReady;
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        return { success: false, error: 'profile_not_found' };
      }
      const data = snap.data() || {};
      const merged = { ...(userProfile || {}), ...data, id: uid };
      setUserProfile(merged);
      try { window.localStorage.setItem('MyWed360_user_profile', JSON.stringify(merged)); } catch {}
      return { success: true, profile: merged };
    } catch (e) {
      console.warn('[useAuth] reloadUserProfile failed:', e);
      return { success: false, error: e?.message || 'reload_failed' };
    }
  }, [currentUser, userProfile]);

  // Upgrade de rol vía backend y refresco de perfil
  const upgradeRole = useCallback(async ({ newRole, tier }) => {
    try {
      if (!currentUser?.uid) return { success: false, error: 'not_authenticated' };
      const base = typeof getBackendBase === 'function' ? getBackendBase() : '';
      if (!base) return { success: false, error: 'backend_base_unavailable' };
      const token = await getIdToken();
      const resp = await fetch(`${base}/api/users/upgrade-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newRole, tier }),
        credentials: 'include',
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        return {
          success: false,
          error: json?.error?.message || `upgrade_failed_${resp.status}`,
          code: json?.error?.code || 'upgrade_failed',
        };
      }
      await reloadUserProfile();
      return { success: true, role: json?.role, subscription: json?.subscription };
    } catch (e) {
      console.warn('[useAuth] upgradeRole failed:', e);
      return { success: false, error: e?.message || 'upgrade_failed' };
    }
  }, [currentUser, getIdToken, reloadUserProfile]);

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
      try {
        if (db && currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            { ...profileData, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn('[useAuth] No se pudo persistir updateUserProfile en Firestore:', e);
      }
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
    pendingAdminSession,
    adminSessionToken,
    adminSessionExpiresAt: adminSessionExpiry,
    adminSessionId,
    completeAdminMfa,
    logout,
    register,
    socialSignIn,
    loginWithProvider,
    registerWithProvider,
    sendPasswordReset,
    getIdToken,
    updateUserProfile,
    reloadUserProfile,
    upgradeRole,
    availableSocialProviders: Object.keys(SOCIAL_PROVIDER_FACTORIES),
    getProviderLabel: getReadableProvider,
  };

  // Registrar el contexto en emailService para que pueda obtener el token
  useEffect(() => {
    EmailService?.setAuthContext?.({
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
      pendingAdminSession: null,
      completeAdminMfa: async () => ({ success: false, error: 'auth_unavailable' }),
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
      reloadUserProfile: async () => ({ success: false, error: 'auth_unavailable' }),
      upgradeRole: async () => ({ success: false, error: 'auth_unavailable' }),
      availableSocialProviders: [],
      getProviderLabel: (providerId) => providerId,
    };
  }
  return context;
};
export default useAuth;
