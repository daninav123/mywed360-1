/* eslint-disable no-undef */
import { post } from './apiClient';

const CONFIG_KEY = 'mywed360.email.automation.config';
const STATE_KEY = 'mywed360.email.automation.state';
const CLASSIFICATION_CACHE_KEY = 'mywed360.email.automation.classification';
const SCHEDULE_KEY = 'mywed360.email.automation.schedule';
const CLASSIFICATION_TTL = 12 * 60 * 60 * 1000; // 12 hours
const REPLY_INTERVAL_DEFAULT = 24; // hours

const memoryStorage = new Map();
const hasLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const storageGet = (key) => {
  try {
    if (hasLocalStorage()) return window.localStorage.getItem(key);
    return memoryStorage.get(key) || null;
  } catch {
    return memoryStorage.get(key) || null;
  }
};

const storageSet = (key, value) => {
  try {
    if (hasLocalStorage()) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {}
  memoryStorage.set(key, value);
};

const storageRemove = (key) => {
  try {
    if (hasLocalStorage()) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch {}
  memoryStorage.delete(key);
};

const DEFAULT_CONFIG = {
  classification: {
    enabled: true,
  },
  autoReply: {
    enabled: false,
    subjectTemplate: 'Re: [Asunto]',
    generalMessage:
      'Hola [Nombre],\n\nHemos recibido tu mensaje y nuestro equipo lo revisar\u00e1 en breve. Te contactaremos lo antes posible.\n\n\u00a1Gracias por escribirnos!',
    replyIntervalHours: REPLY_INTERVAL_DEFAULT,
    excludeSenders: [],
    categories: {
      Proveedor: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por tu propuesta. Estamos revisando los detalles y te responderemos en breve con la informaci\u00f3n necesaria.\n\nUn saludo,',
      },
      Invitado: {
        enabled: true,
        message:
          'Hola [Nombre],\n\n\u00a1Gracias por tu mensaje! Hemos tomado nota y te responderemos pronto con m\u00e1s detalles.\n\nUn abrazo,',
      },
      Finanzas: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por la informaci\u00f3n. Nuestro equipo financiero lo revisar\u00e1 y te contactar\u00e1 en cuanto tengamos novedades.\n\nSaludos,',
      },
      Contratos: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nHemos recibido el contrato y nuestro equipo legal lo est\u00e1 revisando. Te enviaremos la respuesta en breve.\n\nSaludos,',
      },
      Facturas: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por enviarnos la factura. La estamos revisando y confirmaremos el pago en cuanto sea posible.\n\nSaludos,',
      },
      Reuniones: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nGracias por proponer la reuni\u00f3n. Revisaremos nuestra agenda y te enviaremos la confirmaci\u00f3n muy pronto.\n\nSaludos,',
      },
      RSVP: {
        enabled: true,
        message:
          'Hola [Nombre],\n\n\u00a1Gracias por tu confirmaci\u00f3n! Hemos registrado tu respuesta y te mantendremos informado con las novedades.\n\nUn abrazo,',
      },
      Urgente: {
        enabled: true,
        message:
          'Hola [Nombre],\n\nHemos recibido tu mensaje y estamos priorizando la respuesta. Te contactaremos lo antes posible.\n\nSaludos,',
      },
    },
  },
};

const DEFAULT_STATE = {
  lastAutoReplyBySender: {},
  autoRepliesByMail: {},
};

const DEFAULT_SCHEDULE = {
  queue: [],
  history: [],
};

const classificationPromises = new Map();

function deepMerge(base, override) {
  if (!override) return { ...base };
  const result = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(override).forEach((key) => {
    const value = override[key];
    if (Array.isArray(value)) {
      result[key] = value.slice();
      return;
    }
    if (value && typeof value === 'object') {
      const baseValue = base && base[key] ? base[key] : {};
      result[key] = deepMerge(baseValue, value);
      return;
    }
    result[key] = value;
  });
  return result;
}

function readJSON(key, fallback) {
  const raw = storageGet(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (fallback && typeof fallback === 'object') {
      return deepMerge(fallback, parsed);
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    storageSet(key, JSON.stringify(value));
  } catch {}
}

export function getAutomationConfig() {
  return readJSON(CONFIG_KEY, DEFAULT_CONFIG);
}

export function saveAutomationConfig(config) {
  const merged = deepMerge(DEFAULT_CONFIG, config || {});
  writeJSON(CONFIG_KEY, merged);
  return merged;
}

export function updateAutomationConfig(partial = {}) {
  const current = getAutomationConfig();
  const merged = deepMerge(current, partial);
  return saveAutomationConfig(merged);
}

function getAutomationState() {
  return readJSON(STATE_KEY, DEFAULT_STATE);
}

function saveAutomationState(state) {
  writeJSON(STATE_KEY, state || DEFAULT_STATE);
}

function getScheduleData() {
  return readJSON(SCHEDULE_KEY, DEFAULT_SCHEDULE);
}

function saveScheduleData(data) {
  writeJSON(SCHEDULE_KEY, data || DEFAULT_SCHEDULE);
}

function getClassificationCache() {
  return readJSON(CLASSIFICATION_CACHE_KEY, {});
}

function saveClassificationCache(cache) {
  writeJSON(CLASSIFICATION_CACHE_KEY, cache || {});
}

function hashString(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i += 1) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

function getMailCacheKey(mail) {
  if (!mail) return 'unknown';
  if (mail.id) return `id:${mail.id}`;
  const base = `${mail.subject || ''}::${mail.date || ''}::${(mail.from || '').toLowerCase()}`;
  return `hash:${hashString(base)}`;
}

function fallbackClassification(mail) {
  try {
    const textContent = `${mail.subject || ''} ${mail.body || ''}`.toLowerCase();
    const tags = new Set();
    let folder = null;

    if (/rsvp|confirmaci(?:ó|o)n|asistencia|save the date/.test(textContent)) {
      tags.add('RSVP');
      folder = folder || 'RSVP';
    }

    if (/invitado|guest/.test(textContent)) {
      tags.add('Invitado');
    }

    if (/factura|invoice|recibo|nota de cargo|bill/.test(textContent)) {
      tags.add('Facturas');
      folder = folder || 'Facturas';
    }

    if (/presupuesto|pago|importe|transferencia|budget|finanzas/.test(textContent)) {
      tags.add('Finanzas');
      folder = folder || 'Finanzas';
    }

    if (/contrato|legal|firma|acuerdo|anexo/.test(textContent)) {
      tags.add('Contratos');
      folder = folder || 'Contratos';
    }

    if (/reuni(?:ó|o)n|meeting|cita|llamada|videollamada/.test(textContent)) {
      tags.add('Reuniones');
      folder = folder || 'Reuniones';
    }

    if (
      /proveedor|catering|fot(?:ó|o)grafo|dj|m(?:ú|u)sica|flor|banquete|venue|servicio/.test(
        textContent
      )
    ) {
      tags.add('Proveedor');
      folder = folder || 'Proveedores';
    }

    if (/invitaci(?:ó|o)n|save the date/.test(textContent)) {
      tags.add('Invitaciones');
      folder = folder || 'RSVP';
    }

    if (/urgente|emergencia|asap|prioritario/.test(textContent)) {
      tags.add('Urgente');
    }

    return {
      tags: Array.from(tags),
      folder,
      source: 'heuristic',
      createdAt: Date.now(),
    };
  } catch {
    return {
      tags: [],
      folder: null,
      source: 'heuristic',
      createdAt: Date.now(),
    };
  }
}

function classifyEmail(mail, config) {
  if (!mail || config?.classification?.enabled === false) {
    return null;
  }
  const cacheKey = getMailCacheKey(mail);
  const cache = getClassificationCache();
  const cached = cache[cacheKey];
  if (cached && cached.createdAt && Date.now() - cached.createdAt < CLASSIFICATION_TTL) {
    return cached;
  }
  if (classificationPromises.has(cacheKey)) {
    return classificationPromises.get(cacheKey);
  }
  const promise = (async () => {
    const aiResult = await callClassificationAPI(mail);
    const result = aiResult || fallbackClassification(mail);
    cache[cacheKey] = result;
    saveClassificationCache(cache);
    classificationPromises.delete(cacheKey);
    return result;
  })();
  classificationPromises.set(cacheKey, promise);
  return promise;
}

function extractEmailAddress(raw) {
  if (!raw) return '';
  const match = String(raw).match(/<([^>]+)>/);
  const email = match ? match[1] : String(raw);
  return email.trim().toLowerCase();
}

function extractSenderName(raw) {
  if (!raw) return '';
  const match = String(raw).match(/^([^<]+)</);
  if (match) return match[1].trim();
  return String(raw).split('@')[0]?.replace(/[._]/g, ' ') || '';
}

function mapTagToCategory(tags = [], folder = null) {
  const normalized = (Array.isArray(tags) ? tags : []).map((tag) => String(tag).toLowerCase());
  const folderValue = folder ? String(folder).toLowerCase() : '';
  const has = (...keywords) => normalized.some((value) => keywords.some((k) => value.includes(k)));

  if (has('contrato', 'legal')) return 'Contratos';
  if (has('factura', 'invoice', 'recibo')) return 'Facturas';
  if (has('reuniá³n', 'reunion', 'meeting', 'cita', 'llamada')) return 'Reuniones';
  if (has('rsvp', 'invitaciá³n', 'invitacion', 'confirmaciá³n', 'confirmacion')) return 'RSVP';
  if (has('guest', 'invitado')) return 'Invitado';
  if (
    has(
      'proveedor',
      'catering',
      'fotá³grafo',
      'fotografo',
      'dj',
      'máºsica',
      'musica',
      'flor',
      'banquete',
      'venue'
    )
  )
    return 'Proveedor';
  if (has('finanzas', 'presupuesto', 'pago', 'importe', 'transferencia', 'budget'))
    return 'Finanzas';
  if (has('urgente', 'emergencia', 'asap')) return 'Urgente';

  if (folderValue) {
    if (folderValue.includes('contrato')) return 'Contratos';
    if (folderValue.includes('factura')) return 'Facturas';
    if (folderValue.includes('meeting') || folderValue.includes('reun')) return 'Reuniones';
    if (folderValue.includes('rsvp') || folderValue.includes('invit')) return 'RSVP';
    if (folderValue.includes('guest') || folderValue.includes('invitado')) return 'Invitado';
    if (folderValue.includes('proveedor')) return 'Proveedor';
    if (folderValue.includes('finan') || folderValue.includes('budget')) return 'Finanzas';
  }

  return 'General';
}

function getCurrentLovendaEmail() {
  try {
    const raw = storageGet('mywed360.email.init');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.myWed360Email || parsed?.email || '';
  } catch {
    return '';
  }
}

async function maybeAutoReply(mail, classification, config, state, sendMail) {
  if (!config?.autoReply?.enabled || typeof sendMail !== 'function') return false;
  if (!mail || !mail.from) return false;
  const senderEmail = extractEmailAddress(mail.from);
  if (!senderEmail) return false;
  const myEmail = (config?.autoReply?.identityEmail || getCurrentLovendaEmail()).toLowerCase();
  if (myEmail && senderEmail === myEmail) return false;
  if (config.autoReply.excludeSenders?.some((item) => senderEmail === item.toLowerCase().trim())) {
    return false;
  }
  const alreadyReplied = state.autoRepliesByMail?.[mail.id];
  if (alreadyReplied) return false;
  const lastReply = state.lastAutoReplyBySender?.[senderEmail];
  const intervalHours = Number(config.autoReply.replyIntervalHours || REPLY_INTERVAL_DEFAULT);
  if (lastReply && Date.now() - lastReply < intervalHours * 60 * 60 * 1000) {
    return false;
  }
  const category = mapTagToCategory(classification?.tags, classification?.folder);
  const categoryConfig = config.autoReply.categories?.[category];
  let templateMessage = categoryConfig?.enabled ? categoryConfig?.message : null;
  if (!templateMessage) {
    templateMessage = config.autoReply.generalMessage;
  }
  if (!templateMessage) return false;
  const context = {
    name: extractSenderName(mail.from) || senderEmail,
    category,
    subject: mail.subject || '',
    date: new Date().toLocaleDateString('es-ES'),
  };
  const body = renderTemplate(templateMessage, context);
  if (!body.trim()) return false;
  const subject =
    renderTemplate(config.autoReply.subjectTemplate || 'Re: [Asunto]', context) ||
    `Re: ${mail.subject || 'tu mensaje'}`;
  try {
    await sendMail({
      to: senderEmail,
      subject,
      body,
    });
    const nextState = { ...state };
    nextState.autoRepliesByMail = { ...(nextState.autoRepliesByMail || {}), [mail.id]: Date.now() };
    nextState.lastAutoReplyBySender = {
      ...(nextState.lastAutoReplyBySender || {}),
      [senderEmail]: Date.now(),
    };
    saveAutomationState(nextState);
    state.autoRepliesByMail = nextState.autoRepliesByMail;
    state.lastAutoReplyBySender = nextState.lastAutoReplyBySender;
    return true;
  } catch (error) {
    console.warn('[emailAutomation] auto-reply failed', error);
    return false;
  }
}

export async function processIncomingEmails(emails = [], options = {}) {
  const list = Array.isArray(emails) ? emails : [];
  if (!list.length) return list;
  const config = getAutomationConfig();
  const state = getAutomationState();
  const sendMail = options.sendMail;
  const processed = [];
  for (const item of list) {
    if (!item) {
      processed.push(item);
      continue;
    }
    const clone = { ...item };
    try {
      const classification = await classifyEmail(clone, config);
      if (classification) {
        clone.aiClassification = classification;
        if (!clone.suggestedTags && classification.tags?.length) {
          clone.suggestedTags = classification.tags;
        }
        if (!clone.suggestedFolder && classification.folder) {
          clone.suggestedFolder = classification.folder;
        }
      }
      await maybeAutoReply(clone, classification, config, state, sendMail);
    } catch (error) {
      console.warn('[emailAutomation] processing mail failed', error);
    }
    processed.push(clone);
  }
  saveAutomationState(state);
  return processed;
}

export function getScheduledEmails() {
  return getScheduleData().queue || [];
}

export function getScheduledHistory() {
  return getScheduleData().history || [];
}

export function scheduleEmailSend(payload, scheduledAt) {
  if (!scheduledAt) throw new Error('scheduledAt requerido');
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha programada no váÆ’Ã†’áâ€ Ã¢€â„¢áÆ’Ã¢€Å¡áâ€šÃ‚¡lida');
  }
  if (payload?.attachments && payload.attachments.length) {
    throw new Error(
      'La programaciáÆ’Ã†’áâ€ Ã¢€â„¢áÆ’Ã¢€Å¡áâ€šÃ‚³n con adjuntos no estáÆ’Ã†’áâ€ Ã¢€â„¢áÆ’Ã¢€Å¡áâ€šÃ‚¡ soportada todaváÆ’Ã†’áâ€ Ã¢€â„¢áÆ’Ã¢€Å¡áâ€šÃ‚­a'
    );
  }
  const now = Date.now();
  if (date.getTime() < now + 60 * 1000) {
    throw new Error('La fecha programada debe ser al menos dentro de 1 minuto');
  }
  const data = getScheduleData();
  const queue = Array.isArray(data.queue) ? data.queue.slice() : [];
  const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({
    id,
    payload,
    scheduledAt: date.toISOString(),
    createdAt: new Date().toISOString(),
    status: 'scheduled',
  });
  saveScheduleData({ queue, history: data.history || [] });
  return id;
}

export function cancelScheduledEmail(id) {
  const data = getScheduleData();
  const queue = Array.isArray(data.queue) ? data.queue.filter((item) => item.id !== id) : [];
  const history = Array.isArray(data.history) ? data.history : [];
  const removed = queue.length !== (data.queue || []).length;
  saveScheduleData({ queue, history });
  return removed;
}

export async function processScheduledEmails(sendMail) {
  if (typeof sendMail !== 'function') return;
  const data = getScheduleData();
  const queue = Array.isArray(data.queue) ? data.queue.slice() : [];
  const history = Array.isArray(data.history) ? data.history.slice() : [];
  const remaining = [];
  const now = Date.now();
  for (const item of queue) {
    if (!item || !item.scheduledAt) continue;
    const due = new Date(item.scheduledAt).getTime();
    if (Number.isNaN(due) || due > now) {
      remaining.push(item);
      continue;
    }
    try {
      await sendMail(item.payload || {});
      history.push({
        ...item,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      const retries = (item.retryCount || 0) + 1;
      if (retries >= 3) {
        history.push({
          ...item,
          status: 'failed',
          error: error?.message || 'send_failed',
          failedAt: new Date().toISOString(),
        });
      } else {
        remaining.push({
          ...item,
          retryCount: retries,
          lastError: error?.message || 'send_failed',
          status: 'scheduled',
        });
      }
    }
  }
  const trimmedHistory = history.slice(-100);
  saveScheduleData({ queue: remaining, history: trimmedHistory });
}


