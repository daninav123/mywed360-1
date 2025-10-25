import {
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db, auth } from '../../firebaseConfig';
import { useTranslations } from '../../hooks/useTranslations';

// Listens to window 'maloveapp-tasks' events and persists tasks/meetings in Firestore
// Supports actions: add (default), update, delete, complete (only for tasks)
export default function TaskEventBridge() {
  const { activeWedding } = useWedding();

  useEffect(() => {
    if (!activeWedding || !db) return;

    const handler = async (ev) => {
      try {
        const detail = ev?.detail || {};
        const uid = auth?.currentUser?.uid || null;

        // --- TASKS ---
        if (detail.task) {
          const t = detail.task;
          const action = detail.action || 'add';
          const now = new Date();
          const start = t.start ? new Date(t.start) : now;
          const end = t.end ? new Date(t.end) : new Date(now.getTime() + 60 * 60 * 1000);
          const colRef = collection(db, 'weddings', activeWedding, 'tasks');

          if (action === 'add') {
            const payload = {
              title: t.title || 'Tarea',
              desc: t.desc || '',
              category: t.category || 'OTROS',
              start,
              end,
              clientId: t.id || null,
              createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(colRef, payload);
            if (uid) {
              await setDoc(
                doc(db, 'users', uid, 'tasks', docRef.id),
                { id: docRef.id, ...payload },
                { merge: true }
              );
            }
            // eslint-disable-next-line no-console
            console.log('[TaskEventBridge] Tarea creada', docRef.id);
            return;
          }

          // locate existing by clientId then by title
          let targetId = null;
          try {
            if (t.id) {
              const q1 = query(colRef, where('clientId', '==', t.id));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) targetId = snap1.docs[0].id;
            }
          } catch {}
          if (!targetId) {
            try {
              const snap = await getDocs(colRef);
              const title = String(t.title || '').toLowerCase();
              const found = snap.docs.find(
                (d) => String(d.data()?.title || '').toLowerCase() === title
              );
              if (found) targetId = found.id;
            } catch {}
          }
          if (!targetId) return;

          if (action === 'update') {
            const patch = { title: t.title, desc: t.desc, category: t.category, start, end };
            Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);
            await updateDoc(doc(db, 'weddings', activeWedding, 'tasks', targetId), patch);
            console.log('[TaskEventBridge] Tarea actualizada', targetId);
            return;
          }
          if (action === 'delete') {
            await deleteDoc(doc(db, 'weddings', activeWedding, 'tasks', targetId));
            console.log('[TaskEventBridge] Tarea eliminada', targetId);
            return;
          }
          if (action === 'complete') {
            try {
              await setDoc(
                doc(db, 'weddings', activeWedding, 'tasksCompleted', String(targetId)),
                { id: String(targetId), taskId: String(targetId), completedAt: serverTimestamp() },
                { merge: true }
              );
              console.log('[TaskEventBridge] Tarea completada', targetId);
            } catch (e) {
              console.warn('[TaskEventBridge] No se pudo marcar completada', e);
            }
            return;
          }
        }

        // --- MEETINGS ---
        if (detail.meeting) {
          const m = detail.meeting;
          const action = detail.action || 'add';
          const start = m.start ? new Date(m.start) : new Date();
          const end = m.end ? new Date(m.end) : new Date(start.getTime() + 60 * 60 * 1000);
          const colRef = collection(db, 'weddings', activeWedding, 'meetings');

          if (action === 'add') {
            const payload = {
              title: m.title || {t('common.reunion')},
              desc: m.desc || '',
              start,
              end,
              clientId: m.id || null,
              createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(colRef, payload);
            if (uid) {
              await setDoc(
                doc(db, 'users', uid, 'meetings', docRef.id),
                { id: docRef.id, ...payload },
                { merge: true }
              );
            }
            console.log('[TaskEventBridge] Reunión creada', docRef.id);
            return;
          }

          let targetId = null;
          try {
            if (m.id) {
              const q1 = query(colRef, where('clientId', '==', m.id));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) targetId = snap1.docs[0].id;
            }
          } catch {}
          if (!targetId) {
            try {
              const snap = await getDocs(colRef);
              const title = String(m.title || '').toLowerCase();
              const found = snap.docs.find(
                (d) => String(d.data()?.title || '').toLowerCase() === title
              );
              if (found) targetId = found.id;
            } catch {}
          }
          if (!targetId) return;

          if (action === 'update') {
            const patch = { title: m.title, desc: m.desc, start, end };
            Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);
            await updateDoc(doc(db, 'weddings', activeWedding, 'meetings', targetId), patch);
            console.log('[TaskEventBridge] Reunión actualizada', targetId);
            return;
          }
          if (action === 'delete') {
            await deleteDoc(doc(db, 'weddings', activeWedding, 'meetings', targetId));
            console.log('[TaskEventBridge] Reunión eliminada', targetId);
            return;
          }
        }
      } catch (e) {
        console.error('[TaskEventBridge] Error al manejar evento mywed360-tasks', e);
      }
    };

    window.addEventListener('maloveapp-tasks', handler);
    return () => window.removeEventListener('maloveapp-tasks', handler);
  }, [activeWedding]);

  return null;
}



