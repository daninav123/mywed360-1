const DEFAULT_CURRENCY = 'EUR';

const makeId = () => Math.random().toString(36).slice(2, 12);

const coerceNumber = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
};

const coercePositiveNumber = (value, fallback = 0) => {
  const num = coerceNumber(value, fallback);
  return num < 0 ? fallback : num;
};

const coerceInt = (value, fallback = 0) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return fallback;
  return num;
};

const toDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'number') {
    const dateFromNumber = new Date(value);
    return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
  }
  if (typeof value === 'string') {
    const dateFromString = new Date(value);
    return Number.isNaN(dateFromString.getTime()) ? null : dateFromString;
  }
  if (value.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (value._seconds !== undefined) {
    return new Date(value._seconds * 1000);
  }
  return null;
};

const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeTier = (rawTier, index) => {
  if (!rawTier || typeof rawTier !== 'object') return null;

  let percentage = coerceNumber(rawTier.percentage, 0);
  if (!Number.isFinite(percentage)) return null;
  if (percentage < 0) percentage = 0;
  if (percentage > 1) {
    percentage /= 100;
  }

  let fixedAmount = coerceNumber(rawTier.fixedAmount ?? rawTier.fixed, 0);
  if (!Number.isFinite(fixedAmount) || fixedAmount < 0) {
    fixedAmount = 0;
  }

  let minRevenue = coerceNumber(rawTier.minRevenue, 0);
  if (!Number.isFinite(minRevenue) || minRevenue < 0) {
    minRevenue = 0;
  }

  let maxRevenue = rawTier.maxRevenue;
  if (maxRevenue === undefined || maxRevenue === null || maxRevenue === '') {
    maxRevenue = null;
  } else {
    maxRevenue = coerceNumber(maxRevenue, null);
    if (!Number.isFinite(maxRevenue) || maxRevenue <= minRevenue) {
      maxRevenue = null;
    }
  }

  return {
    id: typeof rawTier.id === 'string' && rawTier.id.trim() ? rawTier.id.trim() : `tier_${index}_${makeId()}`,
    label: typeof rawTier.label === 'string' && rawTier.label.trim() ? rawTier.label.trim() : 'Tramo',
    minRevenue,
    maxRevenue,
    percentage,
    fixedAmount,
  };
};

const normalizePeriod = (rawPeriod, index) => {
  if (!rawPeriod || typeof rawPeriod !== 'object') return null;

  const startMonthRaw = rawPeriod.startMonth ?? 0;
  const startMonth = Math.max(0, coerceInt(startMonthRaw, 0));

  let endMonth = rawPeriod.endMonth;
  if (endMonth === undefined || endMonth === null || endMonth === '') {
    endMonth = null;
  } else {
    endMonth = Math.max(startMonth + 1, coerceInt(endMonth, startMonth + 1));
  }

  const tiersSource = Array.isArray(rawPeriod.tiers) ? rawPeriod.tiers : [];
  const tiers = tiersSource
    .map((tier, tierIndex) => normalizeTier(tier, `${index}-${tierIndex}`))
    .filter(Boolean)
    .sort((a, b) => a.minRevenue - b.minRevenue);

  if (tiers.length === 0) return null;

  return {
    id: typeof rawPeriod.id === 'string' && rawPeriod.id.trim() ? rawPeriod.id.trim() : `period_${index}_${makeId()}`,
    label: typeof rawPeriod.label === 'string' && rawPeriod.label.trim() ? rawPeriod.label.trim() : `Periodo ${index + 1}`,
    startMonth,
    endMonth,
    tiers,
  };
};

export const normalizeCommissionRules = (rules, { defaultCurrency = DEFAULT_CURRENCY } = {}) => {
  if (!rules || typeof rules !== 'object') return null;

  const currency = typeof rules.currency === 'string' && rules.currency.trim()
    ? rules.currency.trim().toUpperCase()
    : defaultCurrency;

  const periodsSource = Array.isArray(rules.periods) ? rules.periods : [];
  const periods = periodsSource
    .map((period, index) => normalizePeriod(period, index))
    .filter(Boolean)
    .sort((a, b) => a.startMonth - b.startMonth);

  if (periods.length === 0) return null;

  return {
    currency,
    periods,
  };
};

const monthsBetween = (start, end) => {
  if (!start || !end) return 0;
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  let months = (endYear - startYear) * 12 + (endMonth - startMonth);

  if (end.getDate() < start.getDate()) {
    months -= 1;
  }

  return months < 0 ? 0 : months;
};

const findTierForRevenue = (tiers, revenue) => {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  let selected = null;
  for (const tier of tiers) {
    if (revenue < tier.minRevenue) {
      continue;
    }
    if (tier.maxRevenue !== null && revenue > tier.maxRevenue) {
      continue;
    }
    if (!selected || tier.minRevenue >= selected.minRevenue) {
      selected = tier;
    }
  }
  return selected;
};

export const calculateCommission = (payments = [], rules, options = {}) => {
  const defaultCurrency = options.currency || options.defaultCurrency || DEFAULT_CURRENCY;
  const normalized = normalizeCommissionRules(rules, { defaultCurrency });

  const baseResponse = {
    amount: 0,
    currency: defaultCurrency,
    breakdown: [],
    paymentsEvaluated: 0,
    unassignedRevenue: 0,
    hasRules: !!normalized,
  };

  if (!normalized) {
    return baseResponse;
  }

  const paymentSummaries = normalized.periods.map((period) => ({
    period,
    revenue: 0,
    paymentCount: 0,
  }));

  const normalizedStartDate = toDateSafe(options.startDate)
    || payments.reduce((acc, payment) => {
      const date = toDateSafe(payment?.createdAt) || toDateSafe(payment?.paidAt) || toDateSafe(payment?.completedAt);
      if (!date) return acc;
      if (!acc || date < acc) return date;
      return acc;
    }, null)
    || new Date();

  let unassignedRevenue = 0;
  let paymentsEvaluated = 0;

  for (const payment of payments) {
    const amount = coercePositiveNumber(payment?.amount ?? payment?.total, 0);
    if (!amount) continue;

    const paymentDate = toDateSafe(payment?.createdAt)
      || toDateSafe(payment?.paidAt)
      || toDateSafe(payment?.completedAt)
      || normalizedStartDate;

    const monthOffset = monthsBetween(normalizedStartDate, paymentDate);
    const entry = paymentSummaries.find(({ period }) => {
      if (monthOffset < period.startMonth) return false;
      if (period.endMonth !== null && monthOffset >= period.endMonth) return false;
      return true;
    });

    if (!entry) {
      unassignedRevenue += amount;
      continue;
    }

    entry.revenue += amount;
    entry.paymentCount += 1;
    paymentsEvaluated += 1;
  }

  const breakdown = paymentSummaries.map(({ period, revenue, paymentCount }) => {
    const tier = findTierForRevenue(period.tiers, revenue);
    const percentage = tier ? tier.percentage : 0;
    const fixedAmount = tier ? tier.fixedAmount : 0;
    const commission = revenue * percentage + fixedAmount;
    return {
      periodId: period.id,
      label: period.label,
      revenue: roundCurrency(revenue),
      commission: roundCurrency(commission),
      percentageApplied: percentage,
      fixedApplied: roundCurrency(fixedAmount),
      tierId: tier ? tier.id : null,
      tierLabel: tier ? tier.label : null,
      minRevenue: tier ? tier.minRevenue : null,
      maxRevenue: tier ? tier.maxRevenue : null,
      paymentCount,
    };
  });

  const totalAmount = breakdown.reduce((sum, item) => sum + item.commission, 0);

  return {
    amount: roundCurrency(totalAmount),
    currency: normalized.currency || defaultCurrency,
    breakdown,
    paymentsEvaluated,
    unassignedRevenue: roundCurrency(unassignedRevenue),
    hasRules: true,
  };
};

