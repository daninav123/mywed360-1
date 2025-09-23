import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db } from '../../firebaseConfig';
import { addNotification, showNotification, shouldNotify } from '../../services/notificationService';

// Observa tareas de la boda activa (consulta puntual + polling simple) y emite notificaciones
// de vencidas (últimas 24h) o próximas a 24h. Desduplica con localStorage.
export default function TaskNotificationWatcher({ intervalMs = 5 * 60 * 1000 }) {
  const { activeWedding } = useWedding();

  useEffect(() => {
    let timer = null;
    let running = false;
    if (!db || !activeWedding) return;

    const seenKey = 'lovenda_tasks_notif_seen';
    const loadSeen = () => {
      try { return JSON.parse(localStorage.getItem(seenKey) || '{}'); } catch { return {}; }
    };
    const saveSeen = (obj) => { try { localStorage.setItem(seenKey, JSON.stringify(obj)); } catch {} };

    const scan = async () => {
      if (running) return;
      running = true;
      try {
        const now = new Date();
        const soonMs = 24 * 60 * 60 * 1000;
        const seen = loadSeen();

        const colRef = collection(db, 'weddings', activeWedding, 'tasks');
        const snap = await getDocs(colRef);
        if (snap.empty) { running = false; return; }

        let emitted = 0;
        const maxEmits = 5;

        for (const doc of snap.docs) {
          const t = doc.data() || {};
          // Normalizar fechas (Timestamp/Date/string)
          const endRaw = t.end || t.due || t.until;
          let end = null;
          try {
            if (endRaw instanceof Date) end = endRaw;
            else if (endRaw && typeof endRaw.toDate === 'function') end = endRaw.toDate();
            else if (typeof endRaw === 'number' || typeof endRaw === 'string') end = new Date(endRaw);
          } catch {}
          if (!(end instanceof Date) || isNaN(end.getTime())) continue;

          const msDiff = end.getTime() - now.getTime();
          const isOverdue = msDiff < 0 && end.getTime() > now.getTime() - soonMs; // vencida en últimas 24h
          const isDueSoon = msDiff >= 0 && msDiff <= soonMs; // vence en próximas 24h
          if (!isOverdue && !isDueSoon) continue;

          const kind = isOverdue ? 'overdue' : 'reminder24h';
          const key = `${kind}:${doc.id}:${end.toISOString().slice(0,10)}`;
          if (seen[key]) continue;

          const title = isOverdue ? 'Tarea vencida' : 'Tarea próxima a vencer';
          const name = t.title || t.name || 'Tarea';
          const endStr = end.toLocaleString('es-ES');
          const message = isOverdue ? `${name} venció (${endStr})` : `${name} vence antes de 24h (${endStr})`;

          // Respeta preferencias (canal toast)
          const allowToast = shouldNotify({ type: 'tasks', subtype: kind, priority: isOverdue ? 'high' : 'normal', channel: 'toast' });
          if (allowToast) {
            showNotification({ title, message, type: isOverdue ? 'warning' : 'info', duration: 6000 });
          }

          // Registrar en bandeja (persistente)
          addNotification({ type: isOverdue ? 'warning' : 'info', message, dueDate: end.toISOString() }).catch(() => {});

          seen[key] = true;
          emitted++;
          if (emitted >= maxEmits) break;
        }
        saveSeen(seen);
      } catch {}
      running = false;
    };

    // Disparo inicial y polling sencillo
    scan();
    timer = setInterval(scan, Math.max(60_000, intervalMs));
    return () => { if (timer) clearInterval(timer); };
  }, [db, activeWedding, intervalMs]);

  return null;
}

