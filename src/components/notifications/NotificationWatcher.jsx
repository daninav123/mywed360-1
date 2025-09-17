import { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { showNotification } from '../../services/notificationService';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_BASE_URL) || '';

// Polls backend notifications and emits toast events for meeting/budget suggestions
export default function NotificationWatcher({ intervalMs = 20000 }) {
  const seenRef = useRef(new Set());

  useEffect(() => {
    let active = true;
    let started = false;
    let intervalId = null;

    try {
      const raw = localStorage.getItem('lovenda_notif_seen');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((id) => seenRef.current.add(id));
      }
    } catch {}

    const load = async () => {
      try {
        const u = auth?.currentUser;
        if (!u || !u.getIdToken) return;
        const token = await u.getIdToken();
        const res = await fetch(`${BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list)) return;
        for (const n of list) {
          if (!n || !n.id) continue;
          if (seenRef.current.has(n.id)) continue;
          seenRef.current.add(n.id);
          const kind = n?.payload?.kind;
          if (kind === 'meeting_suggested') {
            const title = n?.payload?.meeting?.title || 'Reunión detectada';
            const when = n?.payload?.meeting?.when || '';
            showNotification({
              title: 'Reunión sugerida',
              message: `${title}${when ? ' · ' + when : ''}`,
              type: 'info',
              duration: 9000,
              actions: [
                { label: 'Aceptar', kind: 'acceptMeeting', payload: { weddingId: n?.payload?.weddingId, mailId: n?.payload?.mailId, title, when, notificationId: n.id } },
                { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
              ],
            });
          } else if (kind === 'budget_suggested') {
            const amount = n?.payload?.budget?.amount;
            const currency = n?.payload?.budget?.currency || 'EUR';
            const desc = n?.payload?.budget?.description || 'Presupuesto';
            showNotification({
              title: 'Presupuesto detectado',
              message: `${desc}${amount ? ' · ' + amount + ' ' + currency : ''}`,
              type: 'info',
              duration: 9000,
              actions: [
                { label: 'Aceptar', kind: 'acceptBudget', payload: { weddingId: n?.payload?.weddingId, budgetId: n?.payload?.budgetId, emailId: n?.payload?.mailId, notificationId: n.id } },
                { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
              ],
            });
          } else if (kind === 'task_suggested') {
            const title = n?.payload?.task?.title || 'Tarea detectada';
            const due = n?.payload?.task?.due;
            const priority = n?.payload?.task?.priority || 'media';
            showNotification({
              title: 'Tarea sugerida',
              message: `${title}${due ? ' - ' + due : ''}`,
              type: 'info',
              duration: 9000,
              actions: [
                { label: 'Agregar', kind: 'acceptTask', payload: { weddingId: n?.payload?.weddingId, mailId: n?.payload?.mailId, title, due, priority, notificationId: n.id } },
                { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
              ],
            });
          }
        }
        try { localStorage.setItem('lovenda_notif_seen', JSON.stringify(Array.from(seenRef.current))); } catch {}
      } catch {}
    };

    const startPolling = async () => {
      if (started) return;
      started = true;
      try { const u = auth?.currentUser; if (u?.getIdToken) await u.getIdToken(); } catch {}
      load();
      intervalId = setInterval(() => { if (active) load(); }, Math.max(10000, intervalMs));
    };

    if (auth?.currentUser) {
      startPolling();
    } else {
      const unsub = onAuthStateChanged(auth, (u) => { if (u) { startPolling(); unsub(); } });
    }

    return () => { active = false; if (intervalId) clearInterval(intervalId); };
  }, [intervalMs]);

  return null;
}

