import admin from 'firebase-admin';

import logger from '../logger.js';
import { sendWhatsAppText, toE164 } from './whatsappService.js';

const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const CONFIG_REF = firestore.collection('admin').doc('automation_first_anniversary');

const DEFAULT_CONFIG = {
  enabled: false,
  sendHourUtc: 9,
  sendMinuteUtc: 0,
  daysOffset: 0,
  includePlanners: false,
  defaultCountryCode: '+34',
  template:
    '¡Feliz aniversario {{couple_names}}! Esperamos que vuestro gran día siga inspirando momentos increíbles. Aquí tenéis vuestro álbum: {{album_link}}',
};

const MAX_NOTES = 20;
const FALLBACK_LIMIT = 500;

const ensureApp = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
};

ensureApp();

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
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const startOfUtcDay = (date) => {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const diffYears = (from, to) => {
  const start = new Date(from.getTime());
  const end = new Date(to.getTime());
  let years = end.getUTCFullYear() - start.getUTCFullYear();

  const anniversary = new Date(start.getTime());
  anniversary.setUTCFullYear(start.getUTCFullYear() + years);
  if (anniversary > end) years -= 1;
  return years < 1 ? 1 : years;
};

const extractWeddingDate = (data) => {
  const candidates = [
    data.weddingDate,
    data.date,
    data.eventDate,
    data.eventInfo?.weddingDate,
    data.eventProfile?.weddingDate,
    data.timeline?.weddingDate,
  ];
  for (const candidate of candidates) {
    const resolved = toDate(candidate);
    if (resolved) return resolved;
  }
  return null;
};

const extractCoupleNames = (data) => {
  if (typeof data.coupleName === 'string' && data.coupleName.trim()) {
    return data.coupleName.trim();
  }
  if (Array.isArray(data.partnerNames) && data.partnerNames.length) {
    return data.partnerNames.filter(Boolean).join(' & ');
  }
  if (Array.isArray(data.owners) && data.owners.length) {
    const names = data.owners
      .map((owner) => owner?.name || owner?.displayName)
      .filter(Boolean);
    if (names.length) return names.join(' & ');
  }
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }
  const bride = data?.brideName;
  const groom = data?.groomName;
  if (bride || groom) {
    return [bride, groom].filter(Boolean).join(' & ');
  }
  return 'pareja';
};

const extractWeddingName = (data) => {
  if (typeof data.name === 'string' && data.name.trim()) return data.name.trim();
  if (typeof data.coupleName === 'string' && data.coupleName.trim()) {
    return data.coupleName.trim();
  }
  return 'Tu boda';
};

const extractAlbumLink = (weddingId, data) => {
  if (typeof data.albumLink === 'string' && data.albumLink.trim()) {
    return data.albumLink.trim();
  }
  if (typeof data.momentosShareUrl === 'string' && data.momentosShareUrl.trim()) {
    return data.momentosShareUrl.trim();
  }
  const base =
    process.env.PUBLIC_APP_BASE_URL ||
    process.env.VITE_PUBLIC_APP_BASE_URL ||
    'https://maloveapp.app';
  return `${base.replace(/\/$/, '')}/momentos/${encodeURIComponent(weddingId)}`;
};

const gatherPhonesFromWedding = (data) => {
  const values = new Set();
  const add = (value) => {
    if (!value) return;
    const phone = String(value).trim();
    if (phone) values.add(phone);
  };

  add(data.contactPhone);
  add(data.primaryContactPhone);
  add(data.phone);
  add(data.preferences?.contactPhone);
  add(data.eventProfile?.contactPhone);
  add(data.ownerPhone);
  add(data.profile?.contactPhone);

  if (Array.isArray(data.contacts)) {
    data.contacts.forEach((contact) => add(contact?.phone));
  }

  if (Array.isArray(data.coupleContacts)) {
    data.coupleContacts.forEach((contact) => add(contact?.phone));
  }

  return values;
};

const getUserPhones = async (uids = []) => {
  if (!Array.isArray(uids) || uids.length === 0) return [];
  const phones = new Set();
  const db = admin.firestore();
  for (const uid of uids) {
    try {
      if (!uid) continue;
      const snap = await db.collection('users').doc(String(uid)).get();
      if (!snap.exists) continue;
      const data = snap.data() || {};
      const add = (value) => {
        if (!value) return;
        const phone = String(value).trim();
        if (phone) phones.add(phone);
      };
      add(data.phoneNumber);
      add(data.phone);
      add(data.whatsapp);
      add(data.contactPhone);
      add(data.preferences?.contactPhone);
      if (data.profile && typeof data.profile === 'object') {
        add(data.profile.phone);
        add(data.profile.whatsapp);
        add(data.profile.contactPhone);
      }
    } catch (error) {
      logger.warn('[automation-anniversary] No se pudo leer usuario', uid, error?.message || error);
    }
  }
  return Array.from(phones);
};

function renderTemplate(template, context) {
  let output = template || '';
  for (const [key, value] of Object.entries(context)) {
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    output = output.replace(token, value ?? '');
  }
  return output;
}

export async function getAnniversaryConfig() {
  const snap = await CONFIG_REF.get();
  const data = snap.exists ? snap.data() || {} : {};
  const lastRun = data.lastRun || null;
  return {
    config: {
      ...DEFAULT_CONFIG,
      ...data,
      lastRun: undefined,
    },
    lastRun,
  };
}

export async function updateAnniversaryConfig(payload = {}, actor = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    ...(payload?.config || payload || {}),
  };

  if (typeof config.sendHourUtc !== 'number' || config.sendHourUtc < 0 || config.sendHourUtc > 23) {
    throw new Error('sendHourUtc inválido');
  }
  if (typeof config.sendMinuteUtc !== 'number' || config.sendMinuteUtc < 0 || config.sendMinuteUtc > 59) {
    throw new Error('sendMinuteUtc inválido');
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
}

const fetchCandidateWeddings = async (startUtc, endUtc) => {
  const startTs = admin.firestore.Timestamp.fromDate(startUtc);
  const endTs = admin.firestore.Timestamp.fromDate(endUtc);
  try {
    const query = await firestore
      .collection('weddings')
      .where('weddingDate', '>=', startTs)
      .where('weddingDate', '<', endTs)
      .get();
    if (!query.empty) {
      return query.docs;
    }
  } catch (error) {
    logger.warn('[automation-anniversary] query directa falló, se usará fallback', error?.message || error);
  }

  const fallbackSnap = await firestore.collection('weddings').limit(FALLBACK_LIMIT).get();
  return fallbackSnap.docs.filter((doc) => {
    const data = doc.data() || {};
    const wDate = extractWeddingDate(data);
    if (!wDate) return false;
    return wDate >= startUtc && wDate < endUtc;
  });
};

export async function runAnniversaryAutomation({ dryRun = false } = {}, actor = {}) {
  const { config } = await getAnniversaryConfig();
  if (!config.enabled && !dryRun) {
    return { success: true, processed: 0, sent: 0, skipped: 0, errors: 0, dryRun, notes: ['automation_disabled'] };
  }

  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
  const offset = Number(config.daysOffset || 0);
  const targetDate = addDays(base, offset * -1);

  const windowStart = startOfUtcDay(targetDate);
  const windowEnd = addDays(windowStart, 1);

  const docs = await fetchCandidateWeddings(windowStart, windowEnd);

  const processed = [];
  let sent = 0;
  let skipped = 0;
  let errors = 0;
  const notes = [];

  for (const doc of docs) {
    const data = doc.data() || {};
    const weddingId = doc.id;
    const weddingDate = extractWeddingDate(data);
    if (!weddingDate) {
      skipped += 1;
      notes.push(`wedding:${weddingId} sin fecha`);
      continue;
    }

    const marketingOptIn =
      data.preferences?.marketingOptIn !== false &&
      data.eventProfile?.marketingOptIn !== false;

    if (!marketingOptIn) {
      skipped += 1;
      notes.push(`wedding:${weddingId} marketing_opt_out`);
      continue;
    }

    const phones = gatherPhonesFromWedding(data);
    const ownerPhones = await getUserPhones(data.ownerIds || []);
    ownerPhones.forEach((phone) => phones.add(phone));

    if (config.includePlanners && Array.isArray(data.plannerIds) && data.plannerIds.length) {
      const plannerPhones = await getUserPhones([data.plannerIds[0]]);
      plannerPhones.forEach((phone) => phones.add(phone));
    }

    const recipients = Array.from(phones);
    if (recipients.length === 0) {
      skipped += 1;
      notes.push(`wedding:${weddingId} sin telefono`);
      continue;
    }

    const coupleNames = extractCoupleNames(data);
    const weddingName = extractWeddingName(data);
    const albumLink = extractAlbumLink(weddingId, data);
    const years = diffYears(weddingDate, now);
    const context = {
      couple_names: coupleNames,
      wedding_name: weddingName,
      wedding_date: weddingDate.toLocaleDateString('es-ES'),
      album_link: albumLink,
      year: String(years),
    };
    const message = renderTemplate(config.template, context);
    const preview = {
      weddingId,
      weddingName,
      coupleNames,
      recipients: [],
      messagePreview: message.slice(0, 200),
      dryRun,
    };

    for (const rawPhone of recipients) {
      const normalized = toE164(rawPhone, config.defaultCountryCode || '');
      if (!normalized) {
        skipped += 1;
        notes.push(`wedding:${weddingId} telefono_invalido:${rawPhone}`);
        continue;
      }
      preview.recipients.push(normalized);

      if (dryRun) continue;

      try {
        const resp = await sendWhatsAppText({
          to: normalized,
          message,
          weddingId,
          metadata: {
            automation: 'anniversary_first',
            year: years,
          },
        });
        if (resp.success) {
          sent += 1;
        } else {
          errors += 1;
          notes.push(`wedding:${weddingId} envio_error:${resp.error || 'unknown'}`);
        }
      } catch (error) {
        errors += 1;
        notes.push(`wedding:${weddingId} send_exception:${error?.message || error}`);
        logger.error('[automation-anniversary] error enviando WhatsApp', error);
      }
    }

    if (!dryRun) {
      try {
        await firestore.collection('automationLogs').add({
          type: 'anniversary_first_whatsapp',
          weddingId,
          messagePreview: message.slice(0, 160),
          recipients: preview.recipients,
          dryRun: false,
          templateVersion: config.template,
          year: years,
          executedAt: FieldValue.serverTimestamp(),
          actor: actor?.email || actor?.uid || 'automation-cron',
        });
      } catch (error) {
        logger.warn('[automation-anniversary] no se pudo escribir log', error?.message || error);
      }
    }

    processed.push(preview);
  }

  if (!dryRun) {
    try {
      await CONFIG_REF.set(
        {
          lastRun: {
            attempted: FieldValue.serverTimestamp(),
            processed: processed.length,
            sent,
            skipped,
            errors,
            dryRun,
            notes: notes.slice(0, MAX_NOTES),
          },
        },
        { merge: true },
      );
    } catch (error) {
      logger.warn('[automation-anniversary] no se pudo actualizar lastRun', error?.message || error);
    }
  }

  return {
    success: true,
    dryRun,
    processed: processed.length,
    sent,
    skipped,
    errors,
    notes: notes.slice(0, MAX_NOTES),
    previews: processed.slice(0, 20),
  };
}
