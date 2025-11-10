/**
 * Notification Service - Sprint 7
 */

import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Variable para almacenar el contexto de autenticación
let authContext = null;

// Función para registrar el contexto de autenticación desde useAuth
export const setAuthContext = (context) => {
  authContext = context || null;
};

const NOTIFICATION_TYPES = {
  RSVP_REMINDER: 'rsvp_reminder',
  INFO_UPDATE: 'info_update',
  PAYMENT_REMINDER: 'payment_reminder',
  THANK_YOU: 'thank_you',
};

class NotificationService {
  async create(weddingId, notification) {
    const ref = collection(db, 'weddings', weddingId, 'notifications');
    const docRef = await addDoc(ref, {
      ...notification,
      createdAt: new Date().toISOString(),
      sent: false,
    });
    return { id: docRef.id, ...notification };
  }

  async schedule(weddingId, notification, sendAt) {
    return this.create(weddingId, {
      ...notification,
      scheduled: true,
      sendAt: sendAt.toISOString(),
    });
  }

  async getPending(weddingId) {
    const q = query(
      collection(db, 'weddings', weddingId, 'notifications'),
      where('sent', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async markSent(weddingId, notificationId) {
    const ref = doc(db, 'weddings', weddingId, 'notifications', notificationId);
    await updateDoc(ref, { sent: true, sentAt: new Date().toISOString() });
  }

  getTypes() {
    return NOTIFICATION_TYPES;
  }
}

// Instancia singleton del servicio
const notificationServiceInstance = new NotificationService();

// Preferencias de notificación por defecto
export const DEFAULT_NOTIFICATION_PREFS = {
  email: {
    newMessage: true,
    replies: true,
    mentions: true,
  },
  tasks: {
    assigned: true,
    dueDate: true,
    completed: true,
  },
  rsvp: {
    newResponse: true,
    reminders: true,
  },
  system: {
    updates: true,
    security: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

// Exportaciones adicionales para compatibilidad con diferentes módulos
export const addNotification = async (notification) => {
  // Función helper para añadir notificaciones
  // Si tiene weddingId, usa el servicio, sino solo retorna la notificación
  if (notification.weddingId) {
    return await notificationServiceInstance.create(notification.weddingId, notification);
  }
  // Para notificaciones que no requieren persistencia, solo retornar
  return { ...notification, id: Date.now().toString() };
};

export const getNotifications = async (weddingId) => {
  // Obtener notificaciones pendientes
  if (!weddingId) {
    // Si no hay weddingId, retornar array vacío
    return [];
  }
  try {
    return await notificationServiceInstance.getPending(weddingId);
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
};

export const getNotificationPrefs = () => {
  // Obtener preferencias de notificación desde localStorage
  try {
    const stored = localStorage.getItem('maloveapp_notification_prefs');
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error cargando preferencias:', error);
  }
  return DEFAULT_NOTIFICATION_PREFS;
};

export const saveNotificationPrefs = (prefs) => {
  // Guardar preferencias de notificación en localStorage
  try {
    localStorage.setItem('maloveapp_notification_prefs', JSON.stringify(prefs));
    return true;
  } catch (error) {
    console.error('Error guardando preferencias:', error);
    return false;
  }
};

export const isQuietHoursActive = () => {
  // Verificar si estamos en quiet hours
  const prefs = getNotificationPrefs();
  if (!prefs.quietHours?.enabled) return false;

  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = prefs.quietHours;

    // Si quiet hours cruza medianoche
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    // Quiet hours normal
    return currentTime >= start && currentTime < end;
  } catch (error) {
    console.error('Error verificando quiet hours:', error);
    return false;
  }
};

export const showNotification = (notification) => {
  // Verificar quiet hours
  if (isQuietHoursActive()) {
    console.log('Notificación silenciada por quiet hours');
    return notification;
  }

  // Mostrar notificación en el navegador (si está soportado)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.message || 'Notificación', {
      body: notification.body || notification.message,
      icon: '/badge-72.png',
      tag: notification.id || Date.now().toString(),
    });
  }

  // También podríamos emitir un evento personalizado para que otros componentes lo escuchen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('maloveapp:notification', { detail: notification }));
  }

  return notification;
};

export const shouldNotify = (notification) => {
  // Lógica simple para determinar si se debe mostrar una notificación
  // Puede ser extendida con preferencias de usuario, quiet hours, etc.
  if (!notification) return false;

  // Verificar quiet hours
  if (isQuietHoursActive()) return false;

  // Si el usuario tiene el contexto de auth, verificar preferencias
  if (authContext?.preferences?.notificationsEnabled === false) {
    return false;
  }

  // Verificar preferencias específicas por tipo
  const prefs = getNotificationPrefs();
  const notifType = notification.type || 'system';
  const category = notification.category || 'updates';

  if (prefs[notifType]?.[category] === false) {
    return false;
  }

  // Por defecto, permitir notificaciones
  return true;
};

export const markNotificationRead = async (weddingId, notificationId) => {
  // Marcar notificación como leída
  if (!weddingId || !notificationId) {
    console.warn('markNotificationRead: weddingId y notificationId son requeridos');
    return false;
  }

  try {
    const ref = doc(db, 'weddings', weddingId, 'notifications', notificationId);
    await updateDoc(ref, {
      read: true,
      readAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return false;
  }
};

export const deleteNotification = async (weddingId, notificationId) => {
  // Eliminar notificación
  if (!weddingId || !notificationId) {
    console.warn('deleteNotification: weddingId y notificationId son requeridos');
    return false;
  }

  try {
    const ref = doc(db, 'weddings', weddingId, 'notifications', notificationId);
    await updateDoc(ref, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    return false;
  }
};

export default notificationServiceInstance;
