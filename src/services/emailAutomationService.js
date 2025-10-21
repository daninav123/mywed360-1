/* eslint-disable no-undef */
import { get as apiGet, post, put as apiPut, del as apiDel } from './apiClient';
import { performanceMonitor } from './PerformanceMonitor';
import { USE_BACKEND } from './emailService';

const CLASSIFICATION_ENDPOINT = '/api/email-insights/classify';
const SCHEDULER_INTERVAL_MS = 60 * 1000;
const SCHEDULER_KICKOFF_DELAY_MS = 2 * 1000;
let schedulerHandle = null;
let schedulerKickoffTimeout = null;
let queueProcessing = false;

const CONFIG_KEY = 'mywed360.email.automation.config';
const CONFIG_LAST_SYNC_KEY = 'mywed360.email.automation.config.lastSync';
const STATE_KEY = 'mywed360.email.automation.state';
const CLASSIFICATION_CACHE_KEY = 'mywed360.email.automation.classification';
const SCHEDULE_KEY = 'mywed360.email.automation.schedule';
const CONFIG_ENDPOINT = '/api/email-automation/config';
const REMOTE_SYNC_TTL_MS = 60 * 1000;
const CLASSIFICATION_TTL = 12 * 60 * 60 * 1000; // 12 hours
const REPLY_INTERVAL_DEFAULT = 24; // hours
const REMOTE_SCHEDULE_ENDPOINT = '/api/email-automation/schedule';
const REMOTE_PROCESS_ENDPOINT = '/api/email-automation/schedule/process';
const CLASSIFICATION_RECORD_ENDPOINT = '/api/email-automation/classification';
const REMOTE_QUEUE_CACHE_TTL_MS = 30 * 1000;
const STATE_ENDPOINT = '/api/email-automation/state';
const STATE_AUTOREPLY_ENDPOINT = '/api/email-automation/state/auto-reply';
const REMOTE_STATE_TTL_MS = 60 * 1000;

const HAS_PERFORMANCE_NOW =
  typeof performance !== 'undefined' && typeof performance.now === 'function';
const nowMs = () => (HAS_PERFORMANCE_NOW ? performance.now() : Date.now());

const clampConfidence = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const remoteScheduleCache = {
  queue: [],
  history: [],
  fetchedAt: 0,
};

let remoteSchedulePromise = null;
let remoteStatePromise = null;
let lastRemoteStateSync = 0;

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

function supportsRemoteScheduler() {
  return USE_BACKEND === true;
}

function invalidateRemoteScheduleCache() {
  remoteScheduleCache.fetchedAt = 0;
}

async function fetchRemoteSchedule(force = false) {
  if (!supportsRemoteScheduler()) return null;
  if (!force && remoteSchedulePromise) {
    return remoteSchedulePromise;
  }
  if (
    !force &&
    remoteScheduleCache.fetchedAt &&
    Date.now() - remoteScheduleCache.fetchedAt < REMOTE_QUEUE_CACHE_TTL_MS
  ) {
    return remoteScheduleCache;
  }
  remoteSchedulePromise = (async () => {
    try {
      const response = await apiGet(REMOTE_SCHEDULE_ENDPOINT, { auth: true, silent: true });
      if (!response?.ok) {
        throw new Error(`schedule-fetch-${response?.status || 'unknown'}`);
      }
      const json = await response.json();
      remoteScheduleCache.queue = Array.isArray(json.queue) ? json.queue : [];
      remoteScheduleCache.history = Array.isArray(json.history) ? json.history : [];
      remoteScheduleCache.fetchedAt = Date.now();
      return remoteScheduleCache;
    } catch (error) {
      invalidateRemoteScheduleCache();
      throw error;
    } finally {
      remoteSchedulePromise = null;
    }
  })();
  return remoteSchedulePromise;
}

async function refreshRemoteSchedule(force = false) {
  if (!supportsRemoteScheduler()) return null;
  return fetchRemoteSchedule(force).catch((error) => {
    console.warn('[emailAutomation] remote schedule sync failed', error?.message || error);
    throw error;
  });
}

function getRemoteQueueSnapshot() {
  return remoteScheduleCache.queue.slice();
}

function getRemoteHistorySnapshot() {
  return remoteScheduleCache.history.slice();
}

async function fetchAutomationStateRemote(force = false) {
  if (!supportsRemoteScheduler()) return null;
  if (!force && remoteStatePromise) return remoteStatePromise;
  if (!force && lastRemoteStateSync && Date.now() - lastRemoteStateSync < REMOTE_STATE_TTL_MS) {
    return getAutomationState();
  }

  remoteStatePromise = (async () => {
    try {
      const response = await apiGet(STATE_ENDPOINT, { auth: true, silent: true });
      if (!response?.ok) {
        throw new Error(`state-fetch-${response?.status || 'unknown'}`);
      }
      const payload = await response.json();
      const merged = deepMerge(DEFAULT_STATE, payload?.state || {});
      lastRemoteStateSync = Date.now();
      saveAutomationState(merged);
      return merged;
    } catch (error) {
      lastRemoteStateSync = 0;
      throw error;
    } finally {
      remoteStatePromise = null;
    }
  })();

  return remoteStatePromise;
}

export async function syncAutomationStateFromServer(force = false) {
  if (!supportsRemoteScheduler()) return getAutomationState();
  try {
    return await fetchAutomationStateRemote(force);
  } catch (error) {
    console.warn('[emailAutomation] sync state failed', error?.message || error);
    return getAutomationState();
  }
}

async function recordAutoReplyRemote(payload) {
  if (!supportsRemoteScheduler()) return;
  try {
    const body = { ...payload };
    if (body.classification) {
      body.classification = {
        tags: Array.isArray(body.classification.tags) ? body.classification.tags : [],
        folder: body.classification.folder || null,
        source: body.classification.source || null,
      };
    }
    await post(STATE_AUTOREPLY_ENDPOINT, body, { auth: true, silent: true });
    lastRemoteStateSync = 0;
  } catch (error) {
    console.warn('[emailAutomation] record auto-reply failed', error?.message || error);
  }
}

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
  history: [],
};

const DEFAULT_SCHEDULE = {
  queue: [],
  history: [],
};

const classificationPromises = new Map();
let configSyncPromise = null;
let lastConfigSync = 0;

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

export function getAutomationConfigLastSync() {
  const raw = storageGet(CONFIG_LAST_SYNC_KEY);
  if (!raw) return null;
  return raw;
}

function setAutomationConfigCache(config, { syncTimestamp = null, recordSync = true } = {}) {
  const merged = deepMerge(DEFAULT_CONFIG, config || {});
  writeJSON(CONFIG_KEY, merged);
  if (recordSync) {
    try {
      const ts =
        typeof syncTimestamp === 'string'
          ? syncTimestamp
          : new Date(syncTimestamp || Date.now()).toISOString();
      storageSet(CONFIG_LAST_SYNC_KEY, ts);
    } catch {}
  }
  return merged;
}

async function persistAutomationConfigRemote(config) {
  try {
    const res = await apiPut(CONFIG_ENDPOINT, { config }, { auth: true, silent: true });
    if (!res.ok) {
      const error = new Error(`persist-config-failed-${res.status}`);
      error.status = res.status;
      throw error;
    }
    const payload = await res.json().catch(() => ({}));
    const remoteConfig = deepMerge(DEFAULT_CONFIG, payload?.config || config || {});
    const updatedAt = payload?.updatedAt || payload?.syncTimestamp || new Date().toISOString();
    setAutomationConfigCache(remoteConfig, { syncTimestamp: updatedAt, recordSync: true });
    lastConfigSync = Date.now();
    return remoteConfig;
  } catch (error) {
    console.warn('[emailAutomation] persist remote config failed', error?.message || error);
    throw error;
  }
}

export async function syncAutomationConfigFromServer(force = false) {
  if (typeof window === 'undefined') return getAutomationConfig();
  if (!force && configSyncPromise) return configSyncPromise;
  if (!force && Date.now() - lastConfigSync < REMOTE_SYNC_TTL_MS) {
    return getAutomationConfig();
  }

  configSyncPromise = (async () => {
    try {
      const res = await apiGet(CONFIG_ENDPOINT, { auth: true, silent: true });
      if (!res?.ok) {
        throw new Error(`fetch-config-failed-${res?.status || 'unknown'}`);
      }
      const payload = await res.json().catch(() => ({}));
      const merged = deepMerge(DEFAULT_CONFIG, payload?.config || {});
      const updatedAt = payload?.updatedAt || payload?.syncTimestamp || new Date().toISOString();
      lastConfigSync = Date.now();
      setAutomationConfigCache(merged, { syncTimestamp: updatedAt, recordSync: true });
      return merged;
    } catch (error) {
      console.warn('[emailAutomation] sync config failed', error?.message || error);
      return getAutomationConfig();
    } finally {
      configSyncPromise = null;
    }
  })();

  return configSyncPromise;
}

export async function saveAutomationConfig(config, options = {}) {
  const { skipRemote = false } = options || {};
  const cached = setAutomationConfigCache(config, { recordSync: skipRemote });
  if (skipRemote || typeof window === 'undefined') {
    return cached;
  }
  try {
    return await persistAutomationConfigRemote(cached);
  } catch (error) {
    throw error;
  }
}

export async function updateAutomationConfig(partial = {}) {
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

function getScheduleDataLocal() {
  return readJSON(SCHEDULE_KEY, DEFAULT_SCHEDULE);
}

function saveScheduleDataLocal(data) {
  writeJSON(SCHEDULE_KEY, data || DEFAULT_SCHEDULE);
}

function getClassificationCache() {
  return readJSON(CLASSIFICATION_CACHE_KEY, {});
}

function saveClassificationCache(cache) {
  writeJSON(CLASSIFICATION_CACHE_KEY, cache || {});
}

async function getSendMailFn() {
  try {
    const module = await import('./emailService.js');
    const candidate =
      module?.sendMail || module?.sendEmail || (module?.default && module.default.sendMail);
    return typeof candidate === 'function' ? candidate : null;
  } catch (error) {
    console.warn('[emailAutomation] unable to load sendMail function', error);
    return null;
  }
}

function shouldAutoProcessQueue() {
  try {
    if (supportsRemoteScheduler()) return false;
    if (typeof window === 'undefined') return false;
    if (window.__LOVENDA_DISABLE_EMAIL_SCHEDULER__) return false;
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function runScheduledQueueOnce() {
  if (queueProcessing) return;
  queueProcessing = true;
  try {
    const sendMailFn = await getSendMailFn();
    if (typeof sendMailFn === 'function') {
      await processScheduledEmails(sendMailFn);
    }
  } catch (error) {
    console.warn('[emailAutomation] scheduled queue processing failed', error);
  } finally {
    queueProcessing = false;
  }
}

function ensureSchedulerRunning() {
  if (!shouldAutoProcessQueue()) return;
  if (schedulerHandle) return;
  schedulerHandle = setInterval(() => {
    runScheduledQueueOnce();
  }, SCHEDULER_INTERVAL_MS);
  if (schedulerHandle && typeof schedulerHandle.unref === 'function') {
    schedulerHandle.unref();
  }
}

function scheduleQueueProcessing(delay = SCHEDULER_KICKOFF_DELAY_MS) {
  if (!shouldAutoProcessQueue()) return;
  if (schedulerKickoffTimeout) {
    clearTimeout(schedulerKickoffTimeout);
  }
  schedulerKickoffTimeout = setTimeout(() => {
    schedulerKickoffTimeout = null;
    runScheduledQueueOnce();
  }, Math.max(0, delay));
  if (schedulerKickoffTimeout && typeof schedulerKickoffTimeout.unref === 'function') {
    schedulerKickoffTimeout.unref();
  }
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

    const confidence = tags.size > 0 ? 0.35 : 0.1;
    return {
      tags: Array.from(tags),
      folder,
      source: 'heuristic',
      createdAt: Date.now(),
      confidence,
      reason: 'heuristic_rules',
    };
  } catch {
    return {
      tags: [],
      folder: null,
      source: 'heuristic',
      createdAt: Date.now(),
      confidence: 0.05,
      reason: 'heuristic_rules_error',
    };
  }
}

async function callClassificationAPI(mail) {
  if (!mail) return null;

  const startedAt = nowMs();
  let status = 'error';
  let tagsCount = 0;
  let folderValue = null;
  let payload = null;
  let result = null;

  try {
    payload = {
      mailId: mail.id || mail.mailId || mail.messageId || null,
      id:
        mail.id ||
        mail.messageId ||
        mail.mailId ||
        mail.apiId ||
        (mail.date ? `${mail.from || ''}::${mail.date}` : null),
      subject: mail.subject || '',
      body: mail.body || '',
      from: mail.from || '',
      to: mail.to || '',
      cc: mail.cc || null,
      bcc: mail.bcc || null,
      headers: mail.headers || null,
      date: mail.date || mail.receivedAt || null,
    };

    const response = await post(CLASSIFICATION_ENDPOINT, payload, {
      auth: true,
      silent: true,
    });

    if (!response || !response.ok) {
      status = 'http_error';
      return null;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!data || typeof data !== 'object') {
      status = 'invalid_response';
      return null;
    }

    const tags = Array.from(
      new Set(
        (Array.isArray(data.tags) ? data.tags : [])
          .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
          .filter(Boolean)
      )
    );

    const folder =
      typeof data.folder === 'string' && data.folder.trim() ? data.folder.trim() : null;

    if (!tags.length && !folder) {
      status = 'empty_classification';
      return null;
    }

    const confidence =
      clampConfidence(data.confidence) ??
      (tags.length > 0 ? 0.75 : 0.5);

    result = {
      tags,
      folder,
      source: typeof data.source === 'string' ? data.source : 'api',
      createdAt: Date.now(),
      confidence,
    };

    if (typeof data.reason === 'string' && data.reason.trim()) {
      result.reason = data.reason.trim();
    }
    if (data.extra && typeof data.extra === 'object') {
      result.extra = data.extra;
    }

    tagsCount = result.tags.length;
    folderValue = result.folder || null;
    status = 'success';

    return result;
  } catch (error) {
    status = 'exception';
    const isTestEnv =
      typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      console.warn('[emailAutomation] classification API request failed', error);
    }
    performanceMonitor?.logError?.('email_classification_api', error, {
      mailId: payload?.id || payload?.mailId || null,
    });
    return null;
  } finally {
    const durationMs = nowMs() - startedAt;
    performanceMonitor?.recordTiming?.('email_classification_api', durationMs, {
      status,
      tags: tagsCount,
      folder: folderValue || 'none',
    });

    if (status !== 'success') {
      performanceMonitor?.logEvent?.('email_classification_fallback', {
        status,
        mailId: payload?.id || payload?.mailId || null,
        durationMs,
      });
    }
  }
}

function classifyEmail(mail, config) {
  if (!mail || config?.classification?.enabled === false) {
    return null;
  }
  if (mail.aiClassification && typeof mail.aiClassification === 'object') {
    const ai = mail.aiClassification;
    const tags = Array.isArray(ai.tags)
      ? ai.tags.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter(Boolean)
      : [];
    const folder =
      typeof ai.folder === 'string' && ai.folder.trim()
        ? ai.folder.trim()
        : null;
    if (tags.length || folder) {
      const cached = {
        tags,
        folder,
        source: typeof ai.source === 'string' ? ai.source : 'ai',
        createdAt: Date.now(),
        confidence: typeof ai.confidence === 'number' ? ai.confidence : undefined,
        reason: typeof ai.reason === 'string' ? ai.reason : undefined,
      };
      const cache = getClassificationCache();
      cache[getMailCacheKey(mail)] = cached;
      saveClassificationCache(cache);
      return cached;
    }
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
    const heuristic = fallbackClassification(mail);
    let result = heuristic;
    const aiResult = await callClassificationAPI(mail);
    if (aiResult) {
      const mergedTags = new Set();
      (Array.isArray(aiResult.tags) ? aiResult.tags : []).forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) mergedTags.add(tag.trim());
      });
      (heuristic?.tags || []).forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) mergedTags.add(tag.trim());
      });
      result = {
        ...aiResult,
        tags: Array.from(mergedTags),
        folder: aiResult.folder || heuristic?.folder || null,
        createdAt: Date.now(),
        source: 'ai',
      };
      const mergedConfidence =
        clampConfidence(aiResult.confidence) ?? clampConfidence(heuristic?.confidence);
      if (typeof mergedConfidence === 'number') {
        result.confidence = mergedConfidence;
      }
      if (!result.tags.length && heuristic?.tags?.length) {
        result.tags = heuristic.tags;
      }
      if (heuristic && heuristic.source && !result.fallbackSource) {
        result.fallbackSource = heuristic.source;
      }
      if (heuristic && heuristic.folder && !result.folder) {
        result.folder = heuristic.folder;
      }
    }
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
  const lastReplyEntry = state.lastAutoReplyBySender?.[senderEmail];
  const lastReplyTsRaw =
    typeof lastReplyEntry === 'number'
      ? lastReplyEntry
      : typeof lastReplyEntry === 'string'
        ? new Date(lastReplyEntry).getTime()
        : lastReplyEntry && typeof lastReplyEntry === 'object'
          ? new Date(lastReplyEntry.repliedAt || lastReplyEntry.date || 0).getTime()
          : 0;
  const lastReplyTs = Number.isFinite(lastReplyTsRaw) ? lastReplyTsRaw : 0;
  const intervalHours = Number(config.autoReply.replyIntervalHours || REPLY_INTERVAL_DEFAULT);
  if (lastReplyTs && Date.now() - lastReplyTs < intervalHours * 60 * 60 * 1000) {
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
    const repliedAt = new Date().toISOString();
    nextState.autoRepliesByMail = {
      ...(nextState.autoRepliesByMail || {}),
      [mail.id]: {
        sender: senderEmail,
        repliedAt,
      },
    };
    nextState.lastAutoReplyBySender = {
      ...(nextState.lastAutoReplyBySender || {}),
      [senderEmail]: {
        mailId: mail.id,
        repliedAt,
        subject: mail.subject || null,
      },
    };
    const currentHistory = Array.isArray(nextState.history) ? nextState.history : [];
    const historyEntry = {
      mailId: mail.id,
      sender: senderEmail,
      subject: mail.subject || null,
      repliedAt,
    };
    if (classification && typeof classification === 'object') {
      historyEntry.classification = {
        tags: Array.isArray(classification.tags) ? classification.tags.slice(0, 10) : [],
        folder: classification.folder || null,
        source: classification.source || null,
      };
    }
    nextState.history = [historyEntry, ...currentHistory].slice(0, 50);
    saveAutomationState(nextState);
    state.autoRepliesByMail = nextState.autoRepliesByMail;
    state.lastAutoReplyBySender = nextState.lastAutoReplyBySender;
    state.history = nextState.history;
    recordAutoReplyRemote({
      mailId: mail.id,
      sender: senderEmail,
      subject: mail.subject || null,
      classification: classification
        ? {
            tags: classification.tags || [],
            folder: classification.folder || null,
            source: classification.source || null,
          }
        : undefined,
    });
    return true;
  } catch (error) {
    console.warn('[emailAutomation] auto-reply failed', error);
    return false;
  }
}

export async function processIncomingEmails(emails = [], options = {}) {
  const list = Array.isArray(emails) ? emails : [];
  if (!list.length) return list;
  if (supportsRemoteScheduler()) {
    await syncAutomationStateFromServer();
  }
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
  if (supportsRemoteScheduler()) {
    return getRemoteQueueSnapshot();
  }
  const data = getScheduleDataLocal();
  return Array.isArray(data.queue) ? data.queue : [];
}

export function getScheduledHistory() {
  if (supportsRemoteScheduler()) {
    return getRemoteHistorySnapshot();
  }
  const data = getScheduleDataLocal();
  return Array.isArray(data.history) ? data.history : [];
}

export async function reloadScheduledEmails(force = false) {
  if (supportsRemoteScheduler()) {
    await refreshRemoteSchedule(force);
    return getRemoteQueueSnapshot();
  }
  const data = getScheduleDataLocal();
  return Array.isArray(data.queue) ? data.queue : [];
}

export async function reloadScheduledHistory(force = false) {
  if (supportsRemoteScheduler()) {
    await refreshRemoteSchedule(force);
    return getRemoteHistorySnapshot();
  }
  const data = getScheduleDataLocal();
  return Array.isArray(data.history) ? data.history : [];
}

export async function scheduleEmailSend(payload, scheduledAt) {
  if (!scheduledAt) throw new Error('scheduledAt requerido');
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha programada no válida');
  }
  if (payload?.attachments && payload.attachments.length) {
    throw new Error('La programación con adjuntos no está soportada todavía');
  }
  const now = Date.now();
  if (date.getTime() < now + 60 * 1000) {
    throw new Error('La fecha programada debe ser al menos dentro de 1 minuto');
  }
  if (supportsRemoteScheduler()) {
    const response = await post(
      REMOTE_SCHEDULE_ENDPOINT,
      {
        payload,
        scheduledAt: date.toISOString(),
      },
      { auth: true }
    );
    if (!response?.ok) {
      let detail = '';
      try {
        detail = await response.text();
      } catch {}
      const status = response?.status || 'unknown';
      throw new Error(detail || `schedule-failed-${status}`);
    }
    const json = await response.json().catch(() => ({}));
    await fetchRemoteSchedule(true).catch(() => {});
    return json?.id || null;
  }
  const data = getScheduleDataLocal();
  const queue = Array.isArray(data.queue) ? data.queue.slice() : [];
  const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({
    id,
    payload,
    scheduledAt: date.toISOString(),
    createdAt: new Date().toISOString(),
    status: 'scheduled',
  });
  saveScheduleDataLocal({ queue, history: data.history || [] });
  ensureSchedulerRunning();
  const diff = date.getTime() - Date.now();
  const kickoffDelay = Number.isFinite(diff)
    ? Math.max(0, Math.min(SCHEDULER_KICKOFF_DELAY_MS, diff))
    : SCHEDULER_KICKOFF_DELAY_MS;
  scheduleQueueProcessing(kickoffDelay);
  return id;
}

export function cancelScheduledEmail(id) {
  if (supportsRemoteScheduler()) {
    return apiDel(`${REMOTE_SCHEDULE_ENDPOINT}/${encodeURIComponent(id)}`, {
      auth: true,
      silent: true,
    })
      .then(async (response) => {
        if (!response?.ok) {
          if (response?.status === 404) return false;
          let detail = '';
          try {
            detail = await response.text();
          } catch {}
          const status = response?.status || 'unknown';
          throw new Error(detail || `cancel-failed-${status}`);
        }
        await fetchRemoteSchedule(true).catch(() => {});
        return true;
      })
      .catch((error) => {
        console.warn('[emailAutomation] cancel schedule failed', error);
        throw error;
      });
  }
  const data = getScheduleDataLocal();
  const queue = Array.isArray(data.queue) ? data.queue.filter((item) => item.id !== id) : [];
  const history = Array.isArray(data.history) ? data.history : [];
  const removed = queue.length !== (data.queue || []).length;
  saveScheduleDataLocal({ queue, history });
  return removed;
}

export async function processScheduledEmails(sendMail) {
  if (supportsRemoteScheduler()) {
    return { remote: true, processed: 0 };
  }
  if (typeof sendMail !== 'function') return;
  const data = getScheduleDataLocal();
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
  saveScheduleDataLocal({ queue: remaining, history: trimmedHistory });
  if (remaining.length > 0) {
    ensureSchedulerRunning();
    scheduleQueueProcessing(SCHEDULER_KICKOFF_DELAY_MS);
  }
}

export function startEmailScheduler(options = {}) {
  if (supportsRemoteScheduler()) return;
  ensureSchedulerRunning();
  if (options && options.immediate) {
    scheduleQueueProcessing(0);
  }
}

if (shouldAutoProcessQueue()) {
  ensureSchedulerRunning();
  scheduleQueueProcessing(SCHEDULER_KICKOFF_DELAY_MS);
}




