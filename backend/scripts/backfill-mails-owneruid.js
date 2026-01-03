#!/usr/bin/env node
/**
 * Backfill script: enlaza mails globales a usuarios específicos por ownerUid
 * 
 * - Busca mails sin ownerUid en colección global 'mails'
 * - Resuelve UID por maLoveEmail, myWed360Email o email del destinatario (inbox) o remitente (sent)
 * - Actualiza mail con ownerUid en colección global
 * - Copia mail a subcol users/{uid}/mails
 * 
 * Uso:
 *   node backend/scripts/backfill-mails-owneruid.js [--dry-run] [--limit=N]
 */

import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 1000;

const userCache = new Map();

async function resolveUidByEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  if (!normalized) return null;
  
  if (userCache.has(normalized)) {
    return userCache.get(normalized);
  }

  try {
    // 1. maLoveEmail (nuevo sistema de buzones compartidos)
    let snap = await db.collection('users').where('maLoveEmail', '==', normalized).limit(1).get();
    if (!snap.empty) {
      const uid = snap.docs[0].id;
      userCache.set(normalized, uid);
      return uid;
    }

    // 2. myWed360Email (legacy)
    snap = await db.collection('users').where('myWed360Email', '==', normalized).limit(1).get();
    if (!snap.empty) {
      const uid = snap.docs[0].id;
      userCache.set(normalized, uid);
      return uid;
    }

    // 3. email (login)
    snap = await db.collection('users').where('email', '==', normalized).limit(1).get();
    if (!snap.empty) {
      const uid = snap.docs[0].id;
      userCache.set(normalized, uid);
      return uid;
    }
  } catch (err) {
    console.warn(`[resolveUidByEmail] Error buscando ${normalized}:`, err?.message || err);
  }

  userCache.set(normalized, null);
  return null;
}

async function backfillMails() {
  console.log(`🔍 [Backfill] Buscando hasta ${LIMIT} mails sin ownerUid...`);
  
  let query = db.collection('mails').limit(LIMIT);
  const snap = await query.get();
  
  console.log(`📧 [Backfill] Encontrados ${snap.docs.length} mails en total, filtrando sin ownerUid...`);
  
  let processed = 0;
  let linked = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    
    // Si ya tiene ownerUid, saltar
    if (data.ownerUid && String(data.ownerUid).trim()) {
      skipped++;
      continue;
    }

    processed++;
    const mailId = doc.id;
    const folder = data.folder || 'inbox';
    
    // Determinar email objetivo según carpeta
    const targetEmail = folder === 'sent' ? data.from : data.to;
    
    if (!targetEmail) {
      console.log(`⚠️  [${mailId}] Sin email objetivo (folder=${folder})`);
      continue;
    }

    // Resolver UID
    const uid = await resolveUidByEmail(targetEmail);
    
    if (!uid) {
      console.log(`❌ [${mailId}] No se pudo resolver UID para ${targetEmail}`);
      continue;
    }

    if (dryRun) {
      console.log(`[DRY-RUN] ${mailId} -> user ${uid} (${targetEmail})`);
      linked++;
      continue;
    }

    try {
      // 1. Actualizar mail global con ownerUid
      await db.collection('mails').doc(mailId).set(
        {
          ownerUid: uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Copiar a subcol users/{uid}/mails
      await db
        .collection('users')
        .doc(uid)
        .collection('mails')
        .doc(mailId)
        .set(
          {
            id: mailId,
            from: data.from || '',
            to: data.to || '',
            subject: data.subject || '',
            body: data.body || '',
            date: data.date || new Date().toISOString(),
            folder,
            read: Boolean(data.read),
            via: data.via || 'backfill',
            ownerUid: uid,
            linkedQuoteRequestId: data.linkedQuoteRequestId || null,
            linkedQuoteResponseId: data.linkedQuoteResponseId || null,
            weddingId: data.weddingId || null,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      linked++;
      console.log(`✅ [${mailId}] Enlazado a user ${uid} (${targetEmail})`);
    } catch (err) {
      console.error(`❌ [${mailId}] Error enlazando:`, err?.message || err);
    }
  }

  console.log(`\n📊 [Backfill] Resumen:`);
  console.log(`   - Total revisados: ${snap.docs.length}`);
  console.log(`   - Sin ownerUid procesados: ${processed}`);
  console.log(`   - Enlaces creados: ${linked}`);
  console.log(`   - Ya enlazados (skipped): ${skipped}`);
  console.log(`   - Modo: ${dryRun ? 'DRY-RUN' : 'REAL'}`);
}

async function main() {
  console.log(`\n🚀 [Backfill] Iniciando backfill de mails...`);
  console.log(`   - Límite: ${LIMIT} mails`);
  console.log(`   - Modo: ${dryRun ? 'DRY-RUN (no escribe)' : 'REAL (escribe en BD)'}`);
  console.log('');
  
  await backfillMails();
  
  console.log(`\n✅ [Backfill] Completado.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ [Backfill] Error fatal:', err);
  process.exit(1);
});
