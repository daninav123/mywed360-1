import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../db.js';

export const DELIVERABILITY_COLLECTION = 'emailDeliverability';
const MAX_EVENT_HISTORY = 50;

function normalizeEventName(event) {
  if (typeof event !== 'string') return 'unknown';
  return event.trim().toLowerCase();
}

function sanitizeRecipient(value) {
  if (!value) return null;
  return String(value).trim().toLowerCase();
}

function sanitizeReason(value) {
  if (!value) return null;
  const text = String(value).trim();
  return text || null;
}

function sanitizeCode(value) {
  if (!value) return null;
  const code = parseInt(value, 10);
  if (Number.isNaN(code)) return null;
  return code;
}

function buildEventObject(payload) {
  const eventName = normalizeEventName(payload.event);
  const timestampMs = Number(payload.timestamp);
  const timestampIso = Number.isFinite(timestampMs)
    ? new Date(timestampMs).toISOString()
    : new Date().toISOString();

  return {
    event: eventName,
    recipient: sanitizeRecipient(payload.recipient),
    timestamp: timestampIso,
    severity: payload.severity || null,
    reason: sanitizeReason(payload.reason || payload.description || payload['reject-reason']),
    code: sanitizeCode(payload.code || payload['delivery-status-code']),
    message: sanitizeReason(payload.message || payload.error || payload['delivery-status-message']),
    storage: payload.storage || null,
    webhookId: payload.signatureId || null,
  };
}

function getIncrementFields(eventName) {
  const increments = {
    'counts.total': FieldValue.increment(1),
  };

  switch (eventName) {
    case 'delivered':
      increments['counts.delivered'] = FieldValue.increment(1);
      break;
    case 'failed':
    case 'temporary_fail':
    case 'permanent_fail':
      increments['counts.failed'] = FieldValue.increment(1);
      break;
    case 'complained':
    case 'spam':
      increments['counts.complained'] = FieldValue.increment(1);
      break;
    case 'opened':
      increments['counts.opened'] = FieldValue.increment(1);
      break;
    case 'clicked':
      increments['counts.clicked'] = FieldValue.increment(1);
      break;
    default:
      increments[`counts.${eventName}`] = FieldValue.increment(1);
      break;
  }

  return increments;
}

export async function recordDeliverabilityEvent(payload) {
  const messageId = (payload['message-id'] || payload.messageId || payload['Message-Id'] || '').trim();
  if (!messageId) {
    return { recorded: false, reason: 'missing_message_id' };
  }

  const event = buildEventObject(payload);
  const docRef = db.collection(DELIVERABILITY_COLLECTION).doc(messageId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const existing = snap.exists ? snap.data() || {} : {};
    const currentEvents = Array.isArray(existing.events) ? existing.events.slice(-MAX_EVENT_HISTORY + 1) : [];
    currentEvents.push(event);

    const updateData = {
      messageId,
      events: currentEvents,
      lastStatus: event.event,
      lastEventAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastRecipient: event.recipient || existing.lastRecipient || null,
      lastReason: event.reason || existing.lastReason || null,
      lastSeverity: event.severity || existing.lastSeverity || null,
    };

    if (!snap.exists) {
      updateData.createdAt = FieldValue.serverTimestamp();
      updateData.firstEventAt = FieldValue.serverTimestamp();
    }

    const increments = getIncrementFields(event.event);

    tx.set(
      docRef,
      {
        ...updateData,
        ...increments,
      },
      { merge: true },
    );
  });

  return { recorded: true };
}
