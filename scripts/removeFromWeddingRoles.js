#!/usr/bin/env node
/**
 * removeFromWeddingRoles.js
 * ---------------------------------------------------------
 * Elimina un UID de ownerIds, plannerIds y assistantIds de una boda.
 * Además elimina el enlace users/{uid}/weddings/{weddingId} si existe.
 * Uso:
 *   node scripts/removeFromWeddingRoles.js <weddingId> <uid> [--credentials C:\ruta\serviceAccount.json]
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

async function removeFromWeddingRoles(weddingId, uid) {
  if (!uid || !weddingId) {
    console.error('❌ Debes proporcionar weddingId y uid.');
    process.exit(1);
  }
  const wedRef = db.collection('weddings').doc(weddingId);
  const wedSnap = await wedRef.get();
  if (!wedSnap.exists) {
    console.error(`❌ La boda ${weddingId} no existe.`);
    process.exit(2);
  }

  await wedRef.update({
    ownerIds: admin.firestore.FieldValue.arrayRemove(uid),
    plannerIds: admin.firestore.FieldValue.arrayRemove(uid),
    assistantIds: admin.firestore.FieldValue.arrayRemove(uid),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`✅ UID ${uid} eliminado de todos los roles en la boda ${weddingId}`);

  // Borrar enlace users/{uid}/weddings/{weddingId} si existe
  const linkRef = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
  const linkSnap = await linkRef.get();
  if (linkSnap.exists) {
    await linkRef.delete();
    console.log(`🗑️  Eliminado enlace users/${uid}/weddings/${weddingId}`);
  } else {
    console.log(`ℹ️  No había enlace users/${uid}/weddings/${weddingId}`);
  }
}

(async () => {
  // Extraer args ignorando flag --credentials
  const args = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--credentials') { i++; continue; }
    args.push(process.argv[i]);
  }
  const [weddingId, uid] = args;
  await removeFromWeddingRoles(weddingId, uid);
  process.exit(0);
})().catch((err) => {
  console.error('❌ Error eliminando roles:', err);
  process.exit(1);
});
