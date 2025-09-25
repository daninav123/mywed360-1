import express from 'express';
import admin from 'firebase-admin';
import { z, validate } from '../utils/validation.js';

const router = express.Router();

async function listProviders({ category, status, q, limit = 20 }) {
  let query = admin.firestore().collection('providers');
  if (category) query = query.where('category', '==', category);
  if (status) query = query.where('status', '==', status);
  // Limitar resultados para evitar sobrecarga
  query = query.limit(Math.min(Math.max(Number(limit) || 20, 1), 100));
  const snap = await query.get();
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (q) {
    const term = String(q).toLowerCase();
    items = items.filter((it) => {
      const name = String(it.name || '').toLowerCase();
      const location = String(it.location || '').toLowerCase();
      const inServices = Array.isArray(it.services)
        ? it.services.some((s) =>
            String(s?.name || '')
              .toLowerCase()
              .includes(term)
          )
        : false;
      return name.includes(term) || location.includes(term) || inServices;
    });
  }
  return items;
}

// GET /api/providers
const listQuery = z.object({
  q: z.string().optional().default(''),
  category: z.string().optional().default(''),
  status: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
router.get('/', validate(listQuery, 'query'), async (req, res) => {
  try {
    const { q = '', category = '', status = '', page = 1, limit = 20 } = req.query || {};
    const l = Number(limit);
    const items = await listProviders({ q, category, status, limit: l });
    // Paginación simple: de momento se devuelve la primera página
    res.json({ items, page: Number(page) || 1, limit: l, total: items.length });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

// POST /api/providers
const createBody = z.object({
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  status: z.enum(['prospect', 'active', 'archived']).optional().default('prospect'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  services: z.array(z.any()).optional().default([]),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});
router.post('/', express.json(), validate(createBody), async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    let now;
    try { now = admin.firestore.FieldValue.serverTimestamp(); } catch { try { now = admin.firestore().FieldValue.serverTimestamp(); } catch { now = new Date(); } }
    const doc = {
      name,
      category: body.category || null,
      status: ['prospect', 'active', 'archived'].includes(body.status) ? body.status : 'prospect',
      phone: body.phone || null,
      email: body.email || null,
      location: body.location || null,
      services: Array.isArray(body.services) ? body.services : [],
      rating: typeof body.rating === 'number' ? body.rating : null,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await admin.firestore().collection('providers').add(doc);
    res.status(201).json({ id: ref.id });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

// GET /api/providers/:id
const idParams = z.object({ id: z.string().min(1) });
router.get('/:id', validate(idParams, 'params'), async (req, res) => {
  try {
    const id = req.params.id;
    const snap = await admin.firestore().collection('providers').doc(id).get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'not_found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

// PATCH /api/providers/:id
const patchBody = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  status: z.enum(['prospect', 'active', 'archived']).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  services: z.array(z.any()).optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
}).strict();
router.patch('/:id', express.json(), validate(idParams, 'params'), validate(patchBody), async (req, res) => {
  try {
    const id = req.params.id;
    const patch = req.body || {};
    const allowed = [
      'name',
      'category',
      'status',
      'phone',
      'email',
      'location',
      'services',
      'rating',
      'notes',
    ];
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) data[k] = patch[k];
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      const st = data.status;
      if (!['prospect', 'active', 'archived'].includes(st))
        return res.status(400).json({ success: false, error: 'status inválido' });
    }
    try { data.updatedAt = admin.firestore.FieldValue.serverTimestamp(); }
    catch { try { data.updatedAt = admin.firestore().FieldValue.serverTimestamp(); } catch { data.updatedAt = new Date(); } }
    await admin.firestore().collection('providers').doc(id).set(data, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

// DELETE /api/providers/:id
router.delete('/:id', validate(idParams, 'params'), async (req, res) => {
  try {
    const id = req.params.id;
    await admin.firestore().collection('providers').doc(id).delete();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

// GET /api/providers/search
const searchQuery = z.object({ q: z.string().min(1) });
router.get('/search', validate(searchQuery, 'query'), async (req, res) => {
  try {
    const { q } = req.query || {};
    const items = await listProviders({ q: String(q), limit: 50 });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});

export default router;
