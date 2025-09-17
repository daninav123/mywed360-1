import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = express.Router();

// POST /api/email-actions/accept-meeting
// Body: { weddingId, mailId, title, when }
router.post('/accept-meeting', async (req, res) => {
  try {
    const { weddingId, mailId, title = 'Reunión', when } = req.body || {};
    if (!weddingId || !when) return res.status(400).json({ error: 'weddingId and when required' });
    const start = new Date(when);
    if (isNaN(start)) return res.status(400).json({ error: 'invalid date' });
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const ref = await db
      .collection('weddings').doc(weddingId)
      .collection('meetings').doc();
  const payload = {
    title,
    start,
    end,
    type: 'meeting',
    source: { type: 'email', mailId },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload, { merge: true });
    // También añadir a la lista de tareas (mismo rango de tiempo)
    try {
      const taskRef = db
        .collection('weddings').doc(weddingId)
        .collection('tasks').doc();
      await taskRef.set({
        title,
        name: title,
        desc: 'Reunión aceptada desde notificación',
        start,
        end,
        long: false,
        category: 'REUNIONES',
        type: 'task',
        source: { type: 'email', mailId },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch {}
  return res.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('accept-meeting failed', e);
    return res.status(500).json({ error: 'internal' });
  }
});

// POST /api/email-actions/accept-budget
// Body: { weddingId, emailId, amount, currency, description, supplierId?, budgetId? }
router.post('/accept-budget', async (req, res) => {
  try {
    const { weddingId, budgetId, emailId } = req.body || {};
    if (!weddingId) return res.status(400).json({ error: 'weddingId required' });
    // If budgetId not provided, try find by emailId
    let target = budgetId || null;
    if (!target && emailId) {
      const col = db.collection('weddings').doc(weddingId).collection('suppliers');
      const supSnap = await col.get();
      for (const sup of supSnap.docs) {
        const bs = await sup.ref.collection('budgets').where('emailId', '==', emailId).limit(1).get();
        if (!bs.empty) { target = bs.docs[0].id; break; }
      }
    }
    if (!target) return res.status(404).json({ error: 'budget not found' });

    // Find supplier doc containing this budget
    const supSnap = await db.collection('weddings').doc(weddingId).collection('suppliers').get();
    let supplierId = null;
    for (const sup of supSnap.docs) {
      const exists = await sup.ref.collection('budgets').doc(target).get();
      if (exists.exists) { supplierId = sup.id; break; }
    }
    if (!supplierId) return res.status(404).json({ error: 'supplier for budget not found' });

    await db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId).collection('budgets').doc(target).set({ status: 'accepted', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    // Create finance transaction
    try {
      const bud = await db.collection('weddings').doc(weddingId).collection('suppliers').doc(supplierId).collection('budgets').doc(target).get();
      const b = bud.data() || {};
      await db.collection('weddings').doc(weddingId).collection('transactions').add({
        supplierId,
        budgetId: target,
        amount: b.amount,
        currency: b.currency || 'EUR',
        description: b.description || 'Presupuesto',
        type: 'expense',
        createdAt: FieldValue.serverTimestamp(),
        source: { type: 'email', emailId },
      });
    } catch {}
    return res.json({ ok: true, budgetId: target });
  } catch (e) {
    console.error('accept-budget failed', e);
    return res.status(500).json({ error: 'internal' });
  }
});

// POST /api/email-actions/accept-task
// Body: { weddingId, mailId, title, due?, priority? }
router.post('/accept-task', async (req, res) => {
  try {
    const { weddingId, mailId, title = 'Tarea', due, priority = 'media' } = req.body || {};
    if (!weddingId || !title) return res.status(400).json({ error: 'weddingId and title required' });
    const start = due ? new Date(due) : new Date();
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const taskRef = db
      .collection('weddings').doc(weddingId)
      .collection('tasks').doc();
    const payload = {
      title,
      name: title,
      desc: 'Generada desde email',
      start,
      end,
      long: true,
      category: 'EMAIL',
      priority,
      source: { type: 'email', mailId },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (due) {
      try {
        payload.due = new Date(due);
      } catch {}
    }
    await taskRef.set(payload, { merge: true });

    return res.json({ ok: true, id: taskRef.id });
  } catch (e) {
    console.error('accept-task failed', e);
    return res.status(500).json({ error: 'internal' });
  }
});


export default router;
