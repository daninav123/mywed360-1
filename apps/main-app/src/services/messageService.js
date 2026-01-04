/**
 * Message Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

class MessageService {
  async send(weddingId, message) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ weddingId, ...message })
    });
    
    if (!response.ok) throw new Error('Error enviando mensaje');
    const result = await response.json();
    return result.message || result.data;
  }

  async getMessages(weddingId, guestId = null) {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams({ weddingId });
    if (guestId) params.append('guestId', guestId);
    
    const response = await fetch(`${API_URL}/api/messages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.messages || result.data || [];
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
