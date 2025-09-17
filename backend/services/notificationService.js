import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Crea una notificación genérica en Firestore con soporte de payload estructurado.
 * @param {Object} params
 * @param {string} params.type - info|event|email|provider|system|warning
 * @param {string} params.message
 * @param {Object} [params.payload] - datos adicionales (e.g., {kind:'meeting', ...})
 * @returns {Promise<string>} notificationId
 */
export async function createNotification({ type = 'info', message, payload = {} }) {
  if (!message) throw new Error('message is required');
  const date = new Date().toISOString();
  const ref = await db.collection('notifications').add({
    type,
    message,
    date,
    read: false,
    payload,
    createdAt: FieldValue.serverTimestamp(),
  });
  try { await ref.update({ id: ref.id }); } catch {}
  return ref.id;
}

export default { createNotification };

