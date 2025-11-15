import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { transactionSchema, transactionUpdateSchema } from '@/schemas/transaction.js';

import { auth, db } from '../firebaseConfig';
import { useFirestoreCollection } from './useFirestoreCollection';
import { useWedding } from '../context/WeddingContext';
import { getTransactions } from '../services/bankService';
import { uploadEmailAttachments } from '../services/storageUploadService';
import { saveData } from '../services/SyncService';
import { requestBudgetAdvisor as fetchBudgetAdvisor } from '../services/budgetAdvisorService';
import { getLocalFinance, updateLocalFinance } from '../services/localWeddingStore';
import {
  normalizeBudgetCategoryKey,
  normalizeBudgetCategoryName,
  computeGuestBucket as computeGuestBucketUtil,
} from '../utils/budgetCategories';

const resolveLocalUid = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('MaLoveApp_user_profile');
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.uid || data?.id || null;
  } catch {
    return null;
  }
};

// Reglas simples de autocategorización por palabras clave/proveedor
const AUTO_CATEGORY_RULES = [
  { cat: 'Catering', keywords: ['catering', 'restaurante', 'banquete', 'comida', 'menú'] },
  { cat: 'Música', keywords: ['dj', 'banda', 'música', 'musica', 'orquesta', 'sonido'] },
  {
    cat: 'Flores',
    keywords: ['flor', 'flores', 'floristería', 'floristeria', 'ramo', 'decor floral'],
  },
  { cat: 'Fotografia', keywords: ['foto', 'fotógrafo', 'fotografo', 'fotografía', 'fotografia'] },
  { cat: 'Vestimenta', keywords: ['vestido', 'traje', 'moda', 'sastre', 'zapatos'] },
  {
    cat: 'Decoracion',
    keywords: ['decoración', 'decoracion', 'iluminación', 'iluminacion', 'alquiler', 'carpa'],
  },
  {
    cat: 'Transporte',
    keywords: ['taxi', 'uber', 'cabify', 'bus', 'autobús', 'autobus', 'transporte', 'coche'],
  },
  { cat: 'Alojamiento', keywords: ['hotel', 'hostal', 'alojamiento'] },
  {
    cat: 'Invitaciones',
    keywords: [
      'invitación',
      'invitacion',
      'papelería',
      'papeleria',
      'impresión',
      'impresion',
      'save the date',
    ],
  },
  {
    cat: 'Luna de miel',
    keywords: ['vuelo', 'viaje', 'luna de miel', 'airbnb', 'booking', 'hotel'],
  },
];

const normalizeCategoryName = (value) => normalizeBudgetCategoryName(value);

const dedupeServiceList = (list = []) => {
  const seen = new Set();
  const result = [];
  for (const entry of Array.isArray(list) ? list : []) {
    if (!entry) continue;
    const name = String(entry).trim();
    if (!name) continue;
    const key = normalizeCategoryName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
};

const arraysShallowEqual = (a = [], b = []) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const parseMoneyValue = (value, fallback = 0) => {
  if (value == null) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw) return fallback;
  let sanitized = raw.replace(/[^0-9.,-]/g, '');
  const commaIndex = sanitized.lastIndexOf(',');
  const dotIndex = sanitized.lastIndexOf('.');

  if (commaIndex > dotIndex) {
    const integerPart = sanitized
      .slice(0, commaIndex)
      .replace(/[^0-9-]/g, '')
      .replace(/\./g, '');
    const decimalPart = sanitized.slice(commaIndex + 1).replace(/[^0-9]/g, '');
    const normalized = `${integerPart}.${decimalPart}`;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : fallback;
  }

  sanitized = sanitized.replace(/,/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    const decimal = parts.pop();
    const integer = parts.join('').replace(/[^0-9-]/g, '');
    const normalized = `${integer}.${decimal}`;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : fallback;
  }

  const num = Number(sanitized);
  return Number.isFinite(num) ? num : fallback;
};

const resolveCategoryKey = (value) => normalizeBudgetCategoryKey(value);

const computeGuestBucket = (guestCount) => computeGuestBucketUtil(guestCount);

const extractCategoryNames = (list = []) =>
  Array.from(
    new Set(
      (Array.isArray(list) ? list : [])
        .map((entry) => {
          if (!entry) return '';
          if (typeof entry === 'string') return entry.trim();
          if (entry && typeof entry === 'object' && entry.name) return String(entry.name).trim();
          return '';
        })
        .filter(Boolean)
    )
  );

const normalizeAdvisorTimestamp = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') {
    try {
      const date = value.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {}
  }
  return null;
};

const normalizeAdvisorData = (rawAdvisor) => {
  if (!rawAdvisor || typeof rawAdvisor !== 'object') return null;
  const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };
  const scenarios = Array.isArray(rawAdvisor.scenarios)
    ? rawAdvisor.scenarios.map((scenario, idx) => {
        const allocation = Array.isArray(scenario?.allocation)
          ? scenario.allocation.map((entry) => ({
              category: String(entry?.category || ''),
              percentage: toNumberOrNull(entry?.percentage),
              amount: toNumberOrNull(entry?.amount),
              notes: entry?.notes ? String(entry.notes) : '',
            }))
          : [];
        return {
          id: scenario?.id || `scenario-${idx}`,
          label: scenario?.label || scenario?.title || `Escenario ${idx + 1}`,
          summary: scenario?.summary ? String(scenario.summary) : '',
          allocation,
          alerts: Array.isArray(scenario?.alerts)
            ? scenario.alerts.filter(Boolean).map((alert) => String(alert))
            : [],
          traceId: scenario?.traceId || null,
        };
      })
    : [];
  return {
    scenarios,
    globalTips: Array.isArray(rawAdvisor.globalTips)
      ? rawAdvisor.globalTips.filter(Boolean).map((tip) => String(tip))
      : [],
    requestedAt: normalizeAdvisorTimestamp(rawAdvisor.requestedAt),
    appliedAt: normalizeAdvisorTimestamp(rawAdvisor.appliedAt),
    selectedScenarioId: rawAdvisor.selectedScenarioId || null,
    traceId: rawAdvisor.traceId || null,
    feedback: rawAdvisor.feedback || null,
  };
};

const autoCategorizeTransaction = (concept = '', provider = '', amount = 0, type = 'expense') => {
  const text = `${concept} ${provider}`.toLowerCase();
  if (type !== 'expense') return '';
  for (const rule of AUTO_CATEGORY_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.cat;
  }
  return '';
};

const loadXLSXModule = async () => {
  const mod = await import('xlsx/xlsx.mjs');
  const cpexcel = await import('xlsx/dist/cpexcel.full.mjs');
  const XLSX = mod.default || mod;
  if (typeof XLSX.set_cptable === 'function') {
    XLSX.set_cptable(cpexcel.default || cpexcel);
  }
  return XLSX;
};

// Hook centralizado para gestión de finanzas
// Maneja transacciones, presupuestos, aportaciones y sincronización
export default function useFinance() {
  const { activeWedding, activeWeddingData } = useWedding();
  const firebaseUid = auth?.currentUser?.uid || null;

  // Estados principales
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

  const [advisor, setAdvisor] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);

  // Ajustes de finanzas (umbrales de alertas, etc.)
  const [settings, setSettings] = useState({
    alertThresholds: { warn: 75, danger: 90 },
  });

  // Servicios deseados desde proveedores (para plantillas por defecto)
  const [providerTemplates, setProviderTemplates] = useState([]);

  // Indica si hay cuenta bancaria vinculada
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [weddingTimeline, setWeddingTimeline] = useState({
    invitesSentDate: null,
    weddingDate: null,
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
      const localUid = firebaseUid || resolveLocalUid() || 'anonymous';
      let savedRemotely = false;
      if (firebaseUid && db) {
        try {
          const ref = doc(db, 'weddings', activeWedding, 'finance', 'main');
          await setDoc(ref, patch, { merge: true });
          savedRemotely = true;
        } catch (e) {
          // console.warn('[useFinance] No se pudo persistir finance/main en Firestore:', e);
        }
      }
      try {
        updateLocalFinance(localUid, activeWedding, patch);
      } catch (error) {
        if (!savedRemotely) {
          // console.warn('[useFinance] No se pudo persistir finance/main localmente:', error);
        }
      }
    },
    [activeWedding, firebaseUid]
  );

  const syncProviderTemplatesWithCategories = useCallback(
    async (categoriesList) => {
      const names = extractCategoryNames(categoriesList);
      const alreadyEqual = arraysShallowEqual(providerTemplates, names);
      if (!alreadyEqual) {
        setProviderTemplates(names);
      }
      if (!activeWedding || alreadyEqual) return;
      try {
        await saveData('wantedServices', names, {
          docPath: `weddings/${activeWedding}`,
          showNotification: false,
        });
      } catch (error) {
        // console.warn('[useFinance] No se pudieron sincronizar wantedServices', error);
      }
    },
    [activeWedding, providerTemplates]
  );

  useEffect(() => {
    if (!activeWedding) {
      setProviderTemplates((prev) => (prev.length ? [] : prev));
      return undefined;
    }
    if (!db) {
      setProviderTemplates((prev) => (prev.length ? [] : prev));
      return undefined;
    }
    const weddingRef = doc(db, 'weddings', activeWedding);
    const unsubscribe = onSnapshot(
      weddingRef,
      (snap) => {
        if (!snap.exists()) {
          setProviderTemplates((prev) => (prev.length ? [] : prev));
          return;
        }
        try {
          const data = snap.data() || {};
          const rawList =
            Array.isArray(data?.wantedServices) && data.wantedServices.length
              ? data.wantedServices
              : Array.isArray(data?.neededServices) && data.neededServices.length
                ? data.neededServices
                : Array.isArray(data?.requiredServices) && data.requiredServices.length
                  ? data.requiredServices
                  : [];
          const normalized = (Array.isArray(rawList) ? rawList : [])
            .map((entry) => {
              if (typeof entry === 'string') return entry;
              if (entry && typeof entry === 'object') {
                return entry.name || entry.label || entry.id || '';
              }
              return '';
            })
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean);
          const deduped = dedupeServiceList(normalized);
          setProviderTemplates((prev) => (arraysShallowEqual(prev, deduped) ? prev : deduped));
        } catch (err) {
          // console.warn('[useFinance] Error procesando wantedServices:', err);
        }
      },
      (err) => {
        // console.warn('[useFinance] Error escuchando wantedServices:', err);
        setProviderTemplates((prev) => (prev.length ? [] : prev));
      }
    );
    return () => unsubscribe();
  }, [activeWedding]);

  // Cálculos memoizados
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

  const emergencyAmount = useMemo(() => Math.round(budget.total * 0.1), [budget.total]);

  const totalSpent = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + normalizePaidAmount(t), 0);
  }, [transactions, normalizePaidAmount]);

  const monthlySeries = useMemo(() => {
    const arr = Array.isArray(transactions) ? transactions : [];
    const now = new Date();
    const months = [];
    const incomeMap = new Map();
    const expenseMap = new Map();
    for (let i = 11; i >= 0; i--) {
      const point = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${point.getFullYear()}-${String(point.getMonth() + 1).padStart(2, '0')}`;
      months.push(key);
      incomeMap.set(key, 0);
      expenseMap.set(key, 0);
    }
    for (const tx of arr) {
      if (!tx?.date) continue;
      const parsed = new Date(tx.date);
      if (Number.isNaN(parsed.getTime())) continue;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      if (!incomeMap.has(key)) continue;
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        incomeMap.set(key, (incomeMap.get(key) || 0) + Math.max(0, amount));
      } else if (tx.type === 'expense') {
        expenseMap.set(key, (expenseMap.get(key) || 0) + Math.max(0, amount));
      }
    }
    const income = months.map((key) => incomeMap.get(key) || 0);
    const expense = months.map((key) => expenseMap.get(key) || 0);
    const net = income.map((value, idx) => value - expense[idx]);
    return { months, income, expense, net };
  }, [transactions]);

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

  // Estadísticas generales
  const paymentHealth = useMemo(() => {
    if (!Array.isArray(transactions)) {
      return { pendingExpenses: 0, overdueExpenses: 0 };
    }
    const now = new Date();
    return transactions.reduce(
      (acc, tx) => {
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
      },
      { pendingExpenses: 0, overdueExpenses: 0 }
    );
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
      budgetUsagePercentage: budget.total > 0 ? (totalSpent / budget.total) * 100 : 0,
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

  // Proyección completa (ingresos y gastos futuros)
  const projection = useMemo(() => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weddingDate =
        weddingTimeline.weddingDate instanceof Date &&
        !Number.isNaN(weddingTimeline.weddingDate?.getTime())
          ? new Date(
              weddingTimeline.weddingDate.getFullYear(),
              weddingTimeline.weddingDate.getMonth(),
              weddingTimeline.weddingDate.getDate()
            )
          : null;
      const invitesDateRaw =
        weddingTimeline.invitesSentDate instanceof Date &&
        !Number.isNaN(weddingTimeline.invitesSentDate?.getTime())
          ? new Date(
              weddingTimeline.invitesSentDate.getFullYear(),
              weddingTimeline.invitesSentDate.getMonth(),
              weddingTimeline.invitesSentDate.getDate()
            )
          : null;
      const invitesDate =
        invitesDateRaw || new Date(start.getFullYear(), start.getMonth(), start.getDate() - 60);
      const tailDays = 30;
      const end = weddingDate
        ? new Date(
            weddingDate.getFullYear(),
            weddingDate.getMonth(),
            weddingDate.getDate() + tailDays
          )
        : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 90);

      const daysBetween = (d1, d2) => Math.max(0, Math.ceil((d2 - d1) / (24 * 60 * 60 * 1000)));
      const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
      const toISO = (d) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

      const incomesByDay = new Map();
      const expensesByDay = new Map();
      const bump = (map, date, amount) => {
        if (!amount || !Number.isFinite(amount)) return;
        const key = toISO(date);
        map.set(key, (map.get(key) || 0) + amount);
      };

      // Invitados: curva Beta-like entre invitaciones y boda, con cola post-boda
      const totalGifts = Math.max(
        0,
        (contributions.giftPerGuest || 0) * (contributions.guestCount || 0)
      );
      const preDays = weddingDate ? Math.max(1, daysBetween(invitesDate, weddingDate)) : 60;
      const a = 2.5,
        b = 2.0; // forma asimétrica
      let preWeights = [];
      let preSum = 0;
      for (let i = 0; i < preDays; i++) {
        const x = (i + 1) / preDays;
        const w = Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
        preWeights.push(w);
        preSum += w;
      }
      preWeights = preSum > 0 ? preWeights.map((w) => w / preSum) : Array(preDays).fill(0);
      const tailMass = 0.3;
      const preMass = 1 - tailMass;
      for (let i = 0; i < preDays; i++) {
        const d = addDays(invitesDate, i);
        if (d >= start && d <= end) bump(incomesByDay, d, totalGifts * preMass * preWeights[i]);
      }
      const r = 0.9;
      let geoSum = 0;
      for (let i = 1; i <= tailDays; i++) geoSum += Math.pow(r, i);
      for (let i = 1; i <= tailDays; i++) {
        const d = weddingDate ? addDays(weddingDate, i) : addDays(start, i);
        if (d >= start && d <= end)
          bump(incomesByDay, d, totalGifts * tailMass * (Math.pow(r, i) / geoSum));
      }

      // Contribuciones de novios
      const initialContrib = Math.max(0, (contributions.initA || 0) + (contributions.initB || 0));
      const monthly = Math.max(0, (contributions.monthlyA || 0) + (contributions.monthlyB || 0));
      const extras = Math.max(0, contributions.extras || 0);
      const contribStart = invitesDate > start ? invitesDate : start;
      if (initialContrib > 0) bump(incomesByDay, contribStart, initialContrib);
      if (monthly > 0) {
        let d = new Date(start);
        while (d <= end && (!weddingDate || d <= weddingDate)) {
          bump(incomesByDay, d, monthly);
          d = addDays(d, 30);
        }
      }
      if (extras > 0) bump(incomesByDay, weddingDate || end, extras);

      // Gastos: pagos pendientes con dueDate
      for (const tx of Array.isArray(transactions) ? transactions : []) {
        if (!tx || tx.type !== 'expense') continue;
        const due = tx.dueDate ? new Date(tx.dueDate) : null;
        if (!due || Number.isNaN(due.getTime())) continue;
        const amount = Number(tx.amount) || 0;
        const paid = normalizePaidAmount(tx);
        const outstanding = Math.max(0, amount - paid);
        if (outstanding <= 0) continue;
        const dd = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        if (dd >= start && dd <= end) bump(expensesByDay, dd, outstanding);
      }

      // Serie
      const series = [];
      const daysTotal = daysBetween(start, end);
      let balance = totalIncome - totalSpent;
      let minBalance = balance;
      let minDate = toISO(start);
      let riskDays = 0;
      for (let i = 0; i <= daysTotal; i++) {
        const d = addDays(start, i);
        const key = toISO(d);
        const inc = incomesByDay.get(key) || 0;
        const exp = expensesByDay.get(key) || 0;
        balance = balance + inc - exp;
        if (balance < minBalance) {
          minBalance = balance;
          minDate = key;
        }
        if (balance < 0) riskDays += 1;
        series.push({ date: key, income: inc, expense: exp, balance });
      }

      const toISODate = (d) =>
        d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : null;
      const projectedAtWedding = weddingDate
        ? (series.find((p) => p.date === toISODate(weddingDate))?.balance ?? balance)
        : balance;
      return {
        startDate: toISO(start),
        endDate: toISO(end),
        weddingDate: toISODate(weddingDate),
        invitesSentDate: toISODate(invitesDate),
        params: { gifts: { a, b, tailMass, r }, monthlyStepDays: 30, tailDays },
        series,
        summary: {
          projectedAtWedding,
          minProjectedBalance: minBalance,
          minProjectedBalanceDate: minDate,
          riskDays,
          totalProjectedGifts: totalGifts,
        },
      };
    } catch (e) {
      // console.warn('[useFinance] projection computation error:', e);
      return null;
    }
  }, [transactions, contributions, totalIncome, totalSpent, weddingTimeline]);

  const predictiveInsights = useMemo(() => {
    if (!Array.isArray(transactions) || transactions.length === 0) return null;
    const sliceCount = Math.min(monthlySeries.net.length, 6);
    const recentNet = monthlySeries.net.slice(monthlySeries.net.length - sliceCount);
    const recentIncome = monthlySeries.income.slice(monthlySeries.income.length - sliceCount);
    const recentExpense = monthlySeries.expense.slice(monthlySeries.expense.length - sliceCount);
    const avg = (arr) => (arr.length ? arr.reduce((sum, value) => sum + value, 0) / arr.length : 0);
    const avgNet = avg(recentNet);
    const avgIncome = avg(recentIncome);
    const avgExpense = avg(recentExpense);
    const burnRate = avgNet < 0 ? Math.abs(avgNet) : 0;
    const budgetRemaining = Math.max(0, (stats?.totalBudget || 0) - (stats?.totalSpent || 0));
    let monthsToZero = null;
    let projectedZeroDate = null;
    if (burnRate > 0) {
      monthsToZero = budgetRemaining / burnRate;
      if (Number.isFinite(monthsToZero)) {
        const zeroDate = new Date();
        const wholeMonths = Math.floor(monthsToZero);
        const extraDays = Math.round((monthsToZero - wholeMonths) * 30);
        zeroDate.setMonth(zeroDate.getMonth() + wholeMonths);
        zeroDate.setDate(zeroDate.getDate() + extraDays);
        projectedZeroDate = zeroDate.toISOString().slice(0, 10);
      }
    }
    const warnThreshold = settings?.alertThresholds?.warn ?? 75;
    const categoriesAtRisk = (budgetUsage || [])
      .filter((cat) => !cat.muted && (cat.percentage || 0) >= warnThreshold)
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, 5)
      .map((cat) => ({
        name: cat.name,
        percentage: cat.percentage,
        remaining: cat.remaining,
      }));
    const now = new Date();
    const upcomingPayments = (Array.isArray(transactions) ? transactions : [])
      .filter(
        (tx) =>
          tx &&
          tx.type === 'expense' &&
          tx.dueDate &&
          (tx.status || '') !== 'paid' &&
          new Date(tx.dueDate) >= now
      )
      .map((tx) => ({
        concept: tx.concept || tx.description || '(Sin concepto)',
        dueDate: new Date(tx.dueDate).toISOString().slice(0, 10),
        outstanding: Math.max(0, (Number(tx.amount) || 0) - normalizePaidAmount(tx)),
        provider: tx.provider || '',
      }))
      .filter((item) => item.outstanding > 0)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
    const forecastSurplus = projection?.summary?.projectedAtWedding ?? stats?.currentBalance ?? 0;
    let monthsToWedding = null;
    if (
      weddingTimeline.weddingDate instanceof Date &&
      !Number.isNaN(weddingTimeline.weddingDate.getTime())
    ) {
      const diff =
        (weddingTimeline.weddingDate.getFullYear() - now.getFullYear()) * 12 +
        (weddingTimeline.weddingDate.getMonth() - now.getMonth()) +
        (weddingTimeline.weddingDate.getDate() - now.getDate()) / 30;
      monthsToWedding = diff > 0 ? diff : 0;
    }
    const recommendedMonthlySaving =
      monthsToWedding && monthsToWedding > 0 ? Math.max(0, budgetRemaining / monthsToWedding) : 0;
    const netTrendDiff =
      monthlySeries.net.length >= 2
        ? monthlySeries.net[monthlySeries.net.length - 1] - monthlySeries.net[0]
        : 0;
    const trend = netTrendDiff > 0 ? 'up' : netTrendDiff < 0 ? 'down' : 'flat';
    return {
      avgNet,
      avgIncome,
      avgExpense,
      burnRate,
      monthsToZero,
      projectedZeroDate,
      categoriesAtRisk,
      upcomingPayments,
      forecastSurplus,
      recommendedMonthlySaving,
      netTrend: { change: netTrendDiff, direction: trend },
    };
  }, [
    transactions,
    monthlySeries,
    stats,
    budgetUsage,
    settings,
    projection,
    weddingTimeline,
    normalizePaidAmount,
  ]);
  // Suscribirse a cambios en el estado de sincronización
  // Cargar número de invitados desde el perfil de la boda
  const loadGuestCount = useCallback(async () => {
    if (!activeWedding) return;

    try {
      setIsLoading(true);
      const infoSnap = await getDoc(doc(db, 'weddings', activeWedding, 'info', 'weddingInfo'));
      if (infoSnap.exists()) {
        const info = infoSnap.data();
        if (info?.numGuests) {
          setContributions((prev) => ({
            ...prev,
            guestCount: Number(info.numGuests),
          }));
        }
        // Fechas clave: invitaciones y boda
        try {
          const rawWeddingDate = info?.weddingDate || info?.date || null;
          const rawInvitesDate =
            info?.invitesSentDate ||
            info?.invitationsSentDate ||
            info?.invitesSentAt ||
            info?.invitationsSentAt ||
            null;
          const parsedWedding = rawWeddingDate ? new Date(rawWeddingDate) : null;
          const parsedInvites = rawInvitesDate ? new Date(rawInvitesDate) : null;
          setWeddingTimeline({ invitesSentDate: parsedInvites, weddingDate: parsedWedding });
        } catch (_) {}
      }
    } catch (err) {
      // console.error('Error cargando número de invitados:', err);
      setError('Error cargando datos del perfil');
    } finally {
      setIsLoading(false);
    }
  }, [activeWedding]);

  // Cargar presupuesto y aportaciones desde weddings/{id}/finance/main
  useEffect(() => {
    if (!activeWedding) return;
    const localUid = firebaseUid || resolveLocalUid() || 'anonymous';
    let unsub = null;
    let cancelled = false;

    const applyLocalFinance = () => {
      const local = getLocalFinance(localUid, activeWedding);
      const localBudget = local?.budget || { total: 0, categories: [] };
      const localSettings = local?.settings || { alertThresholds: { warn: 75, danger: 90 } };
      const localContributions = local?.contributions || {
        initA: 0,
        initB: 0,
        monthlyA: 0,
        monthlyB: 0,
        extras: 0,
        giftPerGuest: 0,
        guestCount: 0,
      };

      setBudget({
        total: parseMoneyValue(localBudget.total, 0),
        categories: Array.isArray(localBudget.categories)
          ? localBudget.categories.map((c) => ({
              name: String(c.name || ''),
              amount: parseMoneyValue(c.amount, 0),
              muted: Boolean(c.muted || false),
              source: c.source ? String(c.source) : undefined,
            }))
          : [],
      });
      setSettings({
        alertThresholds: {
          warn: Number(localSettings.alertThresholds?.warn) || 75,
          danger: Number(localSettings.alertThresholds?.danger) || 90,
        },
      });
      setContributions({
        initA: Number(localContributions.initA) || 0,
        initB: Number(localContributions.initB) || 0,
        monthlyA: Number(localContributions.monthlyA) || 0,
        monthlyB: Number(localContributions.monthlyB) || 0,
        extras: Number(localContributions.extras) || 0,
        giftPerGuest: Number(localContributions.giftPerGuest) || 0,
        guestCount: Number(localContributions.guestCount) || 0,
      });
      if (local?.aiAdvisor) {
        const normalized = normalizeAdvisorData(local.aiAdvisor);
        setAdvisor(normalized);
        setAdvisorError(null);
      } else {
        setAdvisor(null);
      }
    };

    if (!db || !firebaseUid) {
      applyLocalFinance();
      return;
    }

    const ref = doc(db, 'weddings', activeWedding, 'finance', 'main');
    unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          applyLocalFinance();
          return;
        }
        const data = snap.data() || {};
        const budgetData = data.budget || {};
        const settingsData = data.settings || {};
        const contributionsData = data.contributions || {};

        setBudget({
          total: parseMoneyValue(budgetData.total, 0),
          categories: Array.isArray(budgetData.categories)
            ? budgetData.categories.map((c) => ({
                name: String(c.name || ''),
                amount: parseMoneyValue(c.amount, 0),
                muted: Boolean(c.muted || false),
                source: c.source ? String(c.source) : undefined,
              }))
            : [],
        });

        setSettings({
          alertThresholds: {
            warn: Number(settingsData.alertThresholds?.warn) || 75,
            danger: Number(settingsData.alertThresholds?.danger) || 90,
          },
        });

        setContributions({
          initA: Number(contributionsData.initA) || 0,
          initB: Number(contributionsData.initB) || 0,
          monthlyA: Number(contributionsData.monthlyA) || 0,
          monthlyB: Number(contributionsData.monthlyB) || 0,
          extras: Number(contributionsData.extras) || 0,
          giftPerGuest: Number(contributionsData.giftPerGuest) || 0,
          guestCount: Number(contributionsData.guestCount) || 0,
        });

        if (data.aiAdvisor && typeof data.aiAdvisor === 'object') {
          const normalized = normalizeAdvisorData(data.aiAdvisor);
          setAdvisor(normalized);
          setAdvisorError(null);
        } else {
          setAdvisor(null);
        }

        updateLocalFinance(localUid, activeWedding, {
          budget: budgetData,
          settings: settingsData,
          contributions: contributionsData,
          aiAdvisor: data.aiAdvisor || null,
        });
      },
      (err) => {
        // console.warn('[useFinance] Error leyendo finance/main:', err);
        applyLocalFinance();
      }
    );

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, [activeWedding, firebaseUid]);

  useEffect(() => {
    if (!activeWedding) return;
    if (!Array.isArray(providerTemplates) || providerTemplates.length === 0) return;

    const normalizedDesired = [];
    const seen = new Set();
    for (const name of providerTemplates) {
      const key = normalizeCategoryName(name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      normalizedDesired.push({ name, key });
    }

    if (!normalizedDesired.length) return;

    const currentCategories = Array.isArray(budget.categories) ? budget.categories : [];

    const nextCategories = normalizedDesired.map(({ name, key }) => {
      const existing = currentCategories.find((cat) => normalizeCategoryName(cat?.name) === key);
      return {
        ...existing,
        name,
        amount: existing ? Number(existing.amount) || 0 : 0,
        muted: existing ? Boolean(existing.muted) : false,
      };
    });

    const shouldUpdate =
      currentCategories.length !== nextCategories.length ||
      currentCategories.some((cat, index) => {
        const next = nextCategories[index];
        if (!next) return true;
        if (normalizeCategoryName(cat?.name) !== normalizeCategoryName(next?.name)) return true;
        if ((Number(cat?.amount) || 0) !== (Number(next?.amount) || 0)) return true;
        if (Boolean(cat?.muted) !== Boolean(next?.muted)) return true;
        return false;
      });

    if (!shouldUpdate) return;

    setBudget((prev) => {
      const nextState = { ...prev, categories: nextCategories };
      persistFinanceDoc({ budget: { total: nextState.total, categories: nextCategories } });
      return nextState;
    });
  }, [activeWedding, providerTemplates, budget.categories, persistFinanceDoc, firebaseUid]);

  // Actualizar configuración de aportaciones y persistir
  const updateContributions = useCallback(
    async (updates) => {
      setContributions((prev) => {
        const next = { ...prev, ...updates };

        // 1. Persistir en finance/main (como antes)
        persistFinanceDoc({ contributions: next });

        // 2. SINCRONIZACIÓN: Si actualiza guestCount, sincronizar en documento raíz
        // Esto permite que otros sistemas lean el número de invitados correctamente
        if (updates.guestCount !== undefined && activeWedding && db && firebaseUid) {
          (async () => {
            try {
              const weddingRef = doc(db, 'weddings', activeWedding);
              await setDoc(
                weddingRef,
                {
                  guestCount: next.guestCount,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
              // console.log(`[useFinance] GuestCount sincronizado en raíz: ${next.guestCount} invitados`);
            } catch (error) {
              // console.warn('[useFinance] No se pudo sincronizar guestCount en documento raíz:', error);
              // No fallar la operación principal si esto falla
            }
          })();
        }

        return next;
      });
    },
    [persistFinanceDoc, activeWedding, firebaseUid]
  );

  // Gestión de categorías de presupuesto
  const addBudgetCategory = useCallback(
    (name, amount = 0) => {
      if (!name || budget.categories.find((c) => c.name === name)) {
        return { success: false, error: 'Categoría ya existe o nombre inválido' };
      }
      const parsedAmount = parseMoneyValue(amount, 0);
      const nextCategories = [...budget.categories, { name, amount: parsedAmount }];
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
      syncProviderTemplatesWithCategories(nextCategories);
      return { success: true };
    },
    [budget.categories, budget.total, persistFinanceDoc, syncProviderTemplatesWithCategories]
  );

  const setBudgetCategories = useCallback(
    (nextCategories) => {
      if (!Array.isArray(nextCategories)) return;
      const sanitized = nextCategories.map((cat) => ({
        ...cat,
        amount: parseMoneyValue(cat?.amount, 0),
      }));
      setBudget((prev) => ({ ...prev, categories: sanitized }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: sanitized },
      });
      syncProviderTemplatesWithCategories(sanitized);
    },
    [budget.total, persistFinanceDoc, syncProviderTemplatesWithCategories]
  );

  const updateBudgetCategory = useCallback(
    (index, updates) => {
      const nextCategories = budget.categories.map((cat, idx) => {
        if (idx !== index) return cat;
        const nextAmount =
          updates.amount != null
            ? parseMoneyValue(updates.amount, 0)
            : parseMoneyValue(cat.amount, 0);
        return { ...cat, ...updates, amount: nextAmount };
      });
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
      syncProviderTemplatesWithCategories(nextCategories);
    },
    [budget.categories, budget.total, persistFinanceDoc, syncProviderTemplatesWithCategories]
  );

  const removeBudgetCategory = useCallback(
    (index) => {
      const nextCategories = budget.categories.filter((_, idx) => idx !== index);
      setBudget((prev) => ({ ...prev, categories: nextCategories }));
      persistFinanceDoc({
        budget: { total: budget.total, categories: nextCategories },
      });
      syncProviderTemplatesWithCategories(nextCategories);
    },
    [budget.categories, budget.total, persistFinanceDoc, syncProviderTemplatesWithCategories]
  );

  const captureBudgetSnapshot = useCallback(
    async ({ status = 'confirmed', source = 'manual' } = {}) => {
      if (!activeWedding || !db) {
        return { success: false, reason: 'no_active_wedding' };
      }
      try {
        const categories = Array.isArray(budget.categories) ? budget.categories : [];
        if (!categories.length) {
          return { success: false, reason: 'empty_categories' };
        }

        const normalizedCategories = categories
          .map((cat) => {
            const amount = parseMoneyValue(cat?.amount, 0);
            const key = resolveCategoryKey(cat?.name || '');
            if (!key || amount <= 0) return null;
            return {
              key,
              name: cat?.name?.trim() || key,
              amount,
            };
          })
          .filter(Boolean);

        if (!normalizedCategories.length) {
          return { success: false, reason: 'normalized_empty' };
        }

        const totalBudget =
          parseMoneyValue(budget.total, 0) ||
          normalizedCategories.reduce((sum, entry) => sum + entry.amount, 0);
        if (totalBudget <= 0) {
          return { success: false, reason: 'total_budget_zero' };
        }

        const weddingCountry =
          activeWeddingData?.countryCode ||
          activeWeddingData?.country ||
          activeWeddingData?.region ||
          'global';
        const regionKey = normalizeCategoryName(weddingCountry) || 'global';
        const guestCount = contributions?.guestCount || activeWeddingData?.guestCount || 0;
        const guestBucket = computeGuestBucket(guestCount);

        const normalizedHash = normalizedCategories
          .map((entry) => `${entry.key}:${Math.round(entry.amount * 100)}`)
          .sort()
          .join('|');

        const nowIso = new Date().toISOString();
        const snapshotPayload = {
          status,
          snapshotId: nowIso,
          capturedAt: nowIso,
          capturedAtTs: serverTimestamp(),
          currency:
            activeWeddingData?.currency || settings?.currency || contributions?.currency || 'EUR',
          wedding: {
            id: activeWedding,
            guestCount,
            country: weddingCountry,
            region:
              activeWeddingData?.province ||
              activeWeddingData?.state ||
              activeWeddingData?.city ||
              '',
            style: activeWeddingData?.style || null,
            type: activeWeddingData?.eventType || activeWeddingData?.type || 'boda',
          },
          totals: {
            budget: totalBudget,
            spent: Number(stats?.totalSpent) || 0,
            expectedIncome: Number(expectedIncome) || 0,
          },
          categories: normalizedCategories,
          regionKey,
          guestBucket,
          meta: {
            version: 1,
            source,
            normalizedHash,
            updatedAt: serverTimestamp(),
          },
        };

        const snapshotId = nowIso.replace(/[:.]/g, '-');
        await setDoc(
          doc(db, 'weddings', activeWedding, 'budgetSnapshots', snapshotId),
          snapshotPayload
        );
        await setDoc(doc(db, 'budgetSnapshots', activeWedding), snapshotPayload, { merge: true });

        return { success: true, snapshotId };
      } catch (error) {
        // console.error('[useFinance] captureBudgetSnapshot failed', error);
        return { success: false, error: error?.message || 'snapshot_failed' };
      }
    },
    [
      activeWedding,
      activeWeddingData,
      budget.categories,
      budget.total,
      contributions,
      expectedIncome,
      settings?.currency,
      stats?.totalSpent,
      db,
    ]
  );

  const requestBudgetAdvisor = useCallback(async () => {
    if (!activeWedding) {
      throw new Error('No hay una boda activa seleccionada.');
    }
    const categories = Array.isArray(budget.categories) ? budget.categories : [];
    if (!categories.length) {
      throw new Error('Configura al menos una categoría antes de usar el consejero.');
    }

    const currency =
      activeWeddingData?.currency ||
      budget?.currency ||
      settings?.currency ||
      contributions?.currency ||
      'EUR';

    const guestCount = contributions?.guestCount || activeWeddingData?.guestCount || null;

    const styleNotes = [
      activeWeddingData?.style,
      activeWeddingData?.theme,
      activeWeddingData?.notes,
    ]
      .filter(Boolean)
      .join('. ');

    const baseTotal =
      Number(budget.total) || categories.reduce((sum, cat) => sum + (Number(cat.amount) || 0), 0);

    const payload = {
      weddingId: activeWedding,
      context: {
        eventType: activeWeddingData?.eventType || activeWeddingData?.type || 'boda',
        guestCount,
        city:
          activeWeddingData?.city ||
          activeWeddingData?.location ||
          activeWeddingData?.province ||
          '',
        date: (() => {
          const raw = activeWeddingData?.weddingDate || activeWeddingData?.date || null;
          if (!raw) return null;
          const parsed = new Date(raw);
          return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
        })(),
        currency,
        styleNotes,
      },
      budget: {
        total: Number(budget.total) || baseTotal,
        categories: categories.map((cat) => ({
          name: cat.name,
          amount: Number(cat.amount) || 0,
        })),
      },
      constraints: {
        mustHave: providerTemplates,
        priorities: Array.isArray(activeWeddingData?.priorities)
          ? activeWeddingData.priorities.filter(Boolean)
          : [],
      },
      financeStatus: {
        incomeConfirmed: stats.totalIncome,
        incomeExpected: expectedIncome,
        expensesCommitted: totalSpent,
        pendingExpenses: paymentHealth.pendingExpenses,
      },
    };

    setAdvisorLoading(true);
    setAdvisorError(null);
    try {
      const response = await fetchBudgetAdvisor(payload);
      const normalized = normalizeAdvisorData({
        scenarios: Array.isArray(response?.scenarios) ? response.scenarios : [],
        globalTips: response?.globalTips,
        requestedAt: response?.requestedAt || new Date().toISOString(),
        traceId: response?.traceId || null,
        feedback: response?.feedback || null,
        selectedScenarioId: null,
        appliedAt: null,
      });
      setAdvisor(normalized);
      persistFinanceDoc({ aiAdvisor: normalized });
      return normalized;
    } catch (err) {
      // console.error('[useFinance] advisor request failed', err);
      const message = err?.message || 'No se pudo obtener la recomendación del consejero.';
      setAdvisorError(message);
      throw err;
    } finally {
      setAdvisorLoading(false);
    }
  }, [
    activeWedding,
    activeWeddingData,
    budget.categories,
    budget.total,
    contributions,
    expectedIncome,
    paymentHealth.pendingExpenses,
    providerTemplates,
    stats.totalIncome,
    totalSpent,
    persistFinanceDoc,
    settings,
  ]);

  const applyAdvisorScenario = useCallback(
    (scenarioId) => {
      if (!advisor || !Array.isArray(advisor.scenarios)) {
        return { ok: false, reason: 'advisor_unavailable' };
      }
      const scenario = advisor.scenarios.find((entry) => entry.id === scenarioId) || null;
      if (!scenario) {
        return { ok: false, reason: 'scenario_not_found' };
      }
      const allocation = Array.isArray(scenario.allocation) ? scenario.allocation : [];
      if (!allocation.length) {
        return { ok: false, reason: 'allocation_empty' };
      }

      const baseTotal =
        Number(budget.total) ||
        budget.categories.reduce((sum, cat) => sum + (Number(cat.amount) || 0), 0);

      const categoryMap = new Map();
      budget.categories.forEach((cat, idx) => {
        categoryMap.set(normalizeCategoryName(cat.name), { cat, idx });
      });

      const updatedCategories = budget.categories.map((cat) => ({ ...cat }));
      const handled = new Set();

      allocation.forEach((entry) => {
        const key = normalizeCategoryName(entry?.category);
        if (!key) return;
        handled.add(key);
        const parsedAmount =
          entry?.amount != null
            ? Number(entry.amount)
            : entry?.percentage != null && baseTotal > 0
              ? (Number(entry.percentage) / 100) * baseTotal
              : null;
        const amount =
          parsedAmount != null && Number.isFinite(parsedAmount)
            ? Math.max(0, Math.round(parsedAmount * 100) / 100)
            : 0;
        if (categoryMap.has(key)) {
          const { idx } = categoryMap.get(key);
          updatedCategories[idx] = {
            ...updatedCategories[idx],
            amount,
            source: 'advisor',
          };
        } else {
          updatedCategories.push({
            name: entry?.category || `Categoría ${updatedCategories.length + 1}`,
            amount,
            muted: false,
            source: 'advisor',
          });
        }
      });

      const nextAdvisorState = {
        ...(advisor || {}),
        selectedScenarioId: scenarioId,
        appliedAt: new Date().toISOString(),
      };

      setBudget((prev) => ({ ...prev, categories: updatedCategories }));
      setAdvisor(nextAdvisorState);
      persistFinanceDoc({
        budget: { total: budget.total, categories: updatedCategories },
        aiAdvisor: nextAdvisorState,
      });
      return { ok: true };
    },
    [advisor, budget.categories, budget.total, persistFinanceDoc]
  );

  const refreshBudgetAdvisor = useCallback(async () => {
    return requestBudgetAdvisor();
  }, [requestBudgetAdvisor]);

  const updateTotalBudget = useCallback(
    async (newTotal) => {
      const total = parseMoneyValue(newTotal, 0);
      setBudget((prev) => ({ ...prev, total }));

      // 1. Actualizar finance/main (como antes)
      await persistFinanceDoc({ budget: { total, categories: budget.categories } });

      // 2. SINCRONIZACIÓN: También actualizar documento raíz de la boda
      // Esto permite que useWeddingBasicInfo lea el presupuesto correctamente
      if (activeWedding && db && firebaseUid) {
        try {
          const weddingRef = doc(db, 'weddings', activeWedding);
          await setDoc(
            weddingRef,
            {
              budget: { total },
              presupuesto: total, // Legacy compatibility
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          // console.log(`[useFinance] Presupuesto sincronizado en raíz: ${total}€`);
        } catch (error) {
          // console.warn('[useFinance] No se pudo sincronizar presupuesto en documento raíz:', error);
          // No fallar la operación principal si esto falla
        }
      }

      return { success: true };
    },
    [budget.categories, persistFinanceDoc, activeWedding, firebaseUid]
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

  // Gestión de transacciones
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

        if (
          type === 'income' &&
          status === 'received' &&
          (paidAmount === null || paidAmount === 0)
        ) {
          paidAmount = amount;
        }

        const attachmentsSpec = transactionData.attachments || {};
        const keepAttachments = Array.isArray(attachmentsSpec.keep) ? attachmentsSpec.keep : [];
        const filesToUpload = Array.isArray(attachmentsSpec.newFiles)
          ? attachmentsSpec.newFiles
          : [];

        let payload = {
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

        // Autocategorizar si no hay categoría definida o es genérica
        if (!payload.category || payload.category === 'OTROS' || payload.category === 'Otros') {
          const inferred = autoCategorizeTransaction(
            payload.concept || payload.description || '',
            payload.provider || '',
            payload.amount,
            payload.type
          );
          if (inferred) payload.category = inferred;
        }

        let uploadedAttachments = [];
        if (filesToUpload.length > 0) {
          uploadedAttachments = await uploadEmailAttachments(
            filesToUpload,
            activeWedding || 'anonymous',
            'finance'
          );
        }

        const normalizeAttachment = (att) => ({
          ...att,
          storagePath: att.storagePath ?? null,
        });

        if (keepAttachments.length > 0 || uploadedAttachments.length > 0) {
          const nowIso = new Date().toISOString();
          const attachments = [
            ...keepAttachments.map(normalizeAttachment),
            ...uploadedAttachments.map((file) => ({ ...file, uploadedAt: nowIso })),
          ];
          payload.attachments = attachments;
        }

        const payloadMeta =
          transactionData.meta && typeof transactionData.meta === 'object'
            ? { ...transactionData.meta }
            : {};
        if (!payloadMeta.source) {
          payloadMeta.source =
            transactionData.source ||
            (transactionData.description && /desde email:/i.test(transactionData.description)
              ? 'email'
              : 'manual');
        }
        payload.meta = payloadMeta;
        payload.source = payloadMeta.source;
        if (!payload.paymentMethod) {
          delete payload.paymentMethod;
        }

        // Validar y normalizar con Zod
        const parsed = transactionSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(parsed.error?.errors?.[0]?.message || 'Datos de transacción inválidos');
        }
        payload = parsed.data;

        const saved = await _addTransaction(payload);

        const baseTransactions = Array.isArray(transactions) ? transactions : [];
        const updatedTransactions = [...baseTransactions, saved];
        const trimmedTransactions = updatedTransactions.slice(-200);
        saveData('movements', trimmedTransactions, {
          docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
          showNotification: false,
        });
        window.dispatchEvent(new Event('maloveapp-movements'));

        return { success: true, data: saved };
      } catch (err) {
        // console.error('Error creando transacción:', err);
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
        const baseAmount =
          changes?.amount !== undefined
            ? Number(changes.amount) || 0
            : Number(existing?.amount) || 0;
        const resolvedStatus =
          changes?.status || existing?.status || (type === 'income' ? 'expected' : 'pending');

        let payload = { ...changes };

        let keepAttachments = [];
        let filesToUpload = [];
        const hasAttachmentsSpec = Object.prototype.hasOwnProperty.call(
          changes || {},
          'attachments'
        );
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

          if (
            type === 'expense' &&
            resolvedStatus === 'paid' &&
            (paidAmount === null || paidAmount === 0)
          ) {
            paidAmount = baseAmount;
          }
          if (
            type === 'income' &&
            resolvedStatus === 'received' &&
            (paidAmount === null || paidAmount === 0)
          ) {
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
          uploadedAttachments = await uploadEmailAttachments(
            filesToUpload,
            activeWedding || 'anonymous',
            'finance'
          );
        }

        if (hasAttachmentsSpec) {
          const nowIso = new Date().toISOString();
          const attachments = [
            ...keepAttachments.map((att) => ({ ...att, storagePath: att.storagePath ?? null })),
            ...uploadedAttachments.map((file) => ({ ...file, uploadedAt: nowIso })),
          ];
          payload.attachments = attachments;
        }

        const payloadMeta =
          changes?.meta && typeof changes.meta === 'object'
            ? { ...changes.meta }
            : existing?.meta
              ? { ...existing.meta }
              : {};
        if (!payloadMeta.source) {
          const inferredSource =
            changes?.source ||
            payload?.source ||
            (existing?.meta?.source ? existing.meta.source : 'manual');
          payloadMeta.source = inferredSource;
        }
        payload.meta = payloadMeta;
        payload.source = payloadMeta.source;
        if (payload.paymentMethod === '') {
          delete payload.paymentMethod;
        }

        // Validar update parcial
        const parsed = transactionUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error(parsed.error?.errors?.[0]?.message || 'Cambios de transacción inválidos');
        }
        payload = parsed.data;

        await _updateTransaction(id, payload);
        const baseTransactions = Array.isArray(transactions) ? transactions : [];
        const updatedList = baseTransactions.map((tx) =>
          tx.id === id ? { ...tx, ...payload } : tx
        );
        const trimmed = updatedList.slice(-200);
        saveData('movements', trimmed, {
          docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
          showNotification: false,
        });
        return { success: true };
      } catch (err) {
        // console.error('Error actualizando transacción:', err);
        return { success: false, error: err.message };
      }
    },
    [_updateTransaction, transactions, activeWedding]
  );

  const deleteTransaction = useCallback(
    async (id) => {
      try {
        await _deleteTransaction(id);
        const baseTransactions = Array.isArray(transactions) ? transactions : [];
        const updatedList = baseTransactions.filter((tx) => tx.id !== id);
        const trimmed = updatedList.slice(-200);
        saveData('movements', trimmed, {
          docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
          showNotification: false,
        });
        return { success: true };
      } catch (err) {
        // console.error('Error eliminando transacción:', err);
        return { success: false, error: err.message };
      }
    },
    [_deleteTransaction, transactions, activeWedding]
  );

  // Importar transacciones bancarias desde backend (opcional)
  const importBankTransactions = useCallback(
    async (opts = {}) => {
      try {
        setIsLoading(true);
        let options = { ...opts };
        if (!options.bankId && activeWedding && firebaseUid) {
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
          const concept = transaction.description;
          const provider = transaction.provider || transaction.counterparty || '';
          const inferredCategory =
            autoCategorizeTransaction(concept, provider, amount, type) || 'OTROS';
          await createTransaction({
            concept,
            amount,
            type,
            category: transaction.category || inferredCategory,
            provider,
            dueDate: transaction.dueDate || transaction.bookingDate || null,
            status: type === 'expense' ? 'paid' : 'received',
            paidAmount: amount,
            source: 'bank',
            meta: {
              source: 'bank',
              bankId: options.bankId || null,
              providerAccount: transaction.accountId || null,
            },
          });
        }

        return { success: true, imported: bankTransactions.length };
      } catch (err) {
        // console.warn('Error importando transacciones bancarias:', err);
        setHasBankAccount(false);
        setError(err?.message || 'Error importando transacciones bancarias');
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [createTransaction, activeWedding, firebaseUid]
  );

  const importTransactionsBulk = useCallback(
    async (items = []) => {
      if (!Array.isArray(items) || !items.length) {
        return { success: false, error: 'No hay filas para importar' };
      }
      const successes = [];
      const errors = [];
      for (let index = 0; index < items.length; index++) {
        const entry = items[index] || {};
        try {
          const rawType = String(entry.type || '').toLowerCase();
          const type = rawType === 'income' || rawType.startsWith('ing') ? 'income' : 'expense';
          const amount = Math.abs(Number(entry.amount) || 0);
          if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error('Import: importe inválido');
          }
          let status = String(entry.status || '').toLowerCase();
          if (type === 'expense') {
            if (!['pending', 'partial', 'paid', 'overdue', 'canceled'].includes(status)) {
              status = 'pending';
            }
          } else {
            if (!['expected', 'received'].includes(status)) status = 'expected';
          }
          let paidAmount = entry.paidAmount !== undefined ? Number(entry.paidAmount) : null;
          if (Number.isFinite(paidAmount) && paidAmount !== null) {
            paidAmount = Math.min(Math.max(Math.abs(paidAmount), 0), amount);
          } else {
            paidAmount = null;
          }
          if (type === 'expense' && status === 'paid' && paidAmount === null) {
            paidAmount = amount;
          }
          if (type === 'income' && status === 'received' && paidAmount === null) {
            paidAmount = amount;
          }
          const normalizeDate = (value) => {
            if (!value) return undefined;
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return undefined;
            return date.toISOString().slice(0, 10);
          };
          const concept = (entry.concept || entry.description || `Importado ${index + 1}`)
            .toString()
            .trim();
          const payload = {
            concept,
            description: entry.description ? String(entry.description).trim() : undefined,
            amount,
            type,
            status,
            category: entry.category ? String(entry.category).trim() || undefined : undefined,
            provider: entry.provider ? String(entry.provider).trim() || undefined : undefined,
            paymentMethod: entry.paymentMethod
              ? String(entry.paymentMethod).trim() || undefined
              : undefined,
            dueDate: normalizeDate(entry.dueDate) || null,
            date: normalizeDate(entry.date) || new Date().toISOString().slice(0, 10),
            paidAmount: paidAmount === null ? undefined : paidAmount,
            source: entry.source || 'import-csv',
            createdAt: new Date().toISOString(),
            meta: {
              ...(entry.meta || {}),
              source: entry.meta?.source || entry.source || 'import-csv',
            },
          };
          if (!payload.category || payload.category === 'OTROS' || payload.category === 'Otros') {
            const inferredCategory = autoCategorizeTransaction(
              payload.concept || payload.description || '',
              payload.provider || '',
              payload.amount,
              payload.type
            );
            if (inferredCategory) payload.category = inferredCategory;
          }
          const validation = transactionSchema.safeParse(payload);
          if (!validation.success) {
            throw new Error(validation.error?.errors?.[0]?.message || 'Fila inválida');
          }
          const saved = await _addTransaction(validation.data);
          successes.push(saved);
        } catch (err) {
          errors.push({ index, error: err?.message || 'Error desconocido' });
        }
      }
      if (successes.length) {
        const baseTransactions = Array.isArray(transactions) ? transactions : [];
        const updated = [...baseTransactions, ...successes].slice(-200);
        saveData('movements', updated, {
          docPath: activeWedding ? `weddings/${activeWedding}/finance/main` : undefined,
          showNotification: false,
        });
        window.dispatchEvent(new Event('maloveapp-movements'));
      }
      return { success: errors.length === 0, imported: successes.length, errors };
    },
    [_addTransaction, transactions, activeWedding]
  );

  const exportFinanceReport = useCallback(async () => {
    try {
      const XLSX = await loadXLSXModule();
      const workbook = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Total presupuesto', stats.totalBudget || 0],
        ['Gasto total', stats.totalSpent || 0],
        ['Ingresos totales', stats.totalIncome || 0],
        ['Balance actual', stats.currentBalance || 0],
        ['Ingresos esperados', stats.expectedIncome || 0],
        ['Ahorro de emergencia', stats.emergencyAmount || 0],
        ['Burn rate mensual', predictiveInsights?.burnRate || 0],
        ['Meses hasta agotar presupuesto', predictiveInsights?.monthsToZero ?? 'N/A'],
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

      const transactionRows = (transactions || []).map((tx) => ({
        Fecha: tx.date || '',
        Tipo: tx.type,
        Estado: tx.status,
        Concepto: tx.concept || '',
        Descripción: tx.description || '',
        Categoría: tx.category || '',
        Proveedor: tx.provider || '',
        Importe: Number(tx.amount) || 0,
        Pagado: tx.paidAmount != null ? Number(tx.paidAmount) : '',
        'Fecha venc.': tx.dueDate || '',
        'Método de pago': tx.paymentMethod || '',
        Fuente: tx.source || tx.meta?.source || '',
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(transactionRows.length ? transactionRows : [{}], {
          skipHeader: transactionRows.length === 0,
        }),
        'Transacciones'
      );

      const categoryRows = (budgetUsage || []).map((cat) => ({
        Categoría: cat.name,
        Presupuesto: cat.amount,
        Gastado: cat.spent,
        Restante: cat.remaining,
        '% uso': Number(cat.percentage || 0),
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(categoryRows.length ? categoryRows : [{}], {
          skipHeader: categoryRows.length === 0,
        }),
        'Categorías'
      );

      const monthlyRows = monthlySeries.months.map((month, idx) => ({
        Mes: month,
        Ingresos: monthlySeries.income[idx],
        Gastos: monthlySeries.expense[idx],
        Neto: monthlySeries.net[idx],
      }));
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(monthlyRows.length ? monthlyRows : [{}], {
          skipHeader: monthlyRows.length === 0,
        }),
        'Mensual'
      );

      if (predictiveInsights) {
        const insightsRows = [
          ['Promedio neto mensual', predictiveInsights.avgNet],
          ['Promedio ingresos mensual', predictiveInsights.avgIncome],
          ['Promedio egresos mensual', predictiveInsights.avgExpense],
          ['Burn rate (mes)', predictiveInsights.burnRate],
          ['Meses hasta agotar presupuesto', predictiveInsights.monthsToZero ?? 'N/A'],
          ['Fecha estimada de agotamiento', predictiveInsights.projectedZeroDate || 'N/A'],
          ['Saldo proyectado día de la boda', predictiveInsights.forecastSurplus || 0],
          ['Ahorro mensual recomendado', predictiveInsights.recommendedMonthlySaving || 0],
          ['Tendencia neta', predictiveInsights.netTrend?.direction || 'flat'],
          ['Cambio neto acumulado', predictiveInsights.netTrend?.change || 0],
        ];
        if (predictiveInsights.categoriesAtRisk?.length) {
          insightsRows.push([], ['Categorías en riesgo']);
          insightsRows.push(['Nombre', '% uso', 'Restante']);
          predictiveInsights.categoriesAtRisk.forEach((cat) => {
            insightsRows.push([cat.name, cat.percentage, cat.remaining]);
          });
        }
        if (predictiveInsights.upcomingPayments?.length) {
          insightsRows.push([], ['Pagos próximos']);
          insightsRows.push(['Concepto', 'Fecha', 'Importe', 'Proveedor']);
          predictiveInsights.upcomingPayments.forEach((pay) => {
            insightsRows.push([pay.concept, pay.dueDate, pay.outstanding, pay.provider]);
          });
        }
        const insightsSheet = XLSX.utils.aoa_to_sheet(insightsRows);
        XLSX.utils.book_append_sheet(workbook, insightsSheet, 'Analítica');
      }

      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `finanzas-${activeWedding || 'evento'}.xlsx`;
      return { success: true, blob, fileName };
    } catch (error) {
      // console.error('[useFinance] exportFinanceReport error:', error);
      return { success: false, error: error?.message || 'No se pudo generar el reporte' };
    }
  }, [transactions, stats, budgetUsage, monthlySeries, predictiveInsights, activeWedding]);

  // Suscribirse a cuentas bancarias vinculadas (para CTA conectar banco)
  useEffect(() => {
    if (!activeWedding || !firebaseUid) {
      setHasBankAccount(false);
      return;
    }
    const ref = doc(db, 'weddings', activeWedding, 'finance', 'accounts');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const acc = snap.exists() ? snap.data() || {} : {};
        setHasBankAccount(Boolean(acc.primaryAccountId));
      },
      () => setHasBankAccount(false)
    );
    return () => unsub();
  }, [activeWedding, firebaseUid]);

  return {
    // Estados
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

    // Cálculos
    stats,
    budgetUsage,
    settings,
    monthlyContrib,
    expectedIncome,
    emergencyAmount,
    currentBalance,
    projection,
    monthlySeries,
    predictiveInsights,

    // Acciones
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

    // Utilidades
    clearError: () => setError(null),
    hasBankAccount,
  };
}
