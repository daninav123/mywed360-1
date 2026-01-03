import { doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const propagateWeddingDate = async (weddingId, weddingDate) => {
  try {
    if (!weddingDate || !weddingId) return;

    const timelineRef = doc(db, 'weddings', weddingId, 'timeline', 'milestones');
    const timelineSnap = await getDoc(timelineRef);

    if (!timelineSnap.exists()) {
      const date = new Date(weddingDate);
      const milestones = [
        { 
          id: 'wedding-day', 
          title: 'Día de la Boda', 
          date: weddingDate, 
          completed: false,
          color: '#ef4444'
        },
        { 
          id: 'three-months', 
          title: '3 meses antes', 
          date: new Date(date.setMonth(date.getMonth() - 3)).toISOString().split('T')[0],
          completed: false,
          color: '#3b82f6'
        },
        { 
          id: 'one-month', 
          title: '1 mes antes', 
          date: new Date(date.setMonth(date.getMonth() + 2)).toISOString().split('T')[0],
          completed: false,
          color: '#f59e0b'
        },
      ];

      await setDoc(timelineRef, {
        milestones,
        createdAt: serverTimestamp(),
        source: 'infoboda-auto'
      });
    }
  } catch (error) {
    console.error('[propagateWeddingDate] Error:', error);
  }
};

export const propagateBudget = async (weddingId, totalBudget) => {
  try {
    if (!totalBudget || !weddingId) return;

    const financeRef = doc(db, 'weddings', weddingId, 'finance', 'budget');
    const financeSnap = await getDoc(financeRef);

    if (!financeSnap.exists() || !financeSnap.data()?.totalBudget) {
      await setDoc(financeRef, {
        totalBudget,
        createdAt: serverTimestamp(),
        source: 'infoboda-auto'
      }, { merge: true });
    }
  } catch (error) {
    console.error('[propagateBudget] Error:', error);
  }
};

export const propagateServices = async (weddingId, services) => {
  try {
    if (!services || !weddingId) return;

    const searchesRef = doc(db, 'weddings', weddingId, 'suppliers', 'searches');
    
    await setDoc(searchesRef, {
      suggestedSearches: services,
      lastUpdated: serverTimestamp(),
      source: 'infoboda-auto'
    }, { merge: true });
  } catch (error) {
    console.error('[propagateServices] Error:', error);
  }
};

export const propagateLocation = async (weddingId, locationData) => {
  try {
    if (!locationData || !weddingId) return;

    const { celebrationPlace, celebrationAddress, celebrationCity } = locationData;
    
    if (!celebrationPlace && !celebrationAddress && !celebrationCity) return;

    const weddingRef = doc(db, 'weddings', weddingId);
    
    await updateDoc(weddingRef, {
      'location.venue': celebrationPlace || '',
      'location.address': celebrationAddress || '',
      'location.city': celebrationCity || '',
      'location.lastUpdated': serverTimestamp(),
      'location.source': 'infoboda'
    });
  } catch (error) {
    console.error('[propagateLocation] Error:', error);
  }
};

export const propagateAllChanges = async (weddingId, weddingInfo, changedFields = []) => {
  const promises = [];

  if (changedFields.includes('weddingDate') && weddingInfo.weddingDate) {
    promises.push(propagateWeddingDate(weddingId, weddingInfo.weddingDate));
  }

  if (changedFields.includes('totalBudget') && weddingInfo.totalBudget) {
    promises.push(propagateBudget(weddingId, weddingInfo.totalBudget));
  }

  if (changedFields.includes('celebrationPlace') || 
      changedFields.includes('celebrationAddress') || 
      changedFields.includes('celebrationCity')) {
    promises.push(propagateLocation(weddingId, weddingInfo));
  }

  try {
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('[propagateAllChanges] Error:', error);
  }
};

export { propagateSupplierToWedding } from '../services/supplierPropagationService';
