// Notifications service – interacts with backend API (Express + Firestore)
// Notification: { id, type, message, date, read, providerId?, trackingId?, dueDate?, action? }

import { auth } from '../firebaseConfig';
import { get as apiGet, post as apiPost, del as apiDel } from './apiClient';

// Sistema de autenticación unificado (inyectado desde useAuth)
let authContext = null;

// Permite registrar el contexto de autenticación desde el proveedor
export const setAuthContext = (context) => {
  authContext = context;
};

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

// Obtiene el token de autenticación del usuario actual (prioriza sistema unificado)
async function getAuthToken() {
  try {
    // 1) Priorizar el sistema de autenticación unificado
    if (authContext && authContext.getIdToken) {
      const token = await authContext.getIdToken();
      if (token) return token;
    }

    // 2) Fallback: Firebase si está disponible
    const user = auth.currentUser;
    if (user && user.getIdToken) {
      return await user.getIdToken();
    }

    // 3) Fallback: token mock si tenemos usuario en el contexto
    if (authContext && authContext.currentUser) {
      return `mock-${authContext.currentUser.uid}-${authContext.currentUser.email}`;
    }
    return null;
  } catch (error) {
    console.warn('Error obteniendo token de autenticación:', error);
    return null;
  }
}

// Devuelve cabeceras con Authorization si hay token
async function authHeader(base = {}) {
  const token = await getAuthToken();
  return token ? { ...base, Authorization: `Bearer ${token}` } : base;
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
 * Determina si se debe notificar según preferencias y prioridad
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

  // categorías
  const cat = (p.categories && p.categories[type]) || null;
  if (!cat) return true; // si no existe categoría, permitir
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
    const res = await apiGet('/api/notifications', { headers });
    if (!res.ok) throw new Error('Error fetching notifications');
    const arr = await res.json();
    const notifications = (Array.isArray(arr) ? arr : []).map((n) => ({
      ...n,
      timestamp: n.date || n.createdAt || n.time || new Date().toISOString(),
    }));
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { notifications, unreadCount };
  } catch (error) {
    // Silenciar 401/primer arranque sin token; devolver vacío/local
    try {
      const local = loadLocalNotifications();
      const unreadCount = local.filter((n) => !n.read).length;
      return { notifications: local, unreadCount };
    } catch {
      return { notifications: [], unreadCount: 0 };
    }
  }
}

export async function addNotification(notification) {
  const { type = 'info', message, providerId, trackingId, dueDate, action } = notification;

  try {
    const res = await apiPost(
      '/api/notifications',
      {
        type,
        message,
        providerId,
        trackingId,
        dueDate,
        action,
        date: new Date().toISOString(),
        read: false,
      },
      { headers: await authHeader({}) }
    );

    if (!res.ok) throw new Error('Error adding notification');
    const notif = await res.json();
    window.dispatchEvent(new CustomEvent('mywed360-notif', { detail: { id: notif.id } }));
    return notif;
  } catch (error) {
    console.error('Error adding notification:', error);
    // Modo fallback: guardar notificación en localStorage
    return addLocalNotification({
      type,
      message,
      providerId,
      trackingId,
      dueDate,
      action,
      date: new Date().toISOString(),
      read: false,
    });
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
    // Modo fallback: marcar como leída en localStorage
    return markLocalNotificationRead(id);
  }
}

export async function deleteNotification(id) {
  try {
    const headers = await authHeader();
    const res = await apiDel(`/api/notifications/${id}`, { headers });
    if (!res.ok) throw new Error('Error deleting notification');
    // Eliminar también de localStorage por si acaso
    deleteLocalNotification(id);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    // Modo fallback: eliminar de localStorage
    return deleteLocalNotification(id);
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
  });
}

/**
 * Crea un recordatorio automático para un proveedor según fecha
 * @param {Object} provider - El proveedor para el cual crear el recordatorio
 * @param {Date} dueDate - Fecha límite del recordatorio
 * @param {string} title - Título del recordatorio
 */
export async function createProviderReminder(provider, dueDate, title) {
  return addNotification({
    type: 'info',
    message: `Recordatorio: ${title} - ${provider.name}`,
    providerId: provider.id,
    dueDate: dueDate.toISOString(),
    action: 'viewProvider',
  });
}

/**
 * Verifica y genera notificaciones automáticas basadas en registros de seguimiento
 * @param {Array} trackingRecords - Lista de registros de seguimiento
 * @param {Array} providers - Lista de proveedores
 */
export function generateTrackingNotifications(trackingRecords, providers) {
  // Comprobar seguimientos urgentes (sin respuesta tras 7 días)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  // Filtrar seguimientos pendientes sin actualización por más de 7 días
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
      createUrgentTrackingAlert(provider, tracking, 'Sin respuesta por más de 7 días');
    }
  });

  // Comprobar seguimientos próximos a vencer (recordatorios a 3 días)
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  // Filtrar seguimientos con fecha límite próxima
  const upcomingTrackings = trackingRecords.filter((track) => {
    if (!track.dueDate) return false;

    const dueDate = new Date(track.dueDate);
    const isToday = dueDate.toDateString() === now.toDateString();
    const isInThreeDays = dueDate > now && dueDate <= threeDaysFromNow;

    return isToday || isInThreeDays;
  });

  // Generar recordatorios para seguimientos próximos
  upcomingTrackings.forEach((tracking) => {
    const provider = providers.find((p) => p.id === tracking.providerId);
    if (provider) {
      const dueDate = new Date(tracking.dueDate);
      const isToday = dueDate.toDateString() === now.toDateString();

      createProviderReminder(
        provider,
        dueDate,
        isToday ? 'Seguimiento vence HOY' : 'Seguimiento próximo a vencer'
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
 * Muestra una notificación en la interfaz de usuario
 * @param {Object} notification - Configuración de la notificación
 * @param {string} notification.title - Título de la notificación
 * @param {string} notification.message - Mensaje de la notificación
 * @param {string} notification.type - Tipo de notificación (success, error, info, warning)
 * @param {number} notification.duration - Duración en ms (opcional, por defecto 3000ms)
 */
export function showNotification({ title, message, type = 'info', duration = 3000, actions = [] }) {
  // Crear evento personalizado para el sistema de notificaciones
  const event = new CustomEvent('mywed360-toast', {
    detail: { title, message, type, duration, actions },
  });

  // Disparar evento para que lo capture el componente de notificaciones
  window.dispatchEvent(event);

  // También registrar en consola para desarrollo
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

// Marcar todas como leídas (best-effort)
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
 * Crea una notificación relacionada con un nuevo email recibido
 * @param {Object} email - Datos del email recibido
 */
export async function createNewEmailNotification(email) {
  // Añadir al sistema de notificaciones
  await addNotification({
    type: 'info',
    message: `Nuevo email de ${email.from}: ${email.subject || '(Sin asunto)'}`,
    action: 'viewEmail',
    emailId: email.id,
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
 * Genera notificaciones para emails importantes o que requieren acción
 * @param {Array} emails - Lista de emails para analizar
 */
export function generateEmailNotifications(emails) {
  if (!emails || !emails.length) return { count: 0 };

  // Filtrar emails no leídos
  const unreadEmails = emails.filter((email) => !email.read);

  // Notificar sobre emails no leídos (respetar preferencias)
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

  // Filtrar emails importantes y no leídos para notificaciones persistentes
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
    });
  });

  return {
    count: unreadEmails.length,
    importantCount: importantUnread.length,
  };
}

// =============== LOCAL STORAGE FALLBACK ===============

// Funciones helper para almacenamiento local de notificaciones
function loadLocalNotifications() {
  try {
    const notifications = JSON.parse(localStorage.getItem('mywed360_notifications') || '[]');
    return notifications;
  } catch (e) {
    console.error('Error loading local notifications:', e);
    return [];
  }
}

function saveLocalNotifications(notifications) {
  try {
    localStorage.setItem('mywed360_notifications', JSON.stringify(notifications));
    return true;
  } catch (e) {
    console.error('Error saving local notifications:', e);
    return false;
  }
}

function addLocalNotification(notification) {
  const notifications = loadLocalNotifications();
  const newNotification = {
    ...notification,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };

  notifications.push(newNotification);
  saveLocalNotifications(notifications);

  window.dispatchEvent(
    new CustomEvent('mywed360-notif', {
      detail: { id: newNotification.id },
    })
  );

  return newNotification;
}

function markLocalNotificationRead(id) {
  const notifications = loadLocalNotifications();
  const updatedNotifications = notifications.map((notif) =>
    notif.id === id ? { ...notif, read: true } : notif
  );

  saveLocalNotifications(updatedNotifications);
  return updatedNotifications.find((n) => n.id === id) || null;
}

function deleteLocalNotification(id) {
  const notifications = loadLocalNotifications();
  const updatedNotifications = notifications.filter((notif) => notif.id !== id);

  saveLocalNotifications(updatedNotifications);
  return true;
}


