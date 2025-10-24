#!/usr/bin/env node
/**
 * RSVP Scheduler (manual/cron)
 * - Recorre bodas y ejecuta el endpoint protegido /api/rsvp/reminders por cada una.
 * - Usa un token mock (Bearer mock-<uid>-<email>) y asegura rol planner vía /api/rsvp/dev/ensure-planner.
 * - Por defecto dryRun=true (no envía emails reales, deja trazas en BD si no hay Mailgun).
 *
 * Uso:
 *   node scripts/rsvpScheduler.js --dryRun=true --limit=50 --minIntervalMinutes=1440
 * Vars:
 *   VITE_BACKEND_BASE_URL / BACKEND_BASE_URL  (p. ej. http://localhost:4004)
 */

import 'dotenv/config';
import admin from 'firebase-admin';

const BACKEND = process.env.VITE_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL || 'http://localhost:4004';
const AUTH = 'Bearer mock-scheduler-scheduler@maloveapp.com';

// Inicializar Admin (Application Default Credentials o variables de entorno)
if (!admin.apps.length) {
  try { admin.initializeApp({ credential: admin.credential.applicationDefault() }); }
  catch (e) { console.warn('[rsvpScheduler] Firebase Admin init:', e?.message || e); }
}

const db = admin.firestore();

function parseArgs() {
  const out = { dryRun: true, limit: 100, minIntervalMinutes: 1440, force: false };
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1];
    const v = m[2];
    if (k === 'dryRun') out.dryRun = v !== 'false';
    else if (k === 'limit') out.limit = parseInt(v, 10) || out.limit;
    else if (k === 'minIntervalMinutes') out.minIntervalMinutes = parseInt(v, 10) || out.minIntervalMinutes;
    else if (k === 'force') out.force = v === 'true';
  }
  return out;
}

async function getWeddingIdsOrFallback() {
  // 1) Intentar listar bodas desde Firestore Admin
  try {
    const snap = await db.collection('weddings').limit(50).get();
    const ids = snap.docs.map((d) => d.id);
    if (ids.length) return ids;
  } catch (e) {
    console.warn('[rsvpScheduler] Firestore list weddings failed:', e?.message || e);
  }

  // 2) Fallback por variables de entorno (coma-separadas)
  const envList = process.env.SCHEDULER_WEDDINGS || process.env.FALLBACK_WEDDINGS || '';
  const ids = envList.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length) {
    console.log('[rsvpScheduler] Using fallback weddings from env:', ids);
    return ids;
  }

  console.log('[rsvpScheduler] No weddings found (firestore/env)');
  return [];
}

async function callEnsurePlanner() {
  try {
    const res = await fetch(`${BACKEND}/api/rsvp/dev/ensure-planner`, {
      method: 'POST', headers: { Authorization: AUTH }
    });
    if (!res.ok) console.warn('[ensure-planner] status', res.status);
  } catch (e) { console.warn('[ensure-planner] error', e?.message || e); }
}

async function callReminders(weddingId, opts) {
  const body = JSON.stringify({ weddingId, ...opts });
  const res = await fetch(`${BACKEND}/api/rsvp/reminders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: AUTH }, body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`[reminders][${weddingId}]`, res.status, data?.error || data);
  } else {
    console.log(`[reminders][${weddingId}] ok`, data);
  }
}

async function main() {
  const opts = parseArgs();
  console.log('[rsvpScheduler] BACKEND =', BACKEND, 'opts =', opts);
  await callEnsurePlanner();

  // Obtener bodas: Firestore o fallback por entorno
  const weddingIds = await getWeddingIdsOrFallback();
  if (weddingIds.length === 0) { console.log('[rsvpScheduler] No weddings to process'); return; }

  for (const weddingId of weddingIds) {
    await callReminders(weddingId, opts);
  }
}

main().catch((e) => { console.error('[rsvpScheduler] fatal', e); process.exitCode = 1; });
