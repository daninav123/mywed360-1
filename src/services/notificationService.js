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
    const ref = doc(db, 'weddings', weddingId, 'notifications', notificationId);
    await updateDoc(ref, { sent: true, sentAt: new Date().toISOString() });
  }

  getTypes() {
    return NOTIFICATION_TYPES;
  }
}

// Instancia singleton del servicio
const notificationServiceInstance = new NotificationService();

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

export const showNotification = (notification) => {
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
    window.dispatchEvent(new CustomEvent('mywed360:notification', { detail: notification }));
  }
  
  return notification;
};

export const shouldNotify = (notification) => {
  // Lógica simple para determinar si se debe mostrar una notificación
  // Puede ser extendida con preferencias de usuario, quiet hours, etc.
  if (!notification) return false;
  
  // Si el usuario tiene el contexto de auth, verificar preferencias
  if (authContext?.preferences?.notificationsEnabled === false) {
    return false;
  }
  
  // Por defecto, permitir notificaciones
  return true;
};

export default notificationServiceInstance;
