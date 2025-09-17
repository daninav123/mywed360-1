// Email service implementation with graceful fallbacks.
// Provides a thin client around backend APIs when available,
// and a minimal in-memory fallback otherwise to keep the UI functional.

import { auth } from '../firebaseConfig';

const BASE = (typeof import.meta !== 'undefined' && import.meta && import.meta.env && import.meta.env.VITE_BACKEND_BASE_URL) || '';
export const USE_BACKEND = !!BASE;
export const USE_MAILGUN = true;

let memoryStore = {
  mails: [],
};

// Heurísticas básicas de clasificación en cliente (sin IA externa)
function classifyMailClientSide(m) {
  try {
    const txt = `${m.subject || ''} ${m.body || ''}`.toLowerCase();
    const tags = new Set(m.tags || []);
    let folder = m.folder || 'inbox';
    const add = (t) => { if (t) tags.add(t); };

    if (/\brsvp\b|confirmaci[óo]n|asistencia/.test(txt)) add('RSVP');
    if (/presupuesto|factura|pago|importe|transferencia|invoice|budget/.test(txt)) { add('Finanzas'); if (folder === 'inbox') folder = 'finance'; }
    if (/contrato|firma|acuerdo|sign|docu/.test(txt)) { add('Contratos'); }
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
      localStorage.setItem('lovenda.email.auth', JSON.stringify({ t: Date.now(), ctx: !!ctx }));
    }
  } catch {}
}

export async function initEmailService(opts = {}) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lovenda.email.init', JSON.stringify({ t: Date.now(), ...opts }));
    }
  } catch {}
  return opts?.myWed360Email || opts?.email || '';
}

function resolveCurrentEmail() {
  try {
    if (typeof localStorage === 'undefined') return '';
    const raw = localStorage.getItem('lovenda.email.init');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.myWed360Email || parsed?.email || '';
  } catch {
    return '';
  }
}

async function buildAuthHeaders(base = {}) {
  try {
    const user = auth && auth.currentUser;
    if (user && typeof user.getIdToken === 'function') {
      const token = await user.getIdToken();
      return { ...base, Authorization: `Bearer ${token}` };
    }
  } catch {}
  return base;
}

export async function getMails(folder = 'inbox') {
  if (USE_BACKEND) {
    const user = resolveCurrentEmail();
    const qs = new URLSearchParams();
    if (folder) qs.set('folder', folder);
    if (user) qs.set('user', (user||'').toLowerCase());
    const url = `${BASE}/api/mail${qs.toString() ? `?${qs.toString()}` : ''}`;
    const res = await fetch(url, { headers: await buildAuthHeaders() });
    if (!res.ok) throw new Error(`getMails ${res.status}`);
    const list = await res.json();
    try {
      // Clasificación ligera en cliente (tags sugeridos y carpeta probable)
      return (Array.isArray(list) ? list : []).map(classifyMailClientSide);
    } catch {
      return list;
    }
  }
  return memoryStore.mails.filter(m => (folder === 'all' ? true : (m.folder || 'inbox') === folder));
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
        ? attachments.map(a => ({ name: a.name || a.filename, size: a.size, type: a.type, url: a.url }))
        : []
    };
    const res = await fetch(`${BASE}/api/mail`, {
      method: 'POST',
      headers: await buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`sendMail ${res.status}`);
    return res.json();
  }
  const id = String(Date.now());
  memoryStore.mails.push({ id, to, subject, body, folder: 'sent', date: new Date().toISOString(), read: true, attachments: [] });
  return { success: true, id };
}

export async function deleteMail(id) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await buildAuthHeaders() });
    if (!res.ok) throw new Error(`deleteMail ${res.status}`);
    return true;
  }
  memoryStore.mails = memoryStore.mails.filter(m => m.id !== id);
  return true;
}

export async function markAsRead(id) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/${encodeURIComponent(id)}/read`, { method: 'POST', headers: await buildAuthHeaders() });
    if (!res.ok) throw new Error(`markAsRead ${res.status}`);
    return true;
  }
  memoryStore.mails = memoryStore.mails.map(m => (m.id === id ? { ...m, read: true } : m));
  return true;
}

export async function markAsUnread(id) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/${encodeURIComponent(id)}/unread`, { method: 'POST', headers: await buildAuthHeaders() });
    if (!res.ok) throw new Error(`markAsUnread ${res.status}`);
    return true;
  }
  memoryStore.mails = memoryStore.mails.map(m => (m.id === id ? { ...m, read: false } : m));
  return true;
}

export async function createEmailAlias(alias) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/alias`, { method: 'POST', headers: await buildAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ alias }) });
    if (!res.ok) throw new Error(`createEmailAlias ${res.status}`);
    return res.json();
  }
  return { success: true, alias };
}

export async function getEmailStatistics() {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/stats`, { headers: await buildAuthHeaders() });
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
      const res = await fetch(`${BASE}/api/mail/search?q=${encodeURIComponent(q)}`, { headers: await buildAuthHeaders() });
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
        const base = [
          ...(Array.isArray(inbox) ? inbox : []),
          ...(Array.isArray(sent) ? sent : []),
        ];
        return base
          .filter((m) => {
            const hay = `${m.subject || ''} ${m.body || ''} ${m.from || ''} ${m.to || ''}`.toLowerCase();
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
      const res = await fetch(`${BASE}/api/events/search?q=${encodeURIComponent(q)}`, { headers: await buildAuthHeaders() });
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
  const res = await fetch(`${BASE}/api/mail/${encodeURIComponent(id)}/folder`, {
    method: 'PUT',
    headers: await buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) throw new Error(`setFolder ${res.status}`);
  return true;
}

export async function updateMailTags(id, { add = [], remove = [] } = {}) {
  if (!USE_BACKEND) return true;
  const res = await fetch(`${BASE}/api/mail/${encodeURIComponent(id)}/tags`, {
    method: 'POST',
    headers: await buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ add, remove }),
  });
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
};

// Registro simple de actividad de emails AI (best-effort local)
export function logAIEmailActivity(aiResultId, searchQuery) {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = 'aiEmailActivities';
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2,10)}`,
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
