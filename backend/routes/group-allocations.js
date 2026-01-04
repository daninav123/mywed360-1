import express from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/group-allocations/:weddingId/:groupId
router.get('/:weddingId/:groupId', async (req, res) => {
  try {
    const { weddingId, groupId } = req.params;
    const userId = req.user?.uid;

    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
      select: { supplierGroupsData: true },
    });

    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

    const groups = wedding.supplierGroupsData?.groups || [];
    const group = groups.find((g) => g.id === groupId);
    const allocations = group?.allocations || [];

    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('[group-allocations] GET error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/group-allocations/:weddingId/:groupId
router.post('/:weddingId/:groupId', async (req, res) => {
  try {
    const { weddingId, groupId } = req.params;
    const payload = req.body;
    const userId = req.user?.uid;

    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
      select: { supplierGroupsData: true },
    });

    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

    const groups = wedding.supplierGroupsData?.groups || [];
    const groupIndex = groups.findIndex((g) => g.id === groupId);

    if (groupIndex === -1) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const newAllocation = {
      id: uuidv4(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!groups[groupIndex].allocations) {
      groups[groupIndex].allocations = [];
    }
    groups[groupIndex].allocations.push(newAllocation);

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: { ...wedding.supplierGroupsData, groups },
      },
    });

    res.json({ success: true, data: newAllocation });
  } catch (error) {
    console.error('[group-allocations] POST error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/group-allocations/:weddingId/:groupId/:allocationId
router.put('/:weddingId/:groupId/:allocationId', async (req, res) => {
  try {
    const { weddingId, groupId, allocationId } = req.params;
    const payload = req.body;
    const userId = req.user?.uid;

    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
      select: { supplierGroupsData: true },
    });

    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

    const groups = wedding.supplierGroupsData?.groups || [];
    const group = groups.find((g) => g.id === groupId);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    const allocationIndex = group.allocations?.findIndex((a) => a.id === allocationId);
    if (allocationIndex === -1) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    group.allocations[allocationIndex] = {
      ...group.allocations[allocationIndex],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: { ...wedding.supplierGroupsData, groups },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[group-allocations] PUT error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/group-allocations/:weddingId/:groupId/:allocationId
router.delete('/:weddingId/:groupId/:allocationId', async (req, res) => {
  try {
    const { weddingId, groupId, allocationId } = req.params;
    const userId = req.user?.uid;

    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const wedding = await prisma.wedding.findFirst({
      where: {
        id: weddingId,
        OR: [{ userId }, { access: { some: { userId } } }],
      },
      select: { supplierGroupsData: true },
    });

    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });

    const groups = wedding.supplierGroupsData?.groups || [];
    const group = groups.find((g) => g.id === groupId);

    if (!group) return res.status(404).json({ error: 'Group not found' });

    group.allocations = group.allocations?.filter((a) => a.id !== allocationId) || [];

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        supplierGroupsData: { ...wedding.supplierGroupsData, groups },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[group-allocations] DELETE error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
