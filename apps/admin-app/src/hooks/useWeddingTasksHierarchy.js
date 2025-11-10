import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';

// Utilidades internas
const toDate = (v) => {
  if (!v) return null;
  try {
    if (v instanceof Date) return isNaN(v.getTime()) ?null : v;
    if (typeof v?.toDate === 'function') {
      const d = v.toDate();
      return isNaN(d.getTime()) ?null : d;
    }
    const d = new Date(v);
    return isNaN(d.getTime()) ?null : d;
  } catch (_) {
    return null;
  }
};

/**
 * Hook que suscribe a tasks padre en weddings/{weddingId}/tasks y a sus subtareas
 * en weddings/{weddingId}/tasks/{taskId}/subtasks. Devuelve una lista unificada
 * para Gantt (padres como 'project' si tienen hijos) y estructuras crudas.
 */
export default function useWeddingTasksHierarchy(weddingId) {
  const [parents, setParents] = useState([]);
  const [childrenByParent, setChildrenByParent] = useState({});
  const childUnsubsRef = useRef(new Map());

  // Suscripci?n a tareas padre
  useEffect(() => {
    // Limpiar suscripciones previas
    for (const unsub of childUnsubsRef.current.values()) {
      try { unsub(); } catch {}
    }
    childUnsubsRef.current.clear();
    setChildrenByParent({});
    setParents([]);

    if (!weddingId) return;

    const colRef = collection(db, 'weddings', weddingId, 'tasks');
    const unsubParents = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setParents(list);

      // Ajustar listeners de subtareas segun padres
      const activeIds = new Set(list.map((p) => p.id));
      // Quitar listeners de padres eliminados
      for (const [pid, unsub] of childUnsubsRef.current.entries()) {
        if (!activeIds.has(pid)) {
          try { unsub(); } catch {}
          childUnsubsRef.current.delete(pid);
          setChildrenByParent((prev) => {
            const next = { ...prev };
            delete next[pid];
            return next;
          });
        }
      }

      // A?adir listeners para padres nuevos
      list.forEach((p) => {
        const pid = p.id;
        if (!childUnsubsRef.current.has(pid)) {
          const subCol = collection(db, 'weddings', weddingId, 'tasks', pid, 'subtasks');
          const unsubChild = onSnapshot(subCol, (subSnap) => {
            const arr = subSnap.docs.map((d) => ({ id: d.id, parentId: pid, ...d.data() }));
            setChildrenByParent((prev) => ({ ...prev, [pid]: arr }));
          }, () => {
            // En error, dejar vac?o pero mantener estructura
            setChildrenByParent((prev) => ({ ...prev, [pid]: prev[pid] || [] }));
          });
          childUnsubsRef.current.set(pid, unsubChild);
        }
      });
    });

    return () => {
      try { unsubParents(); } catch {}
      for (const unsub of childUnsubsRef.current.values()) {
        try { unsub(); } catch {}
      }
      childUnsubsRef.current.clear();
    };
  }, [weddingId]);

  // Construcci?n de lista Gantt compatible con gantt-task-react
  const ganttTasks = useMemo(() => {
    const tasks = [];
    const parentsSafe = Array.isArray(parents) ?parents : [];
    const childrenSafe = childrenByParent || {};

    parentsSafe.forEach((p) => {
      const pid = p.id;
      const kids = Array.isArray(childrenSafe[pid]) ?childrenSafe[pid] : [];
      const startCandidates = [toDate(p.start), ...kids.map((k) => toDate(k.start)).filter(Boolean)].filter(Boolean);
      const endCandidates = [toDate(p.end), ...kids.map((k) => toDate(k.end)).filter(Boolean)].filter(Boolean);

      const start = startCandidates.length ?new Date(Math.min(...startCandidates.map((d) => d.getTime()))) : toDate(p.start) || new Date();
      const end = endCandidates.length ?new Date(Math.max(...endCandidates.map((d) => d.getTime()))) : toDate(p.end) || new Date(start.getTime() + 24*60*60*1000);

      const name = p.name || p.title || 'Tarea';
      const baseParent = {
        id: pid,
        name,
        title: name,
        start,
        end,
        progress: typeof p.progress === 'number' ?p.progress : 0,
        category: p.category || 'OTROS',
        dependencies: Array.isArray(p.dependencies) ?p.dependencies : [],
      };

      if (kids.length > 0) {
        tasks.push({ ...baseParent, type: 'project', hideChildren: false });
      } else {
        tasks.push({ ...baseParent, type: 'task' });
      }

      // Hijos
      kids.forEach((k) => {
        const kstart = toDate(k.start) || start;
        const kend = toDate(k.end) || new Date(kstart.getTime() + 60*60*1000);
        const kname = k.name || k.title || 'Subtarea';
        tasks.push({
          id: k.id,
          name: kname,
          title: kname,
          start: kstart,
          end: kend,
          progress: typeof k.progress === 'number' ?k.progress : 0,
          category: k.category || p.category || 'OTROS',
          dependencies: Array.isArray(k.dependencies) ?k.dependencies : [],
          project: pid,
          type: 'task',
        });
      });
    });

    return tasks;
  }, [parents, childrenByParent]);

  return { parents, childrenByParent, ganttTasks };
}

