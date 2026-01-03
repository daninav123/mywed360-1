import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch {}
}

function dateId(ts) {
  const d = ts instanceof Date ? ts : (ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date());
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function processMetricEvents(limit = 200) {
  const db = admin.firestore();
  const q = await db.collection('projectMetrics_events').where('processed', '==', false).limit(limit).get();
  if (q.empty) return { processed: 0 };
  const batch = db.batch();
  let count = 0;
  for (const doc of q.docs) {
    try {
      const data = doc.data() || {};
      const wid = String(data.weddingId || '').trim();
      const mod = String(data.module || '').trim();
      const ev = String(data.event || '').trim();
      if (!wid || !mod || !ev) {
        batch.update(doc.ref, { processed: true });
        count += 1;
        continue;
      }
      const when = data.eventAt || data.receivedAt || admin.firestore.Timestamp.fromDate(new Date());
      const day = dateId(when);
      const dailyRef = db.collection('projectMetrics').doc(wid).collection('modules').doc(mod).collection('daily').doc(day);
      const incAlerts = ev === 'budget_over_threshold' ? 1 : 0;
      const incErrors = ev.startsWith('error') || ev === 'email_bounced' ? 1 : 0;
      batch.set(
        dailyRef,
        {
          totals: {
            events: admin.firestore.FieldValue.increment(1),
            alerts: admin.firestore.FieldValue.increment(incAlerts),
            errors: admin.firestore.FieldValue.increment(incErrors),
          },
          breakdown: { [ev]: admin.firestore.FieldValue.increment(1) },
          metadata: {
            computedAt: admin.firestore.FieldValue.serverTimestamp(),
            version: '2025.10.1',
          },
        },
        { merge: true }
      );
      batch.update(doc.ref, { processed: true });
      count += 1;
    } catch {}
  }
  try { await batch.commit(); } catch {}
  return { processed: count };
}

function intervalMs() {
  const raw = process.env.METRICS_AGGREGATOR_INTERVAL_MS;
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return n;
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  return isProd ? 15 * 60 * 1000 : 60 * 1000;
}

let timer = null;
export function startMetricAggregatorWorker() {
  if (timer) return;
  const run = async () => {
    try { await processMetricEvents(200); } catch {}
  };
  timer = setInterval(run, intervalMs());
  try { run(); } catch {}
}

export { processMetricEvents };
