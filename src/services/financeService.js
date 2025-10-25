/**
 * Finance Service
 * Gestión completa de presupuesto y finanzas
 * Sprint 4 - Completar Finance
 */

import i18n from '../i18n';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Categorías de gastos predefinidas
 */
export const EXPENSE_CATEGORIES = {
  VENUE: { id: 'venue', name: 'Lugar', icon: '🏛️', color: '#3B82F6' },
  CATERING: { id: 'catering', name: 'Catering', icon: '🍽️', color: '#10B981' },
  PHOTOGRAPHY: { id: 'photography', name: i18n.t('common.fotografia'), icon: '📸', color: '#8B5CF6' },
  MUSIC: { id: 'music', name: 'Música', icon: '🎵', color: '#F59E0B' },
  DECORATION: { id: 'decoration', name: i18n.t('common.decoracion'), icon: '🌸', color: '#EC4899' },
  ATTIRE: { id: 'attire', name: 'Vestuario', icon: '👗', color: '#6366F1' },
  INVITATIONS: { id: 'invitations', name: 'Invitaciones', icon: '✉️', color: '#14B8A6' },
  TRANSPORTATION: { id: 'transportation', name: 'Transporte', icon: '🚗', color: '#EF4444' },
  ACCOMMODATION: { id: 'accommodation', name: 'Alojamiento', icon: '🏨', color: '#F97316' },
  OTHER: { id: 'other', name: 'Otros', icon: '💰', color: '#6B7280' }
};

/**
 * Estados de pago
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue'
};

/**
 * Finance Service Class
 */
class FinanceService {
  /**
   * Obtiene el presupuesto de una boda
   */
  async getBudget(weddingId) {
    try {
      const budgetRef = doc(db, 'weddings', weddingId, 'finance', 'budget');
      const budgetDoc = await getDoc(budgetRef);

      if (!budgetDoc.exists()) {
        return null;
      }

      return {
        id: budgetDoc.id,
        ...budgetDoc.data()
      };
    } catch (error) {
      console.error('Error getting budget:', error);
      throw error;
    }
  }

  /**
   * Crea o actualiza el presupuesto
   */
  async saveBudget(weddingId, budgetData) {
    try {
      const budgetRef = doc(db, 'weddings', weddingId, 'finance', 'budget');

      await setDoc(budgetRef, {
        ...budgetData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los gastos
   */
  async getExpenses(weddingId, filters = {}) {
    try {
      let expensesQuery = collection(db, 'weddings', weddingId, 'expenses');

      // Aplicar filtros
      if (filters.category) {
        expensesQuery = query(expensesQuery, where('category', '==', filters.category));
      }
      if (filters.status) {
        expensesQuery = query(expensesQuery, where('status', '==', filters.status));
      }

      const snapshot = await getDocs(expensesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo gasto
   */
  async createExpense(weddingId, expenseData) {
    try {
      const expensesRef = collection(db, 'weddings', weddingId, 'expenses');

      const docRef = await addDoc(expensesRef, {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        ...expenseData
      };
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  /**
   * Actualiza un gasto existente
   */
  async updateExpense(weddingId, expenseId, updates) {
    try {
      const expenseRef = doc(db, 'weddings', weddingId, 'expenses', expenseId);

      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  /**
   * Elimina un gasto
   */
  async deleteExpense(weddingId, expenseId) {
    try {
      const expenseRef = doc(db, 'weddings', weddingId, 'expenses', expenseId);
      await deleteDoc(expenseRef);
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  /**
   * Registra un pago
   */
  async recordPayment(weddingId, expenseId, payment) {
    try {
      const paymentRef = collection(db, 'weddings', weddingId, 'expenses', expenseId, 'payments');

      await addDoc(paymentRef, {
        ...payment,
        paidAt: serverTimestamp()
      });

      // Actualizar estado del gasto
      await this.updateExpenseStatus(weddingId, expenseId);

      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de pago de un gasto
   */
  async updateExpenseStatus(weddingId, expenseId) {
    try {
      const expenseRef = doc(db, 'weddings', weddingId, 'expenses', expenseId);
      const expenseDoc = await getDoc(expenseRef);

      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }

      const expense = expenseDoc.data();
      const paymentsRef = collection(db, 'weddings', weddingId, 'expenses', expenseId, 'payments');
      const paymentsSnapshot = await getDocs(paymentsRef);

      const totalPaid = paymentsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      let status = PAYMENT_STATUS.PENDING;
      if (totalPaid >= expense.amount) {
        status = PAYMENT_STATUS.PAID;
      } else if (totalPaid > 0) {
        status = PAYMENT_STATUS.PARTIAL;
      } else if (expense.dueDate && new Date(expense.dueDate) < new Date()) {
        status = PAYMENT_STATUS.OVERDUE;
      }

      await updateDoc(expenseRef, {
        status,
        totalPaid,
        remaining: expense.amount - totalPaid,
        updatedAt: serverTimestamp()
      });

      return status;
    } catch (error) {
      console.error('Error updating expense status:', error);
      throw error;
    }
  }

  /**
   * Calcula estadísticas del presupuesto
   */
  async calculateBudgetStats(weddingId) {
    try {
      const budget = await this.getBudget(weddingId);
      const expenses = await this.getExpenses(weddingId);

      const totalBudget = budget?.totalBudget || 0;
      const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const totalPaid = expenses.reduce((sum, exp) => sum + (exp.totalPaid || 0), 0);
      const totalPending = totalSpent - totalPaid;
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      // Por categoría
      const byCategory = {};
      Object.keys(EXPENSE_CATEGORIES).forEach(key => {
        const categoryExpenses = expenses.filter(e => e.category === EXPENSE_CATEGORIES[key].id);
        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        byCategory[EXPENSE_CATEGORIES[key].id] = {
          ...EXPENSE_CATEGORIES[key],
          total: categoryTotal,
          count: categoryExpenses.length,
          percentage: totalSpent > 0 ? (categoryTotal / totalSpent) * 100 : 0
        };
      });

      // Por estado
      const byStatus = {
        paid: expenses.filter(e => e.status === PAYMENT_STATUS.PAID).length,
        pending: expenses.filter(e => e.status === PAYMENT_STATUS.PENDING).length,
        partial: expenses.filter(e => e.status === PAYMENT_STATUS.PARTIAL).length,
        overdue: expenses.filter(e => e.status === PAYMENT_STATUS.OVERDUE).length
      };

      return {
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
      };
    } catch (error) {
      console.error('Error calculating budget stats:', error);
      throw error;
    }
  }

  /**
   * Genera reporte de finanzas
   */
  async generateReport(weddingId, format = 'summary') {
    try {
      const stats = await this.calculateBudgetStats(weddingId);
      const expenses = await this.getExpenses(weddingId);
      const budget = await this.getBudget(weddingId);

      if (format === 'summary') {
        return {
          budget: budget?.totalBudget || 0,
          spent: stats.totalSpent,
          paid: stats.totalPaid,
          remaining: stats.remaining,
          percentageUsed: stats.percentageUsed,
          topCategories: Object.values(stats.byCategory)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
        };
      }

      if (format === 'detailed') {
        return {
          summary: stats,
          expenses: expenses.map(e => ({
            ...e,
            category: EXPENSE_CATEGORIES[e.category.toUpperCase()] || EXPENSE_CATEGORIES.OTHER
          })),
          budget
        };
      }

      return stats;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Exporta datos para Excel/CSV
   */
  async exportData(weddingId) {
    try {
      const expenses = await this.getExpenses(weddingId);
      
      return expenses.map(expense => ({
        'Concepto': expense.name,
        i18n.t('common.categoria'): EXPENSE_CATEGORIES[expense.category?.toUpperCase()]?.name || 'Otros',
        'Proveedor': expense.vendor || '-',
        'Monto': expense.amount,
        'Pagado': expense.totalPaid || 0,
        'Pendiente': expense.remaining || 0,
        'Estado': expense.status,
        'Fecha Vencimiento': expense.dueDate || '-',
        'Notas': expense.notes || ''
      }));
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
}

// Instancia singleton
const financeService = new FinanceService();

export default financeService;

/**
 * Hook de React para usar financeService
 */
export function useFinance(weddingId) {
  const [budget, setBudget] = React.useState(null);
  const [expenses, setExpenses] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!weddingId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [budgetData, expensesData, statsData] = await Promise.all([
          financeService.getBudget(weddingId),
          financeService.getExpenses(weddingId),
          financeService.calculateBudgetStats(weddingId)
        ]);

        setBudget(budgetData);
        setExpenses(expensesData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading finance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weddingId]);

  const createExpense = React.useCallback(async (expenseData) => {
    const newExpense = await financeService.createExpense(weddingId, expenseData);
    setExpenses(prev => [...prev, newExpense]);
    
    // Recalcular stats
    const newStats = await financeService.calculateBudgetStats(weddingId);
    setStats(newStats);
    
    return newExpense;
  }, [weddingId]);

  const updateExpense = React.useCallback(async (expenseId, updates) => {
    await financeService.updateExpense(weddingId, expenseId, updates);
    
    // Recargar datos
    const [updatedExpenses, newStats] = await Promise.all([
      financeService.getExpenses(weddingId),
      financeService.calculateBudgetStats(weddingId)
    ]);
    
    setExpenses(updatedExpenses);
    setStats(newStats);
  }, [weddingId]);

  return {
    budget,
    expenses,
    stats,
    loading,
    createExpense,
    updateExpense,
    financeService
  };
}
