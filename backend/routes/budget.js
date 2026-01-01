import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/budget/wedding/:weddingId - Obtener presupuesto de una boda
router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { budgetData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const budgetData = wedding.budgetData || {
      budget: { total: 0, categories: [] },
      contributions: {
        initA: 0,
        initB: 0,
        monthlyA: 0,
        monthlyB: 0,
        extras: 0,
        giftPerGuest: 0,
        guestCount: 0,
        initialBalance: 0,
        balanceAdjustments: [],
      },
      settings: {
        alertThresholds: { warn: 75, danger: 90 },
      },
      aiAdvisor: null,
    };

    res.json(budgetData);
  } catch (error) {
    console.error('[GET /budget/wedding/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
});

// PUT /api/budget/wedding/:weddingId - Actualizar presupuesto completo
router.put('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const budgetData = req.body;

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        budgetData: budgetData,
        updatedAt: new Date(),
      },
      select: { budgetData: true },
    });

    res.json(wedding.budgetData);
  } catch (error) {
    console.error('[PUT /budget/wedding/:weddingId] Error:', error);
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
});

// PATCH /api/budget/wedding/:weddingId/budget - Actualizar solo budget
router.patch('/wedding/:weddingId/budget', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { total, categories } = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { budgetData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentBudgetData = wedding.budgetData || {};
    const updatedBudgetData = {
      ...currentBudgetData,
      budget: {
        total: total ?? currentBudgetData.budget?.total ?? 0,
        categories: categories ?? currentBudgetData.budget?.categories ?? [],
      },
    };

    const updated = await prisma.wedding.update({
      where: { id: weddingId },
      data: { budgetData: updatedBudgetData },
      select: { budgetData: true },
    });

    res.json(updated.budgetData);
  } catch (error) {
    console.error('[PATCH /budget/wedding/:weddingId/budget] Error:', error);
    res.status(500).json({ error: 'Error al actualizar presupuesto' });
  }
});

// PATCH /api/budget/wedding/:weddingId/contributions - Actualizar contribuciones
router.patch('/wedding/:weddingId/contributions', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const contributions = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { budgetData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentBudgetData = wedding.budgetData || {};
    const updatedBudgetData = {
      ...currentBudgetData,
      contributions: {
        ...currentBudgetData.contributions,
        ...contributions,
      },
    };

    const updated = await prisma.wedding.update({
      where: { id: weddingId },
      data: { budgetData: updatedBudgetData },
      select: { budgetData: true },
    });

    res.json(updated.budgetData);
  } catch (error) {
    console.error('[PATCH /budget/wedding/:weddingId/contributions] Error:', error);
    res.status(500).json({ error: 'Error al actualizar contribuciones' });
  }
});

// PATCH /api/budget/wedding/:weddingId/settings - Actualizar settings
router.patch('/wedding/:weddingId/settings', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const settings = req.body;

    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { budgetData: true },
    });

    if (!wedding) {
      return res.status(404).json({ error: 'Boda no encontrada' });
    }

    const currentBudgetData = wedding.budgetData || {};
    const updatedBudgetData = {
      ...currentBudgetData,
      settings: {
        ...currentBudgetData.settings,
        ...settings,
      },
    };

    const updated = await prisma.wedding.update({
      where: { id: weddingId },
      data: { budgetData: updatedBudgetData },
      select: { budgetData: true },
    });

    res.json(updated.budgetData);
  } catch (error) {
    console.error('[PATCH /budget/wedding/:weddingId/settings] Error:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
