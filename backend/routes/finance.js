/**
 * Finance Routes
 * Endpoints para gestión de presupuesto y gastos
 * Sprint 4 - Completar Finance, S4-T005
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError, sendNotFoundError, sendInternalError } = require('../utils/apiResponse');
const { db } = require('../db');
const { z } = require('zod');

// Schemas de validación
const budgetSchema = z.object({
  totalBudget: z.number().min(0),
  currency: z.string().default('USD'),
  notes: z.string().optional()
});

const expenseSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['venue', 'catering', 'photography', 'music', 'decoration', 'attire', 'invitations', 'transportation', 'accommodation', 'other']),
  amount: z.number().min(0),
  vendor: z.string().max(200).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['pending', 'paid', 'partial', 'overdue']).optional()
});

const paymentSchema = z.object({
  amount: z.number().min(0),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional()
});

/**
 * GET /api/finance/:weddingId/budget
 * Obtiene el presupuesto de una boda
 */
router.get('/:weddingId/budget', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    const budgetRef = db.collection('weddings').doc(weddingId)
      .collection('finance').doc('budget');
    
    const budgetDoc = await budgetRef.get();

    if (!budgetDoc.exists) {
      return sendSuccess(req, res, { budget: null });
    }

    return sendSuccess(req, res, {
      budget: {
        id: budgetDoc.id,
        ...budgetDoc.data()
      }
    });
  } catch (error) {
    console.error('Error getting budget:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * PUT /api/finance/:weddingId/budget
 * Crea o actualiza el presupuesto
 */
router.put('/:weddingId/budget', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Validar body
    const validation = budgetSchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const budgetData = validation.data;

    const budgetRef = db.collection('weddings').doc(weddingId)
      .collection('finance').doc('budget');

    await budgetRef.set({
      ...budgetData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return sendSuccess(req, res, {
      budget: budgetData,
      updated: true
    });
  } catch (error) {
    console.error('Error saving budget:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * GET /api/finance/:weddingId/expenses
 * Obtiene todos los gastos
 */
router.get('/:weddingId/expenses', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;
    const { category, status } = req.query;

    let expensesQuery = db.collection('weddings').doc(weddingId)
      .collection('expenses');

    // Aplicar filtros
    if (category) {
      expensesQuery = expensesQuery.where('category', '==', category);
    }
    if (status) {
      expensesQuery = expensesQuery.where('status', '==', status);
    }

    const snapshot = await expensesQuery.get();
    
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return sendSuccess(req, res, { expenses });
  } catch (error) {
    console.error('Error getting expenses:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/finance/:weddingId/expenses
 * Crea un nuevo gasto
 */
router.post('/:weddingId/expenses', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Validar body
    const validation = expenseSchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const expenseData = validation.data;

    const expensesRef = db.collection('weddings').doc(weddingId)
      .collection('expenses');

    const docRef = await expensesRef.add({
      ...expenseData,
      totalPaid: 0,
      remaining: expenseData.amount,
      status: expenseData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const expense = {
      id: docRef.id,
      ...expenseData
    };

    return sendSuccess(req, res, { expense }, 201);
  } catch (error) {
    console.error('Error creating expense:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * GET /api/finance/:weddingId/expenses/:expenseId
 * Obtiene un gasto específico
 */
router.get('/:weddingId/expenses/:expenseId', requireAuth, async (req, res) => {
  try {
    const { weddingId, expenseId } = req.params;

    const expenseRef = db.collection('weddings').doc(weddingId)
      .collection('expenses').doc(expenseId);
    
    const expenseDoc = await expenseRef.get();

    if (!expenseDoc.exists) {
      return sendNotFoundError(req, res, 'Gasto');
    }

    return sendSuccess(req, res, {
      expense: {
        id: expenseDoc.id,
        ...expenseDoc.data()
      }
    });
  } catch (error) {
    console.error('Error getting expense:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * PUT /api/finance/:weddingId/expenses/:expenseId
 * Actualiza un gasto
 */
router.put('/:weddingId/expenses/:expenseId', requireAuth, async (req, res) => {
  try {
    const { weddingId, expenseId } = req.params;

    // Validar body
    const validation = expenseSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const updates = validation.data;

    const expenseRef = db.collection('weddings').doc(weddingId)
      .collection('expenses').doc(expenseId);

    const expenseDoc = await expenseRef.get();
    if (!expenseDoc.exists) {
      return sendNotFoundError(req, res, 'Gasto');
    }

    // Si cambia el monto, recalcular remaining
    if (updates.amount !== undefined) {
      const expense = expenseDoc.data();
      updates.remaining = updates.amount - (expense.totalPaid || 0);
    }

    await expenseRef.update({
      ...updates,
      updatedAt: new Date().toISOString()
    });

    return sendSuccess(req, res, { updated: true });
  } catch (error) {
    console.error('Error updating expense:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * DELETE /api/finance/:weddingId/expenses/:expenseId
 * Elimina un gasto
 */
router.delete('/:weddingId/expenses/:expenseId', requireAuth, async (req, res) => {
  try {
    const { weddingId, expenseId } = req.params;

    const expenseRef = db.collection('weddings').doc(weddingId)
      .collection('expenses').doc(expenseId);

    const expenseDoc = await expenseRef.get();
    if (!expenseDoc.exists) {
      return sendNotFoundError(req, res, 'Gasto');
    }

    await expenseRef.delete();

    return sendSuccess(req, res, { deleted: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * POST /api/finance/:weddingId/expenses/:expenseId/payments
 * Registra un pago para un gasto
 */
router.post('/:weddingId/expenses/:expenseId/payments', requireAuth, async (req, res) => {
  try {
    const { weddingId, expenseId } = req.params;

    // Validar body
    const validation = paymentSchema.safeParse(req.body);
    if (!validation.success) {
      return sendValidationError(req, res, validation.error.errors);
    }

    const paymentData = validation.data;

    // Verificar que el gasto existe
    const expenseRef = db.collection('weddings').doc(weddingId)
      .collection('expenses').doc(expenseId);
    
    const expenseDoc = await expenseRef.get();
    if (!expenseDoc.exists) {
      return sendNotFoundError(req, res, 'Gasto');
    }

    const expense = expenseDoc.data();

    // Registrar pago
    const paymentRef = expenseRef.collection('payments');
    await paymentRef.add({
      ...paymentData,
      paidAt: new Date().toISOString()
    });

    // Calcular total pagado
    const paymentsSnapshot = await paymentRef.get();
    const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);

    // Actualizar estado del gasto
    let status = 'pending';
    if (totalPaid >= expense.amount) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else if (expense.dueDate && new Date(expense.dueDate) < new Date()) {
      status = 'overdue';
    }

    await expenseRef.update({
      status,
      totalPaid,
      remaining: expense.amount - totalPaid,
      updatedAt: new Date().toISOString()
    });

    return sendSuccess(req, res, {
      payment: paymentData,
      status,
      totalPaid,
      remaining: expense.amount - totalPaid
    }, 201);
  } catch (error) {
    console.error('Error recording payment:', error);
    return sendInternalError(req, res, error);
  }
});

/**
 * GET /api/finance/:weddingId/stats
 * Obtiene estadísticas del presupuesto
 */
router.get('/:weddingId/stats', requireAuth, async (req, res) => {
  try {
    const { weddingId } = req.params;

    // Obtener presupuesto
    const budgetRef = db.collection('weddings').doc(weddingId)
      .collection('finance').doc('budget');
    const budgetDoc = await budgetRef.get();
    const budget = budgetDoc.exists ? budgetDoc.data() : { totalBudget: 0 };

    // Obtener gastos
    const expensesSnapshot = await db.collection('weddings').doc(weddingId)
      .collection('expenses').get();
    
    const expenses = expensesSnapshot.docs.map(doc => doc.data());

    // Calcular estadísticas
    const totalBudget = budget.totalBudget || 0;
    const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalPaid = expenses.reduce((sum, exp) => sum + (exp.totalPaid || 0), 0);
    const totalPending = totalSpent - totalPaid;
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Por categoría
    const categories = ['venue', 'catering', 'photography', 'music', 'decoration', 
                       'attire', 'invitations', 'transportation', 'accommodation', 'other'];
    const byCategory = {};
    
    categories.forEach(cat => {
      const categoryExpenses = expenses.filter(e => e.category === cat);
      const categoryTotal = categoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      byCategory[cat] = {
        total: categoryTotal,
        count: categoryExpenses.length,
        percentage: totalSpent > 0 ? (categoryTotal / totalSpent) * 100 : 0
      };
    });

    // Por estado
    const byStatus = {
      paid: expenses.filter(e => e.status === 'paid').length,
      pending: expenses.filter(e => e.status === 'pending').length,
      partial: expenses.filter(e => e.status === 'partial').length,
      overdue: expenses.filter(e => e.status === 'overdue').length
    };

    return sendSuccess(req, res, {
      stats: {
        totalBudget,
        totalSpent,
        totalPaid,
        totalPending,
        remaining,
        percentageUsed,
        byCategory,
        byStatus,
        isOverBudget: remaining < 0,
        expensesCount: expenses.length
      }
    });
  } catch (error) {
    console.error('Error getting finance stats:', error);
    return sendInternalError(req, res, error);
  }
});

module.exports = router;
