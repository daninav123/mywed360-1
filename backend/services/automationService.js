// Automation Rules Service - Reglas de automatización para notificaciones y acciones
// Nota: Este servicio usa Firebase Admin inicializado por authMiddleware

import admin from 'firebase-admin';
import logger from '../utils/logger.js';

const colForWedding = (weddingId) =>
  admin.firestore().collection('weddings').doc(String(weddingId));

export async function listRules(weddingId) {
  if (!weddingId) throw new Error('weddingId requerido');
  const snap = await colForWedding(weddingId).collection('automationRules').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function upsertRule(weddingId, rule) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!rule || !rule.id) {
    const ref = await colForWedding(weddingId)
      .collection('automationRules')
      .add({
        ...rule,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    return { id: ref.id, ...rule };
  }
  await colForWedding(weddingId)
    .collection('automationRules')
    .doc(rule.id)
    .set(
      {
        ...rule,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  return rule;
}

// Evaluar un disparador y devolver acciones recomendadas (no envía notificaciones)
export async function evaluateTrigger(weddingId, trigger) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!trigger || !trigger.type) throw new Error('trigger.type requerido');
  const rules = await listRules(weddingId);

  const actions = [];
  for (const rule of rules) {
    try {
      if (!rule.enabled) continue;
      // Regla tipo date_relative sobre rsvp_deadline (ejemplo del doc flujo-12)
      if (rule.trigger?.type === 'date_relative' && trigger.type === 'rsvp_deadline') {
        // Simple: si falta <= rule.trigger.offset días, emitir acción
        const daysBefore = Number(rule.trigger.offset || -7);
        const now = new Date();
        const deadline = new Date(trigger.deadline || now);
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= Math.abs(daysBefore)) {
          actions.push({
            type: 'send_notification',
            channel: 'email',
            template: 'rsvp_reminder',
            metadata: { diffDays, deadline: deadline.toISOString() },
          });
        }
      }
      // Expandir con otros tipos (tasks, finance, providers) cuando sea necesario
    } catch (e) {
      logger.warn('evaluateTrigger rule error:', e?.message || e);
    }
  }
  return { actions, evaluated: rules.length };
}

export async function health() {
  try {
    await admin.firestore().collection('health').limit(1).get();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
}
