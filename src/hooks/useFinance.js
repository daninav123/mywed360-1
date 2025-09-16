import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useWedding } from '../context/WeddingContext';
import { saveData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { getTransactions } from '../services/bankService';

// Hook centralizado para gestión de finanzas
// Maneja transacciones, presupuestos, aportaciones y sincronización
export default function useFinance() {
  const { activeWedding } = useWedding();

  // Estados principales
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuración de aportaciones y regalos
  const [contributions, setContributions] = useState({
    initA: 0,
    initB: 0,
    monthlyA: 0,
    monthlyB: 0,
    extras: 0,
    giftPerGuest: 0,
    guestCount: 0,
  });

  // Presupuesto y categorías (persistido en Firestore)
  const [budget, setBudget] = useState({
    total: 0,
    categories: [],
  });

  // Transacciones usando Firestore (subcolección weddings/{id}/transactions)
  const {
    data: transactions,
    addItem: _addTransaction,
    updateItem: _updateTransaction,
    deleteItem: _deleteTransaction,
  } = useFirestoreCollection('transactions', activeWedding, []);

  // Helper: persistir cambios en weddings/{id}/finance/main
  const persistFinanceDoc = useCallback(
    async (patch) => {
      if (!activeWedding) return;
      try {
        const ref = doc(db, 'weddings', activeWedding, 'finance', 'main');
        await setDoc(ref, patch, { merge: true });
      } catch (e) {
        console.warn('[useFinance] No se pudo persistir finance/main:', e);
      }
    },
    [activeWedding]
  );

  // Cálculos memoizados
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

  const emergencyAmount = useMemo(
    () => Math.round(budget.total * 0.1),
    [budget.total]
  );

  const totalSpent = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalIncome = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const currentBalance = useMemo(
    () => totalIncome - totalSpent + expectedIncome,
    [totalIncome, totalSpent, expectedIncome]
  );

  const budgetUsage = useMemo(() => {
    if (!Array.isArray(budget.categories)) return [];
    return budget.categories.map((category) => {
      const spent = Array.isArray(transactions)
        ? transactions
            .filter(
              (t) => t.type === 'expense' && t.category === category.name
            )
            .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        : 0;

      return {
        ...category,
        spent,
        remaining: category.amount - spent,
        percentage: category.amount > 0 ? (spent / category.amount) * 100 : 0,
      };
    });
  }, [budget.categories, transactions]);

  // Estadísticas generales
  const stats = useMemo(
    () => ({
      totalBudget: budget.total,
      totalSpent,
      totalIncome,
      currentBalance,
      expectedIncome,
      emergencyAmount,
      budgetRemaining: budget.total - totalSpent,
      budgetUsagePercentage:
        budget.total > 0 ? (totalSpent / budget.total) * 100 : 0,
    }),
    [
      budget.total,
      totalSpent,
      totalIncome,
      currentBalance,
      expectedIncome,
      emergencyAmount,
    ]
  );

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Cargar número de invitados desde el perfil de la boda
  const loadGuestCount = useCallback(async () => {
    if (!activeWedding) return;

    try {
      setIsLoading(true);
      const infoSnap = await getDoc(
        doc(db, 'weddings', activeWedding, 'info', 'weddingInfo')
      );
      if (infoSnap.exists()) {
        const info = infoSnap.data();
        if (info?.numGuests) {
          setContributions((prev) => ({
            ...prev,
            guestCount: Number(info.numGuests),
          }));
        }
      }
    } catch (err) {
      console.error('Error cargando número de invitados:', err);
      setError('Error cargando datos del perfil');
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  // Cargar presupuesto y aportaciones desde weddings/{id}/finance/main
  useEffect(() => {
    if (!activeWedding) return;
    const ref = doc(db, 'weddings', activeWedding, 'finance', 'main');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        if (data.budget && typeof data.budget === 'object') {
          const b = data.budget || {};
          setBudget({
            total: Number(b.total) || 0,
            categories: Array.isArray(b.categories)
              ? b.categories.map((c) => ({
                  name: String(c.name || ''),
                  amount: Number(c.amount) || 0,
                }))
              : [],
          });
        }
        if (data.contributions && typeof data.contributions === 'object') {
          const c = data.contributions || {};
          setContributions({
            initA: Number(c.initA) || 0,
            initB: Number(c.initB) || 0,
            monthlyA: Number(c.monthlyA) || 0,
            monthlyB: Number(c.monthlyB) || 0,
            extras: Number(c.extras) || 0,
            giftPerGuest: Number(c.giftPerGuest) || 0,
            guestCount: Number(c.guestCount) || 0,
          });
        }
      },
      (err) => {
        console.warn('[useFinance] Error leyendo finance/main:', err);
      }
    );
    return () => unsub();
  }, [activeWedding]);

  // Actualizar configuración de aportaciones y persistir
  const updateContributions = useCallback(
    (updates) => {
      setContributions((prev) => {
        const next = { ...prev, ...updates };
        persistFinanceDoc({ contributions: next });
        return next;
      });
    },
    [persistFinanceDoc]
  );

  // Gestión de categorías de presupuesto
  const addBudgetCategory = useCallback(
    (name, amount = 0) => {
      if (!name || budget.categories.find((c) => c.name === name)) {
        return { success: false, error: 'Categoría ya existe o nombre inválido' };
      }
      const nextCategories = [...budget.categories, { name, amount }];
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
      return { success: true };
    },
    [budget.categories, budget.total, persistFinanceDoc]
  );

  const updateBudgetCategory = useCallback(
    (index, updates) => {
      const nextCategories = budget.categories.map((cat, idx) =>
        idx === index ? { ...cat, ...updates } : cat
      );
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
    },
    [budget.categories, budget.total, persistFinanceDoc]
  );

  const removeBudgetCategory = useCallback(
    (index) => {
      const nextCategories = budget.categories.filter((_, idx) => idx !== index);
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
    },
    [budget.categories, budget.total, persistFinanceDoc]
  );

  // Actualizar presupuesto total
  const updateTotalBudget = useCallback(
    (newTotal) => {
      const total = Number(newTotal) || 0;
      setBudget((prev) => ({ ...prev, total }));
      persistFinanceDoc({ budget: { total, categories: budget.categories } });
      return { success: true };
    },
    [budget.categories, persistFinanceDoc]
  );

  // Gestión de transacciones
  const createTransaction = useCallback(
    async (transactionData) => {
      try {
        setIsLoading(true);
        const saved = await _addTransaction({
          ...transactionData,
          date:
            transactionData.date || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });

        // Sincronizar con localStorage para compatibilidad legacy (movements)
        const updatedTransactions = [...transactions, saved];
        saveData('movements', updatedTransactions, {
          docPath: activeWedding
            ? `weddings/${activeWedding}/finance/main`
            : undefined,
          showNotification: false,
        });
        window.dispatchEvent(new Event('lovenda-movements'));

        return { success: true, data: saved };
      } catch (err) {
        console.error('Error creando transacción:', err);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [_addTransaction, transactions, activeWedding]
  );

  const updateTransaction = useCallback(
    async (id, changes) => {
      try {
        await _updateTransaction(id, changes);
        return { success: true };
      } catch (err) {
        console.error('Error actualizando transacción:', err);
        return { success: false, error: err.message };
      }
    },
    [_updateTransaction]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        await _deleteTransaction(id);
        return { success: true };
      } catch (err) {
        console.error('Error eliminando transacción:', err);
        return { success: false, error: err.message };
      }
    },
    [_deleteTransaction]
  );

  // Importar transacciones bancarias desde backend (opcional)
  const importBankTransactions = useCallback(
    async (opts = {}) => {
      try {
        setIsLoading(true);
        let options = { ...opts };
        if (!options.bankId && activeWedding) {
          try {
            const accSnap = await getDoc(doc(db, 'weddings', activeWedding, 'finance', 'accounts'));
            const acc = accSnap.exists() ? accSnap.data() : null;
            if (acc?.primaryAccountId) options.bankId = acc.primaryAccountId;
          } catch (_) {}
        }
        const bankTransactions = await getTransactions(options);

        for (const transaction of bankTransactions) {
          await createTransaction({
            concept: transaction.description,
            amount: Math.abs(transaction.amount),
            type: transaction.amount < 0 ? 'expense' : 'income',
            category: transaction.category || 'OTROS',
            source: 'bank',
          });
        }

        return { success: true, imported: bankTransactions.length };
      } catch (err) {
        console.error('Error importando transacciones bancarias:', err);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [createTransaction, activeWedding]
  );

  return {
    // Estados
    syncStatus,
    isLoading,
    error,
    contributions,
    budget,
    transactions,

    // Cálculos
    stats,
    budgetUsage,
    monthlyContrib,
    expectedIncome,
    emergencyAmount,
    currentBalance,

    // Acciones
    updateContributions,
    loadGuestCount,
    addBudgetCategory,
    updateBudgetCategory,
    removeBudgetCategory,
    updateTotalBudget,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,

    // Utilidades
    clearError: () => setError(null),
  };
}
