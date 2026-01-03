// scripts/backfillUserWeddings.js
// Uso: node scripts/backfillUserWeddings.js [--credentials path/to/serviceAccount.json]
// Recorre todas las bodas existentes y crea/actualiza la subcolección
// users/{uid}/weddings/{weddingId} para cada usuario que figure en ownerIds, plannerIds o assistantIds.

const admin = require('firebase-admin');
const { argv } = require('process');
const fs = require('fs');
const path = require('path');
const os = require('os');

let credentialPath;
// 1. CLI flag
for (let i = 2; i < argv.length; i++) {
  if (argv[i] === '--credentials' && argv[i + 1]) {
    credentialPath = argv[i + 1];
    break;
  }
}
// 2. Variable de entorno estándar
if (!credentialPath && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
}
// 3. Ruta por defecto en Windows Downloads
if (!credentialPath) {
  const candidateDirs = ['Download', 'Downloads'];
  for (const dir of candidateDirs) {
    const p = path.join(os.homedir(), dir, 'serviceAccount.json');
    if (fs.existsSync(p)) {
      credentialPath = p;
      break;
    }
  }
}

if (!admin.apps.length) {
  if (credentialPath) {
    admin.initializeApp({
      credential: admin.credential.cert(require(path.resolve(credentialPath)))
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

(async () => {
  console.log('Backfilling user wedding subcollections...');
  const weddingsSnap = await db.collection('weddings').get();
  const batch = db.batch();
  let ops = 0;

  weddingsSnap.forEach(docSnap => {
    const data = docSnap.data();
    const weddingId = docSnap.id;
    const roles = [
      { key: 'ownerIds', role: 'owner' },
      { key: 'plannerIds', role: 'planner' },
      { key: 'assistantIds', role: 'assistant' }
    ];

    roles.forEach(({ key, role }) => {
      (data[key] || []).forEach(uid => {
        // 1) Crear/actualizar subcolección del usuario
        const ref = db.collection('users').doc(uid).collection('weddings').doc(weddingId);
        batch.set(ref, {
          name: data.name || 'Boda',
          roles: admin.firestore.FieldValue.arrayUnion(role),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        ops++;

        // 2) Asegurar que el usuario figura en el array correspondiente dentro del documento de la boda
        const weddingRef = db.collection('weddings').doc(weddingId);
        batch.set(weddingRef, {
          [key]: admin.firestore.FieldValue.arrayUnion(uid),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        ops++;
        if (ops >= 400) { // Firestore batch limita a 500
          batch.commit();
          ops = 0;
        }
      });
    });
  });

  if (ops) await batch.commit();
  console.log('Backfill completado.');
  process.exit(0);
})();
