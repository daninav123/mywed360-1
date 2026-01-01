import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    
    const tasks = await prisma.task.findMany({
      where: { weddingId },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('[tasks] Error fetching tasks:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

router.post('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const taskData = req.body;
    
    const task = await prisma.task.create({
      data: {
        weddingId,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || 'general',
        status: taskData.status || 'pending',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        priority: taskData.priority || 'medium',
        assignedTo: taskData.assignedTo || null,
        completed: taskData.completed || false,
        completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
        order: taskData.order || 0,
        notes: taskData.notes || null
      }
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('[tasks] Error creating task:', error);
    res.status(500).json({ error: 'Error al crear tarea' });
  }
});

router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const taskData = req.body;
    
    const updates = {};
    if (taskData.title !== undefined) updates.title = taskData.title;
    if (taskData.description !== undefined) updates.description = taskData.description;
    if (taskData.category !== undefined) updates.category = taskData.category;
    if (taskData.status !== undefined) updates.status = taskData.status;
    if (taskData.dueDate !== undefined) updates.dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;
    if (taskData.priority !== undefined) updates.priority = taskData.priority;
    if (taskData.assignedTo !== undefined) updates.assignedTo = taskData.assignedTo;
    if (taskData.completed !== undefined) {
      updates.completed = taskData.completed;
      updates.completedAt = taskData.completed ? new Date() : null;
    }
    if (taskData.order !== undefined) updates.order = taskData.order;
    if (taskData.notes !== undefined) updates.notes = taskData.notes;
    
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updates
    });
    
    res.json(task);
  } catch (error) {
    console.error('[tasks] Error updating task:', error);
    res.status(500).json({ error: 'Error al actualizar tarea' });
  }
});

router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    await prisma.task.delete({
      where: { id: taskId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[tasks] Error deleting task:', error);
    res.status(500).json({ error: 'Error al eliminar tarea' });
  }
});

router.put('/wedding/:weddingId/bulk', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { tasks } = req.body;
    
    const operations = tasks.map(task => {
      if (task.id) {
        return prisma.task.update({
          where: { id: task.id },
          data: {
            title: task.title,
            description: task.description,
            category: task.category,
            status: task.status,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority,
            completed: task.completed,
            completedAt: task.completed ? new Date() : null,
            order: task.order,
            notes: task.notes
          }
        });
      } else {
        return prisma.task.create({
          data: {
            weddingId,
            title: task.title,
            description: task.description || null,
            category: task.category || 'general',
            status: task.status || 'pending',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority || 'medium',
            completed: task.completed || false,
            order: task.order || 0,
            notes: task.notes || null
          }
        });
      }
    });
    
    await prisma.$transaction(operations);
    
    const updatedTasks = await prisma.task.findMany({
      where: { weddingId },
      orderBy: [{ order: 'asc' }]
    });
    
    res.json(updatedTasks);
  } catch (error) {
    console.error('[tasks] Error bulk updating tasks:', error);
    res.status(500).json({ error: 'Error al actualizar tareas' });
  }
});

export default router;
