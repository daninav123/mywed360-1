import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef } from 'react';

import { auth, firebaseReady } from '../../firebaseConfig';
import { useWedding } from '../../context/WeddingContext';
import {
  showNotification,
  shouldNotify,
  getNotifications as fetchNotifications,
} from '../../services/notificationService';

// Polls backend notifications and emits toast events for meeting/budget suggestions
export default function NotificationWatcher({ intervalMs = 20000 }) {
  const { activeWedding } = useWedding();
  const seenRef = useRef(new Set());
  const uid = auth?.currentUser?.uid || null;

  useEffect(() => {
    // Verificar que auth está inicializado
    if (!auth) {
      console.warn('[NotificationWatcher] Firebase Auth no está inicializado todavía');
      return;
    }
    let active = true;
    let started = false;
    let intervalId = null;

    try {
      const raw = localStorage.getItem('maloveapp_notif_seen');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach((id) => seenRef.current.add(id));
      }
    } catch {}

    const load = async (forceRefresh = false) => {
      try {
        // Si no hay weddingId activo, no hacer nada
        if (!activeWedding) {
          return;
        }

        const notifications = await fetchNotifications(activeWedding);
        const list = Array.isArray(notifications) ? notifications : [];
        if (!Array.isArray(list)) return;
        for (const n of list) {
          if (!n || !n.id) continue;
          if (seenRef.current.has(n.id)) continue;
          seenRef.current.add(n.id);
          const kind = n?.payload?.kind;
          if (kind === 'meeting_suggested') {
            const title = n?.payload?.meeting?.title || 'Reunión detectada';
            const when = n?.payload?.meeting?.when || '';
            if (
              shouldNotify({
                type: 'ai',
                subtype: 'meeting_suggested',
                priority: 'high',
                channel: 'toast',
              })
            ) {
              showNotification({
                title: 'Reunión sugerida',
                message: `${title}${when ? ' · ' + when : ''}`,
                type: 'info',
                duration: 9000,
                actions: [
                  {
                    label: 'Aceptar',
                    kind: 'acceptMeeting',
                    payload: {
                      weddingId: n?.payload?.weddingId,
                      mailId: n?.payload?.mailId,
                      title,
                      when,
                      notificationId: n.id,
                    },
                  },
                  { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
                ],
              });
            }
          } else if (kind === 'budget_suggested') {
            const amount = n?.payload?.budget?.amount;
            const currency = n?.payload?.budget?.currency || 'EUR';
            const desc = n?.payload?.budget?.description || 'Presupuesto';
            if (
              shouldNotify({
                type: 'ai',
                subtype: 'budget_suggested',
                priority: 'high',
                channel: 'toast',
              })
            ) {
              showNotification({
                title: 'Presupuesto detectado',
                message: `${desc}${amount ? ' · ' + amount + ' ' + currency : ''}`,
                type: 'info',
                duration: 9000,
                actions: [
                  {
                    label: 'Aceptar',
                    kind: 'acceptBudget',
                    payload: {
                      weddingId: n?.payload?.weddingId,
                      budgetId: n?.payload?.budgetId,
                      emailId: n?.payload?.mailId,
                      notificationId: n.id,
                    },
                  },
                  { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
                ],
              });
            }
          } else if (kind === 'task_suggested') {
            const title = n?.payload?.task?.title || 'Tarea detectada';
            const due = n?.payload?.task?.due;
            const priority = n?.payload?.task?.priority || 'media';
            if (
              shouldNotify({
                type: 'ai',
                subtype: 'task_suggested',
                priority: 'high',
                channel: 'toast',
              })
            ) {
              showNotification({
                title: 'Tarea sugerida',
                message: `${title}${due ? ' - ' + due : ''}`,
                type: 'info',
                duration: 9000,
                actions: [
                  {
                    label: 'Agregar',
                    kind: 'acceptTask',
                    payload: {
                      weddingId: n?.payload?.weddingId,
                      mailId: n?.payload?.mailId,
                      title,
                      due,
                      priority,
                      notificationId: n.id,
                    },
                  },
                  { label: 'Rechazar', kind: 'markRead', payload: { notificationId: n.id } },
                ],
              });
            }
          }
        }
        try {
          localStorage.setItem('maloveapp_notif_seen', JSON.stringify(Array.from(seenRef.current)));
        } catch {}
      } catch (error) {
        if (import.meta.env?.DEV) {
          console.debug('[NotificationWatcher] load error, usando cache local', error?.message);
        }
      }
    };

    const startPolling = async () => {
      if (started) return;
      started = true;
      try {
        const u = auth?.currentUser;
        if (u?.getIdToken) await u.getIdToken();
      } catch {}
      load();
      intervalId = setInterval(
        () => {
          if (active) load();
        },
        Math.max(10000, intervalMs)
      );
    };

    if (auth?.currentUser?.uid) {
      startPolling();
    } else if (auth) {
      // Solo suscribirse si auth está disponible
      const unsub = onAuthStateChanged(auth, (u) => {
        if (u) {
          startPolling();
          unsub();
        }
      });
    }

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs, uid]);

  return null;
}
