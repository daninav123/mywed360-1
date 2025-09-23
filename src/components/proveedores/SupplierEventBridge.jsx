import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useWedding } from '../../context/WeddingContext';

// Listens to 'lovenda-suppliers' events and persists suppliers in Firestore
export default function SupplierEventBridge() {
  const { activeWedding } = useWedding();

  useEffect(() => {
    if (!activeWedding || !db) return;

    const handler = async (ev) => {
      try {
        const detail = ev?.detail || {};
        if (!detail?.supplier) return;
        const s = detail.supplier;
        const action = detail.action || 'add';
        const colRef = collection(db, 'weddings', activeWedding, 'suppliers');

        if (action === 'add') {
          const payload = {
            name: s.name || 'Proveedor',
            service: s.service || s.category || '',
            contact: s.contact || '',
            email: s.email || '',
            phone: s.phone || '',
            link: s.link || s.website || s.url || '',
            status: s.status || 'Nuevo',
            snippet: s.snippet || s.desc || '',
            clientId: s.id || null,
            created: serverTimestamp(),
            createdAt: serverTimestamp(),
            updated: serverTimestamp(),
          };
          await addDoc(colRef, payload);
          console.log('[SupplierEventBridge] Proveedor creado');
          return;
        }

        // localizar doc por clientId o por nombre
        let targetId = null;
        try {
          if (s.id) {
            const q = query(colRef, where('clientId', '==', s.id));
            const snap = await getDocs(q);
            if (!snap.empty) targetId = snap.docs[0].id;
          }
        } catch {}
        if (!targetId) {
          try {
            const snap = await getDocs(colRef);
            const name = String(s.name || '').toLowerCase();
            const found = snap.docs.find((d) => String(d.data().name || '').toLowerCase() === name);
            if (found) targetId = found.id;
          } catch {}
        }
        if (!targetId) return;

        if (action === 'update') {
          const patch = {
            name: s.name,
            service: s.service || s.category,
            contact: s.contact,
            email: s.email,
            phone: s.phone,
            link: s.link || s.website || s.url,
            status: s.status,
            snippet: s.snippet || s.desc,
            updated: serverTimestamp(),
          };
          Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);
          await updateDoc(doc(db, 'weddings', activeWedding, 'suppliers', targetId), patch);
          console.log('[SupplierEventBridge] Proveedor actualizado', targetId);
        } else if (action === 'delete') {
          await deleteDoc(doc(db, 'weddings', activeWedding, 'suppliers', targetId));
          console.log('[SupplierEventBridge] Proveedor eliminado', targetId);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[SupplierEventBridge] Error al manejar evento lovenda-suppliers', e);
      }
    };

    window.addEventListener('lovenda-suppliers', handler);
    return () => window.removeEventListener('lovenda-suppliers', handler);
  }, [activeWedding]);

  return null;
}
