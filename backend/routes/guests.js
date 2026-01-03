import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { z, validate } from '../utils/validation.js';
import {
  sendSuccess,
  sendNotFoundError,
  sendInternalError,
  sendValidationError,
} from '../utils/apiResponse.js';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /api/guests/invite
 * Body: { name: string, phone?: string, email?: string, eventId?: string }
 * Crea un invitado y devuelve link personalizado de RSVP.
 */
// Ruta: POST /api/guests/:weddingId/invite
const inviteBodySchema = z.object({
  name: z.string().min(1, 'name required'),
  phone: z.string().min(5).max(50).optional(),
  email: z.string().email().optional(),
  eventId: z.string().min(1).default('default'),
});
const inviteParamsSchema = z.object({ weddingId: z.string().min(1) });

router.post(
  '/:weddingId/invite',
  validate(inviteParamsSchema, 'params'),
  validate(inviteBodySchema),
  async (req, res) => {
    try {
      const { weddingId } = req.params;
      const { name, phone = '', email = '', eventId = 'default' } = req.body;

      const token = uuidv4();
      
      const guest = await prisma.guest.create({
        data: {
          id: token,
          weddingId,
          name,
          phone: phone || null,
          email: email || null,
          status: 'pending',
          companions: 0,
          dietaryRestrictions: '',
          notes: eventId !== 'default' ? `Event: ${eventId}` : null,
        },
      });

      // Indexar token para búsqueda pública por token (ruta /api/rsvp)
      await prisma.rsvpToken.create({
        data: {
          token,
          weddingId,
          guestId: token,
        },
      });

      const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
      return sendSuccess(req, res, { token, link }, 201);
    } catch (err) {
      logger.error('guest-invite-error', err);
      return sendInternalError(req, res, err);
    }
  }
);

/**
 * GET /api/guests/:token
 * Devuelve datos del invitado (sin datos sensibles).
 */
// Ruta: GET /api/guests/:weddingId/:token
const getGuestParams = z.object({ weddingId: z.string().min(1), token: z.string().min(1) });
router.get('/:weddingId/:token', validate(getGuestParams, 'params'), async (req, res) => {
  try {
    const { weddingId, token } = req.params;
    
    const guest = await prisma.guest.findFirst({
      where: {
        id: token,
        weddingId,
      },
    });
    
    if (!guest) {
      return sendNotFoundError(req, res, 'Invitado');
    }
    
    // Filtrar datos sensibles - solo exponer lo necesario para RSVP público
    const guestData = {
      name: guest.name,
      status: guest.status,
      companions: guest.companions,
      allergens: guest.dietaryRestrictions || '',
    };
    return sendSuccess(req, res, guestData);
  } catch (err) {
    logger.error('guest-get-error', err);
    return sendInternalError(req, res, err);
  }
});

/**
 * PUT /api/guests/:token
 * Body: { status: 'accepted' | 'rejected', companions?: number, allergens?: string }
 * Actualiza la respuesta del invitado.
 */
// Ruta: PUT /api/guests/:weddingId/:token
const updateGuestParams = z.object({ weddingId: z.string().min(1), token: z.string().min(1) });
const updateGuestBody = z.object({
  status: z.enum(['accepted', 'rejected']),
  companions: z.coerce.number().int().min(0).max(20).default(0),
  allergens: z.string().max(500).optional(),
});
router.put(
  '/:weddingId/:token',
  validate(updateGuestParams, 'params'),
  validate(updateGuestBody),
  async (req, res) => {
    try {
      const { weddingId, token } = req.params;
      const { status, companions = 0, allergens = '' } = req.body;

      await prisma.guest.update({
        where: { id: token },
        data: {
          status,
          companions,
          dietaryRestrictions: allergens,
        },
      });

      return sendSuccess(req, res, { updated: true });
    } catch (err) {
      logger.error('guest-update-error', err);
      return sendInternalError(req, res, err);
    }
  }
);

/**
 * POST /api/guests/id/:docId/rsvp-link
 * Genera (o recupera) el enlace de RSVP para un invitado ya existente.
 * Devuelve { link, token }
 */
// Ruta: POST /api/guests/:weddingId/id/:docId/rsvp-link
const rsvpLinkParams = z.object({ weddingId: z.string().min(1), docId: z.string().min(1) });
router.post(
  '/:weddingId/id/:docId/rsvp-link',
  validate(rsvpLinkParams, 'params'),
  async (req, res) => {
    try {
      const { weddingId, docId } = req.params;
      
      let guest = await prisma.guest.findUnique({
        where: { id: docId },
      });
      
      if (!guest) {
        return sendNotFoundError(req, res, 'Invitado');
      }

      let token = docId;
      
      // Verificar si ya existe token RSVP
      const existingToken = await prisma.rsvpToken.findFirst({
        where: { guestId: docId },
      });
      
      if (!existingToken) {
        // Crear token RSVP
        await prisma.rsvpToken.create({
          data: {
            token: docId,
            weddingId,
            guestId: docId,
          },
        });
      }

      const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
      return sendSuccess(req, res, { token, link });
    } catch (err) {
      logger.error('rsvp-link-error', err);
      return sendInternalError(req, res, err);
    }
  }
);

export default router;
