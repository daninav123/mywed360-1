/**
 * AI Task Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

class AITaskService {
  async generateSuggestions(weddingData) {
    const tasks = [];
    const { date, guestsCount } = weddingData;
    
    const daysUntil = Math.floor((new Date(date) - new Date()) / (1000*60*60*24));
    
    if (daysUntil > 180) tasks.push({ title: 'Reservar lugar', priority: 'high', category: 'venue' });
    if (daysUntil > 120) tasks.push({ title: 'Contratar catering', priority: 'high', category: 'catering' });
    if (daysUntil > 90) tasks.push({ title: 'Enviar invitaciones', priority: 'medium', category: 'invitations' });
    if (daysUntil < 60) tasks.push({ title: 'Confirmar proveedores', priority: 'high', category: 'suppliers' });
    if (daysUntil < 30) tasks.push({ title: 'Plan de asientos final', priority: 'high', category: 'seating' });
    
    return tasks;
  }

  async saveSuggestions(weddingId, tasks) {
    const token = localStorage.getItem('authToken');
    const promises = tasks.map(task => 
      fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          weddingId, 
          ...task, 
          source: 'ai' 
        })
      })
    );
    return Promise.all(promises);
  }

  async getTasks(weddingId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/tasks?weddingId=${weddingId}&source=ai`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.tasks || result.data || [];
  }
}

export default new AITaskService();
