import express from 'express';
import admin from 'firebase-admin';
import { z, validate } from '../utils/validation.js';

const router = express.Router();

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const buildMatcher = (rawTerm) => {
  const baseTerm = normalizeText(rawTerm);
  const tokens = baseTerm.split(/\s+/).filter(Boolean);
  if (!baseTerm && tokens.length === 0) {
    return () => true;
  }
  return (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return false;
    if (baseTerm && normalized.includes(baseTerm)) return true;
    if (!tokens.length) return false;
    return tokens.some((token) => normalized.includes(token));
  };
};

async function listProviders({ category, status, q, limit = 20 }) {
  let query = admin.firestore().collection('providers');
  if (category) query = query.where('category', '==', category);
  if (status) query = query.where('status', '==', status);
  // Limitar resultados para evitar sobrecarga
  query = query.limit(Math.min(Math.max(Number(limit) || 20, 1), 100));
  const snap = await query.get();
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (q) {
    const matches = buildMatcher(q);
    items = items.filter((it) => {
      const nameMatch = matches(it.name);
      const locationMatch = matches(it.location);
      const categoryMatch = matches(it.category);
      const tagMatch = Array.isArray(it.tags) ? it.tags.some((tag) => matches(tag)) : false;
      const keywordMatch = Array.isArray(it.keywords) ? it.keywords.some((tag) => matches(tag)) : false;
      const servicesMatch = Array.isArray(it.services)
        ? it.services.some((svc) => matches(svc?.name) || matches(svc?.description))
        : false;
      return nameMatch || locationMatch || categoryMatch || tagMatch || keywordMatch || servicesMatch;
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

export default router;
// GET /api/providers/:id/status
// Aggrega estado de contratos y pagos relacionados con el proveedor (sin procesar pagos)
const statusParams = z.object({ id: z.string().min(1) });
router.get('/:id/status', validate(statusParams, 'params'), async (req, res) => {
  try {
    const id = req.params.id;

    // Contratos por proveedor
    let contractsSnap = { empty: true, docs: [] };
    try {
      contractsSnap = await admin.firestore().collection('contracts').where('providerId', '==', id).limit(500).get();
    } catch {}
    const contracts = contractsSnap.empty ? [] : contractsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const cByStatus = { draft: 0, sent: 0, signed: 0, cancelled: 0 };
    let cAmountSigned = 0;
    let lastContractUpdate = null;
    for (const c of contracts) {
      const st = String(c.status || 'draft');
      if (Object.prototype.hasOwnProperty.call(cByStatus, st)) cByStatus[st] += 1;
      if (st === 'signed' && typeof c.amount === 'number') cAmountSigned += Number(c.amount) || 0;
      const ts = c.updatedAt?.toDate?.() || c.updatedAt || c.createdAt?.toDate?.() || c.createdAt || null;
      if (ts && (!lastContractUpdate || ts > lastContractUpdate)) lastContractUpdate = ts;
    }

    // Pagos por proveedor (vía metadata o providerId en el pago si existe)
    let paymentsSnap = { empty: true, docs: [] };
    try {
      // Intento principal: payments con providerId directo
      paymentsSnap = await admin.firestore().collection('payments').where('providerId', '==', id).limit(1000).get();
      if (paymentsSnap.empty) {
        // Fallback: si no hay providerId directo, recuperar por contratos del proveedor
        const contractIds = new Set(contracts.map((c) => c.id));
        if (contractIds.size) {
          // No hay where IN garantizado en el mock; cargamos y filtramos localmente (limit 1000 para no explotar)
          const allPay = await admin.firestore().collection('payments').limit(1000).get();
          const docs = [];
          allPay.docs.forEach((doc) => {
            const d = doc.data() || {};
            if (d.contractId && contractIds.has(d.contractId)) docs.push({ id: doc.id, ...d });
          });
          paymentsSnap = { empty: docs.length === 0, docs: docs.map((d) => ({ id: d.id, data: () => ({ ...d }) })) };
        }
      }
    } catch {}

    const payments = paymentsSnap.empty ? [] : paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const pByStatus = { pending: 0, authorized: 0, paid: 0, failed: 0, refunded: 0 };
    let paid = 0, pending = 0, failed = 0;
    let lastPaymentUpdate = null;
    for (const p of payments) {
      const st = String(p.status || 'pending');
      if (Object.prototype.hasOwnProperty.call(pByStatus, st)) pByStatus[st] += 1;
      const amt = Number(p.amount || 0) || 0;
      if (st === 'paid') paid += amt;
      else if (st === 'pending' || st === 'authorized') pending += amt;
      else if (st === 'failed') failed += amt;
      const ts = p.updatedAt?.toDate?.() || p.updatedAt || p.createdAt?.toDate?.() || p.createdAt || null;
      if (ts && (!lastPaymentUpdate || ts > lastPaymentUpdate)) lastPaymentUpdate = ts;
    }

    return res.json({
      providerId: id,
      contracts: {
        total: contracts.length,
        byStatus: cByStatus,
        amountSigned: cAmountSigned,
        lastUpdate: lastContractUpdate ? new Date(lastContractUpdate).toISOString() : null,
      },
      payments: {
        total: payments.length,
        byStatus: pByStatus,
        amount: { paid, pending, failed },
        lastUpdate: lastPaymentUpdate ? new Date(lastPaymentUpdate).toISOString() : null,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e?.message || 'internal' });
  }
});
