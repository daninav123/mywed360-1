#!/usr/bin/env node
/**
 * Limpia eventos antiguos de projectMetrics_events que ya están processed:true
 * Retención por defecto: 30 días (configurable via --days=N)
 */
const admin = require('firebase-admin');

(async function main(){
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const days = daysArg ? Number(daysArg.split('=')[1]) : 30;
    const keepMs = Math.max(1, days) * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
    const db = admin.firestore();

    // Seleccionar ventana temporal aproximada usando receivedAt/eventAt si existe
    const cutoffTs = new Date(now - keepMs);

    const col = db.collection('projectMetrics_events');
    const snap = await col.limit(2000).get();

    let toDelete = [];
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      if (!d.processed) continue;
      const when = (d.eventAt && d.eventAt.toDate) ? d.eventAt.toDate() : ((d.receivedAt && d.receivedAt.toDate) ? d.receivedAt.toDate() : null);
      if (!when) continue;
      if (when < cutoffTs) toDelete.push(doc.ref);
      if (toDelete.length >= 450) {
        const batch = db.batch();
        for (const ref of toDelete) batch.delete(ref);
        await batch.commit();
        toDelete = [];
      }
    }
    if (toDelete.length) {
      const batch = db.batch();
      for (const ref of toDelete) batch.delete(ref);
      await batch.commit();
    }

    console.log(`[cleanupProjectMetricsEvents] Limpieza completada. Retención: ${days} días.`);
    process.exit(0);
  } catch (e) {
    console.error('[cleanupProjectMetricsEvents] Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
