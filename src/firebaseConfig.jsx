import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  getDoc,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuraci�n de Firebase desde variables de entorno (sin secretos hard-coded)
const rawFirebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta?.env?.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};
const inferredAuthDomain =
  rawFirebaseConfig.authDomain ||
  (rawFirebaseConfig.projectId ? `${rawFirebaseConfig.projectId}.firebaseapp.com` : '');
const inferredStorageBucket =
  rawFirebaseConfig.storageBucket ||
  (rawFirebaseConfig.projectId ? `${rawFirebaseConfig.projectId}.appspot.com` : '');

// if (!rawFirebaseConfig.authDomain && inferredAuthDomain && typeof console !== 'undefined') - debug removed
// if (!rawFirebaseConfig.storageBucket && inferredStorageBucket && typeof console !== 'undefined') - debug removed

const firebaseConfig = {
  ...rawFirebaseConfig,
  authDomain: inferredAuthDomain,
  storageBucket: inferredStorageBucket,
};

const FIREBASE_CONFIGURED =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.authDomain);

if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // Aviso en consola para facilitar configuración local
    // No expone valores; solo lista claves faltantes
    // console.warn('[firebaseConfig] Variables VITE_* faltantes:', missing.join(', '));
  }
}

// Variables globales de Firebase
let app =
  FIREBASE_CONFIGURED && getApps().length
    ? getApp()
    : FIREBASE_CONFIGURED
      ? initializeApp(firebaseConfig)
      : null;
let db =
  FIREBASE_CONFIGURED && app
    ? (() => {
        try {
          return initializeFirestore(app, {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          });
        } catch (_e1) {
          try {
            return initializeFirestore(app, {
              experimentalForceLongPolling: true,
              ignoreUndefinedProperties: true,
              localCache: persistentLocalCache(),
            });
          } catch (_e2) {
            return initializeFirestore(app, {
              experimentalForceLongPolling: true,
              ignoreUndefinedProperties: true,
              localCache: memoryLocalCache(),
            });
          }
        }
      })()
    : null;
let auth;
let storage;
let analytics;

// Prueba la conexión con Firestore sin requerir autenticación (solo lectura)
const probarConexionFirestore = async () => {
  try {
    const docPrueba = doc(db, '_conexion_prueba', 'test');
    // Solo lectura: las reglas permiten read=if true para colecciones de prueba
    await getDoc(docPrueba);
    return true;
  } catch (_error) {
    // No propagar: inicialización debe continuar en modo offline si falla
    return false;
  }
};

// ⭐ MEJORADO: Listener de estado de conexión para Firestore y Realtime DB
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const configurarListenerConexion = () => {
  if (typeof window === 'undefined') return;

  // ✅ Listener para Firestore (browser online/offline)
  const handleConnectionChange = async (online) => {
    isOnline = online;

    if (online) {
      // console.log('🟢 Conexión de red restaurada');
      reconnectAttempts = 0;

      // Intentar habilitar red de Firestore
      if (db) {
        try {
          const { enableNetwork } = await import('firebase/firestore');
          await enableNetwork(db);
          // console.log('✅ Firestore reconectado exitosamente');

          if (window.mostrarErrorUsuario) {
            window.mostrarErrorUsuario('Conectado a internet', 3000);
          }
        } catch (error) {
          // console.warn('⚠️ Error reconectando Firestore:', error.message);
        }
      }
    } else {
      // console.log('🔴 Conexión de red perdida - modo offline');
      reconnectAttempts++;

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        // console.log(`🔄 Reintento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      }
    }
  };

  window.addEventListener('online', () => handleConnectionChange(true));
  window.addEventListener('offline', () => handleConnectionChange(false));

  // Estado inicial
  if (!navigator.onLine) {
    // console.log('⚠️ Iniciando en modo offline');
  }

  // ✅ Listener para Realtime Database (si está habilitado)
  if (import.meta.env.VITE_ENABLE_REALTIME_DB === 'true') {
    try {
      const dbRealtime = getDatabase();
      const estadoConexion = ref(dbRealtime, '.info/connected');
      onValue(estadoConexion, (snapshot) => {
        if (snapshot.val() === true) {
          // console.log('✅ Realtime Database conectado');
        } else {
          // console.log('⚠️ Realtime Database desconectado');
        }
      });
    } catch (error) {
      // console.warn('No se pudo configurar el listener de Realtime Database:', error);
    }
  }
};

// Inicializa los servicios de Firebase
const inicializarFirebase = async () => {
  if (!FIREBASE_CONFIGURED) {
    return null;
  }
  try {
    // App
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // Auth
    auth = getAuth(app);
    if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      window.auth = auth;
    }
    try {
      const { setPersistence, browserLocalPersistence } = await import('firebase/auth');
      await setPersistence(auth, browserLocalPersistence);
    } catch (pErr) {
      // console.warn('No se pudo establecer la persistencia local de auth:', pErr);
    }
    auth.languageCode = 'es';
    if (typeof window !== 'undefined') window.auth = auth;

    // Storage
    storage = getStorage(app);
    if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
      window.storage = storage;
    }

    // Firestore si es necesario
    if (!db) {
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (firestoreError) {
        try {
          db = initializeFirestore(app, {
            experimentalForceLongPolling: true,
            ignoreUndefinedProperties: true,
            localCache: persistentLocalCache(),
          });
        } catch (_e2) {
          try {
            db = initializeFirestore(app, {
              experimentalForceLongPolling: true,
              ignoreUndefinedProperties: true,
              localCache: memoryLocalCache(),
            });
          } catch (finalError) {
            // console.error('❌ Error crítico inicializando Firestore:', finalError);
            db = getFirestore(app);
          }
        }
      }
    }

    try {
      db && db;
    } catch (_err) {}

    // Emulador (info)
    try {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (emulatorError) {
      // console.warn('No se pudo configurar el emulador:', emulatorError);
    }

    // Probar conectividad: solo lectura para no requerir auth
    const ok = await probarConexionFirestore();
    if (!ok) {
      if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
        window.mostrarErrorUsuario(
          'Modo sin conexión - Los cambios se sincronizarán cuando se recupere la conexión',
          10000
        );
      }
    }

    // Analytics en producción
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        const soporteAnalytics = await isSupported();
        if (soporteAnalytics) {
          analytics = getAnalytics(app);
        }
      } catch (error) {
        // console.warn('Error al inicializar Analytics:', error);
      }
    }

    // Listener de conexión
    configurarListenerConexion();
  } catch (error) {
    // console.error('Error al inicializar Firebase:', error);
    if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
      window.mostrarErrorUsuario(
        'Error al conectar con el servidor. La aplicación funcionará en modo fuera de línea.',
        0
      );
    }
    throw error;
  }
};

// Al importar este módulo iniciamos Firebase y exportamos la promesa
const firebaseReady = FIREBASE_CONFIGURED
  ? inicializarFirebase().catch((error) => {
      // console.error('Error crítico al inicializar Firebase:', error);
      throw error;
    })
  : Promise.resolve();

const getFirebaseAuth = () => auth;

export { auth, db, storage, analytics, firebaseReady, getFirebaseAuth, isOnline };
