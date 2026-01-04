import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const computeGuestBucket = (guestCount) => {
  const count = Number(guestCount) || 0;
  if (count <= 0) return '0-0';
  const size = 50;
  const start = Math.floor((count - 1) / size) * size + 1;
  const end = start + size - 1;
  return `${start}-${end}`;
};

const normalizeRegionKey = (country, region) => {
  const parts = [country, region]
    .map((value) =>
      value
        ? String(value)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/gi, '-')
            .trim()
            .toLowerCase()
        : ''
    )
    .filter(Boolean);
  return parts.length ? parts.join('_') : 'global';
};

/**
 * GET /api/budget-benchmarks?country=X&region=Y&guestCount=Z
 * Obtener benchmarks de presupuesto
 */
router.get('/', async (req, res) => {
  try {
    // TODO: Implementar tabla SystemMetadata en Prisma schema
    // Por ahora retornamos null hasta que se cree la tabla
    console.log('[budget-benchmarks] Tabla SystemMetadata no implementada aún, retornando null');

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('[budget-benchmarks] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
