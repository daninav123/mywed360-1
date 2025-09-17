import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../logger.js';

/**
 * Try to parse a date-time string into Date, return null if invalid
 */
function parseDateMaybe(v) {
  try {
    if (!v) return null;
    // Accept nested structures from insights: { date, when, start }
    if (typeof v === 'object' && v !== null) {
      const candidate = v.start || v.date || v.when || v.whenText || v.time || v;
      return parseDateMaybe(candidate);
    }
    const d = new Date(String(v));
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/**
 * Ensure reasonable start/end for a 1h meeting given an input date string.
 */
function computeMeetingWindow(dateLike) {
  const start = parseDateMaybe(dateLike) || new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

/**
 * Find supplierId for a wedding using sender email or provided hints.
 */
async function resolveSupplierId({ weddingId, senderEmail, supplierHint }) {
  try {
    if (!weddingId) return null;
    let supplierId = null;
    const col = db
      .collection('weddings')
      .doc(weddingId)
      .collection('suppliers');

    // 1) Supplier by exact email
    if (senderEmail) {
      const snap = await col.where('email', '==', senderEmail).limit(1).get();
      if (!snap.empty) return snap.docs[0].id;
    }

    // 2) Supplier by name hint
    if (supplierHint) {
      const snap = await col.limit(50).get();
      const low = String(supplierHint).toLowerCase();
      let best = null;
      snap.forEach((d) => {
        const data = d.data() || {};
        const name = (data.name || data.providerName || '').toLowerCase();
        if (name && (name.includes(low) || low.includes(name))) {
          best = best || d.id;
        }
      });
      if (best) return best;
    }

    return null;
  } catch (e) {
    logger.warn('[emailActionRouter] resolveSupplierId failed:', e?.message || e);
    return null;
  }
}

/**
 * Create a meeting under weddings/{weddingId}/meetings
 */
async function createMeeting({ weddingId, title, when, mailId, category, supplierId }) {
  if (!weddingId) return null;
  const { start, end } = computeMeetingWindow(when);
  const payload = {
    title: title || 'Reunión',
    start,
    end,
    category: category || 'OTROS',
    type: 'meeting',
    source: { type: 'email', mailId },
    supplierId: supplierId || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await db
    .collection('weddings')
    .doc(weddingId)
    .collection('meetings')
    .doc();
  await ref.set(payload, { merge: true });
  return ref.id;
}

/**
 * Create a Gantt-like task under weddings/{weddingId}/tasks
 */
async function createTask({ weddingId, title, due, mailId, category, supplierId }) {
  if (!weddingId) return null;
  // Use due date, fallback today
  const start = parseDateMaybe(due) || new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const payload = {
    title: title || 'Tarea',
    name: title || 'Tarea',
    desc: '',
    start,
    end,
    long: true,
    category: category || 'OTROS',
    source: { type: 'email', mailId },
    supplierId: supplierId || null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await db
    .collection('weddings')
    .doc(weddingId)
    .collection('tasks')
    .doc();
  await ref.set(payload, { merge: true });
  return ref.id;
}

/**
 * Save or update a supplier budget and apply acceptance effects.
 */
async function upsertSupplierBudget({
  weddingId,
  supplierId,
  description,
  amount,
  currency = 'EUR',
  status = 'pending',
  mailId,
}) {
  if (!weddingId || !supplierId) return null;
  const budgetsCol = db
    .collection('weddings')
    .doc(weddingId)
    .collection('suppliers')
    .doc(supplierId)
    .collection('budgets');

  // Try to find existing by same description and close amount (string or number)
  let amountNum = null;
  try {
    amountNum = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9.,-]/g, '').replace(',', '.'));
    if (!isFinite(amountNum)) amountNum = null;
  } catch {}

  let targetDocId = null;
  try {
    const snap = await budgetsCol.limit(25).get();
    const norm = (s) => String(s || '').trim().toLowerCase();
    const descNorm = norm(description);
    snap.forEach((d) => {
      const data = d.data() || {};
      if (descNorm && norm(data.description) === descNorm) {
        // optional amount proximity check
        if (amountNum && typeof data.amount === 'number') {
          const diff = Math.abs(data.amount - amountNum);
          if (diff <= Math.max(5, data.amount * 0.02)) {
            targetDocId = targetDocId || d.id;
          }
        } else {
          targetDocId = targetDocId || d.id;
        }
      }
    });
  } catch {}

  const docRef = targetDocId ? budgetsCol.doc(targetDocId) : budgetsCol.doc();
  const payload = {
    description,
    amount: amountNum ?? amount,
    currency,
    status,
    emailId: mailId,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!targetDocId) payload.createdAt = FieldValue.serverTimestamp();

  await docRef.set(payload, { merge: true });

  // If accepted, create a finance transaction
  if (status === 'accepted') {
    try {
      const txRef = db
        .collection('weddings')
        .doc(weddingId)
        .collection('transactions')
        .doc();
      await txRef.set({
        supplierId,
        budgetId: docRef.id,
        amount: amountNum ?? amount,
        currency,
        description,
        type: 'expense',
        source: { type: 'email', mailId },
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      logger.warn('[emailActionRouter] could not create finance transaction for accepted budget:', e?.message || e);
    }
  }

  return docRef.id;
}

/**
 * Apply AI insights to system entities (tasks, meetings, budgets) derived from an inbound email.
 */
export async function applyEmailInsightsToSystem({
  weddingId,
  sender,
  mailId,
  insights,
  subject,
}) {
  if (!weddingId || !insights) return { meetings: 0, tasks: 0, budgets: 0 };

  let appliedMeetings = 0;
  let appliedTasks = 0;
  let appliedBudgets = 0;

  // Resolve supplier once if possible
  let resolvedSupplierId = null;
  try {
    resolvedSupplierId = await resolveSupplierId({
      weddingId,
      senderEmail: sender,
      supplierHint: insights?.budgets?.[0]?.client || insights?.budgets?.[0]?.supplier || null,
    });
  } catch {}
  // Stamp supplierId on mail if found
  try {
    if (resolvedSupplierId) {
      await db.collection('mails').doc(mailId).set({ supplierId: resolvedSupplierId }, { merge: true });
    }
  } catch {}

  // Meetings
  try {
    const meetings = Array.isArray(insights.meetings) ? insights.meetings : [];
    for (const m of meetings) {
      const when = m?.start || m?.date || m?.when || null;
      const title = m?.title || subject || 'Reunión';
      if (!when && !title) continue;
      await createMeeting({ weddingId, title, when, mailId, supplierId: resolvedSupplierId });
      appliedMeetings++;
    }
  } catch (e) {
    logger.warn('[emailActionRouter] meetings apply failed:', e?.message || e);
  }

  // Tasks -> create Gantt tasks (long) or short meetings if only due date
  try {
    const tasks = Array.isArray(insights.tasks) ? insights.tasks : [];
    for (const t of tasks) {
      const title = t?.title || 'Tarea';
      const due = t?.due || null;
      // If due provided, we can also create a small meeting as a reminder in calendar
      if (due) {
        try { await createMeeting({ weddingId, title, when: due, mailId, category: 'TAREAS', supplierId: resolvedSupplierId }); } catch {}
      }
      await createTask({ weddingId, title, due, mailId, category: 'TAREAS', supplierId: resolvedSupplierId });
      appliedTasks++;
    }
  } catch (e) {
    logger.warn('[emailActionRouter] tasks apply failed:', e?.message || e);
  }

  // Budgets -> link to supplier
  try {
    const budgets = Array.isArray(insights.budgets) ? insights.budgets : [];
    if (budgets.length) {
      const supplierId = resolvedSupplierId || await resolveSupplierId({
        weddingId,
        senderEmail: sender,
        supplierHint: budgets[0]?.client || budgets[0]?.supplier || null,
      });
      // Stamp supplierId on the mail itself for better linkage
      try {
        if (supplierId) {
          await db.collection('mails').doc(mailId).set({ supplierId }, { merge: true });
        }
      } catch {}
      for (const b of budgets) {
        const status = (b?.status || '').toString().toLowerCase();
        const normalizedStatus = ['accepted', 'rejected', 'pending'].includes(status)
          ? status
          : (/aceptad/i.test(status || subject || '') ? 'accepted'
            : (/rechazad|declin|denegad/i.test(status || subject || '') ? 'rejected' : 'pending'));
        await upsertSupplierBudget({
          weddingId,
          supplierId: supplierId || (b?.supplierId || b?.clientId) || 'unknown',
          description: b?.description || subject || 'Presupuesto',
          amount: b?.amount,
          currency: b?.currency || 'EUR',
          status: normalizedStatus,
          mailId,
        });
        appliedBudgets++;
      }
    }
  } catch (e) {
    logger.warn('[emailActionRouter] budgets apply failed:', e?.message || e);
  }

  return { meetings: appliedMeetings, tasks: appliedTasks, budgets: appliedBudgets };
}

export default {
  applyEmailInsightsToSystem,
};
