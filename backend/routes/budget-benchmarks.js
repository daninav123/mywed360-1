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
    const { country, region, guestCount } = req.query;
    
    const regionKey = normalizeRegionKey(country, region);
    const bucket = computeGuestBucket(guestCount);

    // Intentar múltiples combinaciones
    const attempts = [
      `${regionKey}_${bucket}`,
      `${regionKey}_global`,
      `global_${bucket}`,
      'global_global'
    ];

    for (const key of attempts) {
      // Buscar en metadata del sistema
      const benchmark = await prisma.systemMetadata.findUnique({
        where: { key: `budget_benchmark_${key}` },
        select: { value: true }
      });

      if (benchmark?.value) {
        return res.json({
          success: true,
          data: {
            ...benchmark.value,
            source: { regionKey, bucket, key }
          }
        });
      }
    }

    // No hay datos disponibles
    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('[budget-benchmarks] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
