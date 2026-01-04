import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/group-budgets/:weddingId
 * Obtener presupuestos de múltiples proveedores
 * Body: { memberIds: string[] }
 */
router.post('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { memberIds = [] } = req.body;
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

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // Obtener proveedores con sus líneas de servicio (budgets)
    const suppliers = await prisma.weddingSupplier.findMany({
      where: {
        weddingId,
        id: { in: memberIds },
      },
      include: {
        serviceLines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Formatear resultado como { [supplierId]: budgets[] }
    const result = {};
    memberIds.forEach((id) => {
      const supplier = suppliers.find((s) => s.id === id);
      result[id] = supplier?.serviceLines || [];
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[group-budgets] POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
