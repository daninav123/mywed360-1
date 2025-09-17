import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { uploadEmailAttachments } from '../services/storageUploadService';
import { useWedding } from '../context/WeddingContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import { saveData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { getTransactions } from '../services/bankService';

// Hook centralizado para gestiÃ³n de finanzas
// Maneja transacciones, presupuestos, aportaciones y sincronizaciÃ³n
export default function useFinance() {
  const { activeWedding } = useWedding();

  // Estados principales
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ConfiguraciÃ³n de aportaciones y regalos
  const [contributions, setContributions] = useState({
    initA: 0,
    initB: 0,
    monthlyA: 0,
    monthlyB: 0,
    extras: 0,
    giftPerGuest: 0,
    guestCount: 0,
  });

  // Presupuesto y categorÃ­as (persistido en Firestore)
  const [budget, setBudget] = useState({
    total: 0,
    categories: [],
  });

  // Ajustes de finanzas (umbrales de alertas, etc.)
  const [settings, setSettings] = useState({
    alertThresholds: { warn: 75, danger: 90 },
  });

  // Indica si hay cuenta bancaria vinculada
  const [hasBankAccount, setHasBankAccount] = useState(false);

  // Transacciones usando Firestore (subcolecciÃ³n weddings/{id}/transactions)
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

  // CÃ¡lculos memoizados
  const normalizePaidAmount = useCallback((transaction) => {
    if (!transaction) return 0;
    const type = transaction.type || 'expense';
    const status = transaction.status || (type === 'income' ? 'expected' : 'pending');
    const amount = Number(transaction.amount) || 0;
    const rawPaid = Number(transaction.paidAmount);
    let paid = Number.isFinite(rawPaid) ? rawPaid : 0;
    if (amount > 0) {
      paid = Math.min(Math.max(paid, 0), amount);
    } else {
      paid = Math.max(paid, 0);
    }
    if (type === 'expense' && status === 'paid' && paid === 0) return amount;
    if (type === 'income' && status === 'received' && paid === 0) return amount;
    return paid;
  }, []);

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
      .reduce((sum, t) => sum + normalizePaidAmount(t), 0);
  }, [transactions, normalizePaidAmount]);

  const totalIncome = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + normalizePaidAmount(t), 0);
  }, [transactions, normalizePaidAmount]);

  const currentBalance = useMemo(
    () => totalIncome - totalSpent + expectedIncome,
    [totalIncome, totalSpent, expectedIncome]
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
  }, [budget.categories, transactions]);

  // EstadÃ­sticas generales
  const paymentHealth = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { pendingExpenses: 0, overdueExpenses: 0 };
    }
    const now = new Date();
    return transactions.reduce((acc, tx) => {
      if (tx.type !== 'expense') return acc;
      const amount = Number(tx.amount) || 0;
      const paid = normalizePaidAmount(tx);
      const outstanding = Math.max(0, amount - paid);
      if (outstanding > 0) {
        acc.pendingExpenses += outstanding;
        if (tx.dueDate) {
          const due = new Date(tx.dueDate);
          if (!Number.isNaN(due.getTime()) && due < now && (tx.status || '') !== 'paid') {
            acc.overdueExpenses += outstanding;
          }
        }
      }
      return acc;
    }, { pendingExpenses: 0, overdueExpenses: 0 });
  }, [transactions, normalizePaidAmount]);

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
      pendingExpenses: paymentHealth.pendingExpenses,
      overdueExpenses: paymentHealth.overdueExpenses,
    }),
    [
      budget.total,
      totalSpent,
      totalIncome,
      currentBalance,
      expectedIncome,
      emergencyAmount,
      paymentHealth.pendingExpenses,
      paymentHealth.overdueExpenses,
    ]
  );

  // Suscribirse a cambios en el estado de sincronizaciÃ³n
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Cargar nÃºmero de invitados desde el perfil de la boda
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
      console.error('Error cargando nÃºmero de invitados:', err);
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
                  muted: Boolean(c.muted || false),
                }))
              : [],
          });
        }
        // Cargar ajustes (umbrales de alerta)
        if (data.settings && typeof data.settings === 'object') {
          const s = data.settings || {};
          const at = s.alertThresholds || {};
          setSettings({
            alertThresholds: {
              warn: Number(at.warn) || 75,
              danger: Number(at.danger) || 90,
            },
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

  // Actualizar configuraciÃ³n de aportaciones y persistir
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

  // GestiÃ³n de categorÃ­as de presupuesto
  const addBudgetCategory = useCallback(
    (name, amount = 0) => {
      if (!name || budget.categories.find((c) => c.name === name)) {
        return { success: false, error: 'CategorÃ­a ya existe o nombre invÃ¡lido' };
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

  // Actualizar ajustes de presupuesto (umbrales de alerta)
  const updateBudgetSettings = useCallback(
    (updates) => {
      const next = {
        ...settings,
        ...updates,
        alertThresholds: {
          ...settings.alertThresholds,
          ...(updates && updates.alertThresholds ? updates.alertThresholds : {}),
        },
      };
      setSettings(next);
      persistFinanceDoc({ settings: next });
      return { success: true };
    },
    [settings, persistFinanceDoc]
  );

  // GestiÃ³n de transacciones
  const createTransaction = useCallback(
    async (transactionData) => {
      try {
        setIsLoading(true);
        const type = transactionData.type || 'expense';
        const amount = Number(transactionData.amount) || 0;
        const status = transactionData.status || (type === 'income' ? 'expected' : 'pending');

        let paidAmount = transactionData.paidAmount;
        if (paidAmount === '' || paidAmount === undefined) {
          paidAmount = null;
        } else if (paidAmount !== null) {
          const numericPaid = Number(paidAmount);
          paidAmount = Number.isFinite(numericPaid) ? numericPaid : null;
        }

        if (paidAmount !== null) {
          if (amount > 0) {
            paidAmount = Math.min(Math.max(paidAmount, 0), amount);
          } else {
            paidAmount = Math.max(paidAmount, 0);
          }
        }

        if (type === 'expense' && status === 'paid' && (paidAmount === null || paidAmount === 0)) {
          paidAmount = amount;
        }

        if (type === 'income' && status === 'received' && (paidAmount === null || paidAmount === 0)) {
          paidAmount = amount;
        }

        const attachmentsSpec = transactionData.attachments || {};
        const keepAttachments = Array.isArray(attachmentsSpec.keep) ? attachmentsSpec.keep : [];
        const filesToUpload = Array.isArray(attachmentsSpec.newFiles) ? attachmentsSpec.newFiles : [];

        const payload = {
          ...transactionData,
          type,
          status,
          amount,
          provider: (transactionData.provider || '').trim(),
          dueDate: transactionData.dueDate || null,
          paidAmount,
          date: transactionData.date || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };

        delete payload.attachments;

        if (!payload.provider) delete payload.provider;
        if (!payload.dueDate) payload.dueDate = null;
        if (payload.paidAmount === null) delete payload.paidAmount;
        if (payload.category) payload.category = String(payload.category).trim();

        let uploadedAttachments = [];
        if (filesToUpload.length > 0) {
          uploadedAttachments = await uploadEmailAttachments(filesToUpload, activeWedding || 'anonymous', 'finance');
        }

        if (keepAttachments.length > 0 || uploadedAttachments.length > 0) {
          const nowIso = new Date().toISOString();
          const attachments = [
            ...keepAttachments,
            ...uploadedAttachments.map((file) => ({ ...file, uploadedAt: nowIso })),
          ];
          payload.attachments = attachments;
        }

        const saved = await _addTransaction(payload);

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
        const existing = Array.isArray(transactions)
          ? transactions.find((tx) => tx.id === id)
          : null;

        const type = changes?.type || existing?.type || 'expense';
        const baseAmount = changes?.amount !== undefined ? Number(changes.amount) || 0 : Number(existing?.amount) || 0;
        const resolvedStatus = changes?.status || existing?.status || (type === 'income' ? 'expected' : 'pending');

        const payload = { ...changes };

        let keepAttachments = [];
        let filesToUpload = [];
        const hasAttachmentsSpec = Object.prototype.hasOwnProperty.call(changes || {}, 'attachments');
        if (hasAttachmentsSpec) {
          const attachmentSpec = changes.attachments || {};
          keepAttachments = Array.isArray(attachmentSpec.keep) ? attachmentSpec.keep : [];
          filesToUpload = Array.isArray(attachmentSpec.newFiles) ? attachmentSpec.newFiles : [];
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'attachments')) {
          delete payload.attachments;
        }

        if (changes?.amount !== undefined) {
          payload.amount = baseAmount;
        }

        if (changes?.status !== undefined) {
          payload.status = resolvedStatus;
        }

        if (changes?.provider !== undefined) {
          const provider = (changes.provider || '').trim();
          payload.provider = provider || null;
        }

        if (changes?.dueDate !== undefined) {
          payload.dueDate = changes.dueDate || null;
        }

        const shouldAdjustPaid =
          Object.prototype.hasOwnProperty.call(changes || {}, 'paidAmount') ||
          Object.prototype.hasOwnProperty.call(changes || {}, 'status');

        if (shouldAdjustPaid) {
          let paidAmount = changes?.paidAmount;
          if (paidAmount === '' || paidAmount === undefined) {
            paidAmount = null;
          } else if (paidAmount !== null) {
            const numericPaid = Number(paidAmount);
            paidAmount = Number.isFinite(numericPaid) ? numericPaid : null;
          } else if (existing && existing.paidAmount != null && changes?.paidAmount === null) {
            paidAmount = null;
          }

          if (paidAmount !== null) {
            if (baseAmount > 0) {
              paidAmount = Math.min(Math.max(paidAmount, 0), baseAmount);
            } else {
              paidAmount = Math.max(paidAmount, 0);
            }
          }

          if (type === 'expense' && resolvedStatus === 'paid' && (paidAmount === null || paidAmount === 0)) {
            paidAmount = baseAmount;
          }
          if (type === 'income' && resolvedStatus === 'received' && (paidAmount === null || paidAmount === 0)) {
            paidAmount = baseAmount;
          }

          if (paidAmount === null) {
            if (Object.prototype.hasOwnProperty.call(payload, 'paidAmount')) {
              delete payload.paidAmount;
            }
          } else {
            payload.paidAmount = paidAmount;
          }
        }

        let uploadedAttachments = [];
        if (filesToUpload.length > 0) {
          uploadedAttachments = await uploadEmailAttachments(filesToUpload, activeWedding || 'anonymous', 'finance');
        }

        if (hasAttachmentsSpec) {
          const nowIso = new Date().toISOString();
          const attachments = [
            ...keepAttachments,
            ...uploadedAttachments.map((file) => ({ ...file, uploadedAt: nowIso })),
          ];
          payload.attachments = attachments;
        }

        await _updateTransaction(id, payload);
        return { success: true };
      } catch (err) {
        console.error('Error actualizando transacción:', err);
        return { success: false, error: err.message };
      }
    },
    [_updateTransaction, transactions, activeWedding]
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
          const amount = Math.abs(transaction.amount);
          const type = transaction.amount < 0 ? 'expense' : 'income';
          await createTransaction({
            concept: transaction.description,
            amount,
            type,
            category: transaction.category || 'OTROS',
            provider: transaction.provider || transaction.counterparty || '',
            dueDate: transaction.dueDate || transaction.bookingDate || null,
            status: type === 'expense' ? 'paid' : 'received',
            paidAmount: amount,
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

  // Suscribirse a cuentas bancarias vinculadas (para CTA conectar banco)
  useEffect(() => {
    if (!activeWedding) return;
    const ref = doc(db, 'weddings', activeWedding, 'finance', 'accounts');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const acc = snap.exists() ? (snap.data() || {}) : {};
        setHasBankAccount(Boolean(acc.primaryAccountId));
      },
      () => setHasBankAccount(false)
    );
    return () => unsub();
  }, [activeWedding]);

  return {
    // Estados
    syncStatus,
    isLoading,
    error,
    contributions,
    budget,
    transactions,

    // CÃ¡lculos
    stats,
    budgetUsage,
    settings,
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
    updateBudgetSettings,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importBankTransactions,

    // Utilidades
    clearError: () => setError(null),
    hasBankAccount,
  };
}











