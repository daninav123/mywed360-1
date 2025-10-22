import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch {
    // Ignorar si ya está inicializado por otros módulos con más contexto
  }
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const WEDDING_PASS_TYPES = {
  'wedding-pass': {
    code: 'wedding_pass',
  },
  'wedding-pass-plus': {
    code: 'wedding_pass_plus',
  },
};

export const PLANNER_PACK_DEFINITIONS = {
  pack5: {
    code: 'planner_pack_5',
    quota: 5,
  },
  pack15: {
    code: 'planner_pack_15',
    quota: 15,
  },
  teams40: {
    code: 'teams_40',
    quota: 40,
  },
  teamsUnlimited: {
    code: 'teams_unlimited',
    quota: null,
  },
};

const toTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return admin.firestore.Timestamp.fromDate(value);
  if (typeof value === 'number') return admin.firestore.Timestamp.fromMillis(value);
  if (value instanceof admin.firestore.Timestamp) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return admin.firestore.Timestamp.fromMillis(parsed);
  }
  return null;
};

export const addDays = (date, days) => {
  const base = date instanceof Date ? date.getTime() : Date.parse(date);
  if (Number.isNaN(base)) return null;
  return new Date(base + (days * ONE_DAY_MS));
};

export async function upsertWeddingLicense({
  weddingId,
  ownerUid = null,
  planKey,
  priceId = null,
  stripeSessionId = null,
  stripeCustomerId = null,
  stripeSubscriptionId = null,
  status = 'active',
  validUntil = null,
  weddingDate = null,
  amount = null,
  currency = null,
  metadata = {},
}) {
  if (!weddingId) throw new Error('weddingId es obligatorio');
  const plan = WEDDING_PASS_TYPES[planKey];
  if (!plan) throw new Error(`Plan de boda desconocido: ${planKey}`);

  const docRef = db.collection('weddingLicenses').doc(String(weddingId));
  const snapshot = await docRef.get();
  const now = FieldValue.serverTimestamp();

  const record = {
    planKey,
    planCode: plan.code,
    priceId: priceId || null,
    stripeSessionId: stripeSessionId || null,
    stripeCustomerId: stripeCustomerId || null,
    stripeSubscriptionId: stripeSubscriptionId || null,
    status,
    amount,
    currency,
    metadata: metadata || {},
    createdAt: now,
  };

  const update = {
    weddingId: String(weddingId),
    ownerUid: ownerUid || null,
    planKey,
    planCode: plan.code,
    priceId: priceId || null,
    stripeSessionId: stripeSessionId || null,
    stripeCustomerId: stripeCustomerId || null,
    stripeSubscriptionId: stripeSubscriptionId || null,
    status,
    validUntil: toTimestamp(validUntil),
    weddingDate: toTimestamp(weddingDate),
    amount,
    currency,
    updatedAt: now,
  };

  if (!snapshot.exists) {
    update.createdAt = now;
    update.purchases = [record];
  } else {
    update.purchases = FieldValue.arrayUnion(record);
  }

  await docRef.set(update, { merge: true });
  return { id: docRef.id, ...update };
}

export function resolvePlannerPack(packKey) {
  const def = PLANNER_PACK_DEFINITIONS[packKey];
  if (!def) throw new Error(`Pack de planner desconocido: ${packKey}`);
  return def;
}

export async function upsertPlannerPack({
  packKey,
  plannerId,
  billingCycle = 'monthly',
  status = 'trial',
  priceId = null,
  stripeCustomerId = null,
  stripeSubscriptionId = null,
  stripeSessionId = null,
  trialEndsAt = null,
  currentPeriodEnd = null,
  amount = null,
  currency = null,
  metadata = {},
}) {
  if (!plannerId) throw new Error('plannerId es obligatorio');
  const packDef = resolvePlannerPack(packKey);
  const docId = stripeSubscriptionId || stripeSessionId || `${plannerId}_${Date.now()}`;
  const docRef = db.collection('plannerPacks').doc(docId);
  const snap = await docRef.get();
  const now = FieldValue.serverTimestamp();

  const baseData = {
    plannerId: String(plannerId),
    packKey,
    packCode: packDef.code,
    quotaTotal: packDef.quota,
    billingCycle,
    status,
    priceId: priceId || null,
    stripeCustomerId: stripeCustomerId || null,
    stripeSubscriptionId: stripeSubscriptionId || null,
    stripeSessionId: stripeSessionId || null,
    trialEndsAt: toTimestamp(trialEndsAt),
    currentPeriodEnd: toTimestamp(currentPeriodEnd),
    amount,
    currency,
    metadata: metadata || {},
    updatedAt: now,
  };

  if (!snap.exists) {
    baseData.createdAt = now;
    baseData.quotaUsed = 0;
    baseData.events = [
      {
        type: 'created',
        by: 'stripe',
        status,
        billingCycle,
        amount,
        currency,
        createdAt: new Date().toISOString(),
      },
    ];
  } else {
    baseData.events = FieldValue.arrayUnion({
      type: 'updated',
      by: 'stripe',
      status,
      billingCycle,
      amount,
      currency,
      createdAt: new Date().toISOString(),
    });
  }

  await docRef.set(baseData, { merge: true });
  return { id: docId, ...baseData };
}

export async function updatePlannerPackSubscription(subscriptionId, updates = {}) {
  if (!subscriptionId) return null;
  const docRef = db.collection('plannerPacks').doc(subscriptionId);
  const snap = await docRef.get();
  if (!snap.exists) return null;

  const now = FieldValue.serverTimestamp();

  const payload = {
    updatedAt: now,
  };

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    payload.status = updates.status;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quotaUsed')) {
    payload.quotaUsed = updates.quotaUsed;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'quotaTotal')) {
    payload.quotaTotal = updates.quotaTotal;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'billingCycle')) {
    payload.billingCycle = updates.billingCycle;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'cancelAtPeriodEnd')) {
    payload.cancelAtPeriodEnd = updates.cancelAtPeriodEnd;
  }
  if (updates.trialEndsAt) {
    payload.trialEndsAt = toTimestamp(updates.trialEndsAt);
  }
  if (updates.currentPeriodEnd) {
    payload.currentPeriodEnd = toTimestamp(updates.currentPeriodEnd);
  }
  if (updates.metadata) {
    payload.metadata = { ...(snap.data()?.metadata || {}), ...updates.metadata };
  }
  if (updates.amount) {
    payload.amount = updates.amount;
  }
  if (updates.currency) {
    payload.currency = updates.currency;
  }
  if (updates.lastInvoice) {
    payload.lastInvoice = updates.lastInvoice;
  }

  await docRef.set(payload, { merge: true });
  return { id: docRef.id, ...payload };
}

export async function appendPlannerPackEvent(subscriptionId, event) {
  if (!subscriptionId) return null;
  const docRef = db.collection('plannerPacks').doc(subscriptionId);
  const snap = await docRef.get();
  if (!snap.exists) return null;

  await docRef.set({
    events: FieldValue.arrayUnion({
      ...event,
      createdAt: new Date().toISOString(),
    }),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return true;
}

