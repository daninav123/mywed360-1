import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const RESERVED_NAMES = [
  'admin',
  'soporte',
  'noreply',
  'contacto',
  'info',
  'ayuda',
  'sistema',
  'maloveapp',
  'planivia',
  'staff',
  'test',
  'prueba',
];

// GET /api/email-username/check/:username - Verificar disponibilidad
router.get('/check/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const normalizedUsername = username.toLowerCase();

    // Validar formato
    const usernameRegex = /^[a-z0-9][a-z0-9._-]{2,29}$/i;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.json({
        available: false,
        error: 'Formato inválido',
      });
    }

    // Verificar nombres reservados
    if (RESERVED_NAMES.includes(normalizedUsername)) {
      return res.json({
        available: false,
        error: 'Nombre reservado',
      });
    }

    // Verificar si ya existe
    const existing = await prisma.userProfile.findFirst({
      where: { emailUsername: normalizedUsername },
    });

    res.json({ available: !existing });
  } catch (error) {
    console.error('[email-username] Check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/email-username/reserve - Reservar username
router.post('/reserve', async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const normalizedUsername = username.toLowerCase();

    // Validar formato
    const usernameRegex = /^[a-z0-9][a-z0-9._-]{2,29}$/i;
    if (!usernameRegex.test(normalizedUsername)) {
      return res.json({
        success: false,
        error: 'Formato inválido',
      });
    }

    // Verificar nombres reservados
    if (RESERVED_NAMES.includes(normalizedUsername)) {
      return res.json({
        success: false,
        error: 'Nombre reservado',
      });
    }

    // Verificar disponibilidad
    const existing = await prisma.userProfile.findFirst({
      where: { emailUsername: normalizedUsername },
    });

    if (existing) {
      return res.json({
        success: false,
        error: 'Username no disponible',
      });
    }

    // Reservar username
    await prisma.userProfile.update({
      where: { userId },
      data: {
        emailUsername: normalizedUsername,
        planiviaEmail: `${normalizedUsername}@planivia.net`,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[email-username] Reserve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/email-username/current - Obtener username actual
router.get('/current', async (req, res) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        emailUsername: true,
        planiviaEmail: true,
      },
    });

    let username = profile?.emailUsername;

    // Fallback: extraer de planiviaEmail
    if (!username && profile?.planiviaEmail) {
      const parts = profile.planiviaEmail.split('@');
      if (parts.length) username = parts[0];
    }

    res.json({
      success: true,
      username: username || null,
    });
  } catch (error) {
    console.error('[email-username] Current error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
