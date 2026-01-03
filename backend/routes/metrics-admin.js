import express from 'express';
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Admin metrics API
// Mounted at /api/admin/metrics with ipAllowlist + requireAdmin in index.js
const router = express.Router();

// Helper: read last N lines from a file (best-effort)
function readLastLines(filePath, maxLines = 500) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split(/\r?\n/).filter(Boolean);
    return lines.slice(-maxLines);
  } catch {
    return [];
  }
}

// In-memory buffer for recent ingested metrics
const recent = [];
const MAX_RECENT = 500;

// Ensure logs dir for persistence
const logsDir = path.resolve(process.cwd(), 'logs');
try { fs.mkdirSync(logsDir, { recursive: true }); } catch {}
const metricsLogPath = path.join(logsDir, 'metrics.jsonl');

// POST /api/admin/metrics
router.post('/', async (req, res) => {
  try {
    const { timestamp, appVersion, metrics } = req.body || {};
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ error: 'invalid-payload' });
    }

    const payload = {
      ts: Number(timestamp || Date.now()),
      appVersion: String(appVersion || 'unknown'),
      metrics,
      receivedAt: Date.now(),
    };

    recent.push(payload);
    if (recent.length > MAX_RECENT) recent.splice(0, recent.length - MAX_RECENT);

    try { fs.appendFileSync(metricsLogPath, JSON.stringify(payload) + '\n'); } catch {}

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'ingest-failed' });
  }
});

// GET /api/metrics/dashboard
// Returns a minimal JSON payload for the Admin MetricsDashboard
router.get('/dashboard', async (_req, res) => {
  try {
    // Build error distribution from logs/error.log (if available)
    const errorLogPath = path.resolve(process.cwd(), 'logs', 'error.log');
    const lines = readLastLines(errorLogPath, 1000);
    const errorBuckets = new Map();
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const key = (obj && (obj.code || obj.message || obj.stack || 'error'));
        const name = typeof key === 'string' ? key.slice(0, 60) : 'error';
        errorBuckets.set(name, (errorBuckets.get(name) || 0) + 1);
      } catch {
        // non-JSON line, bucket as generic
        errorBuckets.set('error', (errorBuckets.get('error') || 0) + 1);
      }
    }
    // Also include recent ingested errors by type
    for (const item of recent) {
      try {
        const errs = Array.isArray(item.metrics?.errors) ? item.metrics.errors : [];
        for (const er of errs) {
          const key = (er && (er.type || er.message || 'error'));
          const name = typeof key === 'string' ? key.slice(0, 60) : 'error';
          errorBuckets.set(name, (errorBuckets.get(name) || 0) + 1);
        }
      } catch {}
    }

    const errorData = Array.from(errorBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Server usage: minimal health metrics
    const mem = process.memoryUsage();
    const usedMb = Math.round((mem.rss || 0) / (1024 * 1024));
    const heapMb = Math.round((mem.heapUsed || 0) / (1024 * 1024));
    const uptimeMin = Math.round((process.uptime() || 0) / 60);
    const usageData = [
      { name: 'Memoria RSS (MB)', value: usedMb },
      { name: 'Heap usado (MB)', value: heapMb },
      { name: 'Uptime (min)', value: uptimeMin },
    ];

    // Build basic time series from recent ingested metrics (last hour)
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 60 minutes
    const bucketMs = 5 * 60 * 1000; // 5-minute buckets
    const bucketCount = Math.ceil(windowMs / bucketMs);
    const buckets = new Array(bucketCount).fill(null).map((_, i) => ({
      start: now - (bucketCount - i) * bucketMs,
      emailSent: 0,
      emailReceived: 0,
      searchCount: 0,
      eventsDetected: 0,
    }));

    for (const item of recent) {
      const ts = Number(item.ts || item.receivedAt || 0);
      if (!ts || ts < now - windowMs) continue;
      const idx = Math.min(Math.floor((ts - (now - windowMs)) / bucketMs), bucketCount - 1);
      const bucket = buckets[idx];
      if (!bucket) continue;

      const events = Array.isArray(item.metrics?.events) ? item.metrics.events : [];
      for (const ev of events) {
        const name = ev?.name || '';
        if (name === 'email_delivery_success') bucket.emailSent += 1;
        if (name === 'event_detection') bucket.eventsDetected += 1;
      }

      const counters = item.metrics?.counters || {};
      if (Number.isFinite(counters['email_operation_send'])) bucket.emailSent += counters['email_operation_send'];
      const timings = item.metrics?.timings || {};
      if (timings['search']?.count) bucket.searchCount += Number(timings['search'].count) || 0;
    }

    const timeSeriesData = buckets.map((b) => ({
      date: new Date(b.start + bucketMs).toLocaleTimeString(),
      emailSent: b.emailSent,
      emailReceived: b.emailReceived,
      searchCount: b.searchCount,
      eventsDetected: b.eventsDetected,
    }));

    // Aggregate performance timings (averages)
    let emailSendTotal = 0, emailSendCount = 0;
    let searchTotal = 0, searchCount = 0;
    let notifTotal = 0, notifCount = 0;
    let evDetTotal = 0, evDetCount = 0;
    for (const item of recent) {
      const t = item.metrics?.timings || {};
      if (t['email_delivery']?.total && t['email_delivery']?.count) { emailSendTotal += t['email_delivery'].total; emailSendCount += t['email_delivery'].count; }
      if (t['search']?.total && t['search']?.count) { searchTotal += t['search'].total; searchCount += t['search'].count; }
      if (t['notification_rendering']?.total && t['notification_rendering']?.count) { notifTotal += t['notification_rendering'].total; notifCount += t['notification_rendering'].count; }
      if (t['event_detection']?.total && t['event_detection']?.count) { evDetTotal += t['event_detection'].total; evDetCount += t['event_detection'].count; }
    }
    const performanceData = {
      emailSendAvgMs: emailSendCount ? emailSendTotal / emailSendCount : 0,
      emailSearchAvgMs: searchCount ? searchTotal / searchCount : 0,
      notificationDispatchMs: notifCount ? notifTotal / notifCount : 0,
      eventDetectionMs: evDetCount ? evDetTotal / evDetCount : 0,
    };

    res.json({
      timeSeriesData,
      performanceData,
      errorData,
      usageData,
      timestamp: now,
    });
  } catch (e) {
    res.status(500).json({ error: 'metrics-dashboard-failed' });
  }
});

// Helpers
function timeframeToMs(tf) {
  const s = String(tf || '').toLowerCase();
  if (s === 'day' || s === '1d') return 24 * 60 * 60 * 1000;
  if (s === 'week' || s === '7d') return 7 * 24 * 60 * 60 * 1000;
  if (s === 'month' || s === '30d') return 30 * 24 * 60 * 60 * 1000;
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return n; // ms
  return 24 * 60 * 60 * 1000; // default 1d
}

// GET /api/admin/metrics/errors
// Query: timeframe=day|week|month|<ms>&limit=<n>
router.get('/errors', async (req, res) => {
  try {
    const now = Date.now();
    const tfMs = timeframeToMs(req.query.timeframe);
    const since = now - tfMs;
    const limit = Math.max(1, Math.min(5000, Number(req.query.limit || 1000)));

    const list = [];
    // From ingested metrics (client-side)
    for (const item of recent) {
      if (!item?.metrics?.errors) continue;
      const tsItem = Number(item.ts || item.receivedAt || 0);
      if (tsItem && tsItem < since) continue;
      for (const er of item.metrics.errors) {
        const ts = Number(er.timestamp || tsItem || Date.now());
        if (ts < since) continue;
        list.push({
          source: 'ingest',
          type: er.type || 'error',
          message: er.message || '',
          stack: er.stack || null,
          context: er.context || null,
          user: (er.context && er.context.user) ? er.context.user : null,
          timestamp: ts,
        });
      }
    }
    // From server error log
    try {
      const errorLogPath = path.resolve(process.cwd(), 'logs', 'error.log');
      const lines = readLastLines(errorLogPath, limit);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          const ts = Number(obj.timestamp || Date.parse(obj.time || obj.date) || now);
          if (ts < since) continue;
          const msg = obj.message || String(line).slice(0, 4000);
          let uid = null;
          try {
            const m = String(msg).match(/uid:([A-Za-z0-9_\-:]+)/);
            if (m && m[1]) uid = m[1];
          } catch {}
          list.push({
            source: 'server',
            type: obj.code || obj.name || 'error',
            message: msg,
            stack: obj.stack || null,
            context: obj.context || null,
            user: uid ? { uid } : null,
            timestamp: ts,
          });
        } catch {
          // non-JSON line; include basic entry
          list.push({ source: 'server', type: 'error', message: line, timestamp: now });
        }
      }
    } catch {}

    // Sort desc by timestamp and limit
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const trimmed = list.slice(0, limit);
    return res.json({ count: trimmed.length, items: trimmed, timestamp: now });
  } catch (e) {
    return res.status(500).json({ error: 'errors-list-failed' });
  }
});

// GET /api/admin/metrics/errors/by-user
router.get('/errors/by-user', async (req, res) => {
  try {
    const now = Date.now();
    const tfMs = timeframeToMs(req.query.timeframe);
    const since = now - tfMs;
    const map = new Map(); // key: uid/email -> { user, count, lastTimestamp, sources:Set }

    // From ingested metrics
    for (const item of recent) {
      if (!item?.metrics?.errors) continue;
      const tsItem = Number(item.ts || item.receivedAt || 0);
      for (const er of item.metrics.errors) {
        const ts = Number(er.timestamp || tsItem || now);
        if (ts < since) continue;
        const u = (er.context && er.context.user) ? er.context.user : null;
        const key = (u && (u.uid || u.email)) ? (u.uid || u.email) : null;
        if (!key) continue;
        const cur = map.get(key) || { user: u, count: 0, lastTimestamp: 0, sources: new Set() };
        cur.count += 1;
        cur.lastTimestamp = Math.max(cur.lastTimestamp, ts);
        cur.sources.add('ingest');
        map.set(key, cur);
      }
    }

    // From server logs (uid parsed from message)
    try {
      const errorLogPath = path.resolve(process.cwd(), 'logs', 'error.log');
      const lines = readLastLines(errorLogPath, 2000);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          const ts = Number(obj.timestamp || Date.parse(obj.time || obj.date) || now);
          if (ts < since) continue;
          let uid = null;
          try {
            const m = String(obj.message || '').match(/uid:([A-Za-z0-9_\-:]+)/);
            if (m && m[1]) uid = m[1];
          } catch {}
          if (!uid) continue;
          const key = uid;
          const cur = map.get(key) || { user: { uid }, count: 0, lastTimestamp: 0, sources: new Set() };
          cur.count += 1;
          cur.lastTimestamp = Math.max(cur.lastTimestamp, ts);
          cur.sources.add('server');
          map.set(key, cur);
        } catch {}
      }
    } catch {}

    const items = Array.from(map.values())
      .map((v) => ({ user: v.user, count: v.count, lastTimestamp: v.lastTimestamp, sources: Array.from(v.sources) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, Math.max(1, Math.min(500, Number(req.query.limit || 50))));
    return res.json({ items, timestamp: now });
  } catch (e) {
    return res.status(500).json({ error: 'errors-by-user-failed' });
  }
});

// GET /api/admin/metrics/aggregate
// Aggregates counters and timings over recent ingested metrics in timeframe
router.get('/aggregate', async (req, res) => {
  try {
    const now = Date.now();
    const tfMs = timeframeToMs(req.query.timeframe);
    const since = now - tfMs;

    const counters = {};
    const timings = {};
    const durations = new Map(); // key -> number[]
    let eventsTotal = 0;

    for (const item of recent) {
      const ts = Number(item.ts || item.receivedAt || 0);
      if (ts && ts < since) continue;
      // counters
      const c = item.metrics?.counters || {};
      for (const [k, v] of Object.entries(c)) {
        const n = Number(v) || 0;
        counters[k] = (counters[k] || 0) + n;
      }
      // timings
      const t = item.metrics?.timings || {};
      for (const [k, val] of Object.entries(t)) {
        const cur = timings[k] || { count: 0, total: 0, min: Number.POSITIVE_INFINITY, max: 0 };
        const addCount = Number(val?.count || 0);
        const addTotal = Number(val?.total || 0);
        cur.count += addCount;
        cur.total += addTotal;
        cur.min = Math.min(cur.min, Number(val?.min || cur.min));
        cur.max = Math.max(cur.max, Number(val?.max || cur.max));
        timings[k] = cur;
        // collect samples if available
        try {
          const arr = Array.isArray(val?.samples) ? val.samples : [];
          if (arr.length) {
            const list = durations.get(k) || [];
            for (const s of arr) {
              const d = Number(s?.duration || s);
              if (Number.isFinite(d)) list.push(d);
            }
            durations.set(k, list);
          }
        } catch {}
      }
      // events
      const evs = Array.isArray(item.metrics?.events) ? item.metrics.events : [];
      eventsTotal += evs.length;
    }

    // Normalize timings and compute percentiles where samples exist
    for (const [k, v] of Object.entries(timings)) {
      if (!Number.isFinite(v.min)) v.min = 0;
      const arr = durations.get(k) || [];
      if (arr.length >= 3) {
        arr.sort((a, b) => a - b);
        const q = (p) => {
          const idx = Math.ceil(p * arr.length) - 1;
          return arr[Math.max(0, Math.min(arr.length - 1, idx))];
        };
        v.p95 = q(0.95);
        v.p99 = q(0.99);
      } else {
        v.p95 = 0;
        v.p99 = 0;
      }
    }

    return res.json({ counters, timings, eventsTotal, timestamp: now });
  } catch (e) {
    return res.status(500).json({ error: 'aggregate-failed' });
  }
});

// GET /api/admin/metrics/raw
// Returns recent ingested payloads (trimmed)
router.get('/raw', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 100)));
    const out = recent.slice(-limit);
    return res.json({ items: out, count: out.length, totalBuffered: recent.length, timestamp: Date.now() });
  } catch (e) {
    return res.status(500).json({ error: 'raw-failed' });
  }
});

// GET /api/admin/metrics/web-vitals
// Returns recent web-vitals captured via /api/web-vitals
router.get('/web-vitals', async (req, res) => {
  try {
    const { getRecentWebVitals } = await import('./web-vitals.js');
    const limit = Math.max(1, Math.min(1000, Number(req.query.limit || 200)));
    const name = (req.query.name || '').toString();
    const tfMs = timeframeToMs(req.query.timeframe);
    const since = Date.now() - tfMs;
    let items = getRecentWebVitals ? getRecentWebVitals(limit) : [];
    items = items.filter((x) => (x?.ts || 0) >= since);
    if (name) {
      const lc = name.toLowerCase();
      items = items.filter((x) => String(x?.name || '').toLowerCase() === lc);
    }
    return res.json({ items, count: items.length, timestamp: Date.now() });
  } catch (e) {
    return res.status(500).json({ error: 'web-vitals-failed' });
  }
});

router.post('/backfill', async (req, res) => {
  try {
    const { module, weddingId, days } = req.body || {};
    const mod = String(module || '').trim();
    if (!mod) return res.status(400).json({ error: 'missing-module' });
    const limitDays = Math.max(1, Math.min(365, Number(days || 90)));
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (limitDays - 1));
    const startTs = new Date(start);

    const db = admin.firestore();
    const map = new Map();
    const push = (wid, day, ev) => {
      const key = `${wid}|${day}`;
      const cur = map.get(key) || { totals: { events: 0, alerts: 0, errors: 0 }, breakdown: {} };
      cur.totals.events += 1;
      if (ev === 'budget_over_threshold') cur.totals.alerts += 1;
      if (ev.startsWith('error') || ev === 'email_bounced') cur.totals.errors += 1;
      cur.breakdown[ev] = (cur.breakdown[ev] || 0) + 1;
      map.set(key, cur);
    };

    const fmt = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const q1 = db.collection('projectMetrics_events')
      .where('module', '==', mod)
      .where('eventAt', '>=', startTs);
    const q1Final = weddingId ? q1.where('weddingId', '==', String(weddingId)) : q1;
    const snap1 = await q1Final.get();
    for (const doc of snap1.docs) {
      const d = doc.data() || {};
      const wid = String(d.weddingId || '').trim();
      if (!wid) continue;
      const when = (d.eventAt && typeof d.eventAt.toDate === 'function') ? d.eventAt.toDate() : new Date();
      const day = fmt(when);
      if (when < start || when > end) continue;
      const ev = String(d.event || '').trim();
      if (!ev) continue;
      push(wid, day, ev);
    }

    const q2 = db.collection('projectMetrics_events')
      .where('module', '==', mod)
      .where('eventAt', '==', null);
    const q2Final = weddingId ? q2.where('weddingId', '==', String(weddingId)) : q2;
    const snap2 = await q2Final.get();
    for (const doc of snap2.docs) {
      const d = doc.data() || {};
      const wid = String(d.weddingId || '').trim();
      if (!wid) continue;
      const when = (d.receivedAt && typeof d.receivedAt.toDate === 'function') ? d.receivedAt.toDate() : new Date();
      const day = fmt(when);
      if (when < start || when > end) continue;
      const ev = String(d.event || '').trim();
      if (!ev) continue;
      push(wid, day, ev);
    }

    const updates = Array.from(map.entries());
    const batches = [];
    for (let i = 0; i < updates.length; i += 500) {
      const slice = updates.slice(i, i + 500);
      const b = db.batch();
      for (const [key, val] of slice) {
        const [wid, day] = key.split('|');
        const ref = db.collection('projectMetrics').doc(wid).collection('modules').doc(mod).collection('daily').doc(day);
        const totals = val.totals || {};
        const breakdown = val.breakdown || {};
        const breakdownMap = {};
        for (const [k, v] of Object.entries(breakdown)) breakdownMap[k] = v;
        b.set(ref, { totals, breakdown: breakdownMap, metadata: { computedAt: admin.firestore.FieldValue.serverTimestamp(), version: '2025.10.1' } }, { merge: true });
      }
      batches.push(b);
    }
    for (const b of batches) {
      try { await b.commit(); } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }

    return res.json({ ok: true, days: limitDays, module: mod, updated: updates.length });
  } catch (e) {
    return res.status(500).json({ error: 'backfill-failed' });
  }
});

export default router;

