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

// Configuración de Firebase desde variables de entorno (sin secretos hard-coded)
const rawFirebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta?.env?.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};
const inferredAuthDomain =
  rawFirebaseConfig.authDomain ||
  (rawFirebaseConfig.projectId ? `${rawFirebaseConfig.projectId}.firebaseapp.com` : '');
const inferredStorageBucket =
  rawFirebaseConfig.storageBucket ||
  (rawFirebaseConfig.projectId ? `${rawFirebaseConfig.projectId}.appspot.com` : '');

if (!rawFirebaseConfig.authDomain && inferredAuthDomain && typeof console !== 'undefined') {
  console.warn(
    '[firebaseConfig] VITE_FIREBASE_AUTH_DOMAIN ausente; usando dominio inferido:',
    inferredAuthDomain
  );
}

if (!rawFirebaseConfig.storageBucket && inferredStorageBucket && typeof console !== 'undefined') {
  console.warn(
    '[firebaseConfig] VITE_FIREBASE_STORAGE_BUCKET ausente; usando bucket inferido:',
    inferredStorageBucket
  );
}

const firebaseConfig = {
  ...rawFirebaseConfig,
  authDomain: inferredAuthDomain,
  storageBucket: inferredStorageBucket,
};

const FIREBASE_CONFIGURED =
  Boolean(firebaseConfig.apiKey) && Boolean(firebaseConfig.projectId) && Boolean(firebaseConfig.authDomain);

if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // Aviso en consola para facilitar configuraciÃ³n local
    // No expone valores; solo lista claves faltantes
    console.warn('[firebaseConfig] Variables VITE_* faltantes:', missing.join(', '));
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
let analytics;

// Prueba la conexiÃ³n con Firestore sin requerir autenticaciÃ³n (solo lectura)
const probarConexionFirestore = async () => {
  try {
    const docPrueba = doc(db, '_conexion_prueba', 'test');
    // Solo lectura: las reglas permiten read=if true para colecciones de prueba
    await getDoc(docPrueba);
    return true;
  } catch (_error) {
    // No propagar: inicializaciÃ³n debe continuar en modo offline si falla
    return false;
  }
};

// Listener de estado de conexiÃ³n (opcional)
const configurarListenerConexion = () => {
  if (typeof window === 'undefined') return;
  if (import.meta.env.VITE_ENABLE_REALTIME_DB !== 'true') return;
  try {
    const dbRealtime = getDatabase();
    const estadoConexion = ref(dbRealtime, '.info/connected');
    onValue(estadoConexion, (snapshot) => {
      if (snapshot.val() === true) {
        if (window.mostrarErrorUsuario) {
          window.mostrarErrorUsuario(`Conectado a internet`, 3000);
        }
      } else {
        // desconectado
      }
    });
  } catch (error) {
    console.warn('No se pudo configurar el listener de conexiÃ³n:', error);
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
      console.warn('No se pudo establecer la persistencia local de auth:', pErr);
    }
    auth.languageCode = 'es';
    if (typeof window !== 'undefined') window.auth = auth;

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
          if (firestoreError?.message?.includes('has already been called')) {
            db = getFirestore(app);
            console.warn('â„¹ï¸ Firestore ya estaba inicializado, usando instancia existente');
          } else {
            try {
              db = initializeFirestore(app, {
                experimentalForceLongPolling: true,
                ignoreUndefinedProperties: true,
                localCache: memoryLocalCache(),
              });
            } catch (_e3) {
              console.error('âŒ Error al inicializar Firestore:', firestoreError);
              throw new Error(`Error al inicializar Firestore: ${firestoreError.message}`);
            }
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
      console.warn('No se pudo configurar el emulador:', emulatorError);
    }

    // Probar conectividad: solo lectura para no requerir auth
    const ok = await probarConexionFirestore();
    if (!ok) {
      if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
        window.mostrarErrorUsuario(
          'Modo sin conexiÃ³n - Los cambios se sincronizarÃ¡n cuando se recupere la conexiÃ³n',
          10000
        );
      }
    }

    // Analytics en producciÃ³n
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        const soporteAnalytics = await isSupported();
        if (soporteAnalytics) {
          analytics = getAnalytics(app);
        }
      } catch (error) {
        console.warn('Error al inicializar Analytics:', error);
      }
    }

    // Listener de conexiÃ³n
    configurarListenerConexion();
  } catch (error) {
    console.error('Error al inicializar Firebase:', error);
    if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
      window.mostrarErrorUsuario(
        'Error al conectar con el servidor. La aplicaciÃ³n funcionarÃ¡ en modo fuera de lÃ­nea.',
        0
      );
    }
    throw error;
  }
};

// Al importar este mÃ³dulo iniciamos Firebase y exportamos la promesa
const firebaseReady = FIREBASE_CONFIGURED
  ? inicializarFirebase().catch((error) => {
      console.error('Error crÃ­tico al inicializar Firebase:', error);
      throw error;
    })
  : Promise.resolve();

const getFirebaseAuth = () => auth;

export { auth, db, analytics, firebaseReady, getFirebaseAuth };

