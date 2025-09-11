// Fix "from" field for legacy mails that were stored with a placeholder sender
// Usage examples:
//   node backend/scripts/fixMailFrom.js --toEmail=dani@mywed360.com --setFrom=dani@mywed360.com
//   node backend/scripts/fixMailFrom.js --domain=mywed360.com --setFromDefault=no-reply@mywed360.com --dry
// Notes:
// - If --toEmail is provided, only updates mails where to == toEmail and from == 'yo@lovenda.app'
// - If --domain is provided, updates mails where to endsWith('@<domain>') and from == 'yo@lovenda.app'
// - Will also try to update users/{uid}/mails/{id} when the owner can be resolved by myWed360Email or email

import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db.js';

function argVal(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

const toEmail = argVal('toEmail');
const domain = argVal('domain');
const setFrom = argVal('setFrom');
const setFromDefault = argVal('setFromDefault') || setFrom;
const dry = process.argv.includes('--dry');

if (!toEmail && !domain) {
  console.error('Provide --toEmail=<addr> or --domain=<domain>');
  process.exit(1);
}
if (!setFrom && !setFromDefault) {
  console.error('Provide --setFrom=<addr> or --setFromDefault=<addr>');
  process.exit(1);
}

function shouldFix(doc) {
  const d = doc.data() || {};
  if (d.folder !== 'inbox') return false;
  if (d.from !== 'yo@lovenda.app') return false;
  if (toEmail) return (d.to === toEmail);
  if (domain) return (typeof d.to === 'string' && d.to.endsWith(`@${domain}`));
  return false;
}

async function resolveUidByEmail(email) {
  try {
    const byAlias = await db.collection('users').where('myWed360Email', '==', email).limit(1).get();
    if (!byAlias.empty) return byAlias.docs[0].id;
    const byLogin = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!byLogin.empty) return byLogin.docs[0].id;
  } catch {}
  return null;
}

async function main() {
  const snap = await db.collection('mails').get();
  let updates = 0;
  for (const doc of snap.docs) {
    if (!shouldFix(doc)) continue;
    const d = doc.data();
    const newFrom = setFrom || setFromDefault;
    if (dry) {
      console.log(`[dry] would update ${doc.id}: from ${d.from} -> ${newFrom}`);
      updates++;
      continue;
    }
    await db.collection('mails').doc(doc.id).update({ from: newFrom });
    updates++;
    // Update user subcollection copy if owner can be resolved
    const ownerUid = await resolveUidByEmail(d.to);
    if (ownerUid) {
      try {
        await db.collection('users').doc(ownerUid).collection('mails').doc(doc.id).set({ from: newFrom }, { merge: true });
      } catch {}
    }
  }
  console.log(`Done. Updated ${updates} documents${dry ? ' (dry-run)' : ''}.`);
}

main().catch(e => { console.error(e); process.exit(1); });

