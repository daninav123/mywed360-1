/**
 * Supplier Service - Sprint 8
 */

import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

class SupplierService {
  async add(weddingId, supplier) {
    const ref = collection(db, 'weddings', weddingId, 'suppliers');
    const docRef = await addDoc(ref, { ...supplier, createdAt: new Date().toISOString() });
    return { id: docRef.id, ...supplier };
  }

  async getAll(weddingId) {
    const snapshot = await getDocs(collection(db, 'weddings', weddingId, 'suppliers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async update(weddingId, supplierId, updates) {
    const ref = doc(db, 'weddings', weddingId, 'suppliers', supplierId);
    await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
  }

  async getByCategory(weddingId, category) {
    const all = await this.getAll(weddingId);
    return all.filter(s => s.category === category);
  }
}

export default new SupplierService();
