import express from 'express';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';
import mailgunJs from 'mailgun-js';
import { requirePlanner, optionalAuth } from '../middleware/authMiddleware.js';
import { incCounter } from '../services/metrics.js';
import {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFoundError,
  sendInternalError,
  sendRateLimitError,
} from '../utils/apiResponse.js';

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch (err) {
    logger.warn('Firebase admin init (rsvp):', err.message);
  }
}

const db = admin.firestore();
const router = express.Router();

// Mailgun helper (reutiliza configuraciÃ³n como en routes/mail.js)
function createMailgunClients() {
  const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const MAILGUN_SENDING_DOMAIN = process.env.VITE_MAILGUN_SENDING_DOMAIN || process.env.MAILGUN_SENDING_DOMAIN;
  const MAILGUN_EU_REGION = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();
  try { logger.info('Mailgun cfg (rsvp): ' + JSON.stringify({
    apiKey: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0,5) + '***' : 'none',
    domain: MAILGUN_DOMAIN || 'none', sendingDomain: MAILGUN_SENDING_DOMAIN || 'none', eu: MAILGUN_EU_REGION
  })); } catch {}
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) return { mailgun: null, mailgunAlt: null };
  const commonHostCfg = MAILGUN_EU_REGION === 'true' ? { host: 'api.eu.mailgun.net' } : {};
  try {
    const mailgun = mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, ...commonHostCfg });
    const mailgunAlt = MAILGUN_SENDING_DOMAIN ? mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_SENDING_DOMAIN, ...commonHostCfg }) : null;
    return { mailgun, mailgunAlt };
  } catch (e) {
    logger.warn('Mailgun init fail (rsvp): ' + e.message);
    return { mailgun: null, mailgunAlt: null };
  }
}

// Helper: localizar invitado por token usando Ã­ndice rsvpTokens o collectionGroup fallback
async function findGuestRefByToken(token) {
  // 1) Ãndice preferido
  const idxRef = db.collection('rsvpTokens').doc(token);
  const idxSnap = await idxRef.get();
  if (idxSnap.exists) {
    const { weddingId, guestId } = idxSnap.data() || {};
    if (weddingId && guestId) {
      return db.collection('weddings').doc(weddingId).collection('guests').doc(guestId);
    }
  }
  // 2) Fallback con collectionGroup por campo token
  const cg = await db.collectionGroup('guests').where('token', '==', token).limit(1).get();
  if (!cg.empty) {
    const doc = cg.docs[0];
    return doc.ref;
  }
  return null;
}

// GET /api/rsvp/by-token/:token
router.get('/by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return sendValidationError(req, res, [{ message: 'token is required' }]);
    }

    const guestRef = await findGuestRefByToken(token);
    if (!guestRef) {
      return sendNotFoundError(req, res, 'Invitado');
    }

    const snap = await guestRef.get();
    const data = snap.data() || {};
    
    // Filtrar PII - solo exponer datos necesarios para RSVP público
    const guestData = {
      name: data.name || '',
      status: data.status || 'pending',
      companions: data.companions ?? data.companion ?? 0,
      allergens: data.allergens || '',
    };
    
    return sendSuccess(req, res, guestData);
  } catch (err) {
    logger.error('rsvp-get-by-token', err);
    return sendInternalError(req, res, err);
  }
});

// PUT /api/rsvp/by-token/:token
router.put('/by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return sendValidationError(req, res, [{ message: 'token is required' }]);
    }

    let { status, companions = 0, allergens = '' } = req.body || {};
    try {
      const zod = await import('zod');
      const z = zod.z;
      const Schema = z.object({
        status: z.enum(['accepted', 'rejected']),
        companions: z.coerce.number().int().min(0).max(20).optional().default(0),
        allergens: z.string().max(500).optional().default(''),
      });
      const parsed = Schema.parse(req.body || {});
      status = parsed.status;
      companions = parsed.companions;
      allergens = parsed.allergens;
    } catch (validationError) {
      return sendValidationError(req, res, validationError.errors || [{ message: 'invalid-status' }]);
    }

    const guestRef = await findGuestRefByToken(token);
    if (!guestRef) {
      return sendNotFoundError(req, res, 'Invitado');
    }

    await guestRef.update({
      status,
      companions,
      companion: companions,
      allergens,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      await incCounter('rsvp_update_status_total', { status }, 1, 'RSVP status updates', ['status']);
    } catch {}

    try {
      const weddingId = guestRef.parent.parent.id;
      const coll = await db
        .collection('weddings')
        .doc(weddingId)
        .collection('guests')
        .select('status', 'companions', 'companion', 'allergens')
        .get();
      let totalInvitations = 0;
      let totalResponses = 0;
      let confirmedAttendees = 0;
      let declinedInvitations = 0;
      let pendingResponses = 0;
      const dietary = { vegetarian: 0, vegan: 0, glutenFree: 0, lactoseIntolerant: 0, other: 0 };
      coll.forEach((doc) => {
        totalInvitations += 1;
        const d = doc.data() || {};
        const st = d.status || 'pending';
        if (st === 'accepted') {
          totalResponses += 1;
          confirmedAttendees += 1 + (parseInt(d.companions ?? d.companion ?? 0, 10) || 0);
        } else if (st === 'rejected') {
          totalResponses += 1;
          declinedInvitations += 1;
        } else {
          pendingResponses += 1;
        }
        const al = String(d.allergens || '').toLowerCase();
        if (al.includes('vegetarian')) dietary.vegetarian += 1;
        if (al.includes('vegan')) dietary.vegan += 1;
        if (al.includes('gluten')) dietary.glutenFree += 1;
        if (al.includes('lactos')) dietary.lactoseIntolerant += 1;
      });
      const statsRef = db.collection('weddings').doc(weddingId).collection('rsvp').doc('stats');
      await statsRef.set({
        totalInvitations,
        totalResponses,
        confirmedAttendees,
        declinedInvitations,
        pendingResponses,
        dietaryRestrictions: dietary,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (aggErr) {
      logger.warn('rsvp-stats-update-failed', aggErr.message);
    }

    return sendSuccess(req, res, { updated: true });
  } catch (err) {
    logger.error('rsvp-put-by-token', err);
    return sendInternalError(req, res, err);
  }
});

// POST /api/rsvp/generate-link  { weddingId, guestId }
// Genera/garantiza token y devuelve link RSVP para un invitado concreto
router.post('/generate-link', requirePlanner, async (req, res) => {
  try {
    const { weddingId, guestId } = req.body || {};
    if (!weddingId || !guestId) {
      return sendValidationError(req, res, [{ message: 'weddingId and guestId required' }]);
    }

    const guestRef = db.collection('weddings').doc(String(weddingId)).collection('guests').doc(String(guestId));
    const snap = await guestRef.get();
    if (!snap.exists) {
      return sendNotFoundError(req, res, 'Invitado');
    }
    const data = snap.data() || {};

    let token = (data.token || '').toString();
    if (!token) {
      token = uuidv4();
      await db.collection('rsvpTokens').doc(token).set({
        weddingId: String(weddingId),
        guestId: String(guestId),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await guestRef.set({ token, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const link = `${baseUrl.replace(/\/$/, '')}/rsvp/${token}`;
    return sendSuccess(req, res, { token, link, weddingId: String(weddingId), guestId: String(guestId) });
  } catch (err) {
    logger.error('rsvp-generate-link', err);
    return sendInternalError(req, res, err);
  }
});

// POST /api/rsvp/reminders  { weddingId, limit?, dryRun?, minIntervalMinutes?, force? }
router.post('/reminders', requirePlanner, async (req, res) => {
  try {
    let { weddingId, limit = 100, dryRun = true, minIntervalMinutes = 1440, force = false } = req.body || {};
    // ValidaciÃ³n opcional con Zod
    try {
      const zod = await import('zod');
      const z = zod.z;
      const Schema = z.object({
        weddingId: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
        dryRun: z.coerce.boolean().optional().default(true),
        minIntervalMinutes: z.coerce.number().int().min(0).max(10080).optional().default(1440),
        force: z.coerce.boolean().optional().default(false)
      });
      const parsed = Schema.parse(req.body || {});
      weddingId = parsed.weddingId;
      limit = parsed.limit;
      dryRun = parsed.dryRun;
      minIntervalMinutes = parsed.minIntervalMinutes;
      force = parsed.force;
    } catch (validationError) {
      if (!weddingId) {
        return sendValidationError(req, res, [{ message: 'weddingId is required' }]);
      }
    }

    // Rate limiting por ejecución global del recordatorio
    const metaRef = db.collection('weddings').doc(weddingId).collection('rsvp').doc('remindersMeta');
    const metaSnap = await metaRef.get();
    const now = Date.now();
    if (!force && metaSnap.exists) {
      const lastRunAt = metaSnap.get('lastRunAt')?.toMillis?.() || 0;
      if (now - lastRunAt < 5 * 60 * 1000) { // 5 min
        return sendRateLimitError(req, res);
      }
    }

    // Cargar invitados y filtrar en memoria (pending + email)
    const guestsSnap = await db.collection('weddings').doc(weddingId).collection('guests').get();
    let candidates = [];
    guestsSnap.forEach(doc => {
      const g = doc.data() || {};
      const status = g.status || 'pending';
      const email = (g.email || '').toString().trim();
      const lastReminderAt = g.lastReminderAt?.toMillis?.() || 0;
      if (status === 'pending' && email && (!minIntervalMinutes || (now - lastReminderAt) >= (minIntervalMinutes * 60 * 1000))) {
        candidates.push({ id: doc.id, ref: doc.ref, data: g, email });
      }
    });
    if (candidates.length > limit) candidates = candidates.slice(0, limit);

    // Preparar clientes Mailgun si se va a enviar real
    const { mailgun, mailgunAlt } = dryRun ? { mailgun: null, mailgunAlt: null } : createMailgunClients();
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

    let attempted = 0, sent = 0, skipped = 0;
    const errors = [];
    const batch = db.batch();

    for (const c of candidates) {
      attempted++;
      try {
        // Asegurar token
        let token = (c.data.token || '').toString();
        if (!token) {
          token = uuidv4();
          batch.set(db.collection('rsvpTokens').doc(token), {
            weddingId, guestId: c.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          batch.set(c.ref, { token }, { merge: true });
        }

        const rsvpLink = `${baseUrl.replace(/\/$/, '')}/rsvp/${token}`;
        const subject = 'Recordatorio: confirma tu asistencia (RSVP)';
        const bodyHtml = `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <p>Hola${c.data.name ? ' ' + c.data.name : ''},</p>
            <p>Te recordamos confirmar tu asistencia a la boda. Puedes hacerlo en el siguiente enlace:</p>
            <p><a href="${rsvpLink}" target="_blank">Confirmar asistencia</a></p>
            <p>Gracias,</p>
            <p>MaLoveApp</p>
          </div>`;

        if (!dryRun) {
          if (mailgun) {
            const mailData = { from: 'notificaciones@maloveapp.com', to: c.email, subject, html: bodyHtml, text: rsvpLink };
            try {
              await mailgun.messages().send(mailData);
            } catch (e1) {
              if (mailgunAlt) {
                await mailgunAlt.messages().send(mailData);
              } else {
                throw e1;
              }
            }
          } else {
            // Fallback: registrar en colecciÃ³n mails (simulaciÃ³n)
            batch.set(db.collection('mails').doc(), {
              from: 'notificaciones@maloveapp.com', to: c.email, subject,
              body: `RSVP: ${rsvpLink}`, html: bodyHtml, date: new Date().toISOString(), folder: 'sent', read: true
            });
          }
          sent++;
          // Marcar recordatorio en invitado
          batch.set(c.ref, { lastReminderAt: admin.firestore.FieldValue.serverTimestamp(), remindersCount: (c.data.remindersCount || 0) + 1 }, { merge: true });
        } else {
          skipped++;
        }
      } catch (err) {
        logger.warn('rsvp-reminder-fail', err?.message || String(err));
        errors.push({ id: c.id, email: c.email, error: err?.message || String(err) });
      }
    }

    batch.set(metaRef, { lastRunAt: admin.firestore.FieldValue.serverTimestamp(), lastCount: attempted }, { merge: true });
    await batch.commit();

    // MÃ©tricas de recordatorios
    try {
      await incCounter('rsvp_reminders_total', { type: 'attempted' }, attempted, 'RSVP reminders processed', ['type']);
      await incCounter('rsvp_reminders_total', { type: 'sent' }, sent, 'RSVP reminders processed', ['type']);
      await incCounter('rsvp_reminders_total', { type: 'skipped' }, skipped, 'RSVP reminders processed', ['type']);
      if (errors.length) {
        await incCounter('rsvp_reminders_total', { type: 'errors' }, errors.length, 'RSVP reminders processed', ['type']);
      }
    } catch {}

    return sendSuccess(req, res, { weddingId, attempted, sent, skipped, errors });
  } catch (err) {
    logger.error('rsvp-reminders', err);
    try { await incCounter('rsvp_reminders_total', { type: 'failed' }, 1, 'RSVP reminders processed', ['type']); } catch {}
    return sendInternalError(req, res, err);
  }
});

export default router;

// Endpoints de desarrollo: disponibles siempre pero protegidos
function devRoutesAllowed(req) {
  try {
    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    const isCypress = ua.includes('cypress');
    const flag = String(process.env.ENABLE_DEV_ROUTES || '').toLowerCase() === 'true';
    const notProd = process.env.NODE_ENV !== 'production';
    return isCypress || flag || notProd;
  } catch {
    return false;
  }
}

router.post('/dev/create', (req, res) => {
  logger.warn('rsvp-dev-create disabled: requiere flujo RSVP real');
  return sendError(req, res, 'dev-endpoint-removed', 'El endpoint /api/rsvp/dev/create ha sido retirado. Usa la creación de invitados real.', 410);
});



// Asegurar usuario mock con rol planner para E2E (retirado)
router.post('/dev/ensure-planner', (req, res) => {
  logger.warn('rsvp-dev-ensure-planner disabled: requiere asignación real de roles');
  return sendError(req, res, 'dev-endpoint-removed', 'El endpoint /api/rsvp/dev/ensure-planner ha sido retirado. Configura roles planner reales.', 410);
});
