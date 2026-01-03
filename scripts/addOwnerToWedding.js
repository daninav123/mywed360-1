#!/usr/bin/env node
/**
 * addOwnerToWedding.js
 * ---------------------------------------------------------
 * Añade un UID al array ownerIds de una boda concreta.
 * Uso:
 *   node scripts/addOwnerToWedding.js <uid> <weddingId>
 * Ejemplo:
 *   node scripts/addOwnerToWedding.js 9EstYa0T8WRBm9j0XwnE8zU1iFo1 61ffb907-7fcb-4361-b764-0300b317fe06
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const admin = require('firebase-admin');

// --- Resolución flexible de ruta al serviceAccount.json ---
let credentialPath;
// 1. Flag CLI --credentials <ruta>
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--credentials' && process.argv[i + 1]) {
    credentialPath = process.argv[i + 1];
    break;
  }
}
// 2. Variable de entorno estándar
if (!credentialPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
// 3. Búsqueda en carpeta Downloads del usuario
if (!credentialPath) {
  const dirs = ['Downloads', 'Download'];
  for (const dir of dirs) {
    const candidate = path.join(os.homedir(), dir, 'serviceAccount.json');
    if (fs.existsSync(candidate)) {
      credentialPath = candidate;
      break;
    }
  }
}
// Inicializar Firebase Admin
if (!admin.apps.length) {
  if (credentialPath) {
    admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(credentialPath))) });
    console.log('✅ Firebase Admin inicializado con', credentialPath);
  } else {
    console.warn('⚠️ No se proporcionó clave de servicio; usando configuración por defecto');
    admin.initializeApp();
  }
}
const db = admin.firestore();

async function addOwner(uid, weddingId) {
  if (!uid || !weddingId) {
    console.error('❌ Debes proporcionar UID y weddingId.');
    process.exit(1);
  }
  const wedRef = db.collection('weddings').doc(weddingId);
  const wedSnap = await wedRef.get();
  if (!wedSnap.exists) {
    console.error(`❌ La boda ${weddingId} no existe.`);
    process.exit(1);
  }
  const data = wedSnap.data() || {};
  await wedRef.update({ ownerIds: admin.firestore.FieldValue.arrayUnion(uid) });
  console.log(`✅ UID ${uid} añadido a ownerIds de la boda ${weddingId}`);

  // Backfill de subcolección users/{uid}/weddings/{weddingId}
  const userWedRef = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
  await userWedRef.set({
    name: data.name || 'Boda',
    roles: admin.firestore.FieldValue.arrayUnion('owner'),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`✅ Backfill creado/actualizado en users/${uid}/weddings/${weddingId}`);
}

(async () => {
  // Extraer argumentos (uid, weddingId) ignorando flags --credentials
  const args = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--credentials') { i++; continue; }
    args.push(process.argv[i]);
  }
  const [uid, weddingId] = args;
  await addOwner(uid, weddingId);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Error al añadir owner:', err);
  process.exit(1);
});
