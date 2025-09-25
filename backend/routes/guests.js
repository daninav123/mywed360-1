import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import logger from '../logger.js';
import { z, validate } from '../utils/validation.js';

// ------------ Firestore Init -------------
// Se asume que ya existe inicialización global en otro punto del backend.
// Si no, se puede hacer aquí leyendo las credenciales del entorno.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    logger.warn('Firebase admin ya estaba inicializado o no hay credencial:', err.message);
  }
}

const db = admin.firestore();
const router = express.Router();

/**
 * POST /api/guests/invite
 * Body: { name: string, phone?: string, email?: string, eventId?: string }
 * Crea un invitado y devuelve link personalizado de RSVP.
 */
// Ruta: POST /api/guests/:weddingId/invite
const inviteBodySchema = z.object({
  name: z.string().min(1, 'name required'),
  phone: z.string().min(5).max(50).optional(),
  email: z.string().email().optional(),
  eventId: z.string().min(1).default('default'),
});
const inviteParamsSchema = z.object({ weddingId: z.string().min(1) });

router.post('/:weddingId/invite', validate(inviteParamsSchema, 'params'), validate(inviteBodySchema), async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { name, phone = '', email = '', eventId = 'default' } = req.body;

    const token = uuidv4();
    const docRef = db.collection('weddings').doc(weddingId).collection('guests').doc(token);
    await docRef.set({
      name,
      phone,
      email,
      eventId,
      token,
      status: 'pending', // pending | accepted | rejected
      companions: 0,
      allergens: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Indexar token para búsqueda pública por token (ruta /api/rsvp)
    await db.collection('rsvpTokens').doc(token).set({
      weddingId,
      guestId: token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
    res.json({ token, link });
  } catch (err) {
    logger.error('guest-invite-error', err);
    res.status(500).json({ error: 'guest-invite-failed' });
  }
});

/**
 * GET /api/guests/:token
 * Devuelve datos del invitado (sin datos sensibles).
 */
// Ruta: GET /api/guests/:weddingId/:token
const getGuestParams = z.object({ weddingId: z.string().min(1), token: z.string().min(1) });
router.get('/:weddingId/:token', validate(getGuestParams, 'params'), async (req, res) => {
  try {
    const { weddingId, token } = req.params;
    const snap = await db.collection('weddings').doc(weddingId).collection('guests').doc(token).get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data();
    res.json({ name: data.name, status: data.status, companions: data.companions, allergens: data.allergens });
  } catch (err) {
    logger.error('guest-get-error', err);
    res.status(500).json({ error: 'guest-get-failed' });
  }
});

/**
 * PUT /api/guests/:token
 * Body: { status: 'accepted' | 'rejected', companions?: number, allergens?: string }
 * Actualiza la respuesta del invitado.
 */
// Ruta: PUT /api/guests/:weddingId/:token
const updateGuestParams = z.object({ weddingId: z.string().min(1), token: z.string().min(1) });
const updateGuestBody = z.object({
  status: z.enum(['accepted', 'rejected']),
  companions: z.coerce.number().int().min(0).max(20).default(0),
  allergens: z.string().max(500).optional(),
});
router.put('/:weddingId/:token', validate(updateGuestParams, 'params'), validate(updateGuestBody), async (req, res) => {
  try {
    const { weddingId, token } = req.params;
    const { status, companions = 0, allergens = '' } = req.body;

    const docRef = db.collection('weddings').doc(weddingId).collection('guests').doc(token);
    await docRef.update({ status, companions, allergens, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ ok: true });
  } catch (err) {
    logger.error('guest-update-error', err);
    res.status(500).json({ error: 'guest-update-failed' });
  }
});

/**
 * POST /api/guests/id/:docId/rsvp-link
 * Genera (o recupera) el enlace de RSVP para un invitado ya existente.
 * Devuelve { link, token }
 */
// Ruta: POST /api/guests/:weddingId/id/:docId/rsvp-link
const rsvpLinkParams = z.object({ weddingId: z.string().min(1), docId: z.string().min(1) });
router.post('/:weddingId/id/:docId/rsvp-link', validate(rsvpLinkParams, 'params'), async (req, res) => {
  try {
    const { weddingId, docId } = req.params;
    const docRef = db.collection('weddings').doc(weddingId).collection('guests').doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });

    let data = snap.data();
    let { token } = data;
    if (!token) {
      token = uuidv4();
      await docRef.update({ token, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      data = { ...data, token };
    }

    const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
    // Indexar token -> (weddingId, guestId)
    await db.collection('rsvpTokens').doc(token).set({
      weddingId,
      guestId: docId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.json({ token, link });
  } catch (err) {
    logger.error('rsvp-link-error', err);
    res.status(500).json({ error: 'rsvp-link-failed' });
  }
});

export default router;
