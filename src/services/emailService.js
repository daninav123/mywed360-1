// Email service implementation with graceful fallbacks.
// Provides a thin client around backend APIs when available,
// and a minimal in-memory fallback otherwise to keep the UI functional.

import { auth } from '../firebaseConfig';
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
export const USE_BACKEND = !IS_TEST;
export const USE_MAILGUN = true;

let memoryStore = {
  mails: [],
};

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
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mywed360.email.auth', JSON.stringify({ t: Date.now(), ctx: !!ctx }));
    }
  } catch {}
}

export async function initEmailService(opts = {}) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mywed360.email.init', JSON.stringify({ t: Date.now(), ...opts }));
    }
  } catch {}
  return opts?.myWed360Email || opts?.email || '';
}

function resolveCurrentEmail() {
  try {
    if (typeof localStorage === 'undefined') return '';
    const raw = localStorage.getItem('mywed360.email.init');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.myWed360Email || parsed?.email || '';
  } catch {
    return '';
  }
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
    let res = await apiGet(path, { auth: true });
    // Fallback por 403: reintentar sin user y filtrar en cliente
    if (res.status === 403) {
      const qs2 = new URLSearchParams();
      if (folder) qs2.set('folder', folder);
      const path2 = `/api/mail${qs2.toString() ? `?${qs2.toString()}` : ''}`;
      res = await apiGet(path2, { auth: true });
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
    if (!res.ok) throw new Error(`getMails ${res.status}`);
    const list = await res.json();
    try {
      // Clasificación ligera en cliente (tags sugeridos y carpeta probable)
      return (Array.isArray(list) ? list : []).map((m) => normalizeMail(classifyMailClientSide(m)));
    } catch {
      return (Array.isArray(list) ? list : []).map(normalizeMail);
    }
  }
  return memoryStore.mails.filter((m) =>
    folder === 'all' ? true : (m.folder || 'inbox') === folder
  );
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
    let res = await apiGet(path, { auth: true });
    if (res.ok) {
      const json = await res.json();
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
      const qs2 = new URLSearchParams();
      if (folder) qs2.set('folder', folder);
      if (limit) qs2.set('limit', String(limit));
      if (cursor) qs2.set('cursor', String(cursor));
      const path2 = `/api/mail/page${qs2.toString() ? `?${qs2.toString()}` : ''}`;
      res = await apiGet(path2, { auth: true });
      if (res.ok) {
        const json = await res.json();
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
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data?.items)) return data.items;
      }
    } catch {
      // fallback a locales
    }
  }
  try {
    const all = getAllEmailTemplates();
    return Object.values(all).map((t) => ({ name: t.name, subject: t.subject, body: t.body }));
  } catch {
    return [];
  }
}

export async function sendMail({ to, cc, bcc, subject, body, attachments } = {}) {
  if (USE_BACKEND) {
    const from = resolveCurrentEmail();
    const payload = {
      from,
      to,
      cc,
      bcc,
      subject,
      body,
      attachments: Array.isArray(attachments)
        ? attachments.map((a) => ({
            name: a.name || a.filename,
            size: a.size,
            type: a.type,
            url: a.url,
          }))
        : [],
    };
    const res = await apiPost(`/api/mail`, payload, { auth: true });
    if (!res.ok) throw new Error(`sendMail ${res.status}`);
    return res.json();
  }
  const id = String(Date.now());
  memoryStore.mails.push({
    id,
    to,
    subject,
    body,
    folder: 'sent',
    date: new Date().toISOString(),
    read: true,
    attachments: [],
  });
  return { success: true, id };
}

export async function deleteMail(id) {
  if (USE_BACKEND) {
    const res = await apiDel(`/api/mail/${encodeURIComponent(id)}`, { auth: true });
    if (!res.ok) throw new Error(`deleteMail ${res.status}`);
    return true;
  }
  memoryStore.mails = memoryStore.mails.filter((m) => m.id !== id);
  return true;
}

export async function markAsRead(id) {
  if (USE_BACKEND) {
    const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/read`, {}, { auth: true, silent: true });
    if (!res.ok) {
      // Tolerar 404 cuando el mensaje solo existe en la subcolección de usuario
      if (res.status !== 404) throw new Error(`markAsRead ${res.status}`);
      // Best-effort: marcar localmente y no romper la UI
      try {
        memoryStore.mails = memoryStore.mails.map((m) => (m.id === id ? { ...m, read: true } : m));
      } catch {}
      return true;
    }
    return true;
  }
  memoryStore.mails = memoryStore.mails.map((m) => (m.id === id ? { ...m, read: true } : m));
  return true;
}

// Alias de compatibilidad con componentes que usan EmailService.sendEmail
export const sendEmail = sendMail;

export async function markAsUnread(id) {
  if (USE_BACKEND) {
    const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/unread`, {}, { auth: true, silent: true });
    if (!res.ok) {
      if (res.status !== 404) throw new Error(`markAsUnread ${res.status}`);
      try {
        memoryStore.mails = memoryStore.mails.map((m) => (m.id === id ? { ...m, read: false } : m));
      } catch {}
      return true;
    }
    return true;
  }
  memoryStore.mails = memoryStore.mails.map((m) => (m.id === id ? { ...m, read: false } : m));
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
  return memoryStore.mails
    .filter((m) => {
      const hay = `${m.subject || ''} ${m.body || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 20)
    .map((m) => ({ id: m.id, subject: m.subject, from: m.from || '', date: m.date }));
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
  if (!USE_BACKEND) return true;
  const res = await apiPut(`/api/mail/${encodeURIComponent(id)}/folder`, { folder }, { auth: true });
  if (!res.ok) throw new Error(`setFolder ${res.status}`);
  return true;
}

export async function updateMailTags(id, { add = [], remove = [] } = {}) {
  if (!USE_BACKEND) return true;
  const res = await apiPost(`/api/mail/${encodeURIComponent(id)}/tags`, { add, remove }, { auth: true });
  if (!res.ok) throw new Error(`updateTags ${res.status}`);
  return (await res.json()).tags || true;
}

const api = {
  setAuthContext: () => {},
  initEmailService,
  getMails,
  sendMail,
  deleteMail,
  createEmailAlias,
  markAsRead,
  getEmailStatistics,
  searchEmails,
  searchEvents,
  markAsUnread,
  setFolder,
  updateMailTags,
  USE_BACKEND,
  USE_MAILGUN,
  getMailsPage,
  getEmailTemplates,
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

