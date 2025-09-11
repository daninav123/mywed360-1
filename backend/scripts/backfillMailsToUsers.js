// Backfill script: copy global mails into per-user subcollections
// Usage:
//   node backend/scripts/backfillMailsToUsers.js [--dry-run] [--limit=N]
// Notes:
//   - Resolves user by users.myWed360Email == (to|from) or users.email == (to|from)
//   - Inbox mails are stored under recipient (to); Sent under sender (from)
//   - Adds id field to user doc for consistency

import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;

async function resolveUidByEmail(email) {
  if (!email) return null;
  try {
    const byAlias = await db.collection('users').where('myWed360Email', '==', email).limit(1).get();
    if (!byAlias.empty) return byAlias.docs[0].id;
    const byLogin = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!byLogin.empty) return byLogin.docs[0].id;
  } catch {}
  return null;
}

async function backfillBatch() {
  // Fetch mails without user subdoc awareness; we copy as best-effort
  const snap = await db.collection('mails').limit(LIMIT).get();
  let processed = 0;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const folder = data.folder || 'inbox';
    const targetEmail = (folder === 'sent') ? data.from : data.to;
    if (!targetEmail) continue;
    const uid = await resolveUidByEmail(targetEmail);
    if (!uid) continue;
    const payload = {
      id: doc.id,
      from: data.from || '',
      to: data.to || '',
      subject: data.subject || '',
      body: data.body || '',
      date: data.date || new Date().toISOString(),
      folder,
      read: Boolean(data.read),
      via: data.via || 'backfill'
    };
    if (dryRun) {
      console.log(`[dry-run] users/${uid}/mails/${doc.id}`);
    } else {
      await db.collection('users').doc(uid).collection('mails').doc(doc.id).set(payload, { merge: true });
    }
    processed++;
  }
  return processed;
}

async function main() {
  console.log(`Starting backfill (limit=${LIMIT}, dryRun=${dryRun})`);
  const count = await backfillBatch();
  console.log(`Backfill done. Processed: ${count}`);
}

main().catch((e) => {
  console.error('Backfill error:', e);
  process.exit(1);
});

