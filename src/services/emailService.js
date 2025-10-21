import { get as apiGet, post as apiPost, put as apiPut, del as apiDel } from './apiClient';

const IS_BROWSER = typeof window !== 'undefined';
const IS_CYPRESS = typeof window !== 'undefined' && typeof window.Cypress !== 'undefined';

export const BASE = import.meta.env.VITE_BACKEND_BASE_URL || '';
export const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || 'malove.app';
export const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY || '';
export const USE_MAILGUN = import.meta.env.VITE_USE_MAILGUN === 'true';
export const USE_BACKEND =
  import.meta.env.VITE_USE_EMAIL_BACKEND !== 'false' &&
  import.meta.env.VITE_DISABLE_EMAIL_BACKEND !== 'true';
export const MAX_ATTACHMENT_SIZE_MB = Number(import.meta.env.VITE_MAX_ATTACHMENT_SIZE_MB || 15);

export let CURRENT_USER = null;
export let CURRENT_USER_EMAIL = '';

const MAIL_STORAGE_KEY = 'malove_mails';
const TEMPLATE_STORAGE_KEY = 'malove_email_templates';
const DRAFT_STORAGE_KEY = 'malove_email_drafts';
const INIT_MARKER_KEY = 'malove.email.init';

let authContextRef = null;
const HAS_FILE = typeof File !== 'undefined';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function buildEmailFromProfile(profile = {}) {
  if (!profile || typeof profile !== 'object') {
    return `usuario@${MAILGUN_DOMAIN}`;
  }
  const alias = slugify(profile.emailAlias || profile.emailUsername || '');
  if (alias) {
    return `${alias}@${MAILGUN_DOMAIN}`;
  }
  const first = slugify(
    profile.brideFirstName ||
      profile.firstName ||
      (profile.name && profile.name.split(' ')[0]) ||
      ''
  );
  const last = slugify(profile.brideLastName || profile.lastName || profile.secondLastName || '');
  if (first && last) return `${first}.${last}@${MAILGUN_DOMAIN}`;
  if (first) return `${first}@${MAILGUN_DOMAIN}`;
  if (profile.email && String(profile.email).includes('@')) {
    return String(profile.email);
  }
  const fallbackId = slugify(profile.userId || profile.id || profile.uid || '');
  if (fallbackId) return `${fallbackId}@${MAILGUN_DOMAIN}`;
  return `usuario@${MAILGUN_DOMAIN}`;
}

function getRequestOptions(extra = {}) {
  const base = { ...(extra || {}) };
  if (IS_CYPRESS) {
    return { ...base, auth: false };
  }
  if (authContextRef && authContextRef.user) {
    return { ...base, auth: base.auth ?? true };
  }
  return { ...base, auth: base.auth ?? false };
}

async function safeJson(response) {
  if (!response || typeof response.json !== 'function') return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readLocal(key, fallback) {
  if (!IS_BROWSER) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  if (!IS_BROWSER) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function normalizeMail(mail, fallbackFolder) {
  if (!mail || typeof mail !== 'object') return null;
  const copy = { ...mail };
  copy.id =
    copy.id || `email_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  copy.folder = copy.folder || fallbackFolder || 'inbox';
  copy.read = Boolean(copy.read);
  copy.tags = Array.isArray(copy.tags) ? copy.tags : [];
  copy.attachments = Array.isArray(copy.attachments) ? copy.attachments : [];
  copy.date = copy.date || new Date().toISOString();
  return copy;
}

function filterByFolder(list, folder) {
  if (!Array.isArray(list)) return [];
  if (!folder || folder === 'all') {
    return list.map((item) => normalizeMail(item, item?.folder || 'inbox')).filter(Boolean);
  }
  return list
    .map((item) => normalizeMail(item, item?.folder || folder))
    .filter((item) => item && (item.folder || folder) === folder);
}

function sanitizeHtml(html) {
  if (!html) return '';
  return String(html).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
}

function collectRecipients(value = '') {
  return String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function sanitizeAttachments(list = []) {
  if (!Array.isArray(list)) return [];
  const maxBytes = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
  return list
    .map((item) => {
      if (!item) return null;
      const attachment = { ...item };
      if (HAS_FILE && attachment.file instanceof File) {
        attachment.name = attachment.name || attachment.file.name;
        attachment.size = attachment.size || attachment.file.size;
        attachment.type = attachment.type || attachment.file.type;
      }
      if (maxBytes && attachment.size && attachment.size > maxBytes) {
        return null;
      }
      attachment.name = attachment.name || 'adjunto.bin';
      attachment.size = attachment.size || 0;
      return attachment;
    })
    .filter(Boolean);
}

function validateOutgoingMail(mail = {}) {
  const toList = collectRecipients(mail.to);
  if (!toList.length) {
    return 'Destinatario es obligatorio';
  }
  if (toList.length > 50) {
    return 'Hay demasiados destinatarios en el campo Para';
  }
  const allRecipients = [...toList, ...collectRecipients(mail.cc), ...collectRecipients(mail.bcc)];
  const invalid = allRecipients.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  if (invalid.length) {
    return `Direcciones inválidas: ${invalid.join(', ')}`;
  }
  if (!mail.subject || !String(mail.subject).trim()) {
    return 'El asunto es obligatorio';
  }
  if (!mail.body || !String(mail.body).trim()) {
    return 'El contenido del mensaje es obligatorio';
  }
  return null;
}

function rememberSentMail(mail, extra = {}) {
  const stored = readLocal(MAIL_STORAGE_KEY, []);
  const record = normalizeMail(
    {
      ...mail,
      folder: 'sent',
      read: true,
      sentAt: mail.sentAt || new Date().toISOString(),
      ...extra,
    },
    'sent'
  );
  const next = [record, ...stored];
  writeLocal(MAIL_STORAGE_KEY, next);
  return record;
}

function updateLocalMail(emailId, updater) {
  if (!emailId) return;
  const list = readLocal(MAIL_STORAGE_KEY, []);
  const next = list.map((item) => {
    if (!item || item.id !== emailId) return item;
    return { ...item, ...(typeof updater === 'function' ? updater(item) : updater) };
  });
  writeLocal(MAIL_STORAGE_KEY, next);
}

function removeLocalMail(emailId) {
  if (!emailId) return;
  const list = readLocal(MAIL_STORAGE_KEY, []);
  writeLocal(
    MAIL_STORAGE_KEY,
    list.filter((item) => item && item.id !== emailId)
  );
}

export function setAuthContext(context) {
  authContextRef = context;
}

export async function initEmailService(profile = {}) {
  CURRENT_USER = profile || null;
  CURRENT_USER_EMAIL = buildEmailFromProfile(profile);
  if (IS_BROWSER) {
    try {
      window.localStorage.setItem(
        INIT_MARKER_KEY,
        JSON.stringify({ t: Date.now(), profile, email: CURRENT_USER_EMAIL })
      );
    } catch {}
  }
  return CURRENT_USER_EMAIL;
}

export async function getMails(input = 'inbox') {
  const params = typeof input === 'object' && input ? { ...input } : {};
  const folder = typeof input === 'string' ? input : params.folder || 'inbox';
  if (USE_BACKEND) {
    try {
      const query = new URLSearchParams();
      if (folder && folder !== 'all') query.set('folder', folder);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      if (params.search) query.set('search', params.search);
      const response = await apiGet(
        `/api/mail${query.toString() ? `?${query.toString()}` : ''}`,
        getRequestOptions({ silent: true })
      );
      if (response?.ok) {
        const payload = await safeJson(response);
        const list =
          (payload && (payload.data || payload.emails)) ||
          (Array.isArray(payload) ? payload : []);
        if (Array.isArray(list)) {
          return filterByFolder(list, folder);
        }
      }
    } catch (error) {
      console.warn('[EmailService] Backend getMails failed, falling back to local data', error);
    }
  }
  const stored = readLocal(MAIL_STORAGE_KEY, []);
  return filterByFolder(stored, folder);
}

export async function getMailsPage(folder = 'inbox', options = {}) {
  const limit = Number(options?.limit || 50);
  const all = await getMails(folder);
  const items = Array.isArray(all) ? all.slice(0, limit) : [];
  const hasMore = Array.isArray(all) ? all.length > items.length : false;
  return {
    items,
    nextCursor: hasMore ? String(limit) : null,
    hasMore,
    page: 1,
    total: Array.isArray(all) ? all.length : 0,
  };
}

export async function getMail(emailId) {
  if (!emailId) return null;
  if (USE_BACKEND) {
    try {
      const response = await apiGet(`/api/mail/${encodeURIComponent(emailId)}`, getRequestOptions({ silent: true }));
      if (response?.ok) {
        const payload = await safeJson(response);
        if (payload) return normalizeMail(payload, payload.folder);
      }
    } catch (error) {
      console.warn('[EmailService] Backend getMail failed, using local cache', error);
    }
  }
  const local = readLocal(MAIL_STORAGE_KEY, []);
  return local.find((item) => item && item.id === emailId) || null;
}

export const getMailDetails = getMail;
export const getEmail = getMail;

export async function getUnreadCount(folder = 'inbox') {
  const mails = await getMails(folder);
  return Array.isArray(mails) ? mails.filter((mail) => !mail.read).length : 0;
}

function buildOutgoingPayload(mail) {
  const subject = String(mail.subject || '').slice(0, 255);
  const payload = {
    ...mail,
    id: mail.id,
    from: mail.from || CURRENT_USER_EMAIL,
    to: collectRecipients(mail.to).join(', '),
    cc: collectRecipients(mail.cc).join(', '),
    bcc: collectRecipients(mail.bcc).join(', '),
    subject,
    body: sanitizeHtml(mail.body || ''),
    attachments: sanitizeAttachments(mail.attachments),
    scheduledAt: mail.scheduledAt || null,
  };
  if (!payload.id) {
    payload.id = `email_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  }
  return payload;
}

async function sendMailViaBackend(mail) {
  try {
    const response = await apiPost('/api/mail', mail, getRequestOptions({ silent: true }));
    const payload = await safeJson(response);
    if (response?.ok) {
      return { success: true, ...(payload?.data || payload || {}) };
    }
    return {
      success: false,
      error: (payload && (payload.message || payload.error)) || `sendMailViaBackend ${response?.status}`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendMailWithMailgun(mail) {
  try {
    const response = await apiPost('/api/mail', { ...mail, provider: 'mailgun' }, getRequestOptions({ silent: true }));
    const payload = await safeJson(response);
    if (response?.ok) {
      return { success: true, ...(payload?.data || payload || {}) };
    }
    return {
      success: false,
      error: (payload && (payload.message || payload.error)) || `sendMailWithMailgun ${response?.status}`,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function sendMail(mail = {}) {
  const validationError = validateOutgoingMail(mail);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const payload = buildOutgoingPayload(mail);
  let result = null;

  if (USE_MAILGUN) {
    result = await sendMailWithMailgun(payload);
    if (result.success) {
      rememberSentMail(payload, result);
      return { success: true, ...result };
    }
  }

  if (USE_BACKEND) {
    result = await sendMailViaBackend(payload);
    if (result.success) {
      rememberSentMail(payload, result);
      return { success: true, ...result };
    }
  }

  const stored = rememberSentMail(payload, { offline: true });
  return { success: true, storedLocally: true, id: stored.id };
}

export const sendEmail = sendMail;

export async function replyMail(original, overrides = {}) {
  const body = overrides.body || original.body || '';
  return sendMail({
    ...overrides,
    to: overrides.to || original.from,
    subject: overrides.subject || `Re: ${original.subject || ''}`,
    body,
  });
}

export async function forwardMail(original, overrides = {}) {
  const body = overrides.body || original.body || '';
  return sendMail({
    ...overrides,
    subject: overrides.subject || `Fwd: ${original.subject || ''}`,
    body,
  });
}

export async function saveDraft(draft = {}) {
  if (!draft || !draft.id) {
    draft.id = `draft_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  }
  const sanitized = buildOutgoingPayload(draft);
  const stored = readLocal(DRAFT_STORAGE_KEY, []);
  const next = [sanitized, ...stored.filter((item) => item.id !== sanitized.id)];
  writeLocal(DRAFT_STORAGE_KEY, next);
  return { success: true, draft: sanitized };
}

export async function markAsRead(emailId, isRead = true) {
  if (!emailId) return { success: false, error: 'email_id_required' };
  if (USE_BACKEND) {
    try {
      await apiPost(
        `/api/mail/${encodeURIComponent(emailId)}/${isRead ? 'read' : 'unread'}`,
        {},
        getRequestOptions({ silent: true })
      );
    } catch (error) {
      console.warn('[EmailService] markAsRead backend call failed', error);
    }
  }
  updateLocalMail(emailId, { read: Boolean(isRead) });
  return { success: true };
}

export async function deleteMail(emailId) {
  if (!emailId) return { success: false, error: 'email_id_required' };
  if (USE_BACKEND) {
    try {
      await apiDel(`/api/mail/${encodeURIComponent(emailId)}`, getRequestOptions({ silent: true }));
    } catch (error) {
      console.warn('[EmailService] deleteMail backend call failed', error);
    }
  }
  removeLocalMail(emailId);
  return { success: true };
}

export async function setFolder(emailId, folder) {
  if (!emailId || !folder) return { success: false, error: 'invalid_params' };
  if (USE_BACKEND) {
    try {
      await apiPut(
        `/api/mail/${encodeURIComponent(emailId)}/folder`,
        { folder },
        getRequestOptions({ silent: true })
      );
    } catch (error) {
      console.warn('[EmailService] setFolder backend call failed', error);
    }
  }
  updateLocalMail(emailId, { folder });
  return { success: true };
}

export const moveMail = setFolder;

export async function setMailImportant(emailId, important = true) {
  if (!emailId) return { success: false, error: 'email_id_required' };
  if (USE_BACKEND) {
    try {
      await apiPut(
        `/api/mail/${encodeURIComponent(emailId)}/important`,
        { important: Boolean(important) },
        getRequestOptions({ silent: true })
      );
    } catch (error) {
      console.warn('[EmailService] setMailImportant backend call failed', error);
    }
  }
  updateLocalMail(emailId, { important: Boolean(important) });
  return { success: true };
}

export async function updateMailTags(emailId, { add = [], remove = [] } = {}) {
  if (!emailId) throw new Error('email_id_required');
  if (USE_BACKEND) {
    try {
      const response = await apiPost(
        `/api/mail/${encodeURIComponent(emailId)}/tags`,
        { add, remove },
        getRequestOptions({ silent: true })
      );
      if (!response?.ok) {
        const payload = await safeJson(response);
        const message =
          (payload && (payload.message || payload.error)) ||
          `updateMailTags ${response?.status}`;
        const error = new Error(message);
        error.status = response?.status;
        error.body = payload;
        throw error;
      }
    } catch (error) {
      console.error('[EmailService] updateMailTags backend call failed', error);
      throw error;
    }
  }
  updateLocalMail(emailId, (mail) => {
    const current = Array.isArray(mail.tags) ? new Set(mail.tags) : new Set();
    add.forEach((tag) => current.add(tag));
    remove.forEach((tag) => current.delete(tag));
    return { tags: Array.from(current) };
  });
  return true;
}

export async function emptyTrash() {
  if (USE_BACKEND) {
    try {
      await apiDel('/api/email/trash/empty', getRequestOptions({ silent: true }));
    } catch (error) {
      console.warn('[EmailService] emptyTrash backend call failed', error);
    }
  }
  const stored = readLocal(MAIL_STORAGE_KEY, []);
  writeLocal(
    MAIL_STORAGE_KEY,
    stored.filter((mail) => mail && mail.folder !== 'trash')
  );
  return { success: true };
}

const DEFAULT_TEMPLATES = [
  {
    id: 'welcome-provider',
    name: 'Solicitud a proveedor',
    subject: 'Solicitud de información para nuestra boda',
    body: '<p>Hola {{name}},</p><p>Estamos organizando nuestra boda y nos gustaría conocer más sobre tus servicios.</p>',
  },
  {
    id: 'thanks-meeting',
    name: 'Agradecimiento reunión',
    subject: '¡Gracias por tu tiempo!',
    body: '<p>Gracias por reunirte con nosotros. Quedamos atentos a la propuesta.</p>',
  },
  {
    id: 'follow-up',
    name: 'Seguimiento de propuesta',
    subject: 'Seguimiento de nuestra solicitud',
    body: '<p>Queríamos saber si pudiste revisar nuestra solicitud anterior.</p>',
  },
];

export async function getEmailTemplates(forceRefresh = false) {
  if (USE_BACKEND && !IS_CYPRESS) {
    try {
      const response = await apiGet('/api/mail/templates', getRequestOptions({ silent: true }));
      if (response?.ok) {
        const payload = await safeJson(response);
        const list = (payload && (payload.data || payload.templates)) || payload;
        if (Array.isArray(list) && list.length) {
          writeLocal(TEMPLATE_STORAGE_KEY, list);
          return list;
        }
      }
    } catch (error) {
      console.warn('[EmailService] getEmailTemplates backend call failed', error);
    }
  }
  if (!forceRefresh) {
    const stored = readLocal(TEMPLATE_STORAGE_KEY, null);
    if (Array.isArray(stored) && stored.length) return stored;
  }
  writeLocal(TEMPLATE_STORAGE_KEY, DEFAULT_TEMPLATES);
  return DEFAULT_TEMPLATES;
}

export async function getEmailTemplateById(templateId) {
  if (!templateId) return null;
  const templates = await getEmailTemplates();
  return templates.find((template) => template && template.id === templateId) || null;
}

export async function saveEmailTemplate(template) {
  if (!template || !template.name) {
    throw new Error('invalid_template');
  }
  const current = await getEmailTemplates();
  const sanitized = {
    id: template.id || `tpl_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    name: template.name,
    subject: template.subject || '',
    body: sanitizeHtml(template.body || ''),
    category: template.category || 'general',
  };
  const next = [sanitized, ...current.filter((item) => item.id !== sanitized.id)];
  writeLocal(TEMPLATE_STORAGE_KEY, next);
  return sanitized;
}

export async function deleteEmailTemplate(templateId) {
  if (!templateId) return false;
  const current = await getEmailTemplates();
  const next = current.filter((template) => template.id !== templateId);
  writeLocal(TEMPLATE_STORAGE_KEY, next);
  return true;
}

export async function resetPredefinedTemplates() {
  writeLocal(TEMPLATE_STORAGE_KEY, DEFAULT_TEMPLATES);
  return DEFAULT_TEMPLATES;
}

export async function searchEmails(term = '', options = {}) {
  const query = String(term || '').trim();
  if (!query) return [];
  if (USE_BACKEND) {
    try {
      const params = new URLSearchParams({ q: query, ...options });
      const response = await apiGet(`/api/mail/search?${params.toString()}`, getRequestOptions({ silent: true }));
      if (response?.ok) {
        const payload = await safeJson(response);
        const list = (payload && (payload.data || payload.emails)) || payload;
        if (Array.isArray(list)) return list.map((mail) => normalizeMail(mail));
      }
    } catch (error) {
      console.warn('[EmailService] searchEmails backend call failed', error);
    }
  }
  const local = readLocal(MAIL_STORAGE_KEY, []);
  return local.filter((mail) => {
    if (!mail) return false;
    const haystack = `${mail.subject || ''} ${mail.body || ''} ${mail.from || ''} ${mail.to || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
}

export async function searchEvents() {
  return [];
}

export async function getEmailStatistics() {
  if (USE_BACKEND) {
    try {
      const response = await apiGet('/api/mail/stats', getRequestOptions({ silent: true }));
      if (response?.ok) {
        const payload = await safeJson(response);
        if (payload) return payload;
      }
    } catch (error) {
      console.warn('[EmailService] getEmailStatistics backend call failed', error);
    }
  }
  const all = readLocal(MAIL_STORAGE_KEY, []);
  const sent = all.filter((mail) => mail.folder === 'sent').length;
  const inbox = all.filter((mail) => mail.folder === 'inbox').length;
  return {
    total: all.length,
    sent,
    received: inbox,
    unread: all.filter((mail) => !mail.read).length,
  };
}

export const getEmailStats = getEmailStatistics;

export async function logAIEmailActivity(id, context = {}) {
  try {
    if (USE_BACKEND) {
      await apiPost(
        '/api/email/ai/log',
        { id, context },
        getRequestOptions({ silent: true })
      );
    }
  } catch (error) {
    console.warn('[EmailService] logAIEmailActivity backend call failed', error);
  }
  return { success: true };
}

export default {
  BASE,
  MAILGUN_DOMAIN,
  MAILGUN_API_KEY,
  USE_MAILGUN,
  USE_BACKEND,
  MAX_ATTACHMENT_SIZE_MB,
  CURRENT_USER,
  CURRENT_USER_EMAIL,
  setAuthContext,
  initEmailService,
  getMails,
  getMailsPage,
  getMail,
  getMailDetails,
  getEmail,
  getUnreadCount,
  sendMail,
  sendEmail,
  replyMail,
  forwardMail,
  saveDraft,
  markAsRead,
  deleteMail,
  setFolder,
  moveMail,
  setMailImportant,
  emptyTrash,
  getEmailTemplates,
  getEmailTemplateById,
  saveEmailTemplate,
  deleteEmailTemplate,
  resetPredefinedTemplates,
  searchEmails,
  searchEvents,
  getEmailStatistics,
  getEmailStats,
  logAIEmailActivity,
  updateMailTags,
};
