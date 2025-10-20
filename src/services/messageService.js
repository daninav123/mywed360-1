/**
 * Message Service - Sprint 7
 */

import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

class MessageService {
  async send(weddingId, message) {
    const ref = collection(db, 'weddings', weddingId, 'messages');
    const doc = await addDoc(ref, {
      ...message,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    return { id: doc.id, ...message };
  }

  async getMessages(weddingId, guestId = null) {
    let q = collection(db, 'weddings', weddingId, 'messages');
    if (guestId) q = query(q, where('guestId', '==', guestId));
    q = query(q, orderBy('sentAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async bulkSend(weddingId, recipients, template) {
    const promises = recipients.map(guest => 
      this.send(weddingId, {
        guestId: guest.id,
        to: guest.email,
        subject: template.subject,
        body: this.processTemplate(template.body, guest),
        type: 'bulk'
      })
    );
    return Promise.all(promises);
  }

  processTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (_, key) => data[key] || '');
  }
}

export default new MessageService();
