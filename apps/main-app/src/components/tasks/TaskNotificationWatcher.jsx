import { collection, getDocs } from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { auth, db } from '../../firebaseConfig';
import useTranslations from '../../hooks/useTranslations';
import { addNotification, showNotification, shouldNotify } from '../../services/notificationService';

// Observa tareas de la boda activa (consulta puntual + polling simple) y emite notificaciones
// de vencidas (últimas 24h) o próximas a 24h. Desduplica con localStorage.
export default function TaskNotificationWatcher({ intervalMs = 5 * 60 * 1000 }) {
  const { activeWedding } = useWedding();
  const firebaseUid = auth?.currentUser?.uid || null;
  const { t, format } = useTranslations();

  useEffect(() => {
    let timer = null;
    let running = false;
    if (!db || !activeWedding || !firebaseUid) return;

    const seenKey = 'maloveapp_tasks_notif_seen';
    const loadSeen = () => {
      try {
        return JSON.parse(localStorage.getItem(seenKey) || '{}');
      } catch {
        return {};
      }
    };
    const saveSeen = (obj) => {
      try {
        localStorage.setItem(seenKey, JSON.stringify(obj));
      } catch {}
    };

    const scan = async () => {
      if (running) return;
      running = true;
      try {
        const now = new Date();
        const soonMs = 24 * 60 * 60 * 1000;
        const seen = loadSeen();

        const colRef = collection(db, 'weddings', activeWedding, 'tasks');
        const snap = await getDocs(colRef);
        if (snap.empty) {
          running = false;
          return;
        }

        let emitted = 0;
        const maxEmits = 5;

        for (const doc of snap.docs) {
          const taskData = doc.data() || {};
          const endRaw = taskData.end || taskData.due || taskData.until;
          let end = null;
          try {
            if (endRaw instanceof Date) end = endRaw;
            else if (endRaw && typeof endRaw.toDate === 'function') end = endRaw.toDate();
            else if (typeof endRaw === 'number' || typeof endRaw === 'string') end = new Date(endRaw);
          } catch {}
          if (!(end instanceof Date) || Number.isNaN(end.getTime())) continue;

          const msDiff = end.getTime() - now.getTime();
          const isOverdue = msDiff < 0 && end.getTime() > now.getTime() - soonMs;
          const isDueSoon = msDiff >= 0 && msDiff <= soonMs;
          if (!isOverdue && !isDueSoon) continue;

          const kind = isOverdue ? 'overdue' : 'reminder24h';
          const key = `${kind}:${doc.id}:${end.toISOString().slice(0, 10)}`;
          if (seen[key]) continue;

          const title = isOverdue
            ? t('tasks.page.notifications.overdueTitle')
            : t('tasks.page.notifications.upcomingTitle');
          const name =
            taskData.title ||
            taskData.name ||
            t('tasks.page.common.fallbacks.task', { defaultValue: 'Tarea' });
          const endStr = format.datetime(end);
          const message = isOverdue
            ? t('tasks.page.notifications.overdueMessage', { name, date: endStr })
            : t('tasks.page.notifications.upcomingMessage', { name, date: endStr });

          const allowToast = shouldNotify({
            type: 'tasks',
            subtype: kind,
            priority: isOverdue ? 'high' : 'normal',
            channel: 'toast',
          });
          if (allowToast) {
            showNotification({
              title,
              message,
              type: isOverdue ? 'warning' : 'info',
              duration: 6000,
            });
          }

          addNotification({
            type: isOverdue ? 'warning' : 'info',
            message,
            weddingId: activeWedding,
            category: 'tasks',
            severity: isOverdue ? 'high' : 'medium',
            source: 'task_watcher',
            payload: {
              kind,
              taskId: doc.id,
              weddingId: activeWedding,
              dueDate: end.toISOString(),
              status: isOverdue ? 'overdue' : 'due_soon',
            },
          }).catch(() => {});

          seen[key] = true;
          emitted++;
          if (emitted >= maxEmits) break;
        }
        saveSeen(seen);
      } catch {}
      running = false;
    };

    scan();
    timer = setInterval(scan, Math.max(60_000, intervalMs));
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [db, activeWedding, intervalMs, firebaseUid, t, format]);

  return null;
}
