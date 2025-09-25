import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';

// Listens to 'mywed360-finance' custom events and creates transactions in Firestore
export default function FinanceEventBridge() {
  const { activeWedding } = useWedding();

  useEffect(() => {
    if (!activeWedding || !db) return;

    const handler = async (ev) => {
      try {
        const detail = ev?.detail || {};
        if (!detail?.movement) return;
        const m = detail.movement;
        const action = detail.action || 'add';
        const colRef = collection(db, 'weddings', activeWedding, 'transactions');

        if (action === 'add') {
          const payload = {
            type: m.type === 'income' ? 'income' : 'expense',
            amount: Number(m.amount) || 0,
            concept: m.name || m.concept || 'Movimiento',
            date: m.date || new Date().toISOString().slice(0, 10),
            status: m.type === 'income' ? 'expected' : 'pending',
            source: 'chat',
            clientId: m.id || null,
            createdAt: serverTimestamp(),
          };
          await addDoc(colRef, payload);
          console.log('[FinanceEventBridge] Transacción creada');
          return;
        }

        // localizar doc por clientId, si no, por heurística (concept+amount+date)
        let targetId = null;
        try {
          if (m.id) {
            const q = query(colRef, where('clientId', '==', m.id));
            const snap = await getDocs(q);
            if (!snap.empty) targetId = snap.docs[0].id;
          }
        } catch {}
        if (!targetId) {
          try {
            const snap = await getDocs(colRef);
            const concept = (m.name || m.concept || '').toLowerCase();
            const amount = Number(m.amount) || null;
            const date = m.date || null;
            const found = snap.docs.find((d) => {
              const data = d.data();
              const c = String(data.concept || '').toLowerCase();
              const a = Number(data.amount) || null;
              const dt = data.date || null;
              return (!concept || c === concept) && (!amount || a === amount) && (!date || dt === date);
            });
            if (found) targetId = found.id;
          } catch {}
        }
        if (!targetId) return;

        if (action === 'update') {
          const patch = {
            type: m.type === 'income' ? 'income' : 'expense',
            amount: Number(m.amount) || undefined,
            concept: m.name || m.concept,
            date: m.date,
            status: m.type === 'income' ? 'expected' : undefined,
          };
          Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
          await updateDoc(doc(db, 'weddings', activeWedding, 'transactions', targetId), patch);
          console.log('[FinanceEventBridge] Transacción actualizada', targetId);
        } else if (action === 'delete') {
          await deleteDoc(doc(db, 'weddings', activeWedding, 'transactions', targetId));
          console.log('[FinanceEventBridge] Transacción eliminada', targetId);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[FinanceEventBridge] Error al manejar evento mywed360-finance', e);
      }
    };

    window.addEventListener('mywed360-finance', handler);
    return () => window.removeEventListener('mywed360-finance', handler);
  }, [activeWedding]);

  return null;
}

