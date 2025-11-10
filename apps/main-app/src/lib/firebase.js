// Reexporte unificado de Firebase para evitar múltiples instancias
// Todas las partes del frontend deben importar desde este archivo o desde src/firebaseConfig.js
// para compartir la misma app de Firebase.

export { auth, db, storage, analytics, firebaseReady } from '../firebaseConfig';
