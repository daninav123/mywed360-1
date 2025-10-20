/**
 * Notification Service - Sprint 7
 */

import { collection, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

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

export default new NotificationService();
