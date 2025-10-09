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
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';

// Configuración de Firebase desde variables de entorno (sin secretos hard-coded)
const firebaseConfig = {
  apiKey: import.meta?.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta?.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta?.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta?.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta?.env?.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta?.env?.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

if (typeof window !== 'undefined') {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // Aviso en consola para facilitar configuración local
    // No expone valores; solo lista claves faltantes
    console.warn('[firebaseConfig] Variables VITE_* faltantes:', missing.join(', '));
  }
}

// Variables globales de Firebase
let app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: 50 * 1024 * 1024,
  ignoreUndefinedProperties: true,
});
let auth;
let analytics;

// Prueba la conexión con Firestore con reintentos
const probarConexionFirestore = async (maxReintentos = 2) => {
  for (let intento = 0; intento <= maxReintentos; intento++) {
    try {
      const docPrueba = doc(db, '_conexion_prueba', 'test');
      await setDoc(
        docPrueba,
        { timestamp: new Date().toISOString(), intento: intento + 1 },
        { merge: true }
      );
      return true;
    } catch (error) {
      if (intento === maxReintentos) throw error;
      await new Promise((resolver) => setTimeout(resolver, 1000 * Math.pow(2, intento)));
    }
  }
  return false;
};

// Listener de estado de conexión (opcional)
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
    console.warn('No se pudo configurar el listener de conexión:', error);
  }
};

// Inicializa los servicios de Firebase
const inicializarFirebase = async () => {
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
          cacheSizeBytes: 50 * 1024 * 1024,
          ignoreUndefinedProperties: true,
        });
      } catch (firestoreError) {
        if (firestoreError?.message?.includes('has already been called')) {
          db = getFirestore(app);
          console.warn('ℹ️ Firestore ya estaba inicializado, usando instancia existente');
        } else {
          console.error('❌ Error al inicializar Firestore:', firestoreError);
          throw new Error(`Error al inicializar Firestore: ${firestoreError.message}`);
        }
      }
    }

    // Persistencia offline
    try {
      if (typeof enableMultiTabIndexedDbPersistence === 'function') {
        await enableMultiTabIndexedDbPersistence(db);
      } else {
        await enableIndexedDbPersistence(db);
      }
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.warn(
          'No se pudo habilitar multi‑tab (otra pestaña es dueña). Intentando modo single‑tab...'
        );
        try {
          await enableIndexedDbPersistence(db);
        } catch {}
      } else if (err.code === 'unimplemented') {
        console.warn('Este navegador no soporta persistencia offline');
      } else {
        console.error('Error al habilitar persistencia offline:', err);
      }
    }

    // Emulador (info)
    try {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (emulatorError) {
      console.warn('No se pudo configurar el emulador:', emulatorError);
    }

    // Probar conexión y prueba de escritura
    try {
      await probarConexionFirestore();
      try {
        const testDoc = doc(db, '_test_connection', 'test');
        await setDoc(testDoc, { test: new Date().toISOString() }, { merge: true });
      } catch (writeError) {
        let errorMsg = 'Error al escribir en Firestore';
        if (writeError.code === 'permission-denied') {
          errorMsg = 'Error de permisos: No tienes acceso a la base de datos.';
        } else if (writeError.code === 'unavailable') {
          errorMsg = 'Servidor de Firebase no disponible. Verifica tu conexión a internet.';
        } else {
          errorMsg = `Error al acceder a Firestore: ${writeError.message}`;
        }
        if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
          window.mostrarErrorUsuario(errorMsg, 10000);
        }
      }
    } catch (error) {
      let errorMsg =
        'Modo sin conexión - Los cambios se sincronizarán cuando se recupere la conexión';
      if (error.code === 'unavailable') {
        errorMsg = 'Firebase no disponible. Verifica tu conexión a internet.';
      } else if (error.message && error.message.includes('network')) {
        errorMsg = 'Problemas de red al conectar con Firebase.';
      }
      if (typeof window !== 'undefined' && window.mostrarErrorUsuario) {
        window.mostrarErrorUsuario(errorMsg, 10000);
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
        console.warn('Error al inicializar Analytics:', error);
      }
    }

    // Listener de conexión
    configurarListenerConexion();
  } catch (error) {
    console.error('Error al inicializar Firebase:', error);
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
const firebaseReady = inicializarFirebase().catch((error) => {
  console.error('Error crítico al inicializar Firebase:', error);
  throw error;
});

const getFirebaseAuth = () => auth;

export { auth, db, analytics, firebaseReady, getFirebaseAuth };
