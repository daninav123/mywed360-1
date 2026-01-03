import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import {
  sendSuccess,
  sendNotFoundError,
  sendInternalError,
  sendValidationError,
} from '../utils/apiResponse.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/rsvp/by-token/:token
router.get('/by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return sendValidationError(req, res, [{ message: 'token is required' }]);
    }

    const rsvpToken = await prisma.rsvpToken.findUnique({
      where: { token },
    });
    
    if (!rsvpToken) {
      return sendNotFoundError(req, res, 'Invitación');
    }

    const guest = await prisma.guest.findUnique({
      where: { id: rsvpToken.guestId },
    });
    
    if (!guest) {
      return sendNotFoundError(req, res, 'Invitación');
    }

    // Filtrar PII - solo exponer datos necesarios para RSVP público
    const guestData = {
      name: guest.name || '',
      status: guest.status || 'pending',
      companions: guest.companions ?? 0,
      allergens: guest.dietaryRestrictions || '',
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
      return sendValidationError(
        req,
        res,
        validationError.errors || [{ message: 'invalid-status' }]
      );
    }

    const rsvpToken = await prisma.rsvpToken.findUnique({
      where: { token },
    });
    
    if (!rsvpToken) {
      return sendNotFoundError(req, res, 'Invitación');
    }

    await prisma.guest.update({
      where: { id: rsvpToken.guestId },
      data: {
        status,
        companions,
        dietaryRestrictions: allergens,
      },
    });

    // Stats update (background task - no bloqueante)
    setImmediate(async () => {
      try {
        const weddingId = rsvpToken.weddingId;
        const guests = await prisma.guest.findMany({
          where: { weddingId },
        });
        
        let totalInvitations = guests.length;
        let confirmedAttendees = 0;
        let declinedInvitations = 0;
        let pendingResponses = 0;
        
        guests.forEach((g) => {
          if (g.status === 'accepted') {
            confirmedAttendees += 1 + (g.companions || 0);
          } else if (g.status === 'rejected') {
            declinedInvitations += 1;
          } else {
            pendingResponses += 1;
          }
        });
        
        logger.info(`[rsvp-stats] Wedding ${weddingId}: ${confirmedAttendees} confirmed, ${declinedInvitations} declined, ${pendingResponses} pending`);
      } catch (err) {
        logger.warn('rsvp-stats-update-failed', err.message);
      }
    });

    return sendSuccess(req, res, { message: 'RSVP actualizado' });
  } catch (err) {
    logger.error('rsvp-put-by-token', err);
    return sendInternalError(req, res, err);
  }
});

// POST /api/rsvp/generate-link  { weddingId, guestId }
// Genera/garantiza token y devuelve link RSVP para un invitado concreto
router.post('/generate-link', async (req, res) => {
  try {
    const { weddingId, guestId } = req.body || {};
    if (!weddingId || !guestId) {
      return sendValidationError(req, res, [{ message: 'weddingId and guestId required' }]);
    }

    const guest = await prisma.guest.findUnique({
      where: { id: String(guestId) },
    });
    
    if (!guest) {
      return sendNotFoundError(req, res, 'Invitación');
    }

    // Buscar token existente o crear uno nuevo
    let existingToken = await prisma.rsvpToken.findFirst({
      where: { guestId: String(guestId) },
    });
    
    let token;
    if (existingToken) {
      token = existingToken.token;
    } else {
      token = uuidv4();
      await prisma.rsvpToken.create({
        data: {
          token,
          weddingId: String(weddingId),
          guestId: String(guestId),
        },
      });
    }

    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const link = `${baseUrl.replace(/\/$/, '')}/rsvp/${token}`;

    return sendSuccess(req, res, { token, link, guestId, weddingId: String(weddingId) });
  } catch (err) {
    logger.error('rsvp-generate-link', err);
    return sendInternalError(req, res, err);
  }
});

// POST /api/rsvp/reminders  { weddingId, limit?, dryRun?, minIntervalMinutes?, force? }
router.post('/reminders', async (req, res) => {
  try {
    let {
      weddingId,
      limit = 100,
      dryRun = true,
      minIntervalMinutes = 1440,
      force = false,
    } = req.body || {};
    // Validación opcional con Zod
    try {
      const zod = await import('zod');
      const z = zod.z;
      const Schema = z.object({
        weddingId: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
        dryRun: z.coerce.boolean().optional().default(true),
        minIntervalMinutes: z.coerce.number().int().min(0).max(10080).optional().default(1440),
        force: z.coerce.boolean().optional().default(false),
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
    const metaRef = db
      .collection('weddings')
      .doc(weddingId)
      .collection('rsvp')
      .doc('remindersMeta');
    const metaSnap = await metaRef.get();
    const now = Date.now();
    if (!force && metaSnap.exists) {
      const lastRunAt = metaSnap.get('lastRunAt')?.toMillis?.() || 0;
      if (now - lastRunAt < 5 * 60 * 1000) {
        // 5 min
        return sendRateLimitError(req, res);
      }
    }

    // Cargar invitados y filtrar en memoria (pending + email)
    const guestsSnap = await db.collection('weddings').doc(weddingId).collection('guests').get();
    let candidates = [];
    guestsSnap.forEach((doc) => {
      const g = doc.data() || {};
      const status = g.status || 'pending';
      const email = (g.email || '').toString().trim();
      const lastReminderAt = g.lastReminderAt?.toMillis?.() || 0;
      if (
        status === 'pending' &&
        email &&
        (!minIntervalMinutes || now - lastReminderAt >= minIntervalMinutes * 60 * 1000)
      ) {
        candidates.push({ id: doc.id, ref: doc.ref, data: g, email });
      }
    });
    if (candidates.length > limit) candidates = candidates.slice(0, limit);

    // Preparar clientes Mailgun si se va a enviar real
    const { mailgun, mailgunAlt } = dryRun
      ? { mailgun: null, mailgunAlt: null }
      : createMailgunClients();
    const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';

    let attempted = 0,
      sent = 0,
      skipped = 0;
    const errors = [];
    const batch = db.batch();

    for (const c of candidates) {
      attempted++;
      try {
        // Asegurar token
        let token = (c.data.token || '').toString();
        if (!token) {
          token = uuidv4();
          batch.set(
            db.collection('rsvpTokens').doc(token),
            {
              weddingId,
              guestId: c.id,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
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
            const mailData = {
              from: 'notificaciones@maloveapp.com',
              to: c.email,
              subject,
              html: bodyHtml,
              text: rsvpLink,
            };
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
            // Fallback: registrar en colección mails (simulación)
            batch.set(db.collection('mails').doc(), {
              from: 'notificaciones@maloveapp.com',
              to: c.email,
              subject,
              body: `RSVP: ${rsvpLink}`,
              html: bodyHtml,
              date: new Date().toISOString(),
              folder: 'sent',
              read: true,
            });
          }
          sent++;
          // Marcar recordatorio en invitado
          batch.set(
            c.ref,
            {
              lastReminderAt: admin.firestore.FieldValue.serverTimestamp(),
              remindersCount: (c.data.remindersCount || 0) + 1,
            },
            { merge: true }
          );
        } else {
          skipped++;
        }
      } catch (err) {
        logger.warn('rsvp-reminder-fail', err?.message || String(err));
        errors.push({ id: c.id, email: c.email, error: err?.message || String(err) });
      }
    }

    batch.set(
      metaRef,
      { lastRunAt: admin.firestore.FieldValue.serverTimestamp(), lastCount: attempted },
      { merge: true }
    );
    await batch.commit();

    // Métricas de recordatorios
    try {
      await incCounter(
        'rsvp_reminders_total',
        { type: 'attempted' },
        attempted,
        'RSVP reminders processed',
        ['type']
      );
      await incCounter('rsvp_reminders_total', { type: 'sent' }, sent, 'RSVP reminders processed', [
        'type',
      ]);
      await incCounter(
        'rsvp_reminders_total',
        { type: 'skipped' },
        skipped,
        'RSVP reminders processed',
        ['type']
      );
      if (errors.length) {
        await incCounter(
          'rsvp_reminders_total',
          { type: 'errors' },
          errors.length,
          'RSVP reminders processed',
          ['type']
        );
      }
    } catch {}

    return sendSuccess(req, res, { weddingId, attempted, sent, skipped, errors });
  } catch (err) {
    logger.error('rsvp-reminders', err);
    try {
      await incCounter('rsvp_reminders_total', { type: 'failed' }, 1, 'RSVP reminders processed', [
        'type',
      ]);
    } catch {}
    return sendInternalError(req, res, err);
  }
});

export default router;
