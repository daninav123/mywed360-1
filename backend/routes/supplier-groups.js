import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/supplier-groups/:weddingId - Obtener grupos de proveedores
router.get('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { supplierGroupsData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const groups = wedding.supplierGroupsData?.groups || [];
    res.json(groups);
  } catch (error) {
    console.error('[GET /supplier-groups/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener grupos' });
  }
});

// POST /api/supplier-groups/:weddingId - Crear grupo
router.post('/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { name, memberIds = [], notes = '' } = req.body;

    if (!name || memberIds.length < 1) {
      return res.status(400).json({ error: 'Nombre y al menos 1 proveedor requeridos' });
    }

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { supplierGroupsData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentGroups = wedding.supplierGroupsData?.groups || [];
    const newGroup = {
      id: uuidv4(),
      name,
      memberIds,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedGroups = [...currentGroups, newGroup];

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: {
          groups: updatedGroups,
        },
      },
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('[POST /supplier-groups/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al crear grupo' });
  }
});

// PUT /api/supplier-groups/:weddingId/:groupId - Actualizar grupo
router.put('/:weddingId/:groupId', async (req, res) => {
  try {
    const { weddingId, groupId } = req.params;
    const updates = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { supplierGroupsData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentGroups = wedding.supplierGroupsData?.groups || [];
    const groupIndex = currentGroups.findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const updatedGroup = {
      ...currentGroups[groupIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    currentGroups[groupIndex] = updatedGroup;

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: {
          groups: currentGroups,
        },
      },
    });

    res.json(updatedGroup);
  } catch (error) {
    console.error('[PUT /supplier-groups/:weddingId/:groupId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar grupo' });
  }
});

// DELETE /api/supplier-groups/:weddingId/:groupId - Eliminar grupo
router.delete('/:weddingId/:groupId', async (req, res) => {
  try {
    const { weddingId, groupId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { supplierGroupsData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentGroups = wedding.supplierGroupsData?.groups || [];
    const filteredGroups = currentGroups.filter(g => g.id !== groupId);

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: {
          groups: filteredGroups,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE /supplier-groups/:weddingId/:groupId] Error:', error);
    res.status(500).json({ error: 'Error al eliminar grupo' });
  }
});

export default router;
