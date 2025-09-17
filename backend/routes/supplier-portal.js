import express from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { requireAuth } from '../middleware/authMiddleware.js';
import logger from '../logger.js';

const router = express.Router();

function genToken(len = 40) {
  return crypto.randomBytes(len).toString('hex');
}

// Create or rotate a portal token for a supplier (auth required)
router.post('/weddings/:wId/suppliers/:sId/portal-token', requireAuth, async (req, res) => {
  const { wId, sId } = req.params;
  try {
    const token = genToken(16);
    const tokenRef = db.collection('supplierPortalTokens').doc(token);
    await tokenRef.set({
      weddingId: wId,
      supplierId: sId,
      createdAt: FieldValue.serverTimestamp(),
      lastAccess: null,
      active: true,
    });
    // Save a reference on supplier (best-effort; not unique)
    try {
      await db.collection('weddings').doc(wId).collection('suppliers').doc(sId)
        .set({ portalToken: token, portalTokenCreatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } catch {}

    const base = process.env.PUBLIC_APP_BASE_URL || '';
    const path = `/supplier/${token}`;
    const url = base ? (base.endsWith('/') ? base.slice(0, -1) : base) + path : path;
    return res.json({ success: true, token, url });
  } catch (e) {
    logger.error('Error creating supplier portal token', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

async function resolveToken(token) {
  const tRef = db.collection('supplierPortalTokens').doc(token);
  const tSnap = await tRef.get();
  if (!tSnap.exists) return null;
  const tData = tSnap.data();
  if (tData?.active === false) return null;
  return { ref: tRef, data: tData };
}

// Public: fetch portal info by token
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const t = await resolveToken(token);
    if (!t) return res.status(404).json({ error: 'invalid_token' });
    const { weddingId, supplierId } = t.data;
    const [wSnap, sSnap] = await Promise.all([
      db.collection('weddings').doc(weddingId).get(),
      db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId).get(),
    ]);
    if (!wSnap.exists || !sSnap.exists) return res.status(404).json({ error: 'not_found' });
    await t.ref.update({ lastAccess: FieldValue.serverTimestamp() });
    const wedding = wSnap.data();
    const supplier = sSnap.data();
    // Fetch last RFQ or budgets (best-effort)
    let budgets = [];
    try {
      const bSnap = await db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId).collection('budgets').orderBy('createdAt', 'desc').limit(5).get();
      budgets = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {}
    return res.json({
      wedding: { id: weddingId, name: wedding?.name || wedding?.title || 'Boda', date: wedding?.date || wedding?.eventDate || null, location: wedding?.location || wedding?.celebrationPlace || '' },
      supplier: { id: supplierId, name: supplier?.name || '', service: supplier?.service || '', email: supplier?.email || '' },
      budgets,
    });
  } catch (e) {
    logger.error('Error in GET /api/supplier-portal/:token', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Public: submit availability/message and optional budget
router.post('/:token/submit', express.json({ limit: '1mb' }), async (req, res) => {
  const { token } = req.params;
  const bodySchema = z.object({
    availability: z.string().max(50).optional(),
    message: z.string().max(5000).optional(),
    budget: z
      .object({
        description: z.string().max(2000).optional(),
        amount: z.coerce.number().nonnegative().optional(),
        currency: z.string().max(10).optional(),
        links: z.array(z.string().url()).max(5).optional(),
      })
      .optional(),
  });
  let availability, message, budget;
  try {
    ({ availability, message, budget } = bodySchema.parse(req.body || {}));
  } catch (e) {
    const msg = e?.issues ? e.issues.map(i => i.message).join(', ') : 'invalid body';
    return res.status(400).json({ error: msg });
  }
  try {
    const t = await resolveToken(token);
    if (!t) return res.status(404).json({ error: 'invalid_token' });
    const { weddingId, supplierId } = t.data;
    const sRef = db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId);
    const updates = { portalLastSubmitAt: FieldValue.serverTimestamp() };
    if (availability) updates.portalAvailability = availability;
    if (message && typeof message === 'string') updates.portalLastMessage = message;
    await sRef.set(updates, { merge: true });
    let budgetId = null;
    if (budget && (budget.amount || budget.description)) {
      const bRef = sRef.collection('budgets').doc();
      await bRef.set({
        description: String(budget.description || ''),
        amount: Number(budget.amount || 0),
        currency: String((budget.currency || 'EUR')).toUpperCase(),
        links: Array.isArray(budget.links) ? budget.links : [],
        source: 'portal',
        status: 'submitted',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      budgetId = bRef.id;
    }
    return res.json({ success: true, budgetId });
  } catch (e) {
    logger.error('Error in POST /api/supplier-portal/:token/submit', e);
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;
