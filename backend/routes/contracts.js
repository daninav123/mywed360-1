import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

// GET /api/contracts
router.get('/', async (req, res) => {
  try {
    const snap = await admin.firestore().collection('contracts').limit(200).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'list-failed' });
  }
});

// POST /api/contracts
router.post('/', express.json(), async (req, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title requerido' });
    let now;
    try { now = admin.firestore.FieldValue.serverTimestamp(); } catch { try { now = admin.firestore().FieldValue.serverTimestamp(); } catch { now = new Date(); } }
    const doc = {
      title,
      providerId: b.providerId || null,
      weddingId: b.weddingId || null,
      status: ['draft', 'sent', 'signed', 'cancelled'].includes(b.status) ? b.status : 'draft',
      amount: typeof b.amount === 'number' ? b.amount : null,
      currency: b.currency || 'EUR',
      templateId: b.templateId || null,
      createdAt: now,
      updatedAt: now,
      signedAt: null,
    };
    const ref = await admin.firestore().collection('contracts').add(doc);
    res.status(201).json({ id: ref.id });
  } catch (e) {
    res.status(500).json({ error: 'create-failed' });
  }
});

// GET /api/contracts/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const snap = await admin.firestore().collection('contracts').doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: 'not_found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch (e) {
    res.status(500).json({ error: 'get-failed' });
  }
});

// PATCH /api/contracts/:id
router.patch('/:id', express.json(), async (req, res) => {
  try {
    const id = req.params.id;
    const allowed = ['title', 'providerId', 'weddingId', 'status', 'amount', 'currency', 'templateId'];
    const patch = req.body || {};
    const data = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) data[k] = patch[k];
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      const st = data.status;
      if (!['draft', 'sent', 'signed', 'cancelled'].includes(st)) return res.status(400).json({ error: 'status inválido' });
    }
    try { data.updatedAt = admin.firestore.FieldValue.serverTimestamp(); }
    catch { try { data.updatedAt = admin.firestore().FieldValue.serverTimestamp(); } catch { data.updatedAt = new Date(); } }
    await admin.firestore().collection('contracts').doc(id).set(data, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'update-failed' });
  }
});

// POST /api/contracts/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const id = req.params.id;
    const ref = admin.firestore().collection('contracts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'not_found' });
    let ts;
    try { ts = admin.firestore.FieldValue.serverTimestamp(); }
    catch { try { ts = admin.firestore().FieldValue.serverTimestamp(); } catch { ts = new Date(); } }
    await ref.set({ status: 'sent', updatedAt: ts }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'send-failed' });
  }
});

export default router;
// Listar pagos asociados a un contrato
router.get('/:id/payments', async (req, res) => {
  try {
    const id = req.params.id;
    const snap = await admin.firestore().collection('payments').where('contractId', '==', id).limit(200).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    res.status(200).json({ items: [] });
  }
});
