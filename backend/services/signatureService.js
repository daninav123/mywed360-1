import admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';
import { sendMailAndPersist } from './mailSendService.js';

const weddingsCollection = () => admin.firestore().collection('weddings');
const weddingDoc = (weddingId) => weddingsCollection().doc(String(weddingId));

const DEFAULT_PORTAL = 'https://app.maloveapp.com/firma';

function sanitizeObject(value) {
  if (!value || typeof value !== 'object') return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function getSignaturePortalBase() {
  const candidates = [
    process.env.SIGNATURE_PORTAL_BASE_URL,
    process.env.PUBLIC_APP_URL ? `${process.env.PUBLIC_APP_URL.replace(/\/$/, '')}/firma` : null,
    process.env.FRONTEND_BASE_URL
      ? `${process.env.FRONTEND_BASE_URL.replace(/\/$/, '')}/firma`
      : null,
  ].filter(Boolean);
  const chosen = candidates.length ? candidates[0] : DEFAULT_PORTAL;
  return chosen.replace(/\/$/, '');
}

function deriveDocumentStatus(signers) {
  if (!Array.isArray(signers) || signers.length === 0) return 'pending';
  const statuses = signers.map((s) => String(s.status || 'pending').toLowerCase());
  if (statuses.every((st) => st === 'completed')) return 'completed';
  if (statuses.some((st) => st === 'declined')) return 'needs_attention';
  if (statuses.some((st) => st === 'sent' || st === 'viewed' || st === 'in_progress'))
    return 'in_progress';
  return statuses.some((st) => st !== 'pending') ? 'in_progress' : 'pending';
}

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value;
  if (value instanceof Date) return admin.firestore.Timestamp.fromDate(value);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return admin.firestore.Timestamp.fromMillis(value);
  }
  if (typeof value === 'string') {
    if (value === 'now') return admin.firestore.Timestamp.now();
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return admin.firestore.Timestamp.fromDate(parsed);
    }
  }
  return null;
}

async function getWeddingInfo(weddingId) {
  if (!weddingId) return {};
  try {
    const snap = await weddingDoc(weddingId).get();
    if (!snap.exists) return {};
    const data = snap.data() || {};
    const nameCandidates = [
      data.title,
      data.titulo,
      data.name,
      data.nombre,
      data.slug,
      data.weddingName,
      data.eventName,
      data.coupleName,
      data?.couple?.name,
    ].filter(Boolean);
    let composedName = nameCandidates.length ? String(nameCandidates[0]) : null;
    if (!composedName) {
      const couple = [data.brideName, data.groomName, data.novia, data.novio].filter(Boolean);
      if (couple.length >= 2) {
        composedName = `${couple[0]} & ${couple[1]}`;
      } else if (couple.length === 1) {
        composedName = couple[0];
      }
    }
    return {
      name: composedName || null,
      date: data.eventDate || data.date || data.fecha || null,
    };
  } catch (err) {
    logger.warn(
      '[signatureService] No se pudo obtener información de la boda',
      weddingId,
      err?.message || err
    );
    return {};
  }
}

function buildEmailBody({ signerName, docTitle, signUrl, actorName, weddingName }) {
  const safeActor = actorName || 'el equipo de MaLoveApp';
  const safeTitle = docTitle || 'Documento a firmar';
  const safeSigner = signerName || 'Hola';
  const lines = [
    `${safeSigner},`,
    '',
    `${safeActor} te ha invitado a revisar y firmar "${safeTitle}"${weddingName ? ` para la boda ${weddingName}` : ''}.`,
    'Haz clic en el siguiente enlace para acceder al documento:',
    signUrl,
    '',
    'El enlace es personal y debes usarlo para completar la firma.',
    '',
    'Si tienes dudas, puedes responder a este correo.',
    '',
    'Gracias,',
    safeActor,
  ];
  return lines.join('\n');
}

async function dispatchSignatureEmails({
  signers,
  documentMeta,
  weddingId,
  requestId,
  actor,
  disableEmail,
}) {
  const summary = {
    total: Array.isArray(signers) ? signers.length : 0,
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    disabled: false,
    reason: null,
    details: [],
    sentSignerIds: [],
  };

  if (!Array.isArray(signers) || signers.length === 0) {
    summary.reason = 'no-signers';
    return summary;
  }

  const emailDisabledEnv =
    String(process.env.SIGNATURE_EMAIL_DISABLED || '').toLowerCase() === 'true' ||
    String(process.env.DISABLE_SIGNATURE_EMAIL || '').toLowerCase() === 'true';

  if (disableEmail || emailDisabledEnv) {
    summary.disabled = true;
    summary.reason = 'email-disabled';
    summary.skipped = signers.length;
    summary.details = signers.map((signer) => ({
      signerId: signer.id,
      status: 'skipped',
      reason: 'email-disabled',
    }));
    return summary;
  }

  const hasEmails = signers.some((signer) => signer.originalEmail || signer.email);
  if (!hasEmails) {
    summary.reason = 'missing-email';
    summary.skipped = signers.length;
    summary.details = signers.map((signer) => ({
      signerId: signer.id,
      status: 'skipped',
      reason: 'missing-email',
    }));
    return summary;
  }

  const portalBase = getSignaturePortalBase();
  const weddingInfo = await getWeddingInfo(weddingId);
  const docTitle = documentMeta?.title || documentMeta?.name || 'Documento a firmar';
  const actorName = actor?.name || actor?.email || 'Equipo MaLoveApp';
  const sentIds = new Set();

  await Promise.all(
    signers.map(async (signer) => {
      const recipientEmail = (signer.originalEmail || signer.email || '').trim();
      if (!recipientEmail) {
        summary.skipped += 1;
        summary.details.push({
          signerId: signer.id,
          status: 'skipped',
          reason: 'missing-email',
        });
        return;
      }

      summary.attempted += 1;
      const signUrl = signer.signUrl || `${portalBase}/${signer.token}`;
      const subject = `[Firma requerida] ${docTitle}`;
      const body = buildEmailBody({
        signerName: signer.name,
        docTitle,
        signUrl,
        actorName,
        weddingName: weddingInfo.name,
      });

      try {
        await sendMailAndPersist({
          ownerUid: actor?.uid || null,
          ownerProfile: actor || null,
          to: recipientEmail,
          subject,
          body,
          metadata: {
            channel: 'signature',
            weddingId,
            signatureId: requestId,
            signerId: signer.id,
            signUrl,
          },
        });
        sentIds.add(signer.id);
        summary.sent += 1;
        summary.details.push({
          signerId: signer.id,
          status: 'sent',
        });
      } catch (err) {
        summary.failed += 1;
        const message = err?.message || String(err);
        logger.error('[signatureService] Error enviando correo de firma', {
          email: recipientEmail,
          error: message,
        });
        summary.details.push({
          signerId: signer.id,
          status: 'failed',
          error: message,
        });
      }
    })
  );

  summary.sentSignerIds = Array.from(sentIds);
  return summary;
}

export async function createSignatureRequest(weddingId, documentMeta, signers = [], options = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!Array.isArray(signers) || signers.length === 0) {
    throw new Error('Se requiere al menos un firmante');
  }

  const actor = options.actor || {};
  const disableEmail = options.disableEmail === true;
  const portalBase = getSignaturePortalBase();
  const normalizedMeta =
    documentMeta && typeof documentMeta === 'object' ? sanitizeObject(documentMeta) : null;

  const signatureId = `sig_${Date.now()}_${randomUUID()}`;
  const createdAt = admin.firestore.FieldValue.serverTimestamp();

  const normalizedSigners = signers.map((signer, index) => {
    const signerId = signer?.id || `signer_${index + 1}`;
    const token = randomUUID().replace(/-/g, '');
    const baseEmail = (signer?.email || '').trim();
    return {
      id: signerId,
      name: signer?.name || '',
      email: baseEmail ? baseEmail.toLowerCase() : '',
      originalEmail: baseEmail || null,
      role: signer?.role || 'participant',
      status: 'pending',
      token,
      signUrl: `${portalBase}/${token}`,
      lastNotifiedAt: null,
      reminderCount: 0,
      completedAt: null,
      metadata: signer?.metadata ? sanitizeObject(signer.metadata) : null,
    };
  });

  const requestPayload = {
    id: signatureId,
    weddingId: String(weddingId),
    documentId: normalizedMeta?.id || null,
    documentMeta: normalizedMeta,
    title: normalizedMeta?.title || 'Documento a firmar',
    status: 'pending',
    signers: normalizedSigners,
    createdAt,
    updatedAt: createdAt,
    createdBy:
      actor && (actor.uid || actor.email || actor.name)
        ? {
            uid: actor.uid || null,
            email: actor.email || null,
            name: actor.name || null,
            role: actor.role || null,
          }
        : null,
    lastDispatch: null,
  };

  const signatureRef = weddingDoc(weddingId).collection('signatures').doc(signatureId);
  await signatureRef.set(requestPayload);

  const dispatchSummary = await dispatchSignatureEmails({
    signers: normalizedSigners,
    documentMeta: normalizedMeta,
    weddingId,
    requestId: signatureId,
    actor,
    disableEmail,
  });

  let statusToPersist = requestPayload.status;
  let signersToPersist = normalizedSigners;
  const counts = {
    total: dispatchSummary.total,
    attempted: dispatchSummary.attempted,
    sent: dispatchSummary.sent,
    failed: dispatchSummary.failed,
    skipped: dispatchSummary.skipped,
    disabled: dispatchSummary.disabled,
    reason: dispatchSummary.reason,
  };

  if (dispatchSummary.sentSignerIds.length) {
    const nowTs = admin.firestore.Timestamp.now();
    const sentSet = new Set(dispatchSummary.sentSignerIds);
    signersToPersist = normalizedSigners.map((signer) => {
      if (sentSet.has(signer.id)) {
        return {
          ...signer,
          status: 'sent',
          lastNotifiedAt: nowTs,
        };
      }
      return signer;
    });
    statusToPersist = deriveDocumentStatus(signersToPersist);
    await signatureRef.update({
      signers: signersToPersist,
      status: statusToPersist,
      lastDispatch: {
        at: nowTs,
        ...counts,
        actor:
          actor && (actor.uid || actor.email || actor.name)
            ? {
                uid: actor.uid || null,
                email: actor.email || null,
                name: actor.name || null,
              }
            : null,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    const nowTs = admin.firestore.Timestamp.now();
    await signatureRef.update({
      lastDispatch: {
        at: nowTs,
        ...counts,
        actor:
          actor && (actor.uid || actor.email || actor.name)
            ? {
                uid: actor.uid || null,
                email: actor.email || null,
                name: actor.name || null,
              }
            : null,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const fresh = await signatureRef.get();
  const saved = fresh.data() || {};
  return {
    id: fresh.id,
    ...saved,
    dispatchSummary: {
      ...counts,
      details: dispatchSummary.details,
      sentSignerIds: dispatchSummary.sentSignerIds,
    },
  };
}

export async function listSignatureRequests(weddingId, limit = 50) {
  if (!weddingId) throw new Error('weddingId requerido');
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const collection = weddingDoc(weddingId).collection('signatures');
  const snap = await collection.orderBy('createdAt', 'desc').limit(safeLimit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateSignatureStatus(weddingId, signatureId, updates = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!signatureId) throw new Error('signatureId requerido');

  const ref = weddingDoc(weddingId).collection('signatures').doc(signatureId);

  if (updates.signerId) {
    const signerId = updates.signerId;
    await admin.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('signature-not-found');
      const data = snap.data() || {};
      const signers = Array.isArray(data.signers) ? data.signers : [];
      const index = signers.findIndex((s) => s.id === signerId);
      if (index === -1) throw new Error('signer-not-found');

      const current = signers[index];
      const nextStatus = updates.status ? String(updates.status).toLowerCase() : current.status;
      const completedAt =
        toTimestamp(updates.completedAt) ||
        (nextStatus === 'completed' && !current.completedAt
          ? admin.firestore.Timestamp.now()
          : current.completedAt);
      const nowTs = admin.firestore.Timestamp.now();

      const updatedSigner = {
        ...current,
        status: nextStatus,
        completedAt: completedAt || null,
        signedFileUrl: updates.signedFileUrl || current.signedFileUrl || null,
        note: updates.note !== undefined ? updates.note : current.note || null,
        updatedAt: nowTs,
      };

      const updatedSigners = [...signers];
      updatedSigners[index] = updatedSigner;
      const nextDocStatus = deriveDocumentStatus(updatedSigners);

      tx.update(ref, {
        signers: updatedSigners,
        status: nextDocStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } else {
    const patch = { ...updates };
    if (patch.completedAt) {
      patch.completedAt = toTimestamp(patch.completedAt);
    }
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await ref.set(patch, { merge: true });
  }

  const fresh = await ref.get();
  return { id: fresh.id, ...fresh.data() };
}

export async function getSignatureStatus(weddingId, signatureId) {
  if (!weddingId) throw new Error('weddingId requerido');
  if (!signatureId) throw new Error('signatureId requerido');
  const snap = await weddingDoc(weddingId).collection('signatures').doc(signatureId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}
