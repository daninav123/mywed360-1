import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWedding } from '../context/WeddingContext';
import { transactionsAPI, budgetAPI } from '../services/apiService';
import {
  normalizeBudgetCategoryKey,
  normalizeBudgetCategoryName,
} from '../utils/budgetCategories';

const normalizeCategoryName = (value) => normalizeBudgetCategoryName(value);

export default function useFinance() {
  const { activeWedding, activeWeddingData } = useWedding();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contributions, setContributions] = useState({
    initA: 0,
    initB: 0,
    monthlyA: 0,
    monthlyB: 0,
    extras: 0,
    giftPerGuest: 0,
    guestCount: 0,
    initialBalance: 0,
    balanceAdjustments: [],
  });
  const [budget, setBudget] = useState({ total: 0, categories: [] });
  const [advisor, setAdvisor] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);
  const [settings, setSettings] = useState({
    alertThresholds: { warn: 75, danger: 90 },
  });
  const [transactions, setTransactions] = useState([]);

  // Cargar presupuesto desde PostgreSQL
  const loadBudget = useCallback(async () => {
    if (!activeWedding) return;

    try {
      setIsLoading(true);
      const budgetData = await budgetAPI.get(activeWedding);

      if (budgetData.budget) {
        setBudget(budgetData.budget);
      }
      if (budgetData.contributions) {
        setContributions(budgetData.contributions);
      }
      if (budgetData.settings) {
        setSettings(budgetData.settings);
      }
      if (budgetData.aiAdvisor) {
        setAdvisor(budgetData.aiAdvisor);
      }
    } catch (error) {
      console.error('[useFinance] Error loading budget:', error);
      setError('Error cargando presupuesto');
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  const loadTransactions = useCallback(async () => {
    if (!activeWedding) return;
    
    setIsLoading(true);
    try {
      const txs = await transactionsAPI.getAll(activeWedding);
      setTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Error cargando transacciones');
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const loadGuestCount = useCallback(async () => {
    if (!activeWedding) return;
    // Por ahora, el guestCount se carga desde budgetData.contributions
    // Si se necesita desde otra fuente, agregar API endpoint específico
    await loadBudget();
  }, [activeWedding, loadBudget]);

  const updateContributions = useCallback(async (updates) => {
    if (!activeWedding) return;

    const newContributions = { ...contributions, ...updates };
    setContributions(newContributions);

    try {
      await budgetAPI.updateContributions(activeWedding, newContributions);
    } catch (error) {
      console.error('[useFinance] Error updating contributions:', error);
      setContributions(contributions); // Revertir en caso de error
    }
  }, [activeWedding, contributions]);

  const addBudgetCategory = useCallback(async (name, amount = 0) => {
    if (!activeWedding) return { success: false };
    if (!name || budget.categories.find((c) => c.name === name)) {
      return { success: false, error: 'Categoría ya existe o nombre inválido' };
    }

    const nextCategories = [...budget.categories, { name, amount: Number(amount) || 0 }];
    setBudget(prev => ({ ...prev, categories: nextCategories }));

    try {
      await budgetAPI.updateBudget(activeWedding, { total: budget.total, categories: nextCategories });
      return { success: true };
    } catch (error) {
      console.error('[useFinance] Error adding category:', error);
      setBudget(prev => ({ ...prev, categories: budget.categories }));
      return { success: false, error: error.message };
    }
  }, [activeWedding, budget.categories, budget.total]);

  const setBudgetCategories = useCallback(async (categories) => {
    if (!activeWedding) return;

    setBudget(prev => ({ ...prev, categories }));

    try {
      await budgetAPI.updateBudget(activeWedding, { total: budget.total, categories });
    } catch (error) {
      console.error('[useFinance] Error setting categories:', error);
    }
  }, [activeWedding, budget.total]);

  const updateBudgetCategory = useCallback(async (name, updates) => {
    if (!activeWedding) return;

    const nextCategories = budget.categories.map(cat =>
      cat.name === name ? { ...cat, ...updates } : cat
    );
    setBudget(prev => ({ ...prev, categories: nextCategories }));

    try {
      await budgetAPI.updateBudget(activeWedding, { total: budget.total, categories: nextCategories });
    } catch (error) {
      console.error('[useFinance] Error updating category:', error);
    }
  }, [activeWedding, budget.categories, budget.total]);

  const removeBudgetCategory = useCallback(async (name) => {
    if (!activeWedding) return;

    const nextCategories = budget.categories.filter(cat => cat.name !== name);
    setBudget(prev => ({ ...prev, categories: nextCategories }));

    try {
      await budgetAPI.updateBudget(activeWedding, { total: budget.total, categories: nextCategories });
    } catch (error) {
      console.error('[useFinance] Error removing category:', error);
    }
  }, [activeWedding, budget.categories, budget.total]);

  const requestBudgetAdvisor = useCallback(async () => {
    setAdvisorLoading(true);
    setAdvisorError(null);
    try {
      setAdvisor({ scenarios: [], globalTips: [] });
    } catch (err) {
      setAdvisorError(err.message);
    } finally {
      setAdvisorLoading(false);
    }
  }, []);

  const applyAdvisorScenario = useCallback((scenarioId) => {
    return { ok: true };
  }, []);

  const refreshBudgetAdvisor = useCallback(async () => {
    return { success: true };
  }, []);

  const updateTotalBudget = useCallback(async (total) => {
    if (!activeWedding) return;

    setBudget(prev => ({ ...prev, total: Number(total) || 0 }));

    try {
      await budgetAPI.updateBudget(activeWedding, { total: Number(total) || 0, categories: budget.categories });
    } catch (error) {
      console.error('[useFinance] Error updating total budget:', error);
    }
  }, [activeWedding, budget.categories]);

  const updateBudgetSettings = useCallback(async (updates) => {
    if (!activeWedding) return { success: false };

    setSettings(prev => ({ ...prev, ...updates }));

    try {
      await budgetAPI.updateSettings(activeWedding, { ...settings, ...updates });
      return { success: true };
    } catch (error) {
      console.error('[useFinance] Error updating settings:', error);
      return { success: false, error: error.message };
    }
  }, [activeWedding, settings]);

  const createTransaction = useCallback(async (txData) => {
    if (!activeWedding) return { success: false };

    try {
      setIsLoading(true);
      const created = await transactionsAPI.create(activeWedding, {
        category: txData.category,
        description: txData.concept || txData.description,
        amount: parseFloat(txData.amount),
        type: txData.type || 'expense',
        status: txData.status || 'pending',
        dueDate: txData.dueDate || null,
        paidDate: txData.paidDate || null,
        supplierId: txData.supplierId || null,
        notes: txData.notes || null,
      });

      setTransactions(prev => [...prev, created]);
      return { success: true, data: created };
    } catch (error) {
      console.error('Error adding transaction:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  const updateTransaction = useCallback(async (txId, updates) => {
    if (!activeWedding) return { success: false };

    setTransactions(prev =>
      prev.map(tx => (tx.id === txId ? { ...tx, ...updates } : tx))
    );

    try {
      await transactionsAPI.update(txId, updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating transaction:', error);
      await loadTransactions();
      return { success: false, error: error.message };
    }
  }, [activeWedding, loadTransactions]);

  const deleteTransaction = useCallback(async (txId) => {
    if (!activeWedding) return { success: false };

    setTransactions(prev => prev.filter(tx => tx.id !== txId));

    try {
      await transactionsAPI.delete(txId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      await loadTransactions();
      return { success: false, error: error.message };
    }
  }, [activeWedding, loadTransactions]);

  const importBankTransactions = useCallback(async () => {
    return { success: true, imported: 0 };
  }, []);

  const importTransactionsBulk = useCallback(async () => {
    return { success: true };
  }, []);

  const exportFinanceReport = useCallback(async () => {
    return { success: false, error: 'No implementado' };
  }, []);

  const captureBudgetSnapshot = useCallback(async () => {
    return { success: true };
  }, []);

  const normalizePaidAmount = useCallback((transaction) => {
    if (!transaction) return 0;
    const amount = Number(transaction.amount) || 0;
    const paid = Number(transaction.paidAmount) || 0;
    if (transaction.status === 'paid' && paid === 0) return amount;
    return paid;
  }, []);

  const totalSpent = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + normalizePaidAmount(t), 0);
  }, [transactions, normalizePaidAmount]);

  const totalIncome = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + normalizePaidAmount(t), 0);
  }, [transactions, normalizePaidAmount]);

  const monthlyContrib = useMemo(
    () => contributions.monthlyA + contributions.monthlyB,
    [contributions.monthlyA, contributions.monthlyB]
  );

  const expectedIncome = useMemo(
    () =>
      contributions.giftPerGuest * contributions.guestCount +
      contributions.extras +
      contributions.initA +
      contributions.initB +
      monthlyContrib,
    [contributions, monthlyContrib]
  );

  const currentBalance = useMemo(
    () =>
      (contributions.initialBalance || 0) +
      totalIncome -
      totalSpent +
      expectedIncome,
    [contributions.initialBalance, totalIncome, totalSpent, expectedIncome]
  );

  const budgetUsage = useMemo(() => {
    if (!Array.isArray(budget.categories)) return [];
    return budget.categories.map((category) => {
      const spent = Array.isArray(transactions)
        ? transactions
            .filter((t) => t.type === 'expense' && t.category === category.name)
            .reduce((sum, t) => sum + normalizePaidAmount(t), 0)
        : 0;

      return {
        ...category,
        spent,
        remaining: category.amount - spent,
        percentage: category.amount > 0 ? (spent / category.amount) * 100 : 0,
        muted: Boolean(category.muted),
      };
    });
  }, [budget.categories, transactions, normalizePaidAmount]);

  const monthlySeries = useMemo(() => {
    const months = [];
    const income = [];
    const expense = [];
    const net = [];
    return { months, income, expense, net };
  }, []);

  const stats = useMemo(() => ({
    totalBudget: budget.total || 0,
    totalSpent,
    totalIncome,
    balance: currentBalance,
    pendingExpenses: 0,
    overdueExpenses: 0,
  }), [budget.total, totalSpent, totalIncome, currentBalance]);

  const projection = useMemo(() => null, []);
  const predictiveInsights = useMemo(() => null, []);

  return {
    isLoading,
    error,
    contributions,
    budget,
    advisor,
    advisorLoading,
    advisorError,
    transactions,
    activeWedding,
    activeWeddingData,
    stats,
    budgetUsage,
    settings,
    projection,
    predictiveInsights,
    monthlySeries,
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    setBudgetCategories,
    updateBudgetCategory,
    removeBudgetCategory,
    requestBudgetAdvisor,
    applyAdvisorScenario,
    refreshBudgetAdvisor,
    updateTotalBudget,
    updateBudgetSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,
    importTransactionsBulk,
    exportFinanceReport,
    captureBudgetSnapshot,
    clearError: () => setError(null),
  };
}
