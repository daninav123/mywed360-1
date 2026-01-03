#!/usr/bin/env node
/**
 * linkUserWedding.js
 * ---------------------------------------------------------
 * Crea/actualiza el enlace users/{uid}/weddings/{weddingId}
 * sin tocar los arrays de roles de la boda.
 * Uso:
 *   node scripts/linkUserWedding.js <uid> <weddingId> [--credentials C:\ruta\serviceAccount.json]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const admin = require('firebase-admin');

// --- Resolución flexible de ruta al serviceAccount.json ---
let credentialPath;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--credentials' && process.argv[i + 1]) {
    credentialPath = process.argv[i + 1];
    break;
  }
}
if (!credentialPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
if (!credentialPath) {
  const dirs = ['Downloads', 'Download'];
  for (const dir of dirs) {
    const candidate = path.join(os.homedir(), dir, 'serviceAccount.json');
    if (fs.existsSync(candidate)) { credentialPath = candidate; break; }
  }
}

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

async function linkUserWedding(uid, weddingId) {
  if (!uid || !weddingId) {
    console.error('❌ Debes proporcionar UID y weddingId.');
    process.exit(1);
  }
  const wedRef = db.collection('weddings').doc(weddingId);
  const wedSnap = await wedRef.get();
  if (!wedSnap.exists) {
    console.error(`❌ La boda ${weddingId} no existe.`);
    process.exit(2);
  }
  const data = wedSnap.data() || {};

  const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
  await ref.set({
    name: data.name || 'Boda',
    roles: admin.firestore.FieldValue.arrayUnion('owner'),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`✅ Enlace creado/actualizado: users/${uid}/weddings/${weddingId}`);
}

(async () => {
  // Extraer args ignorando flag --credentials
  const args = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--credentials') { i++; continue; }
    args.push(process.argv[i]);
  }
  const [uid, weddingId] = args;
  await linkUserWedding(uid, weddingId);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Error creando enlace:', err);
  process.exit(1);
});
