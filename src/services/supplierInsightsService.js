import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

const INSIGHTS_COLLECTION = 'supplierInsights';

export async function fetchSupplierInsights(supplierId) {
  if (!db || !supplierId) return null;
  try {
    const ref = doc(db, INSIGHTS_COLLECTION, supplierId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
  } catch (error) {
    console.warn('[supplierInsights] fetch failed', error);
    return null;
  }
}

async function ensureDoc(ref) {
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      supplierId: ref.id,
      weddingsServed: 0,
      avgBudget: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      responsesTracked: 0,
      budgetsTracked: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [],
    });
  }
}

export async function recordSupplierInsight({
  supplierId,
  weddingId,
  service,
  budget,
  responseTimeMinutes,
  satisfaction,
  status,
}) {
  if (!db || !supplierId) return;
  try {
    const ref = doc(db, INSIGHTS_COLLECTION, supplierId);
    await ensureDoc(ref);

    const payload = {
      updatedAt: serverTimestamp(),
    };

    if (typeof budget === 'number' && !Number.isNaN(budget)) {
      payload.budgetsTracked = increment(1);
      payload.avgBudget = increment(budget);
    }

    if (typeof responseTimeMinutes === 'number' && !Number.isNaN(responseTimeMinutes)) {
      payload.responsesTracked = increment(1);
      payload.avgResponseTime = increment(responseTimeMinutes);
    }

    if (typeof satisfaction === 'number' && !Number.isNaN(satisfaction)) {
      payload.satisfactionScore = increment(satisfaction);
    }

    if (status === 'Confirmado') {
      payload.weddingsServed = increment(1);
    }

    await updateDoc(ref, payload);

    const historyRef = doc(collection(ref, 'history'));
    await setDoc(historyRef, {
      createdAt: serverTimestamp(),
      weddingId: weddingId || null,
      service: service || '',
      budget: typeof budget === 'number' ? budget : null,
      responseTimeMinutes:
        typeof responseTimeMinutes === 'number' ? responseTimeMinutes : null,
      satisfaction: typeof satisfaction === 'number' ? satisfaction : null,
      status: status || 'Desconocido',
    });
  } catch (error) {
    console.warn('[supplierInsights] record failed', error);
  }
}
