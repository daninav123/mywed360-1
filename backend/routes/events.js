import express from 'express';
import { db, admin, USE_FIREBASE } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware de autenticación muy simple (usa UID en el header Authorization)
function authMiddleware(req, res, next) {
  if (!USE_FIREBASE || !db) {
    return res.status(503).json({ error: 'Firebase not available' });
  }
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  req.userId = auth.substring(7);
  next();
}

/**
 * POST /api/events
 * Crea una nueva boda/evento y asigna al usuario autenticado como "owner" (pareja).
 * Body: { name: string, date?: string, ... }
 * Respuesta: { eventId, ok }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name = 'Mi boda', date = null, ...rest } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name-required' });

    // 1. Crear documento de evento
    const eventRef = db.collection('events').doc();
    const eventData = {
      name,
      date,
      ownerIds: [req.userId],
      plannerIds: [],
      assistantIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...rest,
    };
    await eventRef.set(eventData);

    // 2. Registrar rol en subcolección roles/{eventId}/members/{uid}
    await db
      .collection('roles')
      .doc(eventRef.id)
      .collection('members')
      .doc(req.userId)
      .set({ role: 'owner', assignedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.status(201).json({ ok: true, eventId: eventRef.id });
  } catch (err) {
    logger.error('event-create-error', err);
    res.status(500).json({ error: 'event-create-failed' });
  }
});

// GET /api/events/search?q=term
// Devuelve una lista limitada de eventos coincidentes (título/lugar)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (!q || q.length < 2) return res.json([]);

    let snap;
    try {
      snap = await db.collection('events').orderBy('date', 'desc').limit(300).get();
    } catch (_) {
      snap = await db.collection('events').limit(300).get();
    }

    const out = [];
    snap.docs.forEach((d) => {
      const data = d.data() || {};
      const title = data.title || data.name || '';
      const location = data.location || data.place || '';
      const hay = `${title} ${location}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          id: d.id,
          title: title || 'Evento',
          dateTime: data.date || data.dateTime || data.start || null,
          location,
        });
      }
    });
    res.json(out.slice(0, 50));
  } catch (err) {
    logger.error('events-search-error', err);
    res.status(500).json({ error: 'events-search-failed' });
  }
});

// Si Firebase está deshabilitado, las rutas quedan vacías pero el router se exporta igual
if (!USE_FIREBASE || !db) {
  console.warn('[events.js] Firebase deshabilitado - rutas de eventos no disponibles');
}

export default router;
