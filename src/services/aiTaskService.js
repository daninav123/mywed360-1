/**
 * AI Task Service - Sprint 8 - S8-T002
 */
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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
    const ref = collection(db, 'weddings', weddingId, 'aiTasks');
    const promises = tasks.map(task => addDoc(ref, { ...task, createdAt: new Date().toISOString(), source: 'ai' }));
    return Promise.all(promises);
  }

  async getTasks(weddingId) {
    const snapshot = await getDocs(collection(db, 'weddings', weddingId, 'aiTasks'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export default new AITaskService();
