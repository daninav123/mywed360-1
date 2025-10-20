// Notifications service â€“ interacts with backend API (Express + Firestore)
// Notification: { id, type, message, date, read, providerId?, trackingId?, dueDate?, action? }

import { auth } from '../firebaseConfig';
import { get as apiGet, post as apiPost, del as apiDel } from './apiClient';

// Sistema de autenticaciÃ³n unificado (inyectado desde useAuth)
let authContext = null;

// Permite registrar el contexto de autenticaciÃ³n desde el proveedor
export const setAuthContext = (context) => {
  authContext = context;
};

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4004';

// Obtiene el token de autenticaciÃ³n del usuario actual (prioriza sistema unificado)
async function getAuthToken() {
  const sources = [];
  if (authContext?.getIdToken) {
    sources.push(async () => {
      try {
        return await authContext.getIdToken(true);
      } catch (err) {
        console.warn('[notificationService] Error refrescando token (authContext):', err);
        return await authContext.getIdToken();
      }
    });
  }
  if (auth?.currentUser?.getIdToken) {
    sources.push(async () => {
      try {
        return await auth.currentUser.getIdToken(true);
      } catch (err) {
        console.warn('[notificationService] Error refrescando token (Firebase):', err);
        return await auth.currentUser.getIdToken();
      }
    });
  }

  for (const resolver of sources) {
    try {
      const token = await resolver();
      if (token) return token;
    } catch (error) {
      console.warn('[notificationService] Error obteniendo token de autenticación:', error);
    }
  }

  throw new Error('NotificationService: autenticación requerida');
}

// Devuelve cabeceras con Authorization si hay token
async function authHeader(base = {}) {
  const token = await getAuthToken();
  return { ...base, Authorization: `Bearer ${token}` };
}

// ==================== PREFERENCIAS DE NOTIFICACIONES ====================

export const DEFAULT_NOTIFICATION_PREFS = {
  channels: {
    inApp: true,
    push: true,
    emailDigest: { daily: true, weekly: false },
  },
  quietHours: { enabled: false, start: '22:00', end: '08:00', allowCritical: true },
  categories: {
    email: { new: true, important: true },
    tasks: { assigned: true, reminder24h: true, overdue: true },
    meetings: { suggested: true, reminder1h: true },
    providers: { trackingUrgent: true, budgetReceived: true, contractSigned: true },
    finance: { invoiceDue: true, paymentReceived: true, overbudget: true },
    rsvp: { new: true, changed: true },
    documents: { signatureRequested: true, signatureSigned: true },
    system: { exportReady: true, maintenance: true },
    ai: { suggestedTask: true, suggestedMeeting: true, suggestedBudget: true },
  },
};

const PREFS_KEY = 'mywed360_notification_prefs_v1';

export function getNotificationPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw);
    // merge con defaults para compatibilidad
    return deepMerge(DEFAULT_NOTIFICATION_PREFS, parsed);
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs) {
  try {
    const merged = deepMerge(DEFAULT_NOTIFICATION_PREFS, prefs || {});
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return prefs;
  }
}

function deepMerge(base, ext) {
  if (Array.isArray(base) || Array.isArray(ext)) return ext ?? base;
  if (typeof base !== 'object' || typeof ext !== 'object' || !base || !ext) return ext ?? base;
  const out = { ...base };
  for (const k of Object.keys(ext)) {
    out[k] = deepMerge(base[k], ext[k]);
  }
  return out;
}

export function isQuietHoursActive(date = new Date(), quiet = getNotificationPrefs().quietHours) {
  try {
    if (!quiet?.enabled) return false;
    const [sh, sm] = (quiet.start || '22:00').split(':').map((n) => parseInt(n || '0', 10));
    const [eh, em] = (quiet.end || '08:00').split(':').map((n) => parseInt(n || '0', 10));
    const startM = sh * 60 + (sm || 0);
    const endM = eh * 60 + (em || 0);
    const m = date.getHours() * 60 + date.getMinutes();
    if (startM <= endM) {
      return m >= startM && m < endM;
    } else {
      // rango que cruza medianoche
      return m >= startM || m < endM;
    }
  } catch {
    return false;
  }
}

/**
 * Determina si se debe notificar segÃºn preferencias y prioridad
 * @param {Object} evt { type, subtype, priority='normal', channel='toast', when=Date }
 * @param {Object} prefs preferencias opcionales (si no, se cargan)
 */
export function shouldNotify(evt, prefs = null) {
  const { type, subtype, priority = 'normal', channel = 'toast', when = new Date() } = evt || {};
  const p = prefs || getNotificationPrefs();
  if (!p?.channels?.inApp && channel === 'toast') return false;
  if (!p?.channels?.push && channel === 'push') return false;

  // quiet hours
  if (isQuietHoursActive(new Date(when), p.quietHours)) {
    if (!(priority === 'critical' && p.quietHours?.allowCritical)) return false;
  }

  // categorÃ­as
  const cat = (p.categories && p.categories[type]) || null;
  if (!cat) return true; // si no existe categorÃ­a, permitir
  if (subtype && Object.prototype.hasOwnProperty.call(cat, mapSubtypeKey(type, subtype))) {
    return !!cat[mapSubtypeKey(type, subtype)];
  }
  return true;
}

function mapSubtypeKey(type, subtype) {
  // Mapear subtipos conocidos a claves de prefs
  const map = {
    ai: {
      meeting_suggested: 'suggestedMeeting',
      budget_suggested: 'suggestedBudget',
      task_suggested: 'suggestedTask',
    },
    tasks: { reminder24h: 'reminder24h', overdue: 'overdue', assigned: 'assigned' },
    email: { new: 'new', important: 'important' },
  };
  return map[type] && map[type][subtype] ? map[type][subtype] : subtype || '';
}

export async function getNotifications() {
  try {
    const headers = await authHeader();
    const res = await apiGet('/api/notifications', { headers, silent: true });
    if (!res.ok) throw new Error('Error fetching notifications');
    const arr = await res.json();
    const notifications = (Array.isArray(arr) ? arr : []).map((n) => ({
      ...n,
      payload: n && typeof n.payload === 'object' && n.payload !== null ? n.payload : {},
      timestamp: n.date || n.createdAt || n.time || new Date().toISOString(),
    }));
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

export async function addNotification(notification) {
  if (!notification || !notification.message) {
    throw new Error('notification message required');
  }
  const {
    type = 'info',
    message,
    providerId,
    trackingId,
    dueDate,
    action,
    payload: inputPayload,
    weddingId,
    severity,
    category,
    source,
    ...rest
  } = notification;

  const payload = {
    ...(inputPayload || {}),
  };

  const assignIf = (key, value) => {
    if (value !== undefined && value !== null && !(key in payload)) {
      payload[key] = value;
    }
  };

  assignIf('providerId', providerId);
  assignIf('trackingId', trackingId);
  assignIf('dueDate', dueDate);
  assignIf('action', action);
  assignIf('weddingId', weddingId || rest.wid || rest.eventId);
  assignIf('severity', severity);
  assignIf('category', category);
  assignIf('source', source);

  // Preserve any extra primitive fields for backwards compatibility
  for (const [key, value] of Object.entries(rest)) {
    if (payload[key] === undefined && typeof value !== 'function') {
      payload[key] = value;
    }
  }

  const body = {
    type,
    message,
    payload,
    date: new Date().toISOString(),
    read: false,
  };

  try {
    const res = await apiPost('/api/notifications', body, { headers: await authHeader({}) });
    if (!res.ok) throw new Error('Error adding notification');
    const notif = await res.json();
    const enriched = { ...notif, payload };
    window.dispatchEvent(new CustomEvent('mywed360-notif', { detail: { id: enriched.id } }));
    return enriched;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
}

export async function markNotificationRead(id) {
  try {
    const headers = await authHeader();
    const res = await fetch(`${BASE}/api/notifications/${id}/read`, { method: 'PATCH', headers });
    if (!res.ok) throw new Error('Error marking notification as read');
    return res.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function deleteNotification(id) {
  try {
    const headers = await authHeader();
    const res = await apiDel(`/api/notifications/${id}`, { headers });
    if (!res.ok) throw new Error('Error deleting notification');
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Alias por compatibilidad
export const markAsRead = markNotificationRead;

// ---- Email actions ----
export async function acceptMeeting({ weddingId, mailId, title, when }) {
  const headers = await authHeader({ 'Content-Type': 'application/json' });
  const res = await apiPost(
    '/api/email-actions/accept-meeting',
    { weddingId, mailId, title, when },
    { headers }
  );
  if (!res.ok) throw new Error('acceptMeeting failed');
  return res.json();
}

export async function acceptTask({ weddingId, mailId, title, due, priority }) {
  const headers = await authHeader({ 'Content-Type': 'application/json' });
  const body = { weddingId, mailId, title, priority };
  if (due) body.due = due;
  const res = await apiPost('/api/email-actions/accept-task', body, { headers });
  if (!res.ok) throw new Error('acceptTask failed');
  return res.json();
}

export async function acceptBudget({ weddingId, budgetId, emailId }) {
  const headers = await authHeader({ 'Content-Type': 'application/json' });
  const res = await apiPost(
    '/api/email-actions/accept-budget',
    { weddingId, budgetId, emailId },
    { headers }
  );
  if (!res.ok) throw new Error('acceptBudget failed');
  return res.json();
}

// =============== PROVIDER TRACKING NOTIFICATIONS ===============

/**
 * Crea una alerta de seguimiento urgente para un proveedor
 * @param {Object} provider - El proveedor para el cual crear la alerta
 * @param {Object} tracking - El registro de seguimiento relacionado
 * @param {string} reason - Motivo del seguimiento urgente
 */
export async function createUrgentTrackingAlert(provider, tracking, reason) {
  return addNotification({
    type: 'warning',
    message: `Seguimiento urgente: ${provider.name} - ${reason}`,
    providerId: provider.id,
    trackingId: tracking.id,
    action: 'viewTracking',
    weddingId: provider?.weddingId || tracking?.weddingId || tracking?.weddingID || null,
    category: 'providers',
    severity: 'high',
    source: 'provider_tracking',
    payload: {
      weddingId: provider?.weddingId || tracking?.weddingId || null,
      providerId: provider?.id,
      trackingId: tracking?.id,
      reason,
    },
  });
}

/**
 * Crea un recordatorio automÃ¡tico para un proveedor segÃºn fecha
 * @param {Object} provider - El proveedor para el cual crear el recordatorio
 * @param {Date} dueDate - Fecha lÃ­mite del recordatorio
 * @param {string} title - TÃ­tulo del recordatorio
 */
export async function createProviderReminder(provider, dueDate, title) {
  return addNotification({
    type: 'info',
    message: `Recordatorio: ${title} - ${provider.name}`,
    providerId: provider.id,
    dueDate: dueDate.toISOString(),
    action: 'viewProvider',
    weddingId: provider?.weddingId || null,
    category: 'providers',
    severity: 'medium',
    source: 'provider_reminder',
    payload: {
      weddingId: provider?.weddingId || null,
      providerId: provider?.id,
      dueDate: dueDate.toISOString(),
      title,
    },
  });
}

/**
 * Verifica y genera notificaciones automÃ¡ticas basadas en registros de seguimiento
 * @param {Array} trackingRecords - Lista de registros de seguimiento
 * @param {Array} providers - Lista de proveedores
 */
export function generateTrackingNotifications(trackingRecords, providers) {
  // Comprobar seguimientos urgentes (sin respuesta tras 7 dÃ­as)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Filtrar seguimientos pendientes sin actualizaciÃ³n por mÃ¡s de 7 dÃ­as
  const urgentTrackings = trackingRecords.filter((track) => {
    if (track.status !== 'Pendiente' && track.status !== 'Esperando respuesta') {
      return false;
    }

    const lastUpdate = new Date(track.lastUpdate || track.date);
    return lastUpdate < sevenDaysAgo;
  });

  // Generar notificaciones para seguimientos urgentes
  urgentTrackings.forEach((tracking) => {
    // Buscar el proveedor correspondiente
    const provider = providers.find((p) => p.id === tracking.providerId);
    if (provider) {
      createUrgentTrackingAlert(provider, tracking, 'Sin respuesta por mÃ¡s de 7 dÃ­as');
    }
  });

  // Comprobar seguimientos prÃ³ximos a vencer (recordatorios a 3 dÃ­as)
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Filtrar seguimientos con fecha lÃ­mite prÃ³xima
  const upcomingTrackings = trackingRecords.filter((track) => {
    if (!track.dueDate) return false;

    const dueDate = new Date(track.dueDate);
    const isToday = dueDate.toDateString() === now.toDateString();
    const isInThreeDays = dueDate > now && dueDate <= threeDaysFromNow;

    return isToday || isInThreeDays;
  });

  // Generar recordatorios para seguimientos prÃ³ximos
  upcomingTrackings.forEach((tracking) => {
    const provider = providers.find((p) => p.id === tracking.providerId);
    if (provider) {
      const dueDate = new Date(tracking.dueDate);
      const isToday = dueDate.toDateString() === now.toDateString();

      createProviderReminder(
        provider,
        dueDate,
        isToday ? 'Seguimiento vence HOY' : 'Seguimiento prÃ³ximo a vencer'
      );
    }
  });

  return {
    urgentCount: urgentTrackings.length,
    reminderCount: upcomingTrackings.length,
  };
}

// =============== EMAIL NOTIFICATIONS ===============

/**
 * Muestra una notificaciÃ³n en la interfaz de usuario
 * @param {Object} notification - ConfiguraciÃ³n de la notificaciÃ³n
 * @param {string} notification.title - TÃ­tulo de la notificaciÃ³n
 * @param {string} notification.message - Mensaje de la notificaciÃ³n
 * @param {string} notification.type - Tipo de notificaciÃ³n (success, error, info, warning)
 * @param {number} notification.duration - DuraciÃ³n en ms (opcional, por defecto 3000ms)
 */
export function showNotification({ title, message, type = 'info', duration = 3000, actions = [] }) {
  // Crear evento personalizado para el sistema de notificaciones
  const event = new CustomEvent('mywed360-toast', {
    detail: { title, message, type, duration, actions },
  });

  // Disparar evento para que lo capture el componente de notificaciones
  window.dispatchEvent(event);

  // TambiÃ©n registrar en consola para desarrollo
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

// Marcar todas como leÃ­das (best-effort)
export async function markAllAsRead() {
  try {
    const { notifications } = await getNotifications();
    const ids = (Array.isArray(notifications) ? notifications : [])
      .filter((n) => !n.read && n.id)
      .map((n) => n.id);
    for (const id of ids) {
      try {
        await markNotificationRead(id);
      } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Crea una notificaciÃ³n relacionada con un nuevo email recibido
 * @param {Object} email - Datos del email recibido
 */
export async function createNewEmailNotification(email) {
  // AÃ±adir al sistema de notificaciones
  await addNotification({
    type: 'info',
    message: `Nuevo email de ${email.from}: ${email.subject || '(Sin asunto)'}`,
    action: 'viewEmail',
    emailId: email.id,
    weddingId: email?.weddingId || email?.weddingID || null,
    category: 'email',
    severity: 'low',
    source: 'email_inbox',
    payload: {
      weddingId: email?.weddingId || null,
      emailId: email?.id,
      folder: email?.folder,
    },
  });

  // Mostrar toast inmediato
  showNotification({
    title: 'Nuevo email',
    message: `Has recibido un nuevo email de ${email.from}`,
    type: 'info',
    duration: 5000,
  });
}

/**
 * Genera notificaciones para emails importantes o que requieren acciÃ³n
 * @param {Array} emails - Lista de emails para analizar
 */
export function generateEmailNotifications(emails) {
  if (!emails || !emails.length) return { count: 0 };

  // Filtrar emails no leÃ­dos
  const unreadEmails = emails.filter((email) => !email.read);

  // Notificar sobre emails no leÃ­dos (respetar preferencias)
  try {
    if (
      unreadEmails.length > 0 &&
      shouldNotify({ type: 'email', subtype: 'new', priority: 'normal', channel: 'toast' })
    ) {
      showNotification({
        title: 'Emails sin leer',
        message: `Tienes ${unreadEmails.length} ${unreadEmails.length === 1 ? 'email sin leer' : 'emails sin leer'}`,
        type: 'info',
      });
    }
  } catch {}

  // Filtrar emails importantes y no leÃ­dos para notificaciones persistentes
  const importantUnread = unreadEmails.filter(
    (email) => email.folder === 'important' || email.subject?.toLowerCase().includes('urgente')
  );

  // Crear notificaciones persistentes para emails importantes
  importantUnread.forEach((email) => {
    addNotification({
      type: 'warning',
      message: `Email importante: ${email.subject || '(Sin asunto)'}`,
      action: 'viewEmail',
      emailId: email.id,
      weddingId: email?.weddingId || null,
      category: 'email',
      severity: 'high',
      source: 'email_inbox',
      payload: {
        weddingId: email?.weddingId || null,
        emailId: email?.id,
        folder: email?.folder,
      },
    });
  });

  return {
    count: unreadEmails.length,
    importantCount: importantUnread.length,
  };
}
