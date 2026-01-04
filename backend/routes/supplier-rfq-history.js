import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/supplier-rfq-history/:weddingId/:supplierId
 * Obtener historial de RFQ de un proveedor
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

    // Obtener proveedor con RFQ history
    const supplier = await prisma.weddingSupplier.findFirst({
      where: {
        id: supplierId,
        weddingId,
      },
      select: {
        rfqHistory: true,
      },
    });

    const rfqHistory = supplier?.rfqHistory || [];

    // Ordenar por sentAt desc
    const sortedHistory = Array.isArray(rfqHistory)
      ? [...rfqHistory].sort((a, b) => {
          const dateA = new Date(a.sentAt || 0);
          const dateB = new Date(b.sentAt || 0);
          return dateB - dateA;
        })
      : [];

    res.json({
      success: true,
      data: sortedHistory,
    });
  } catch (error) {
    console.error('[supplier-rfq-history] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
