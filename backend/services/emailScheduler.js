import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../db.js';
import { sendMailAndPersist } from './mailSendService.js';

export const QUEUE_COLLECTION = 'emailAutomationQueue';
export const DEFAULT_PROCESS_LIMIT = 25;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MINUTES = 5;
export const AUDIT_COLLECTION = 'emailScheduledAudit';
const AUDIT_MAX_ENTRIES = 200;

function toIsoDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (value instanceof Date) {
    try {
      return value.toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

/**
 * Procesa los correos programados vencidos en la cola principal.
 *
 * @param {Object} [options]
 * @param {number} [options.limit=DEFAULT_PROCESS_LIMIT] - Número máximo de items a procesar.
 * @param {boolean} [options.dryRun=false] - Si es true, no envía correos; solo retorna los items detectados.
 * @param {Date} [options.now=new Date()] - Fecha de referencia para filtrar programados (solo para tests).
 * @returns {Promise<{processed:number,dryRun:boolean,results:Array}>}
 */
export async function processScheduledEmailQueue({
  limit = DEFAULT_PROCESS_LIMIT,
  dryRun = false,
  now = new Date(),
} = {}) {
  const startedAt = Date.now();
  const queueRef = db.collection(QUEUE_COLLECTION);
  const dueSnapshot = await queueRef
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', now)
    .orderBy('scheduledAt', 'asc')
    .limit(limit)
    .get();

  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const doc of dueSnapshot.docs) {
    const baseData = doc.data() || {};

    if (dryRun) {
      results.push({
        id: doc.id,
        status: 'scheduled',
        scheduledAt: toIsoDate(baseData.scheduledAt),
      });
      continue;
    }

    const transactionData = await db.runTransaction(async (tx) => {
      const snap = await tx.get(doc.ref);
      if (!snap.exists) return null;
      const data = snap.data() || {};
      if (data.status !== 'scheduled') return null;

      tx.update(doc.ref, {
        status: 'processing',
        attempts: FieldValue.increment(1),
        lastAttemptAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return data;
    });

    if (!transactionData) {
      results.push({ id: doc.id, status: 'skipped' });
      skippedCount += 1;
      continue;
    }

    const attempts = (transactionData.attempts || 0) + 1;
    const payload = transactionData.payload || {};
    const ownerUid = transactionData.ownerUid || null;

    if (!payload.to || !payload.subject || !payload.body) {
      await doc.ref.update({
        status: 'failed',
        lastError: 'invalid_payload',
        updatedAt: FieldValue.serverTimestamp(),
        failedAt: FieldValue.serverTimestamp(),
      });
      results.push({ id: doc.id, status: 'failed', error: 'invalid_payload' });
      failedCount += 1;
      continue;
    }

    try {
      const sendResult = await sendMailAndPersist({
        ownerUid,
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        from: payload.from,
        attachments: payload.attachments,
        cc: payload.cc,
        bcc: payload.bcc,
        replyTo: payload.replyTo,
        recordOnly: Boolean(payload.recordOnly),
        metadata: {
          ...(payload.metadata || {}),
          scheduleId: doc.id,
        },
      });

      await doc.ref.update({
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        messageId: sendResult.messageId || null,
        lastError: null,
      });

      results.push({
        id: doc.id,
        status: 'sent',
        messageId: sendResult.messageId || null,
      });
      successCount += 1;
    } catch (error) {
      const nextStatus = attempts >= MAX_ATTEMPTS ? 'failed' : 'scheduled';
      const update = {
        status: nextStatus,
        attempts,
        lastError: error?.message || 'send_failed',
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (nextStatus === 'scheduled') {
        update.scheduledAt = new Date(Date.now() + RETRY_DELAY_MINUTES * 60 * 1000);
      } else {
        update.failedAt = FieldValue.serverTimestamp();
      }

      await doc.ref.update(update);
      results.push({
        id: doc.id,
        status: nextStatus,
        error: error?.message || 'send_failed',
      });

      if (nextStatus === 'failed') {
        failedCount += 1;
      } else {
        skippedCount += 1;
      }
    }
  }

  if (!dryRun && results.length) {
    try {
      const durationMs = Date.now() - startedAt;
      await db.collection(AUDIT_COLLECTION).add({
        processed: results.length,
        successCount,
        failedCount,
        skippedCount,
        limit,
        durationMs,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
      });

      const auditSnapshot = await db
        .collection(AUDIT_COLLECTION)
        .orderBy('createdAt', 'desc')
        .offset(AUDIT_MAX_ENTRIES)
        .limit(50)
        .get();

      if (!auditSnapshot.empty) {
        const batch = db.batch();
        auditSnapshot.docs.forEach((item) => batch.delete(item.ref));
        await batch.commit();
      }
    } catch (auditError) {
      console.warn('[email-scheduler] No se pudo registrar el audit log', auditError);
    }
  }

  return {
    processed: results.length,
    dryRun,
    results,
  };
}
