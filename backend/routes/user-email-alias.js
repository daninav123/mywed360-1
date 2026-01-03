import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';
import { generateEmailSlug, generateUserEmailAliases } from '../utils/emailAliasGenerator.js';
import { sendSuccess, sendValidationError, sendInternalError } from '../utils/apiResponse.js';

const router = express.Router();
const prisma = new PrismaClient();

const EMAIL_DOMAIN = 'planivia.net';

/**
 * GET /api/user/email-alias
 * Obtener el alias de email actual del usuario
 */
router.get('/email-alias', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('[Email Alias GET] UserId:', userId);

    let profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        myWed360Email: true,
        maLoveEmail: true,
      },
    });

    console.log('[Email Alias GET] Profile found:', profile);

    if (!profile) {
      return sendValidationError(req, res, [{ message: 'Perfil no encontrado' }]);
    }

    // Auto-asignar email alias si no existe (usuarios antiguos)
    if (!profile.myWed360Email || !profile.maLoveEmail) {
      console.log('[Email Alias GET] Usuario sin email alias, generando...');
      
      // Obtener usuario para usar su email/nombre
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      
      const emailAliases = await generateUserEmailAliases(user.email, prisma);
      console.log('[Email Alias GET] Aliases generados:', emailAliases);
      
      // Actualizar perfil con los nuevos aliases
      profile = await prisma.userProfile.update({
        where: { userId },
        data: {
          myWed360Email: emailAliases.myWed360Email,
          maLoveEmail: emailAliases.maLoveEmail,
        },
        select: {
          myWed360Email: true,
          maLoveEmail: true,
        }
      });
      
      console.log('[Email Alias GET] Perfil actualizado con aliases');
    }

    // Verificar si el usuario ha enviado o recibido mails
    const mailCount = await prisma.mail.count({
      where: { userId },
    });

    const canEdit = mailCount === 0;

    const response = {
      myWed360Email: profile.myWed360Email,
      maLoveEmail: profile.maLoveEmail,
      domain: EMAIL_DOMAIN,
      canEdit,
      mailCount,
    };

    console.log('[Email Alias GET] Sending response:', response);

    return sendSuccess(req, res, response);
  } catch (error) {
    console.error('[Email Alias] Error obteniendo alias:', error);
    return sendInternalError(req, res, 'Error obteniendo alias de email');
  }
});

/**
 * PUT /api/user/email-alias
 * Actualizar el alias de email del usuario
 * 
 * Body: { newAlias: "nuevo-nombre" } (sin @planivia.net)
 */
router.put('/email-alias', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { newAlias } = req.body;

    // Verificar si el usuario ya ha usado el sistema de mails
    const mailCount = await prisma.mail.count({
      where: { userId },
    });

    if (mailCount > 0) {
      return sendValidationError(req, res, [
        { 
          message: 'No puedes cambiar tu alias porque ya has enviado o recibido emails. El alias solo se puede editar una vez antes de usar el sistema de correo.' 
        }
      ]);
    }

    // Validación
    if (!newAlias || typeof newAlias !== 'string') {
      return sendValidationError(req, res, [{ message: 'Alias requerido' }]);
    }

    // Limpiar y validar el slug
    const cleanSlug = generateEmailSlug(newAlias);
    
    if (!cleanSlug || cleanSlug.length < 3) {
      return sendValidationError(req, res, [
        { message: 'El alias debe tener al menos 3 caracteres válidos' }
      ]);
    }

    if (cleanSlug.length > 30) {
      return sendValidationError(req, res, [
        { message: 'El alias no puede exceder 30 caracteres' }
      ]);
    }

    const newEmail = `${cleanSlug}@${EMAIL_DOMAIN}`;

    // Verificar que el nuevo email no esté en uso
    const existingProfile = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { myWed360Email: newEmail },
          { maLoveEmail: newEmail },
        ],
        userId: { not: userId }, // Excluir el propio usuario
      },
    });

    if (existingProfile) {
      return sendValidationError(req, res, [
        { message: 'Este alias ya está en uso. Por favor, elige otro.' }
      ]);
    }

    // Obtener perfil actual
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { myWed360Email: true, maLoveEmail: true },
    });

    if (!currentProfile) {
      return sendValidationError(req, res, [{ message: 'Perfil no encontrado' }]);
    }

    // Actualizar el alias
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        myWed360Email: newEmail,
        maLoveEmail: newEmail,
        updatedAt: new Date(),
      },
    });

    console.log(`[Email Alias] Usuario ${userId} cambió alias:`, {
      old: currentProfile.myWed360Email,
      new: newEmail,
    });

    // Nota: Los emails antiguos seguirán asociados al usuario por userId
    // No es necesario actualizar la tabla 'mails' ya que está vinculada por userId

    return sendSuccess(req, res, {
      message: 'Alias de email actualizado correctamente',
      myWed360Email: updatedProfile.myWed360Email,
      maLoveEmail: updatedProfile.maLoveEmail,
      previousAlias: currentProfile.myWed360Email,
    });
  } catch (error) {
    console.error('[Email Alias] Error actualizando alias:', error);
    return sendInternalError(req, res, 'Error actualizando alias de email');
  }
});

/**
 * POST /api/user/email-alias/check
 * Verificar si un alias está disponible (sin guardar)
 * 
 * Body: { alias: "nombre-a-verificar" }
 */
router.post('/email-alias/check', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { alias } = req.body;

    if (!alias || typeof alias !== 'string') {
      return sendValidationError(req, res, [{ message: 'Alias requerido' }]);
    }

    const cleanSlug = generateEmailSlug(alias);
    const fullEmail = `${cleanSlug}@${EMAIL_DOMAIN}`;

    // Verificar disponibilidad
    const existingProfile = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { myWed360Email: fullEmail },
          { maLoveEmail: fullEmail },
        ],
        userId: { not: userId },
      },
    });

    const isAvailable = !existingProfile;

    return sendSuccess(req, res, {
      alias: cleanSlug,
      fullEmail,
      available: isAvailable,
      message: isAvailable 
        ? 'Este alias está disponible' 
        : 'Este alias ya está en uso',
    });
  } catch (error) {
    console.error('[Email Alias] Error verificando disponibilidad:', error);
    return sendInternalError(req, res, 'Error verificando disponibilidad');
  }
});

export default router;
