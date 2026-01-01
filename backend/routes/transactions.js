import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { category, status, type } = req.query;
    
    const where = { weddingId };
    if (category) where.category = category;
    if (status) where.status = status;
    if (type) where.type = type;
    
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('[transactions] Error fetching transactions:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

router.post('/wedding/:weddingId', async (req, res) => {
  try {
    const { weddingId } = req.params;
    const txData = req.body;
    
    const transaction = await prisma.transaction.create({
      data: {
        weddingId,
        category: txData.category,
        description: txData.description,
        amount: parseFloat(txData.amount),
        type: txData.type || 'expense',
        status: txData.status || 'pending',
        dueDate: txData.dueDate ? new Date(txData.dueDate) : null,
        paidDate: txData.paidDate ? new Date(txData.paidDate) : null,
        supplierId: txData.supplierId || null,
        notes: txData.notes || null
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('[transactions] Error creating transaction:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
});

router.put('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const txData = req.body;
    
    const updates = {};
    if (txData.category !== undefined) updates.category = txData.category;
    if (txData.description !== undefined) updates.description = txData.description;
    if (txData.amount !== undefined) updates.amount = parseFloat(txData.amount);
    if (txData.type !== undefined) updates.type = txData.type;
    if (txData.status !== undefined) updates.status = txData.status;
    if (txData.dueDate !== undefined) updates.dueDate = txData.dueDate ? new Date(txData.dueDate) : null;
    if (txData.paidDate !== undefined) updates.paidDate = txData.paidDate ? new Date(txData.paidDate) : null;
    if (txData.supplierId !== undefined) updates.supplierId = txData.supplierId;
    if (txData.notes !== undefined) updates.notes = txData.notes;
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: updates
    });
    
    res.json(transaction);
  } catch (error) {
    console.error('[transactions] Error updating transaction:', error);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
});

router.delete('/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    await prisma.transaction.delete({
      where: { id: transactionId }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[transactions] Error deleting transaction:', error);
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
});

router.get('/wedding/:weddingId/summary', async (req, res) => {
  try {
    const { weddingId } = req.params;
    
    const transactions = await prisma.transaction.findMany({
      where: { weddingId }
    });
    
    const summary = {
      total: 0,
      paid: 0,
      pending: 0,
      byCategory: {},
      byStatus: {
        pending: 0,
        paid: 0,
        overdue: 0
      }
    };
    
    transactions.forEach(tx => {
      const amount = tx.type === 'expense' ? tx.amount : -tx.amount;
      summary.total += amount;
      
      if (tx.status === 'paid') {
        summary.paid += amount;
      } else {
        summary.pending += amount;
      }
      
      if (!summary.byCategory[tx.category]) {
        summary.byCategory[tx.category] = 0;
      }
      summary.byCategory[tx.category] += amount;
      
      summary.byStatus[tx.status] = (summary.byStatus[tx.status] || 0) + 1;
    });
    
    res.json(summary);
  } catch (error) {
    console.error('[transactions] Error getting summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

export default router;
