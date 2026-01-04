/**
 * Notification Service - PostgreSQL Version
 * Usa API backend para notificaciones
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

let authContext = null;

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
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weddingId,
          ...notification,
          sent: false,
        })
      });

      if (!response.ok) throw new Error('Error creando notificación');
      const result = await response.json();
      return result.notification || result.data;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  async schedule(weddingId, notification, sendAt) {
    return this.create(weddingId, {
      ...notification,
      scheduled: true,
      sendAt: sendAt.toISOString(),
    });
  }

  async getPending(weddingId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${API_URL}/api/notifications?weddingId=${weddingId}&sent=false`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) return [];
      const result = await response.json();
      return result.notifications || result.data || [];
    } catch (error) {
      console.error('Error obteniendo notificaciones pendientes:', error);
      return [];
    }
  }

  async markSent(weddingId, notificationId) {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sent: true, sentAt: new Date().toISOString() })
      });
    } catch (error) {
      console.error('Error marcando notificación como enviada:', error);
    }
  }

  getTypes() {
    return NOTIFICATION_TYPES;
  }
}

const notificationServiceInstance = new NotificationService();

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

export const addNotification = async (notification) => {
  if (notification.weddingId) {
    return await notificationServiceInstance.create(notification.weddingId, notification);
  }
  return { ...notification, id: Date.now().toString() };
};

export const getNotifications = async (userId, filters = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams();
    if (filters.read !== undefined) params.append('read', filters.read);
    if (filters.type) params.append('type', filters.type);
    
    const response = await fetch(
      `${API_URL}/api/notifications?${params.toString()}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return [];
    const result = await response.json();
    return result.notifications || result.data || [];
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return false;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    return false;
  }
};

export const showNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};

export const shouldNotify = (preferences, type, category) => {
  if (!preferences) return true;
  return preferences[category]?.[type] !== false;
};

export const isQuietHoursActive = (preferences) => {
  if (!preferences?.quietHours?.enabled) return false;
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  
  const [startHour, startMin] = (preferences.quietHours.start || '22:00').split(':').map(Number);
  const [endHour, endMin] = (preferences.quietHours.end || '08:00').split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
};

export default notificationServiceInstance;
