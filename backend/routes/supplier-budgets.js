import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/supplier-budgets/:weddingId/:supplierId
 * Obtener presupuestos (service lines) de un proveedor
 */
router.get('/:weddingId/:supplierId', async (req, res) => {
  try {
    const { weddingId, supplierId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Verificar acceso a la boda
    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Wedding not found' });
    }

    // Obtener service lines del proveedor
    const serviceLines = await prisma.serviceLine.findMany({
      where: {
        supplierId,
        supplier: { weddingId },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: serviceLines,
    });
  } catch (error) {
    console.error('[supplier-budgets] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
