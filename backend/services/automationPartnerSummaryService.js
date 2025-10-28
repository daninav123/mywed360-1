import admin from 'firebase-admin';

import logger from '../logger.js';
import { calculateCommission } from '../utils/commission.js';
import { sendWhatsAppText, toE164 } from './whatsappService.js';

const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const CONFIG_REF = firestore.collection('admin').doc('automation_partner_summary');
const PAYOUTS_COLLECTION = firestore.collection('partnerPayouts');
const DISCOUNTS_COLLECTION = firestore.collection('_system').doc('config').collection('discounts');
const PAYMENTS_COLLECTION = firestore.collection('_system').doc('config').collection('payments');

const DEFAULT_CONFIG = {
  enabled: false,
  dayOfMonth: 1,
  sendHourUtc: 9,
  sendMinuteUtc: 0,
  thresholdPending: 50,
  autoPay: false,
  channel: 'whatsapp',
  defaultCountryCode: '+34',
  paymentLinkBase: '',
  template:
    'Hola {{partner_name}}, aquí tienes tu resumen de {{month}}. Cierres: {{deals}}. Comisión del mes: {{total_earned}}. Pendiente por cobrar: {{pending_amount}}. Gracias por seguir recomendando MaLoveApp.',
};

const MONTH_LABELS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const MAX_NOTES = 30;
const PREVIEW_LIMIT = 20;
const MAX_PARTNERS_PROCESSED = 200;

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value._seconds !== undefined) {
    return new Date(value._seconds * 1000);
  }
  return null;
};

const startOfMonthUtc = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  return d;
};

const addMonths = (date, offset) => {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + offset);
  return d;
};

const computePeriod = (now = new Date()) => {
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = addMonths(current, -1);
  const end = current;
  const key = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  const label = `${MONTH_LABELS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
  return { start, end, key, label };
};

const formatCurrency = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${amount?.toFixed?.(2) ?? '0.00'} ${currency}`;
  }
};

const renderTemplate = (template, context) => {
  let output = template || '';
  for (const [key, value] of Object.entries(context)) {
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    output = output.replace(token, value ?? '');
  }
  return output;
};

const gatherPhones = (assignedTo = {}, discountData = {}, defaultCountryCode = '+34') => {
  const values = new Set();
  const add = (val) => {
    if (!val) return;
    const clean = String(val).trim();
    if (clean) values.add(clean);
  };
  add(assignedTo.phone);
  add(assignedTo.whatsapp);
  add(discountData.partnerPhone);
  add(discountData.contactPhone);
  add(discountData.ownerPhone);
  add(discountData.whatsapp);
  if (Array.isArray(discountData.contacts)) {
    discountData.contacts.forEach((c) => add(c?.phone));
  }
  const normalized = [];
  for (const phone of values) {
    const e164 = toE164(phone, defaultCountryCode);
    if (e164) normalized.push(e164);
  }
  return normalized;
};

const fetchPayoutTotals = async (partnerId, periodKey) => {
  const snap = await PAYOUTS_COLLECTION.where('partnerId', '==', partnerId).get();
  let lifetimeCompleted = 0;
  let periodCompleted = 0;
  let periodExistingDoc = null;

  snap.forEach((doc) => {
    const data = doc.data() || {};
    const amount = Number(data.amount || 0);
    if (!Number.isFinite(amount)) return;
    const status = (data.status || '').toLowerCase();
    if (status === 'completed') {
      lifetimeCompleted += amount;
      if (data.period === periodKey) {
        periodCompleted += amount;
        periodExistingDoc = { ref: doc.ref, data };
      }
    } else if (data.period === periodKey && !periodExistingDoc) {
      periodExistingDoc = { ref: doc.ref, data };
    }
  });

  return { lifetimeCompleted, periodCompleted, periodExistingDoc };
};

const createOrUpdatePayoutDraft = async ({
  partnerId,
  discountCode,
  period,
  amount,
  currency,
  autoPay,
  payoutMethod,
  actor,
  existing,
}) => {
  const status =
    autoPay && payoutMethod === 'revolut'
      ? 'pending_revolut'
      : autoPay
        ? 'pending_review'
        : 'pending_manual';

  const basePayload = {
    partnerId,
    discountCode,
    period,
    amount,
    currency,
    autoPayRequested: !!autoPay,
    payoutMethod: payoutMethod || 'manual',
    status,
    updatedAt: FieldValue.serverTimestamp(),
    actor: actor?.email || actor?.uid || 'automation-cron',
  };

  if (existing?.ref) {
    await existing.ref.set(basePayload, { merge: true });
    return existing.ref.id;
  }

  const payload = {
    ...basePayload,
    createdAt: FieldValue.serverTimestamp(),
  };
  const ref = await PAYOUTS_COLLECTION.add(payload);
  return ref.id;
};

const extractPartnerName = (discountData) => {
  const assigned = discountData.assignedTo || {};
  return (
    assigned.name ||
    discountData.partnerName ||
    discountData.ownerName ||
    discountData.code ||
    'Partner'
  );
};

export const getPartnerSummaryConfig = async () => {
  const snap = await CONFIG_REF.get();
  const data = snap.exists ? snap.data() || {} : {};
  const lastRun = data.lastRun || null;
  return {
    config: { ...DEFAULT_CONFIG, ...data, lastRun: undefined },
    lastRun,
  };
};

export const updatePartnerSummaryConfig = async (payload = {}, actor = {}) => {
  const config = {
    ...DEFAULT_CONFIG,
    ...(payload?.config || payload || {}),
  };

  if (typeof config.dayOfMonth !== 'number' || config.dayOfMonth < 1 || config.dayOfMonth > 28) {
    throw new Error('dayOfMonth debe estar entre 1 y 28');
  }
  if (typeof config.sendHourUtc !== 'number' || config.sendHourUtc < 0 || config.sendHourUtc > 23) {
    throw new Error('sendHourUtc inválido');
  }
  if (typeof config.sendMinuteUtc !== 'number' || config.sendMinuteUtc < 0 || config.sendMinuteUtc > 59) {
    throw new Error('sendMinuteUtc inválido');
  }
  if (typeof config.thresholdPending !== 'number' || config.thresholdPending < 0) {
    throw new Error('thresholdPending inválido');
  }
  if (typeof config.template !== 'string' || !config.template.trim()) {
    throw new Error('template requerido');
  }

  const patch = {
    ...config,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (actor?.email || actor?.uid) {
    patch.updatedBy = actor.email || actor.uid;
  }

  await CONFIG_REF.set(patch, { merge: true });
  return { success: true, config: patch };
};

export const runPartnerSummaryAutomation = async ({ dryRun = false } = {}, actor = {}) => {
  const { config } = await getPartnerSummaryConfig();
  if (!config.enabled && !dryRun) {
    return {
      success: true,
      dryRun,
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      notes: ['automation_disabled'],
    };
  }

  const now = new Date();
  const { start, end, key: periodKey, label: periodLabel } = computePeriod(now);
  const defaultCurrency = 'EUR';
  const notes = [];
  const previews = [];
  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  const discountSnap = await DISCOUNTS_COLLECTION.where('status', 'in', ['active', 'activo']).get();
  const discountDocs = discountSnap.docs.slice(0, MAX_PARTNERS_PROCESSED);

  for (const doc of discountDocs) {
    const discountData = doc.data() || {};
    const partnerId = doc.id;
    const discountCode = discountData.code;
    if (!discountCode) {
      skipped += 1;
      notes.push(`partner:${partnerId} sin codigo`);
      continue;
    }

    const assigned = discountData.assignedTo || {};
    const partnerName = extractPartnerName(discountData);
    const currency = (discountData.currency || defaultCurrency).toUpperCase();

    const paymentsSnap = await PAYMENTS_COLLECTION.where('discountCode', '==', discountCode).get();
    const payments = [];

    paymentsSnap.forEach((paymentDoc) => {
      const paymentData = paymentDoc.data() || {};
      const status = (paymentData.status || '').toLowerCase();
      if (!['paid', 'succeeded', 'completed'].includes(status)) return;

      const paymentDate =
        toDate(paymentData.createdAt) ||
        toDate(paymentData.paidAt) ||
        toDate(paymentData.completedAt);
      if (!paymentDate || paymentDate < start || paymentDate >= end) return;

      const amount = Number(paymentData.amount ?? paymentData.total ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return;

      payments.push({
        amount,
        createdAt: paymentDate,
        paidAt: paymentDate,
        total: amount,
      });
    });

    const deals = payments.length;
    if (deals === 0) {
      skipped += 1;
      notes.push(`partner:${partnerId} sin pagos periodo`);
      continue;
    }

    const commissionSummary = calculateCommission(payments, discountData.commissionRules || null, {
      currency,
      startDate: start,
    });
    const periodCommission = commissionSummary?.amount ?? 0;

    if (!periodCommission || periodCommission < (config.thresholdPending || 0)) {
      skipped += 1;
      notes.push(`partner:${partnerId} comision_baja:${periodCommission}`);
      continue;
    }

    const { lifetimeCompleted, periodCompleted, periodExistingDoc } = await fetchPayoutTotals(
      partnerId,
      periodKey,
    );

    const pendingAmount = Math.max(periodCommission - periodCompleted, 0);
    const phones = gatherPhones(assigned, discountData, config.defaultCountryCode || '+34');
    const mainPhone = phones[0] || null;

    if (!mainPhone) {
      skipped += 1;
      notes.push(`partner:${partnerId} sin telefono`);
      continue;
    }

    const paymentLink =
      assigned.paymentLink ||
      discountData.paymentLink ||
      (config.paymentLinkBase
        ? `${config.paymentLinkBase.replace(/\/$/, '')}/${discountCode}`
        : '');

    const context = {
      partner_name: partnerName,
      month: periodLabel,
      deals: String(deals),
      total_earned: formatCurrency(periodCommission, currency),
      pending_amount: formatCurrency(pendingAmount, currency),
      currency,
      payment_link: paymentLink || '',
    };

    const message = renderTemplate(config.template, context);

    const preview = {
      partnerId,
      discountCode,
      partnerName,
      deals,
      periodCommission,
      pendingAmount,
      currency,
      recipient: mainPhone,
      dryRun,
      paymentLink,
    };
    previews.push(preview);

    if (!dryRun) {
      try {
        if (config.autoPay && pendingAmount > 0) {
          await createOrUpdatePayoutDraft({
            partnerId,
            discountCode,
            period: periodKey,
            amount: pendingAmount,
            currency,
            autoPay: true,
            payoutMethod: assigned.payoutMethod || 'manual',
            actor,
            existing: periodExistingDoc,
          });
        }

        const resp = await sendWhatsAppText({
          to: mainPhone,
          message,
          metadata: {
            automation: 'partner_monthly_summary',
            partnerId,
            discountCode,
            period: periodKey,
            deals,
            commission: periodCommission,
            pending: pendingAmount,
          },
        });

        if (resp?.success) {
          sent += 1;
        } else {
          errors += 1;
          notes.push(
            `partner:${partnerId} envio_error:${resp?.error || 'unknown_response'}`,
          );
        }
      } catch (error) {
        errors += 1;
        notes.push(`partner:${partnerId} exception:${error?.message || error}`);
        logger.error('[automation-partner-summary] fallo envio', error);
      }
    }

    processed += 1;
  }

  if (!dryRun) {
    try {
      await CONFIG_REF.set(
        {
          lastRun: {
            attempted: FieldValue.serverTimestamp(),
            processed,
            sent,
            skipped,
            errors,
            dryRun,
            period: periodKey,
            notes: notes.slice(0, MAX_NOTES),
          },
        },
        { merge: true },
      );
    } catch (error) {
      logger.warn(
        '[automation-partner-summary] no se pudo actualizar lastRun',
        error?.message || error,
      );
    }
  }

  return {
    success: true,
    dryRun,
    processed,
    sent,
    skipped,
    errors,
    period: periodKey,
    periodLabel,
    notes: notes.slice(0, MAX_NOTES),
    previews: previews.slice(0, PREVIEW_LIMIT),
  };
};
