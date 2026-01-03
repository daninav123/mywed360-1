import express from 'express';
import { db } from '../db.js';
import { FieldValue } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';
import { sendBudgetStatusEmail } from '../services/budgetEmailService.js';

const router = express.Router();

/**
 * PUT /api/weddings/:wId/suppliers/:sId/budget
 * Body: { action: "accept"|"reject", budgetId: string }
 */
router.put('/:wId/suppliers/:sId/budget', async (req, res) => {
  const { wId, sId } = req.params;
  const { action, budgetId } = req.body || {};

  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be "accept" or "reject"' });
  }
  if (!budgetId) {
    return res.status(400).json({ error: 'budgetId required' });
  }

  try {
    const budgetRef = db
      .collection('weddings')
      .doc(wId)
      .collection('suppliers')
      .doc(sId)
      .collection('budgets')
      .doc(budgetId);

    const budSnap = await budgetRef.get();
    if (!budSnap.exists) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    const budgetData = budSnap.data();

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await budgetRef.update({ status: newStatus, updatedAt: FieldValue.serverTimestamp() });

    // Enviar email al proveedor
    try {
      await sendBudgetStatusEmail({
        supplierEmail: budgetData.email || budgetData.supplierEmail,
        supplierName: budgetData.supplierName || 'Proveedor',
        description: budgetData.description,
        amount: budgetData.amount,
        currency: budgetData.currency,
        status: newStatus,
      });
    } catch (e) {
      logger.warn('No se pudo enviar email de presupuesto:', e.message);
    }

    // Si se acepta, crear transacción en finanzas (collection financeTransactions)
    if (newStatus === 'accepted') {
      const financeRef = db.collection('weddings').doc(wId).collection('transactions').doc();

      await financeRef.set({
        supplierId: sId,
        budgetId,
        amount: budgetData.amount,
        currency: budgetData.currency,
        description: budgetData.description,
        type: 'expense', // procedente de presupuesto proveedor
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Budget ${budgetId} for wedding ${wId} set to ${newStatus}`);
    return res.json({ success: true, status: newStatus });
  } catch (err) {
    logger.error('Error updating supplier budget:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
