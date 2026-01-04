import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/tasks-hierarchy/:weddingId
 * Obtener todas las tareas con estructura jerárquica
 */
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
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

    // Obtener todas las tareas
    const tasks = await prisma.task.findMany({
      where: { weddingId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    // Separar padres y hijos
    const parents = tasks.filter((t) => !t.parentId);
    const children = tasks.filter((t) => t.parentId);

    // Agrupar hijos por padre
    const childrenByParent = {};
    children.forEach((child) => {
      if (!childrenByParent[child.parentId]) {
        childrenByParent[child.parentId] = [];
      }
      childrenByParent[child.parentId].push(child);
    });

    res.json({
      success: true,
      data: {
        parents,
        childrenByParent,
      },
    });
  } catch (error) {
    console.error('[tasks-hierarchy] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
