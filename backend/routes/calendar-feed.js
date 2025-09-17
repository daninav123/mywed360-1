import express from 'express';
import admin from 'firebase-admin';
import crypto from 'crypto';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Asegurar Firebase Admin inicializado (con soporte de credenciales por variable de entorno)
if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
    if (sa && sa.project_id && sa.client_email && sa.private_key) {
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  } catch (e) {
    console.warn('[calendar] admin init fallback applicationDefault:', e?.message || e);
    try { admin.initializeApp({ credential: admin.credential.applicationDefault() }); } catch {}
  }
}

const db = () => admin.firestore();

// Utilidad: generar token seguro
function generateToken(len = 32) {
  // 32 bytes -> 64 chars base64url aprox
  const buf = crypto.randomBytes(len);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

// Formatear fecha a ICS (UTC)
function toICSDate(d) {
  const dt = new Date(d);
  const iso = dt.toISOString().replace(/[-:]/g, '').replace(/\.[0-9]{3}Z$/, 'Z');
  // 20250101T120000Z
  return iso.slice(0, 15) + 'Z';
}

function toICSDateValue(d) {
  // YYYYMMDD (all-day, usar fecha local para evitar desfases por zona horaria)
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

// Escapar texto ICS
function icsEscape(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

// Construir ICS a partir de eventos [{ id, title, desc, start, end, location }]
function buildICS({ events = [], prodId = '-//Lovenda//Calendar Feed//ES', calName = 'Lovenda' }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(calName)}`,
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ];

  const now = toICSDate(new Date());
  for (const ev of events) {
    if (!ev?.start || !ev?.end) continue;
    const uidCore = `${ev.googleEventId || ev.id || Math.random().toString(36).slice(2)}`;
    const uid = `${uidCore}@lovenda`;
    const isLongTask = ev.type === 'task' || ev.long === true;

    const summary = icsEscape(ev.title || ev.name || 'Evento');
    const description = icsEscape(ev.desc || ev.description || '');
    const location = ev.location ? icsEscape(ev.location) : null;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`LAST-MODIFIED:${now}`);
    if (isLongTask) {
      // Evento de día completo, multi-día. DTEND es exclusivo (+1 día)
      const startDate = toICSDateValue(ev.start);
      const endInclusive = new Date(ev.end);
      // sumar 1 día
      endInclusive.setUTCDate(endInclusive.getUTCDate() + 1);
      const endDate = toICSDateValue(endInclusive);
      lines.push(`DTSTART;VALUE=DATE:${startDate}`);
      lines.push(`DTEND;VALUE=DATE:${endDate}`);
    } else {
      const start = toICSDate(ev.start);
      const end = toICSDate(ev.end);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
    }
    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);
    if (ev.category) lines.push(`CATEGORIES:${icsEscape(ev.category)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// GET /api/calendar/token -> devuelve token y URLs para el usuario actual
function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function signToken(payloadObj, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payloadObj));
  const mac = crypto
    .createHmac('sha256', secret)
    .update(`${h}.${p}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${h}.${p}.${mac}`;
}

function verifyToken(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [h, p, mac] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${h}.${p}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (mac !== expected) return null;
  try {
    const json = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    return json;
  } catch { return null; }
}

router.get('/token', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid || req.user?.id;
    let weddingId = req.query.weddingId || req.userProfile?.activeWedding || req.user?.weddingId || null;
    if (!uid) return res.status(401).json({ ok: false, error: 'auth-required' });

    const secret = process.env.CALENDAR_FEED_SECRET || 'dev-calendar-secret';
    const payload = { v: 1, uid, weddingId: weddingId || null, iat: Date.now() };
    const token = signToken(payload, secret);

    const inferred = `${req.protocol}://${req.get('host')}`;
    const base = process.env.PUBLIC_BASE_URL || process.env.ALLOWED_ORIGIN || process.env.FRONTEND_BASE_URL || inferred;
    // Preferir URL pública del backend si está disponible, incluyendo la variante VITE_ usada en dev
    const backendBase = process.env.BACKEND_BASE_URL 
      || process.env.VITE_BACKEND_BASE_URL 
      || process.env.RENDER_EXTERNAL_URL 
      || base 
      || inferred;
    const httpsBase = backendBase.replace(/^http:\/\//, 'https://');
    const feedUrl = `${httpsBase}/api/calendar/feed/${encodeURIComponent(token)}${weddingId ? `?wid=${encodeURIComponent(weddingId)}` : ''}`;
    const webcalUrl = feedUrl.replace(/^https:\/\//, 'webcal://').replace(/^http:\/\//, 'webcal://');

    return res.json({ ok: true, token, feedUrl, webcalUrl });
  } catch (e) {
    console.error('[calendar] token error', e);
    return res.status(500).json({ ok: false, error: 'token-failed' });
  }
});

function fromFSDate(v) {
  if (!v) return null;
  try {
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000);
  } catch {}
  return new Date(v);
}

// GET /api/calendar/feed/:token -> ICS público por token
router.get('/feed/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).send('invalid');

    const secret = process.env.CALENDAR_FEED_SECRET || 'dev-calendar-secret';
    const decoded = verifyToken(token, secret);
    if (!decoded || !decoded.uid) return res.status(404).send('not found');
    const uid = decoded.uid;
    const weddingId = decoded.weddingId || req.query.wid || null;

    // Cargar eventos de la boda (solo reuniones/"tareas" de la lista, excluye procesos del Gantt)
    const events = [];
    try {
      if (weddingId) {
        const meetingsCol = db().collection('weddings').doc(weddingId).collection('meetings');
        const meetSnap = await meetingsCol.get();
        meetSnap.forEach((d) => {
          const ev = d.data() || {};
          const start = fromFSDate(ev.start);
          const end = fromFSDate(ev.end);
          if (start && end && !isNaN(start) && !isNaN(end)) {
            events.push({ id: d.id, ...ev, start, end });
          }
        });
      } else {
        // Fallback: eventos por usuario si no hay weddingId
        const meetCol = db().collection('users').doc(uid).collection('meetings');
        const meetSnap = await meetCol.get();
        meetSnap.forEach((d) => {
          const ev = d.data() || {};
          const start = fromFSDate(ev.start);
          const end = fromFSDate(ev.end);
          if (start && end && !isNaN(start) && !isNaN(end)) {
            events.push({ id: d.id, ...ev, start, end });
          }
        });
      }
    } catch (e) {
      console.warn('[calendar] error loading events:', e);
      // degradar a feed vacío si hay error para no romper suscripción
    }

    // Ya únicamente llevamos reuniones (lista). Los procesos (Gantt) no se incluyen.
    const ics = buildICS({ events });
    const etag = crypto.createHash('sha1').update(ics).digest('hex');
    const inm = req.headers['if-none-match'];
    if (inm && inm === etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());
    res.setHeader('ETag', etag);
    res.status(200).send(ics);
  } catch (e) {
    console.error('[calendar] feed error', e);
    const ics = buildICS({ events: [] });
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.status(200).send(ics);
  }
});

export default router;
