import express from 'express';
import { FieldValue } from 'firebase-admin/firestore';

import { db } from '../db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { DEFAULT_PROCESS_LIMIT, QUEUE_COLLECTION, processScheduledEmailQueue } from '../services/emailScheduler.js';

const router = express.Router();

router.use(express.json({ limit: '1mb' }));

const STATE_COLLECTION = 'emailAutomationState';
const MAX_HISTORY_ENTRIES = 50;
const MAX_SENDER_ENTRIES = 200;
const MAX_MAIL_ENTRIES = 500;

const DEFAULT_STATE_DOC = {
  lastAutoReplyBySender: {},
  autoRepliesByMail: {},
  history: [],
};

const DEFAULT_CONFIG = {
  classification: {
    enabled: true,
  },
  autoReply: {
    enabled: false,
    subjectTemplate: 'Re: [Asunto]',
    generalMessage:
      'Hola [Nombre],\n\nHemos recibido tu mensaje y nuestro equipo lo revisará en breve. Te contactaremos lo antes posible.\n\n¡Gracias por escribirnos!',
    replyIntervalHours: 24,
    excludeSenders: [],
    categories: {
      Proveedor: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por tu propuesta. Estamos revisando los detalles y te responderemos en breve con la información necesaria.\n\nUn saludo,',
      },
      Invitado: {
        enabled: true,
        message:
          'Hola [Nombre],\n\n¡Gracias por tu mensaje! Hemos tomado nota y te responderemos pronto con más detalles.\n\nUn abrazo,',
      },
      Finanzas: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por la información. Nuestro equipo financiero lo revisará y te contactará en cuanto tengamos novedades.\n\nSaludos,',
      },
      Contratos: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nHemos recibido el contrato y nuestro equipo legal lo está revisando. Te enviaremos la respuesta en breve.\n\nSaludos,',
      },
      Facturas: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por enviarnos la factura. La estamos revisando y confirmaremos el pago en cuanto sea posible.\n\nSaludos,',
      },
      Reuniones: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por proponer la reunión. Revisaremos nuestra agenda y te enviaremos la confirmación muy pronto.\n\nSaludos,',
      },
      RSVP: {
        enabled: true,
        message:
          'Hola [Nombre],\n\n¡Gracias por tu confirmación! Hemos registrado tu respuesta y te mantendremos informado con las novedades.\n\nUn abrazo,',
      },
    },
  },
};

const CATEGORY_KEYS = Object.keys(DEFAULT_CONFIG.autoReply.categories);

function clampNumber(value, min, max, fallback) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function sanitizeMessage(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 2000);
}

function pruneMapByDate(map, limit) {
  if (!map || typeof map !== 'object') return {};
  const entries = Object.entries(map).map(([key, value]) => {
    const repliedAt = value?.repliedAt || value?.date || null;
    const timestamp = repliedAt ? new Date(repliedAt).getTime() : 0;
    return [key, { ...value, repliedAt: repliedAt || null, _ts: Number.isFinite(timestamp) ? timestamp : 0 }];
  });
  const sorted = entries
    .filter(([key]) => typeof key === 'string' && key.trim())
    .sort((a, b) => b[1]._ts - a[1]._ts);
  const limited = sorted.slice(0, limit).map(([key, value]) => {
    const { _ts, ...rest } = value;
    return [key, rest];
  });
  return Object.fromEntries(limited);
}

function sanitizeHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const repliedAt = item.repliedAt || item.date || null;
      return {
        mailId: typeof item.mailId === 'string' ? item.mailId : null,
        sender: typeof item.sender === 'string' ? item.sender : null,
        subject: typeof item.subject === 'string' ? item.subject : null,
        classification:
          item.classification && typeof item.classification === 'object'
            ? {
                tags: Array.isArray(item.classification.tags) ? item.classification.tags.slice(0, 10) : [],
                folder: typeof item.classification.folder === 'string' ? item.classification.folder : null,
              }
            : undefined,
        repliedAt: repliedAt || null,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_HISTORY_ENTRIES);
}

function sanitizeStateDoc(data = {}) {
  const source = data && typeof data === 'object' ? data : {};
  const lastAutoReplyBySender = pruneMapByDate(source.lastAutoReplyBySender || {}, MAX_SENDER_ENTRIES);
  const autoRepliesByMail = pruneMapByDate(source.autoRepliesByMail || {}, MAX_MAIL_ENTRIES);
  const history = sanitizeHistory(source.history || []);
  return {
    lastAutoReplyBySender,
    autoRepliesByMail,
    history,
    updatedAt: source.updatedAt?.toDate?.()?.toISOString?.() || source.updatedAt || null,
  };
}

function sanitizeConfig(input = {}) {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (!input || typeof input !== 'object') return base;

  if (input.classification && typeof input.classification === 'object') {
    if (typeof input.classification.enabled === 'boolean') {
      base.classification.enabled = input.classification.enabled;
    }
  }

  if (input.autoReply && typeof input.autoReply === 'object') {
    const source = input.autoReply;
    if (typeof source.enabled === 'boolean') {
      base.autoReply.enabled = source.enabled;
    }
    if (typeof source.subjectTemplate === 'string') {
      base.autoReply.subjectTemplate = sanitizeMessage(source.subjectTemplate, base.autoReply.subjectTemplate);
    }
    if (typeof source.generalMessage === 'string') {
      base.autoReply.generalMessage = sanitizeMessage(source.generalMessage, base.autoReply.generalMessage);
    }
    if (source.excludeSenders && Array.isArray(source.excludeSenders)) {
      base.autoReply.excludeSenders = source.excludeSenders
        .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
        .filter(Boolean)
        .slice(0, 100);
    }
    if (typeof source.replyIntervalHours !== 'undefined') {
      base.autoReply.replyIntervalHours = clampNumber(
        Number(source.replyIntervalHours),
        1,
        168,
        base.autoReply.replyIntervalHours
      );
    }
    if (source.categories && typeof source.categories === 'object') {
      CATEGORY_KEYS.forEach((key) => {
        const incoming = source.categories[key];
        if (!incoming || typeof incoming !== 'object') return;
        if (typeof incoming.enabled === 'boolean') {
          base.autoReply.categories[key].enabled = incoming.enabled;
        }
        if (typeof incoming.message === 'string') {
          base.autoReply.categories[key].message = sanitizeMessage(
            incoming.message,
            base.autoReply.categories[key].message
          );
        }
      });
    }
  }

  return base;
}

function normalizeAttachmentForStorage(input) {
  if (!input || typeof input !== 'object') return null;
  const filename = input.filename || input.name || null;
  const url = input.url || null;
  if (!filename && !url) return null;
  return {
    filename,
    name: input.name || filename || null,
    size: typeof input.size === 'number' ? input.size : null,
    url,
  };
}

function sanitizeSchedulePayload(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};
  const clean = {};
  if (payload.to) clean.to = String(payload.to).trim();
  if (payload.from) clean.from = String(payload.from).trim();
  if (typeof payload.subject === 'string') clean.subject = payload.subject;
  if (typeof payload.body === 'string') clean.body = payload.body;
  if (payload.cc) clean.cc = String(payload.cc).trim();
  if (payload.bcc) clean.bcc = String(payload.bcc).trim();
  if (payload.replyTo) clean.replyTo = String(payload.replyTo).trim();
  if (Array.isArray(payload.attachments)) {
    clean.attachments = payload.attachments.map(normalizeAttachmentForStorage).filter(Boolean);
  }
  if (payload.metadata && typeof payload.metadata === 'object') {
    clean.metadata = { ...payload.metadata };
  }
  clean.recordOnly = Boolean(payload.recordOnly);
  return clean;
}

function getUserId(req) {
  return req.user?.uid || req.user?.user_id || req.userId || req.user?.sub || null;
}

function getStateDocRef(uid) {
  return db.collection(STATE_COLLECTION).doc(uid);
}

function serializeQueueDoc(doc) {
  if (!doc?.exists) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    ownerUid: data.ownerUid || null,
    status: data.status || 'scheduled',
    payload: data.payload || {},
    attempts: data.attempts || 0,
    scheduledAt: data.scheduledAt?.toDate?.()?.toISOString?.() || null,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    lastAttemptAt: data.lastAttemptAt?.toDate?.()?.toISOString?.() || null,
    sentAt: data.sentAt?.toDate?.()?.toISOString?.() || null,
    failedAt: data.failedAt?.toDate?.()?.toISOString?.() || null,
    lastError: data.lastError || null,
    messageId: data.messageId || null,
  };
}

function isCronAuthorized(req) {
  const cronKey = process.env.EMAIL_AUTOMATION_CRON_KEY || process.env.EMAIL_AUTOMATION_TASK_KEY;
  const provided = req.headers['x-cron-key'] || req.query.key || req.body?.key;
  if (cronKey) {
    return provided === cronKey;
  }
  return process.env.NODE_ENV !== 'production';
}

router.post('/schedule/process', async (req, res) => {
  if (!isCronAuthorized(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const limitRaw = Number(req.body?.limit || req.query?.limit);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 100)) : DEFAULT_PROCESS_LIMIT;
  const dryRun = Boolean(req.body?.dryRun || req.query?.dryRun);

  try {
    const result = await processScheduledEmailQueue({ limit, dryRun });
    return res.json(result);
  } catch (error) {
    console.error('[email-automation] schedule/process failed', error);
    return res.status(500).json({ error: 'process-failed', message: error?.message || String(error) });
  }
});

router.use(requireAuth);

router.get('/state', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'auth-required' });

    const snap = await getStateDocRef(uid).get();
    const state = snap.exists ? sanitizeStateDoc(snap.data()) : sanitizeStateDoc(DEFAULT_STATE_DOC);
    return res.json({ state });
  } catch (error) {
    console.error('[email-automation] GET /state failed', error);
    return res.status(500).json({ error: 'internal-error' });
  }
});

router.post('/state/auto-reply', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'auth-required' });

    const { mailId, sender, subject, classification } = req.body || {};
    const normalizedMailId = typeof mailId === 'string' ? mailId.trim() : '';
    const normalizedSender = typeof sender === 'string' ? sender.trim().toLowerCase() : '';
    if (!normalizedMailId || !normalizedSender) {
      return res.status(400).json({ error: 'mailId-and-sender-required' });
    }

    const nowIso = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      const ref = getStateDocRef(uid);
      const snap = await tx.get(ref);
      const current = snap.exists ? sanitizeStateDoc(snap.data()) : sanitizeStateDoc(DEFAULT_STATE_DOC);

      const lastBySender = {
        ...current.lastAutoReplyBySender,
        [normalizedSender]: {
          mailId: normalizedMailId,
          subject: typeof subject === 'string' ? subject : null,
          repliedAt: nowIso,
        },
      };

      const byMail = {
        ...current.autoRepliesByMail,
        [normalizedMailId]: {
          sender: normalizedSender,
          repliedAt: nowIso,
        },
      };

      const historyEntry = {
        mailId: normalizedMailId,
        sender: normalizedSender,
        subject: typeof subject === 'string' ? subject : null,
        repliedAt: nowIso,
      };

      if (classification && typeof classification === 'object') {
        historyEntry.classification = {
          tags: Array.isArray(classification.tags) ? classification.tags.slice(0, 10) : [],
          folder: typeof classification.folder === 'string' ? classification.folder : null,
        };
      }

      const history = [historyEntry, ...current.history].slice(0, MAX_HISTORY_ENTRIES);

      tx.set(
        ref,
        {
          lastAutoReplyBySender: pruneMapByDate(lastBySender, MAX_SENDER_ENTRIES),
          autoRepliesByMail: pruneMapByDate(byMail, MAX_MAIL_ENTRIES),
          history,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('[email-automation] POST /state/auto-reply failed', error);
    return res.status(500).json({ error: 'internal-error' });
  }
});

router.get('/config', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ success: false, error: 'auth-required' });

    const doc = await db.collection('emailAutomationConfig').doc(uid).get();
    if (!doc.exists) {
      return res.json({ success: true, config: DEFAULT_CONFIG, source: 'default' });
    }
    const data = doc.data() || {};
    const sanitized = sanitizeConfig(data.config || data);
    return res.json({
      success: true,
      config: sanitized,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null,
      source: 'remote',
    });
  } catch (error) {
    console.error('[email-automation] GET /config failed', error);
    return res.status(500).json({ success: false, error: 'internal-error' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ success: false, error: 'auth-required' });
    const incoming = sanitizeConfig(req.body?.config || req.body || {});
    await db
      .collection('emailAutomationConfig')
      .doc(uid)
      .set(
        {
          config: incoming,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    return res.json({ success: true, config: incoming });
  } catch (error) {
    console.error('[email-automation] PUT /config failed', error);
    return res.status(500).json({ success: false, error: 'internal-error' });
  }
});

router.get('/schedule', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'auth-required' });

    const [upcomingSnap, historySnap] = await Promise.all([
      db
        .collection(QUEUE_COLLECTION)
        .where('ownerUid', '==', uid)
        .where('status', 'in', ['scheduled', 'processing'])
        .orderBy('scheduledAt', 'asc')
        .limit(100)
        .get(),
      db
        .collection(QUEUE_COLLECTION)
        .where('ownerUid', '==', uid)
        .where('status', 'in', ['sent', 'failed', 'cancelled'])
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get(),
    ]);

    const queue = upcomingSnap.docs.map(serializeQueueDoc).filter(Boolean);
    const history = historySnap.docs.map(serializeQueueDoc).filter(Boolean);

    return res.json({
      queue,
      history,
    });
  } catch (error) {
    console.error('[email-automation] GET /schedule failed', error);
    return res.status(500).json({ error: 'internal-error' });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'auth-required' });

    const { payload: rawPayload, scheduledAt } = req.body || {};
    const payload = sanitizeSchedulePayload(rawPayload);
    if (!payload.to || !payload.subject || !payload.body) {
      return res.status(400).json({ error: 'payload-invalid' });
    }
    if (!scheduledAt) {
      return res.status(400).json({ error: 'scheduledAt-required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'scheduledAt-invalid' });
    }
    if (scheduledDate.getTime() < Date.now() + 60 * 1000) {
      return res.status(400).json({ error: 'scheduledAt-too-soon' });
    }

    const docRef = await db.collection(QUEUE_COLLECTION).add({
      ownerUid: uid,
      payload,
      status: 'scheduled',
      attempts: 0,
      scheduledAt: scheduledDate,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await docRef.update({ id: docRef.id });

    return res.status(201).json({
      id: docRef.id,
      scheduledAt: scheduledDate.toISOString(),
      status: 'scheduled',
    });
  } catch (error) {
    console.error('[email-automation] POST /schedule failed', error);
    return res.status(500).json({ error: 'internal-error' });
  }
});

router.delete('/schedule/:id', async (req, res) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'auth-required' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id-required' });

    const docRef = db.collection(QUEUE_COLLECTION).doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data() || {};
    if (data.ownerUid !== uid) return res.status(403).json({ error: 'forbidden' });

    if (['sent', 'failed', 'cancelled', 'processing'].includes(data.status)) {
      await docRef.update({
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
        cancelledAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
        cancelledAt: FieldValue.serverTimestamp(),
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('[email-automation] DELETE /schedule/:id failed', error);
    return res.status(500).json({ error: 'internal-error' });
  }
});

export default router;
