// Email service implementation with graceful fallbacks.
// Provides a thin client around backend APIs when available,
// and a minimal in-memory fallback otherwise to keep the UI functional.

import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../firebaseConfig';
import { collection, getDocs, query as fbQuery, where as fbWhere, orderBy as fbOrderBy, limit as fbLimit } from 'firebase/firestore';
import { get as apiGet, post as apiPost, put as apiPut, del as apiDel } from './apiClient';
import { getAllTemplates as getAllEmailTemplates } from './emailTemplates';

const BASE =
  (typeof import.meta !== 'undefined' &&
    import.meta &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND_BASE_URL) ||
  '';
// En desarrollo usamos proxy /api incluso si BASE está vacío; desactivar sólo en tests
const IS_TEST =
  (typeof globalThis !== 'undefined' && (globalThis.vi || globalThis.jest)) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.VITEST || process.env.NODE_ENV === 'test')) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta.vitest || (import.meta.env && import.meta.env.MODE === 'test')));
const MAILS_STORAGE_KEY = 'mywed360_mails';
const EMAIL_TEMPLATES_STORAGE_KEY = 'mywed360_email_templates';
const EMAIL_INIT_STORAGE_KEY = 'mywed360.email.init';

let fallbackStore = {
  mails: [],
  templates: [],
};

export let USE_BACKEND = !IS_TEST;
export let USE_MAILGUN = true;
export let CURRENT_USER = null;
export let CURRENT_USER_EMAIL = '';

let authContextRef = null;

// Normalize mail objects to ensure a stable id for API operations
function chooseMailId(m) {
  try {
    const candidates = [
      m?.id,
      m?._id,
      m?.messageId,
      m?.messageID,
      m?.mailId,
      m?.mailID,
      m?.uid,
      m?.uuid,
    ];
    for (const v of candidates) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    for (const v of candidates) {
      if (v != null) return String(v);
    }
  } catch {}
  return null;
}

function normalizeMail(m) {
  try {
    const idRaw = chooseMailId(m);
    const id = String(idRaw || m?.date || Date.now());
    const apiId = String(idRaw || id);
    return { ...m, id, apiId };
  } catch {
    const id = String(Date.now());
    return { ...(m || {}), id, apiId: id };
  }
}

const canUseLocalStorage = () => {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__email_service_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const readJSON = (key, fallback) => {
  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }
  if (key === MAILS_STORAGE_KEY) return Array.isArray(fallbackStore.mails) ? [...fallbackStore.mails] : fallback;
  if (key === EMAIL_TEMPLATES_STORAGE_KEY) return Array.isArray(fallbackStore.templates) ? [...fallbackStore.templates] : fallback;
  if (key === EMAIL_INIT_STORAGE_KEY) return fallbackStore.init ?? fallback;
  return fallback;
};

const writeJSON = (key, value) => {
  if (canUseLocalStorage()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    } catch {}
  }
  if (key === MAILS_STORAGE_KEY) {
    fallbackStore.mails = Array.isArray(value) ? [...value] : [];
    return;
  }
  if (key === EMAIL_TEMPLATES_STORAGE_KEY) {
    fallbackStore.templates = Array.isArray(value) ? [...value] : [];
    return;
  }
  if (key === EMAIL_INIT_STORAGE_KEY) {
    fallbackStore.init = value;
  }
};

const removeKey = (key) => {
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(key);
      return;
    } catch {}
  }
  if (key === MAILS_STORAGE_KEY) {
    fallbackStore.mails = [];
  } else if (key === EMAIL_TEMPLATES_STORAGE_KEY) {
    fallbackStore.templates = [];
  } else if (key === EMAIL_INIT_STORAGE_KEY) {
    delete fallbackStore.init;
  }
};

const loadStoredMails = () => {
  const mails = readJSON(MAILS_STORAGE_KEY, []);
  return Array.isArray(mails) ? mails.map((m) => ({ ...m })) : [];
};

const persistMails = (mails) => {
  const normalized = Array.isArray(mails) ? mails.map((m) => ({ ...m })) : [];
  writeJSON(MAILS_STORAGE_KEY, normalized);
};

const loadStoredTemplates = () => {
  const templates = readJSON(EMAIL_TEMPLATES_STORAGE_KEY, []);
  return Array.isArray(templates) ? templates.map((tpl) => ({ ...tpl })) : [];
};

const persistTemplates = (templates) => {
  writeJSON(EMAIL_TEMPLATES_STORAGE_KEY, Array.isArray(templates) ? templates.map((tpl) => ({ ...tpl })) : []);
};

const nextMailId = () => `mail_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const sanitizeLocalPart = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .toLowerCase()
    .slice(0, 30);

const getEmailDomain = () => {
  const envKeys = [
    'VITE_MY_WED360_DOMAIN',
    'MY_WED360_DOMAIN',
    'VITE_MAIL_CUSTOM_DOMAIN',
    'VITE_MAILGUN_DOMAIN',
    'MAILGUN_DOMAIN',
  ];
  for (const key of envKeys) {
    try {
      const value =
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) ||
        (typeof process !== 'undefined' && process.env && process.env[key]);
      if (value) return String(value).trim();
    } catch {}
  }
  return 'mywed360.com';
};

const deriveAliasFromProfile = (profile = {}) => {
  if (!profile) return null;
  const existing = profile.myWed360Email || profile.emailAlias || profile.alias;
  if (existing) {
    if (existing.includes('@')) return existing.trim().toLowerCase();
    return `${sanitizeLocalPart(existing)}@${getEmailDomain()}`;
  }
  const candidates = [];
  const first =
    profile.firstName ||
    profile.bridename ||
    profile.brideFirstName ||
    profile.name ||
    profile.displayName ||
    '';
  const last = profile.lastName || profile.brideLastName || '';
  if (first) {
    const joined = `${first}.${last}`.trim();
    candidates.push(joined);
  }
  if (profile.email) {
    try {
      const [local] = String(profile.email).split('@');
      if (local) candidates.push(local);
    } catch {}
  }
  if (profile.userId || profile.id) {
    candidates.push(`user${profile.userId || profile.id}`);
  }
  candidates.push('usuario');
  const clean = candidates
    .map((candidate) => sanitizeLocalPart(candidate))
    .find((candidate) => candidate.length >= 3);
  return `${clean || 'usuario'}@${getEmailDomain()}`;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;
const MAX_SUBJECT_LENGTH = 255;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const expandRecipients = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap((item) => expandRecipients(item));
  }
  return String(input)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').toLowerCase());

const sanitizeHtmlBody = (html = '') =>
  String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();

const coerceAttachments = (attachments) => {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter(Boolean)
    .map((att) => ({
      id: att.id || `att_${Math.random().toString(36).slice(2, 10)}`,
      name: att.name || att.filename || 'adjunto',
      filename: att.filename || att.name || 'adjunto',
      size: Number(att.size || att.filesize || 0),
      type: att.type || att.contentType || 'application/octet-stream',
      url: att.url || att.downloadUrl || null,
      inline: Boolean(att.inline),
    }));
};

const updateLocalMail = (id, updater) => {
  if (!id || typeof updater !== 'function') return false;
  const mails = loadStoredMails();
  let changed = false;
  const updated = mails.map((mail) => {
    if (mail.id === id) {
      const clone = { ...mail };
      const result = updater(clone) || clone;
      changed = true;
      return result;
    }
    return mail;
  });
  if (changed) persistMails(updated);
  return changed;
};

const findLocalMail = (id) => {
  const mails = loadStoredMails();
  return mails.find((mail) => mail.id === id) || null;
};

const storeLocalSentMail = ({ from, to, cc, bcc, subject, body, attachments }) => {
  const now = new Date().toISOString();
  const record = normalizeMail({
    id: nextMailId(),
    from,
    to,
    cc: cc || null,
    bcc: bcc || null,
    subject,
    body,
    plainText: String(body || '').replace(/<[^>]+>/g, ''),
    folder: 'sent',
    date: now,
    read: true,
    attachments,
    createdAt: now,
    updatedAt: now,
  });
  const stored = loadStoredMails();
  stored.unshift(record);
  persistMails(stored);
  return record;
};

const filterAndNormalizeLocalMails = (folder, mails) => {
  const base = Array.isArray(mails) ? mails : [];
  const filtered = base.filter((m) =>
    folder === 'all' ? true : (m.folder || 'inbox') === folder
  );
  try {
    return filtered.map((m) => normalizeMail(classifyMailClientSide(m)));
  } catch {
    return filtered.map(normalizeMail);
  }
};

const normalizeSystemTemplate = (key, template) => ({
  id: key,
  key,
  name: template.name || key,
  subject: template.subject || '',
  body: template.body || '',
  system: true,
});

const normalizeCustomTemplate = (template) => {
  const id = template.id || `tmpl_${uuidv4()}`;
  return {
    id,
    name: template.name || 'Plantilla',
    subject: template.subject || '',
    body: template.body || '',
    category: template.category || null,
    system: false,
  };
};

// Fallback: cargar correos directamente desde Firestore del frontend
async function fetchMailsFromFirestore(folder = 'inbox', userEmail = '') {
  try {
    const results = [];
    const u = auth?.currentUser || null;
    const emailNorm = String(userEmail || u?.email || '').toLowerCase();

    // 1) Intentar subcolección del usuario autenticado
    if (u && u.uid) {
      try {
        const sub = collection(db, 'users', u.uid, 'mails');
        let q = fbQuery(sub, fbWhere('folder', '==', folder));
        try {
          q = fbQuery(sub, fbWhere('folder', '==', folder), fbOrderBy('date', 'desc'));
        } catch {}
        const snap = await getDocs(q);
        snap.forEach((d) => results.push({ id: d.id, ...(d.data() || {}) }));
        if (results.length) {
          try { return results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map((m) => normalizeMail(classifyMailClientSide(m))); } catch { return results.map(normalizeMail); }
        }
      } catch {}
    }

    // 2) Colección global filtrando por to/from
    try {
      const root = collection(db, 'mails');
      let q = fbQuery(root, fbWhere('folder', '==', folder));
      if (emailNorm) {
        if (folder === 'sent') q = fbQuery(root, fbWhere('folder', '==', folder), fbWhere('from', '==', emailNorm));
        else q = fbQuery(root, fbWhere('folder', '==', folder), fbWhere('to', '==', emailNorm));
      }
      try { q = fbQuery(q, fbOrderBy('date', 'desc')); } catch {}
      const snap = await getDocs(q);
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() || {}) }));
      try { return arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).map((m) => normalizeMail(classifyMailClientSide(m))); } catch { return arr.map(normalizeMail); }
    } catch {}
  } catch {}
  return [];
}

// Heurísticas básicas de clasificación en cliente (sin IA externa)
function classifyMailClientSide(m) {
  try {
    const txt = `${m.subject || ''} ${m.body || ''}`.toLowerCase();
    const tags = new Set(m.tags || []);
    let folder = m.folder || 'inbox';
    const add = (t) => {
      if (t) tags.add(t);
    };

    if (/\brsvp\b|confirmaci[óo]n|asistencia/.test(txt)) add('RSVP');
    if (/presupuesto|factura|pago|importe|transferencia|invoice|budget/.test(txt)) {
      add('Finanzas');
      if (folder === 'inbox') folder = 'finance';
    }
    if (/contrato|firma|acuerdo|sign|docu/.test(txt)) {
      add('Contratos');
    }
    if (/proveedor|catering|fot[oó]grafo|dj|m[úu]sica|flor|venue/.test(txt)) add('Proveedores');
    if (/invitaci[óo]n|tarjeta|envelope|sobre/.test(txt)) add('Invitaciones');
    if (/urgente|importante|asap|prisa/.test(txt)) add('Prioridad');

    return { ...m, tags: Array.from(tags), folder };
  } catch {
    return m;
  }
}

export function setAuthContext(ctx) {
  authContextRef = ctx || null;
  try {
    writeJSON('mywed360.email.auth', { t: Date.now(), ctx: !!ctx });
  } catch {}
  return authContextRef;
}

export async function initEmailService(opts = {}) {
  const explicit = opts?.myWed360Email || opts?.email || null;
  let resolvedEmail = null;
  if (explicit) {
    if (String(explicit).includes('@')) {
      resolvedEmail = String(explicit).trim().toLowerCase();
    } else {
      resolvedEmail = `${sanitizeLocalPart(explicit)}@${getEmailDomain()}`;
    }
  }
  if (!resolvedEmail) {
    resolvedEmail = deriveAliasFromProfile(opts);
  }
  CURRENT_USER = opts || null;
  CURRENT_USER_EMAIL = resolvedEmail;
  writeJSON(EMAIL_INIT_STORAGE_KEY, {
    t: Date.now(),
    profile: opts || null,
    myWed360Email: resolvedEmail,
  });
  return resolvedEmail;
}

function resolveCurrentEmail() {
  if (CURRENT_USER_EMAIL) return CURRENT_USER_EMAIL;
  const initData = readJSON(EMAIL_INIT_STORAGE_KEY, null);
  const storedEmail = initData?.myWed360Email || initData?.email;
  if (storedEmail) {
    CURRENT_USER_EMAIL = String(storedEmail).trim().toLowerCase();
    return CURRENT_USER_EMAIL;
  }
  return '';
}

// Direcciones propias normalizadas (alias @mywed360 y login real)
function resolveMyAddresses() {
  try {
    const alias = (resolveCurrentEmail() || '').toLowerCase();
    const login =
      auth && auth.currentUser && auth.currentUser.email
        ? String(auth.currentUser.email).toLowerCase()
        : '';
    const set = new Set([alias, login].filter(Boolean));
    if (alias.endsWith('@mywed360.com')) set.add(alias.replace(/@mywed360\.com$/i, '@mywed360'));
    return Array.from(set);
  } catch {
    return [];
  }
}

// Autenticación se maneja vía apiClient (opción { auth: true })

export async function getMails(folder = 'inbox') {
  // Carpeta virtual: combinar inbox+sent
  if (folder === 'all') {
    try {
      const [inbox, sent] = await Promise.all([
        getMails('inbox').catch(() => []),
        getMails('sent').catch(() => []),
      ]);
      const combined = [
        ...(Array.isArray(inbox) ? inbox : []),
        ...(Array.isArray(sent) ? sent : []),
      ];
      // Ordenar por fecha desc y deduplicar por id
      const byId = new Map();
      for (const m of combined) {
        if (m && m.id) byId.set(m.id, m);
      }
      return Array.from(byId.values()).sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );
    } catch {
      // fall through to backend path
    }
  }
  if (USE_BACKEND) {
    const user = resolveCurrentEmail();
    const qs = new URLSearchParams();
    if (folder) qs.set('folder', folder);
    if (user) qs.set('user', (user || '').toLowerCase());
    const path = `/api/mail${qs.toString() ? `?${qs.toString()}` : ''}`;
    let res;
    try {
      res = await apiGet(path, { auth: true, silent: true });
    } catch (_netErr) {
      const localResult = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (localResult.length) return localResult;
      // Backend no disponible: intentar leer directamente de Firestore desde el cliente
      return fetchMailsFromFirestore(folder, user);
    }
    // Fallback por 403: reintentar sin user y filtrar en cliente
    if (res.status === 403) {
      const local403 = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (local403.length) return local403;
      const qs2 = new URLSearchParams();
      if (folder) qs2.set('folder', folder);
      const path2 = `/api/mail${qs2.toString() ? `?${qs2.toString()}` : ''}`;
      try {
        res = await apiGet(path2, { auth: true, silent: true });
      } catch (_netErr) {
        const localRetry = filterAndNormalizeLocalMails(folder, loadStoredMails());
        if (localRetry.length) return localRetry;
        return fetchMailsFromFirestore(folder, user);
      }
      if (res.ok) {
        const all = await res.json();
        const myAddrs = resolveMyAddresses();
        const filtered = (Array.isArray(all) ? all : []).filter((m) => {
          const to = String(m.to || '').toLowerCase();
          const from = String(m.from || '').toLowerCase();
          return folder === 'sent' ? myAddrs.includes(from) : myAddrs.includes(to);
        });
        try {
          return filtered.map((m) => normalizeMail(classifyMailClientSide(m)));
        } catch {
          return filtered.map(normalizeMail);
        }
      }
    }
    if (!res.ok) {
      const localFallback = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (localFallback.length) return localFallback;
      throw new Error(`getMails ${res.status}`);
    }
    let list;
    try {
      list = await res.json();
    } catch (parseError) {
      const localParsed = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (localParsed.length) return localParsed;
      throw parseError;
    }
    try {
      // Clasificación ligera en cliente (tags sugeridos y carpeta probable)
      return (Array.isArray(list) ? list : []).map((m) => normalizeMail(classifyMailClientSide(m)));
    } catch {
      return (Array.isArray(list) ? list : []).map(normalizeMail);
    }
  }
  return filterAndNormalizeLocalMails(folder, loadStoredMails());
}

// Paginado del buzón desde backend
export async function getMailsPage(folder = 'inbox', { limit = 50, cursor = null } = {}) {
  if (!USE_BACKEND) {
    const items = await getMails(folder);
    return { items, nextCursor: null };
  }
  const user = resolveCurrentEmail();
  const qs = new URLSearchParams();
  if (folder) qs.set('folder', folder);
  if (user) qs.set('user', (user || '').toLowerCase());
  if (limit) qs.set('limit', String(limit));
  if (cursor) qs.set('cursor', String(cursor));
  const path = `/api/mail/page${qs.toString() ? `?${qs.toString()}` : ''}`;
  try {
    let res;
    try {
      res = await apiGet(path, { auth: true, silent: true });
    } catch (_netErr) {
      const localItems = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (localItems.length) return { items: localItems, nextCursor: null };
      const items = await fetchMailsFromFirestore(folder, user);
      return { items, nextCursor: null };
    }
    if (res.ok) {
      let json;
      try {
        json = await res.json();
      } catch (parseError) {
        const localParsed = filterAndNormalizeLocalMails(folder, loadStoredMails());
        if (localParsed.length) return { items: localParsed, nextCursor: null };
        throw parseError;
      }
      const items = Array.isArray(json?.items) ? json.items : [];
      const nextCursor = json?.nextCursor || null;
      try {
        return { items: items.map((m) => normalizeMail(classifyMailClientSide(m))), nextCursor };
      } catch {
        return { items: items.map(normalizeMail), nextCursor };
      }
    }
    // Fallback por 403: reintentar sin user y filtrar en cliente
    if (res.status === 403) {
      const local403 = filterAndNormalizeLocalMails(folder, loadStoredMails());
      if (local403.length) return { items: local403, nextCursor: null };
      const qs2 = new URLSearchParams();
      if (folder) qs2.set('folder', folder);
      if (limit) qs2.set('limit', String(limit));
      if (cursor) qs2.set('cursor', String(cursor));
      const path2 = `/api/mail/page${qs2.toString() ? `?${qs2.toString()}` : ''}`;
      try {
        res = await apiGet(path2, { auth: true, silent: true });
      } catch (_netErr) {
        const localRetry = filterAndNormalizeLocalMails(folder, loadStoredMails());
        if (localRetry.length) return { items: localRetry, nextCursor: null };
        const items = await fetchMailsFromFirestore(folder, user);
        return { items, nextCursor: null };
      }
      if (res.ok) {
        let json;
        try {
          json = await res.json();
        } catch (parseError) {
          const localParsed = filterAndNormalizeLocalMails(folder, loadStoredMails());
          if (localParsed.length) return { items: localParsed, nextCursor: null };
          throw parseError;
        }
        const baseItems = Array.isArray(json?.items) ? json.items : [];
        const myAddrs = resolveMyAddresses();
        const filtered = baseItems.filter((m) => {
          const to = String(m.to || '').toLowerCase();
          const from = String(m.from || '').toLowerCase();
          return folder === 'sent' ? myAddrs.includes(from) : myAddrs.includes(to);
        });
        const nextCursor = json?.nextCursor || null;
        try {
          return { items: filtered.map((m) => normalizeMail(classifyMailClientSide(m))), nextCursor };
        } catch {
          return { items: filtered.map(normalizeMail), nextCursor };
        }
      }
    }
    // Fallback si el backend aún no expone /page (404/501)
    if (res.status === 404 || res.status === 501) {
      const all = await getMails(folder);
      // Ordenar por fecha desc
      const sorted = (Array.isArray(all) ? all : [])
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      const cur = cursor ? new Date(String(cursor)) : null;
      const pageItems = sorted
        .filter((m) => (cur ? new Date(m.date || 0) < cur : true))
        .slice(0, limit);
      const next = pageItems.length === limit ? pageItems[pageItems.length - 1].date : null;
      return { items: pageItems, nextCursor: next };
    }
    throw new Error(`getMailsPage ${res.status}`);
  } catch (e) {
    // Fallback general ante errores de red
    try {
      const all = await getMails(folder);
      const sorted = (Array.isArray(all) ? all : [])
        .slice()
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      const cur = cursor ? new Date(String(cursor)) : null;
      const pageItems = sorted
        .filter((m) => (cur ? new Date(m.date || 0) < cur : true))
        .slice(0, limit);
      const next = pageItems.length === limit ? pageItems[pageItems.length - 1].date : null;
      return { items: pageItems, nextCursor: next };
    } catch {
      throw e;
    }
  }
}

export async function getMail(id) {
  if (!id) throw new Error('mail_id_required');
  if (USE_BACKEND) {
    try {
      const res = await apiGet(`/api/mail/${encodeURIComponent(id)}`, { auth: true });
      if (res.status === 404) {
        const error = new Error('mail no encontrado');
        error.status = 404;
        throw error;
      }
      if (!res.ok) {
        const error = new Error(`getMail ${res.status}`);
        error.status = res.status;
        throw error;
      }
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        const localFallback = findLocalMail(id);
        if (localFallback) return normalizeMail(localFallback);
        throw parseError;
      }
      return normalizeMail(data || {});
    } catch (error) {
      const localFallback = findLocalMail(id);
      if (localFallback) return normalizeMail(localFallback);
      if (error && typeof error.status === 'number') throw error;
      const wrapped = new Error(error?.message || 'Error de conexión');
      wrapped.cause = error;
      throw wrapped;
    }
  }
  const local = findLocalMail(id);
  return local ? normalizeMail(local) : null;
}

/**
 * Obtener plantillas de correo para usar en selectores/edición.
 * Intenta backend si existe; si no, usa las plantillas locales.
 * Devuelve una lista de objetos { name, subject, body }.
 */
export async function getEmailTemplates() {
  // Intento backend (tolerante a fallos / endpoint opcional)
  if (USE_BACKEND) {
    try {
      const res = await apiGet(`/api/email/templates`, { auth: true });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
        if (Array.isArray(list)) {
          return list.map((tpl, index) => ({
            id: tpl.id || tpl.key || tpl.name || `remote_${index}`,
            name: tpl.name || `Plantilla ${index + 1}`,
            subject: tpl.subject || '',
            body: tpl.body || '',
            system: Boolean(tpl.system),
          }));
        }
      }
    } catch {
      // fallback a locales
    }
  }
  const customRaw = loadStoredTemplates();
  let mutated = false;
  const customTemplates = customRaw.map((tpl) => {
    const normalized = normalizeCustomTemplate(tpl);
    if (!tpl.id || tpl.id !== normalized.id) mutated = true;
    return normalized;
  });
  if (mutated) persistTemplates(customTemplates);
  let predefined = [];
  try {
    const all = getAllEmailTemplates();
    predefined = Object.entries(all).map(([key, value]) => normalizeSystemTemplate(key, value));
  } catch {
    predefined = [];
  }
  return [...predefined, ...customTemplates];
}

export async function getEmailTemplateById(id) {
  if (!id) return null;
  const templates = await getEmailTemplates();
  return templates.find((tpl) => tpl.id === id) || null;
}

export async function saveEmailTemplate(template) {
  if (!template || typeof template !== 'object') {
    throw new Error('template_required');
  }
  const current = loadStoredTemplates().map(normalizeCustomTemplate);
  const normalized = normalizeCustomTemplate(template);
  const index = current.findIndex((tpl) => tpl.id === normalized.id);
  if (index >= 0) {
    current[index] = normalized;
  } else {
    current.push(normalized);
  }
  persistTemplates(current);
  return normalized;
}

export async function deleteEmailTemplate(id) {
  if (!id) return false;
  try {
    const predefinedKeys = Object.keys(getAllEmailTemplates() || {});
    if (predefinedKeys.includes(id)) {
      throw new Error('No se pueden eliminar plantillas del sistema');
    }
  } catch {}
  const current = loadStoredTemplates().map(normalizeCustomTemplate);
  const filtered = current.filter((tpl) => tpl.id !== id);
  const removed = filtered.length !== current.length;
  if (removed) persistTemplates(filtered);
  return removed;
}

export async function resetPredefinedTemplates() {
  persistTemplates([]);
  return getEmailTemplates();
}

export async function sendMail({ to, cc, bcc, subject, body, attachments } = {}) {
  const toList = expandRecipients(to);
  if (toList.length === 0) {
    return { success: false, error: 'Destinatario es obligatorio' };
  }
  if (!toList.every(isValidEmail)) {
    return { success: false, error: 'Uno o más destinatarios no son válidos' };
  }
  const ccList = expandRecipients(cc);
  const bccList = expandRecipients(bcc);
  if (![...ccList, ...bccList].every(isValidEmail)) {
    return { success: false, error: 'Direcciones en CC o BCC no válidas' };
  }
  const totalRecipients = toList.length + ccList.length + bccList.length;
  if (totalRecipients > MAX_RECIPIENTS) {
    return { success: false, error: `demasiados destinatarios (máximo ${MAX_RECIPIENTS})` };
  }
  const sanitizedSubject = String(subject || '').trim().slice(0, MAX_SUBJECT_LENGTH);
  const sanitizedBody = sanitizeHtmlBody(body || '');
  const processedAttachments = coerceAttachments(attachments);
  const oversized = processedAttachments.find((att) => att.size > MAX_ATTACHMENT_SIZE);
  if (oversized) {
    return {
      success: false,
      error: `El archivo ${oversized.name} supera el tamaño máximo permitido (10MB)`,
    };
  }
  const totalAttachmentSize = processedAttachments.reduce((sum, att) => sum + Number(att.size || 0), 0);
  if (totalAttachmentSize > MAX_ATTACHMENT_SIZE) {
    return {
      success: false,
      error: 'El tamaño máximo combinado de adjuntos es de 10MB',
    };
  }
  const from = resolveCurrentEmail() || `no-reply@${getEmailDomain()}`;
  const payload = {
    from,
    to: toList.join(', '),
    cc: ccList.length ? ccList.join(', ') : undefined,
    bcc: bccList.length ? bccList.join(', ') : undefined,
    subject: sanitizedSubject || '(Sin asunto)',
    body: sanitizedBody,
    attachments: processedAttachments.map((att) => ({
      name: att.name,
      filename: att.filename,
      size: att.size,
      type: att.type,
      url: att.url,
      inline: att.inline,
    })),
  };

  if (USE_MAILGUN) {
    try {
      const response = await sendMailWithMailgun(payload);
      return response;
    } catch (error) {
      return { success: false, error: error?.message || 'Error de conexión' };
    }
  }

  if (USE_BACKEND) {
    let res;
    try {
      res = await apiPost(`/api/mail`, payload, { auth: true });
    } catch (error) {
      const record = storeLocalSentMail({
        from,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject: payload.subject,
        body: sanitizedBody,
        attachments: processedAttachments,
      });
      return {
        success: false,
        error: error?.message || 'Error de conexión',
        fallbackId: record.id,
      };
    }
    if (res.status === 401) {
      const authError = new Error('No autorizado');
      authError.status = 401;
      throw authError;
    }
    let json;
    try {
      json = await res.json();
    } catch (parseError) {
      json = null;
    }
    if (!res.ok) {
      const err = new Error(`sendMail ${res.status}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    if (json && json.success === false) {
      return { success: false, error: json.error || 'Error de negocio' };
    }
    return json || { success: true };
  }

  const record = storeLocalSentMail({
    from,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    subject: payload.subject,
    body: sanitizedBody,
    attachments: processedAttachments,
  });
  return { success: true, id: record.id };
}

export async function sendMailWithMailgun(payload = {}) {
  try {
    const res = await apiPost(`/api/mail`, { ...payload }, { auth: true });
    if (res.status === 401) {
      const authError = new Error('No autorizado');
      authError.status = 401;
      throw authError;
    }
    let json = null;
    try {
      json = await res.json();
    } catch {}
    if (!res.ok) {
      const err = new Error(`sendMailWithMailgun ${res.status}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    if (json && json.success === false) {
      return { success: false, error: json.error || 'Error al enviar con Mailgun' };
    }
    return json || { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Error al enviar con Mailgun' };
  }
}

// Alias de compatibilidad con componentes existentes

export async function deleteMail(id) {
  if (USE_BACKEND) {
    const res = await apiDel(`/api/mail/${encodeURIComponent(id)}`, { auth: true });
    if (!res.ok) throw new Error(`deleteMail ${res.status}`);
    return true;
  }
  const stored = loadStoredMails();
  const updated = stored.filter((m) => m.id !== id);
  persistMails(updated);
  return true;
}

export async function markAsRead(id) {
  if (USE_BACKEND) {
    const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/read`, {}, { auth: true, silent: true });
    if (!res.ok) {
      // Tolerar 404 cuando el mensaje solo existe en la subcolección de usuario
      if (res.status !== 404) throw new Error(`markAsRead ${res.status}`);
      // Best-effort: marcar localmente y no romper la UI
      updateLocalMail(id, (mail) => ({ ...mail, read: true }));
      return true;
    }
    return true;
  }
  updateLocalMail(id, (mail) => ({ ...mail, read: true }));
  return true;
}

// Alias de compatibilidad con componentes que usan EmailService.sendEmail
export const sendEmail = sendMail;

export async function markAsUnread(id) {
  if (USE_BACKEND) {
    const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/unread`, {}, { auth: true, silent: true });
    if (!res.ok) {
      if (res.status !== 404) throw new Error(`markAsUnread ${res.status}`);
      updateLocalMail(id, (mail) => ({ ...mail, read: false }));
      return true;
    }
    return true;
  }
  updateLocalMail(id, (mail) => ({ ...mail, read: false }));
  return true;
}

export async function createEmailAlias(arg1, arg2) {
  // Soportar firmas: (alias) o (profile, alias)
  const alias = typeof arg1 === 'string' ? arg1 : arg2;
  if (!alias) throw new Error('alias required');
  if (USE_BACKEND) {
    const res = await apiPost(`/api/mail/alias`, { alias }, { auth: true });
    if (!res.ok) throw new Error(`createEmailAlias ${res.status}`);
    return res.json();
  }
  return { success: true, alias };
}

export async function getEmailStatistics() {
  if (USE_BACKEND) {
    const res = await apiGet(`/api/mail/stats`, { auth: true });
    if (!res.ok) throw new Error(`getEmailStatistics ${res.status}`);
    return res.json();
  }
  return { totalSent: 0, totalReceived: 0, responseRate: 0, avgResponseTime: 0 };
}

// Global search helpers
export async function searchEmails(term = '') {
  const q = String(term).trim().toLowerCase();
  if (!q) return [];
  if (USE_BACKEND) {
    try {
      const res = await apiGet(`/api/mail/search?q=${encodeURIComponent(q)}`, { auth: true });
      if (res.ok) {
        const items = await res.json();
        return (Array.isArray(items) ? items : []).map((m) => ({
          id: m.id || m._id || m.messageId || String(m.date || m.time || Date.now()),
          subject: m.subject || '(Sin asunto)',
          from: m.from || m.sender || m.fromEmail || '',
          date: m.date || m.createdAt || new Date().toISOString(),
        }));
      }
      throw new Error(`searchEmails ${res.status}`);
    } catch (e) {
      try {
        const [inbox, sent] = await Promise.all([
          getMails('inbox').catch(() => []),
          getMails('sent').catch(() => []),
        ]);
        const base = [...(Array.isArray(inbox) ? inbox : []), ...(Array.isArray(sent) ? sent : [])];
        return base
          .filter((m) => {
            const hay =
              `${m.subject || ''} ${m.body || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
            return hay.includes(q);
          })
          .slice(0, 20)
          .map((m) => ({
            id: m.id || String(m.date || Date.now()),
            subject: m.subject || '(Sin asunto)',
            from: m.from || '',
            date: m.date || new Date().toISOString(),
          }));
      } catch {
        // fall through to memory fallback
      }
    }
  }
  const mails = loadStoredMails();
  return mails
    .filter((m) => {
      const hay = `${m.subject || ''} ${m.body || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      subject: m.subject || '(Sin asunto)',
      from: m.from || '',
      date: m.date || new Date().toISOString(),
    }));
}

export async function searchEvents(term = '') {
  const q = String(term).trim().toLowerCase();
  if (!q) return [];
  if (USE_BACKEND) {
    try {
      const res = await apiGet(`/api/events/search?q=${encodeURIComponent(q)}`, { auth: true });
      if (!res.ok) throw new Error(`searchEvents ${res.status}`);
      const items = await res.json();
      return (Array.isArray(items) ? items : []).map((e) => ({
        id: e.id || e._id || String(e.start || Date.now()),
        title: e.title || e.name || 'Evento',
        dateTime: e.dateTime || e.start || e.startsAt || new Date().toISOString(),
        location: e.location || e.place || '',
      }));
    } catch {
      return [];
    }
  }
  return [];
}

// Mail operations
export async function setFolder(id, folder) {
  if (!USE_BACKEND) {
    updateLocalMail(id, (mail) => ({
      ...mail,
      folder: folder || mail.folder,
    }));
    return true;
  }
  const res = await apiPut(`/api/mail/${encodeURIComponent(id)}/folder`, { folder }, { auth: true });
  if (!res.ok) throw new Error(`setFolder ${res.status}`);
  return true;
}

export async function moveMail(id, folder) {
  return setFolder(id, folder);
}

export async function emptyTrash() {
  if (USE_BACKEND) {
    const endpoints = ['/api/email/trash/empty', '/api/mail/trash/empty', '/api/mail/trash'];
    for (const endpoint of endpoints) {
      try {
        const res = await apiDel(endpoint, { auth: true });
        if (res.ok || res.status === 204) return true;
      } catch (error) {
        if (error?.status === 404 || error?.status === 405) {
          continue;
        }
        throw error;
      }
    }
    return true;
  }
  const stored = loadStoredMails();
  const filtered = stored.filter((mail) => (mail.folder || 'inbox') !== 'trash');
  persistMails(filtered);
  return true;
}

export async function updateMailTags(id, { add = [], remove = [] } = {}) {
  if (!USE_BACKEND) {
    updateLocalMail(id, (mail) => {
      const current = Array.isArray(mail.tags) ? [...mail.tags] : [];
      const addSet = new Set(add.map((tag) => String(tag || '').trim()).filter(Boolean));
      const removeSet = new Set(remove.map((tag) => String(tag || '').trim()).filter(Boolean));
      const updated = current
        .filter((tag) => !removeSet.has(String(tag || '').trim()))
        .concat(Array.from(addSet));
      return { ...mail, tags: Array.from(new Set(updated)) };
    });
    const updatedMail = findLocalMail(id);
    return updatedMail?.tags || true;
  }
  const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/tags`, { add, remove }, { auth: true });
  if (!res.ok) throw new Error(`updateTags ${res.status}`);
  return (await res.json()).tags || true;
}

const api = {
  setAuthContext,
  initEmailService,
  getMails,
  getMail,
  sendMail,
  sendMailWithMailgun,
  deleteMail,
  createEmailAlias,
  markAsRead,
  getEmailStatistics,
  searchEmails,
  searchEvents,
  markAsUnread,
  setFolder,
  moveMail,
  emptyTrash,
  updateMailTags,
  USE_BACKEND,
  USE_MAILGUN,
  CURRENT_USER,
  CURRENT_USER_EMAIL,
  getMailsPage,
  getEmailTemplates,
  getEmailTemplateById,
  saveEmailTemplate,
  deleteEmailTemplate,
  resetPredefinedTemplates,
  sendEmail: sendMail,
};

// Registro simple de actividad de emails AI (best-effort local)
export function logAIEmailActivity(aiResultId, searchQuery) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = 'aiEmailActivities';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      aiResultId,
      searchQuery,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export default api;
