import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';

// Listens to window 'mywed360-guests' events and persists guests in Firestore
export default function GuestEventBridge() {
  const { activeWedding } = useWedding();

  useEffect(() => {
    if (!activeWedding || !db) return;

    const handler = async (ev) => {
      try {
        const detail = ev?.detail || {};
        if (!detail?.guest) return;
        const g = detail.guest;
        const action = detail.action || 'add';
        const colRef = collection(db, 'weddings', activeWedding, 'guests');

        if (action === 'add') {
          const payload = {
            name: g.name || 'Invitado',
            phone: g.phone || '',
            address: g.address || '',
            companion: Number(g.companion || g.companions || 0) || 0,
            table: g.table || '',
            response: g.response || 'Pendiente',
            status: g.status || 'pending',
            clientId: g.id || null,
            createdAt: serverTimestamp(),
          };
          await addDoc(colRef, payload);
          console.log('[GuestEventBridge] Invitado creado');
          return;
        }

        // localizar por clientId o por nombre
        let targetId = null;
        try {
          if (g.id) {
            const q1 = query(colRef, where('clientId', '==', g.id));
            const snap1 = await getDocs(q1);
            if (!snap1.empty) targetId = snap1.docs[0].id;
          }
        } catch {}
        if (!targetId) {
          try {
            const snap = await getDocs(colRef);
            const name = String(g.name || '').toLowerCase();
            const found = snap.docs.find((d) => String(d.data()?.name || '').toLowerCase() === name);
            if (found) targetId = found.id;
          } catch {}
        }
        if (!targetId) return;

        if (action === 'update') {
          const patch = {
            name: g.name,
            phone: g.phone,
            address: g.address,
            companion: Number(g.companion ?? g.companions),
            table: g.table,
            response: g.response,
            status: g.status,
          };
          Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);
          await updateDoc(doc(db, 'weddings', activeWedding, 'guests', targetId), patch);
          console.log('[GuestEventBridge] Invitado actualizado', targetId);
          return;
        }
        if (action === 'delete') {
          await deleteDoc(doc(db, 'weddings', activeWedding, 'guests', targetId));
          console.log('[GuestEventBridge] Invitado eliminado', targetId);
          return;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[GuestEventBridge] Error al manejar evento mywed360-guests', e);
      }
    };

    window.addEventListener('mywed360-guests', handler);
    return () => window.removeEventListener('mywed360-guests', handler);
  }, [activeWedding]);

  return null;
}

