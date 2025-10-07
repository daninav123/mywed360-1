#!/usr/bin/env node
/**
 * Migración: raíz `guests` -> canónico `weddings/{weddingId}/guests/{token}`
 *
 * Uso:
 *   node scripts/migrate-guests-to-canonical.js [--dry-run] [--remove-root]
 *
 * Requisitos:
 *   - GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_SERVICE_ACCOUNT_KEY (JSON/base64)
 */
import admin from 'firebase-admin';

function getArg(name, def = false) {
  return process.argv.some((a) => a === name) ? true : def;
}

function redact(v) {
  if (!v) return 'NOT_SET';
  return String(v).slice(0, 6) + '…';
}

async function initAdmin() {
  if (admin.apps.length) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let obj = null;
    try { obj = JSON.parse(raw); } catch { try { obj = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch {} }
    if (obj) {
      admin.initializeApp({ credential: admin.credential.cert(obj) });
      return;
    }
  }
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

async function main() {
  const dryRun = getArg('--dry-run');
  const removeRoot = getArg('--remove-root');

  await initAdmin();
  const db = admin.firestore();

  console.log('[migrate] starting', { dryRun, removeRoot, project: process.env.FIREBASE_PROJECT_ID || 'unknown' });

  const rootSnap = await db.collection('guests').get();
  console.log('[migrate] root guests:', rootSnap.size);

  let migrated = 0;
  for (const doc of rootSnap.docs) {
    const data = doc.data() || {};
    const token = data.token || doc.id;
    const weddingId = data.eventId || data.weddingId || 'default';
    const targetRef = db.collection('weddings').doc(String(weddingId)).collection('guests').doc(String(token));

    if (dryRun) {
      console.log('[migrate] would write', targetRef.path, { name: data.name, email: data.email, status: data.status });
    } else {
      await targetRef.set({ ...data, migratedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      migrated += 1;
      if (removeRoot) {
        await doc.ref.delete();
      }
    }
  }

  console.log('[migrate] done', { migrated, removedRoot: removeRoot && !dryRun });
}

main().catch((err) => {
  console.error('[migrate] error', err);
  process.exit(1);
});

