import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/checklist/:weddingId/tabs - Obtener todas las tabs y tasks
router.get('/:weddingId/tabs', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const tabs = await prisma.checklistTab.findMany({
      where: { weddingId },
      include: {
        tasks: {
          orderBy: { position: 'asc' }
        }
      },
      orderBy: { position: 'asc' }
    });

    // Si no hay tabs, crear las predeterminadas
    if (tabs.length === 0) {
      const defaultTabs = [
        {
          weddingId,
          name: 'Pre-Boda',
          position: 0,
          isDefault: true,
          tasks: {
            create: [
              { weddingId, title: 'Confirmar lista de invitados', category: 'Invitados', position: 0 },
              { weddingId, title: 'Reservar lugar de ceremonia', category: 'Ceremonia', position: 1 },
              { weddingId, title: 'Contratar fotógrafo', category: 'Proveedores', position: 2 },
              { weddingId, title: 'Elegir menú de banquete', category: 'Catering', position: 3 },
              { weddingId, title: 'Comprar anillos', category: 'Personal', position: 4 },
              { weddingId, title: 'Enviar invitaciones', category: 'Invitados', position: 5 },
              { weddingId, title: 'Reservar hotel para invitados', category: 'Logística', position: 6 },
            ]
          }
        },
        {
          weddingId,
          name: 'Día de la Boda',
          position: 1,
          isDefault: true,
          tasks: {
            create: [
              { weddingId, title: 'Recoger ramos de flores', category: 'Decoración', position: 0 },
              { weddingId, title: 'Confirmar llegada del transporte', category: 'Logística', position: 1 },
              { weddingId, title: 'Entregar anillos al padrino/madrina', category: 'Ceremonia', position: 2 },
              { weddingId, title: 'Preparar discurso de agradecimiento', category: 'Personal', position: 3 },
              { weddingId, title: 'Verificar decoración del lugar', category: 'Decoración', position: 4 },
            ]
          }
        }
      ];

      const createdTabs = await Promise.all(
        defaultTabs.map(tab => 
          prisma.checklistTab.create({
            data: tab,
            include: { tasks: true }
          })
        )
      );

      return res.json({ success: true, data: createdTabs });
    }

    res.json({ success: true, data: tabs });
  } catch (error) {
    console.error('[Checklist] Error fetching tabs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/checklist/:weddingId/tabs - Crear nueva tab
router.post('/:weddingId/tabs', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Obtener la última posición
    const lastTab = await prisma.checklistTab.findFirst({
      where: { weddingId },
      orderBy: { position: 'desc' }
    });

    const newTab = await prisma.checklistTab.create({
      data: {
        weddingId,
        name: name.trim(),
        position: lastTab ? lastTab.position + 1 : 0,
        isDefault: false
      },
      include: { tasks: true }
    });

    res.json({ success: true, data: newTab });
  } catch (error) {
    console.error('[Checklist] Error creating tab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/checklist/:weddingId/tabs/:tabId - Eliminar tab
router.delete('/:weddingId/tabs/:tabId', async (req, res) => {
  try {
    const { weddingId, tabId } = req.params;

    // Verificar que no sea una tab por defecto
    const tab = await prisma.checklistTab.findUnique({
      where: { id: tabId }
    });

    if (!tab) {
      return res.status(404).json({ success: false, error: 'Tab not found' });
    }

    if (tab.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete default tabs' });
    }

    await prisma.checklistTab.delete({
      where: { id: tabId }
    });

    res.json({ success: true, message: 'Tab deleted successfully' });
  } catch (error) {
    console.error('[Checklist] Error deleting tab:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/checklist/:weddingId/tasks - Crear nueva task
router.post('/:weddingId/tasks', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { tabId, title, category } = req.body;

    if (!tabId || !title) {
      return res.status(400).json({ success: false, error: 'tabId and title are required' });
    }

    // Obtener la última posición en esta tab
    const lastTask = await prisma.checklistTask.findFirst({
      where: { tabId },
      orderBy: { position: 'desc' }
    });

    const newTask = await prisma.checklistTask.create({
      data: {
        weddingId,
        tabId,
        title,
        category: category || null,
        position: lastTask ? lastTask.position + 1 : 0
      }
    });

    res.json({ success: true, data: newTask });
  } catch (error) {
    console.error('[Checklist] Error creating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/checklist/:weddingId/tasks/:taskId - Actualizar task (completar/descompletar)
router.patch('/:weddingId/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    const updatedTask = await prisma.checklistTask.update({
      where: { id: taskId },
      data: {
        completed,
        completedAt: completed ? new Date() : null
      }
    });

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('[Checklist] Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/checklist/:weddingId/tasks/:taskId - Eliminar task
router.delete('/:weddingId/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    await prisma.checklistTask.delete({
      where: { id: taskId }
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('[Checklist] Error deleting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
