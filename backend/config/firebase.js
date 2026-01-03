/**
 * Configuración de Firebase Admin para el backend
 * Firebase está DESHABILITADO - Se usa solo PostgreSQL
 */

// Firebase está deshabilitado cuando USE_FIREBASE=false
const USE_FIREBASE = process.env.USE_FIREBASE !== 'false';

let admin = null;
let db = null;
let FieldValue = null;
let Timestamp = null;
let auth = null;

if (USE_FIREBASE) {
  console.log('⚠️ Firebase habilitado en config/firebase.js');
  const firebaseAdmin = await import('firebase-admin');
  const { getFirestore } = await import('firebase-admin/firestore');
  admin = firebaseAdmin.default;
  
  if (admin && admin.apps && admin.apps.length > 0) {
    db = getFirestore();
    FieldValue = admin.firestore.FieldValue;
    Timestamp = admin.firestore.Timestamp;
    auth = admin.auth();
  }
} else {
  console.log('✅ Firebase deshabilitado en config/firebase.js - usando PostgreSQL');
}

export { admin, db, FieldValue, Timestamp, auth };

export default {
  db,
  FieldValue,
  Timestamp,
  auth,
};
