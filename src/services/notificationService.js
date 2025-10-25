/**
 * Notification Service - Sprint 7
 */

import i18n from '../i18n';
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
  THANK_YOU: 'thank_you'
};

class NotificationService {
  async create(weddingId, notification) {
    const ref = collection(db, 'weddings', weddingId, 'notifications');
    const docRef = await addDoc(ref, {
      ...notification,
      createdAt: new Date().toISOString(),
      sent: false
    });
    return { id: docRef.id, ...notification };
  }

  async schedule(weddingId, notification, sendAt) {
    return this.create(weddingId, {
      ...notification,
      scheduled: true,
      sendAt: sendAt.toISOString()
    });
  }

  async getPending(weddingId) {
    const q = query(
      collection(db, 'weddings', weddingId, 'notifications'),
      where('sent', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async markSent(weddingId, notificationId) {
    const ref = doc(db, 'weddings', weddingId, 'notificationsi18n.t('common.notificationid_await_updatedocref_sent_true_sentat')22:00',
    end: '08:00i18n.t('common.exportaciones_adicionales_para_compatibilidad_con_diferentes')Error obteniendo notificaciones:', error);
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
    new Notification(notification.message || i18n.t('common.notificacion'), {
      body: notification.body || notification.message,
      icon: '/badge-72.pngi18n.t('common.tag_notificationid_datenowtostring_tambien_podriamos_emitir')undefined') {
    window.dispatchEvent(new CustomEvent('maloveapp:notificationi18n.t('common.detail_notification_return_notification_export_const')system';
  const category = notification.category || 'updates';
  
  if (prefs[notifType]?.[category] === false) {
    return false;
  }
  
  // Por defecto, permitir notificaciones
  return true;
};

export default notificationServiceInstance;
