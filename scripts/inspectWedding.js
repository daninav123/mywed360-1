#!/usr/bin/env node
/**
 * inspectWedding.js
 * ---------------------------------------------------------
 * Inspecciona un documento de boda y su subcolección de invitados.
 * Uso:
 *   node scripts/inspectWedding.js <weddingId> [uid]
 * Opcional:
 *   --credentials C:\ruta\a\serviceAccount.json
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

(async () => {
  // Extraer args ignorando flag --credentials
  const args = [];
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--credentials') { i++; continue; }
    args.push(process.argv[i]);
  }
  const [weddingId, uid] = args;
  if (!weddingId) {
    console.error('❌ Debes proporcionar weddingId.');
    process.exit(1);
  }

  const wedRef = db.collection('weddings').doc(weddingId);
  const wedSnap = await wedRef.get();
  if (!wedSnap.exists) {
    console.error(`❌ La boda ${weddingId} no existe en Firestore.`);
    process.exit(2);
  }
  const data = wedSnap.data() || {};
  console.log('📄 Wedding:', weddingId);
  console.log('  name        :', data.name || '(sin nombre)');
  console.log('  ownerIds    :', data.ownerIds || []);
  console.log('  plannerIds  :', data.plannerIds || []);
  console.log('  assistantIds:', data.assistantIds || []);
  if (uid) {
    const isOwner = Array.isArray(data.ownerIds) && data.ownerIds.includes(uid);
    const isPlanner = Array.isArray(data.plannerIds) && data.plannerIds.includes(uid);
    const isAssistant = Array.isArray(data.assistantIds) && data.assistantIds.includes(uid);
    console.log(`  ➤ Roles para ${uid}:`, { isOwner, isPlanner, isAssistant });
  }

  // Contar invitados
  const guestsSnap = await wedRef.collection('guests').limit(5).get();
  const totalGuestsSnap = await wedRef.collection('guests').count().get().catch(() => null);
  const total = totalGuestsSnap?.data()?.count ?? null;
  console.log('👥 Invitados:' , total !== null ? `total=${total}` : `(conteo rápido no disponible)`);
  guestsSnap.docs.forEach((d, i) => {
    const g = d.data();
    console.log(`   [${i+1}] ${d.id} ->`, { name: g.name || g.fullName || g.email || '(sin nombre)' });
  });

  // Comprobar backfill en users/{uid}/weddings/{weddingId}
  if (uid) {
    const uRef = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
    const uSnap = await uRef.get();
    console.log(`📂 users/${uid}/weddings/${weddingId}:`, uSnap.exists ? (uSnap.data()) : '(no existe)');
  }
  process.exit(0);
})().catch(err => {
  console.error('❌ Error inspeccionando boda:', err);
  process.exit(1);
});
