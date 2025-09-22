�import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ViewMode } from 'gantt-task-react';
import { serverTimestamp, doc, deleteDoc, setDoc, collection, addDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { subscribeSyncState, getSyncState } from '../../services/SyncService';

// Importar componentes separados
import ErrorBoundary from './ErrorBoundary';
import { localizer, categories, eventStyleGetter, Event } from './CalendarComponents';
import EventsCalendar from './EventsCalendar';
import TaskList from './TaskList';
import TasksHeader from './TasksHeader';
import TaskForm from './TaskForm';
//

// Importar hooks de Firestore
import { useWedding } from '../../context/WeddingContext';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';

import { useGanttNormalizedTasks, useGanttBoundedTasks } from './hooks/useGanttTasks';


import LongTermTasksGantt from './LongTermTasksGantt';

import { useSafeEvents } from './hooks/useSafeEvents';

// FunciÒ³n helper para cargar datos de Firestore de forma segura con fallbacks

import { addMonths } from './utils/dateUtils';
import { useGanttSizing } from './hooks/useGanttSizing';

// Componente principal Tasks refactorizado
export default function Tasks() {
  // Estados - InicializaciÒ³n segura con manejo de errores

  // Contexto de boda activa
  const { activeWedding } = useWedding();

  // Hooks Firestore para tasks y meetings dentro de la boda
  const {
    data: tasksState,
    addItem: addTaskFS,
    updateItem: updateTaskFS,
    deleteItem: deleteTaskFS,
    loading: tasksLoading,
  } = useFirestoreCollection('tasks', []);

  const {
    data: meetingsState,
    addItem: addMeetingFS,
    updateItem: updateMeetingFS,
    deleteItem: deleteMeetingFS,
    loading: meetingsLoading,
  } = useFirestoreCollection('meetings', []);

  const {
    data: completedDocs,
    addItem: addCompletedFS,
    updateItem: updateCompletedFS,
    deleteItem: deleteCompletedFS,
    loading: completedLoading,
  } = useFirestoreCollection('tasksCompleted', []);

  // --- Los hooks de Firestore gestionan la carga reactiva ---

  const [showNewTask, setShowNewTask] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    category: 'OTROS',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endDate: new Date().toISOString().slice(0, 10),
    endTime: '11:00',
    long: false,
    assignee: '',
    completed: false,
  });
  
  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Etiqueta de mes para el calendario (EJ: "septiembre 2025")
  const monthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(calendarDate);
    } catch (_) {
      return '';
    }
  }, [calendarDate]);

  // Altura del contenedor del calendario (reactiva al tama�o de ventana)
  const [calendarContainerHeight, setCalendarContainerHeight] = useState(520);
  useEffect(() => {
    const compute = () => {
      const viewport = typeof window !== 'undefined' ? window.innerHeight : 800;
      // valor sensible por defecto, limitado a un rango razonable
      const h = Math.max(320, Math.min(900, Math.floor(viewport * 0.6)));
      setCalendarContainerHeight(h);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  
  const [syncStatus, setSyncStatus] = useState(() => {
    try {
      return getSyncState();
    } catch (error) {
      console.error('Error al obtener estado de sincronizaciÒ³n:', error);
      return { isOnline: navigator.onLine, isSyncing: false };
    }
  });
  
  // Suscripción a cambios del estado de sincronización (online/syncing/pending)
  useEffect(() => {
    const unsub = subscribeSyncState(setSyncStatus);
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, []);
  const [columnWidthState, setColumnWidthState] = useState(65);
  const [ganttPreSteps, setGanttPreSteps] = useState(0);
  const [ganttViewDate, setGanttViewDate] = useState(null);
  const [ganttViewMode, setGanttViewMode] = useState(ViewMode.Month);
  // Rango del proyecto: inicio = fecha de registro, fin = fecha de boda
  const [projectStart, setProjectStart] = useState(null);
  const [projectEnd, setProjectEnd] = useState(null);
  // Calcular fechas de proyecto: registro (inicio) y boda (fin + 1 mes)// Crear/actualizar automaticamente la cita del D�a de la boda en el calendario (solo meetings)// Ocultar completamente la lista izquierda del Gantt
  const listCellWidth = "";
  // Altura de fila del Gantt
  const rowHeight = 44;
  
  // Ref para medir el contenedor del Gantt y ajustar el ancho de columna
  const ganttContainerRef = useRef(null);

  // Manejar eventos de calendario externos// FunciÒ³n para aÒ±adir una reuniÒ³n
  const addMeeting = useCallback(async (meeting) => {
    await addMeetingFS({
      ...meeting,
      title: meeting.title || 'Nueva reuniÒ³n',
      start: new Date(meeting.start),
      end: new Date(meeting.end)
    });
  }, [addMeetingFS]);
  // keep for future use (avoid unused-var warnings)
  // eslint-disable-next-line no-unused-expressions
  addMeeting && null;

  // GeneraciÒ³n automÒ¡tica de timeline si estÒ¡ vacÒ­o// Estado para tareas completadas (inicial vacÒ­o, se cargarÒ¡ asÒ­ncronamente)

  // Cargar tareas completadas de Firestore/Storage sin bloquear render// Suscribirse al estado de sincronizaciÒ³n// Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vacÒ­os al inicio)// Sugerencia automÒ¡tica de categorÒ­a
  const sugerirCategoria = (titulo, descripcion) => {
    const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
    if (texto.includes('lugar') || texto.includes('venue') || texto.includes('salon') || texto.includes('espacio')) {
      return 'LUGAR';
    } else if (texto.includes('invita') || texto.includes('guest') || texto.includes('persona')) {
      return 'INVITADOS';
    } else if (texto.includes('comida') || texto.includes('catering') || texto.includes('menu') || texto.includes('bebida')) {
      return 'COMIDA';
    } else if (texto.includes('decora') || texto.includes('adorno') || texto.includes('flor')) {
      return 'DECORACION';
    } else if (texto.includes('invitacion') || texto.includes('papel') || texto.includes('tarjeta')) {
      return 'PAPELERIA';
    } else if (texto.includes('mÒºsica') || texto.includes('music') || texto.includes('dj') || texto.includes('band')) {
      return 'MUSICA';
    } else if (texto.includes('foto') || texto.includes('video') || texto.includes('grafia')) {
      return 'FOTOGRAFO';
    } else if (texto.includes('vestido') || texto.includes('traje') || texto.includes('ropa')) {
      return 'VESTUARIO';
    }
    return 'OTROS';
  };

  // Manejador de cambios en el formulario
  // Maneja los cambios del formulario y aplica reglas adicionales de negocio
  const handleChange = (e) => {
    const field = e.target.name;
    const rawValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

    setFormData((prevForm) => {
      let updated = { ...prevForm, [field]: rawValue };

      // 1. Sugerir categorÒ­a si se cambia el tÒ­tulo y la categorÒ­a es OTROS
      if (field === 'title' && (!prevForm.category || prevForm.category === 'OTROS')) {
        const sugerida = sugerirCategoria(rawValue, prevForm.desc);
        if (sugerida !== 'OTROS') {
          updated.category = sugerida;
        }
      }

      // 2. Si cambia la fecha de inicio, asegurarnos de que la fecha de fin no sea anterior
      if (field === 'startDate') {
        const start = new Date(rawValue);
        const end = new Date(prevForm.endDate);
        if (!prevForm.endDate || end < start) {
          updated.endDate = rawValue; // Ajustar fin al mismo dÒ­a por defecto
        }
      }

      // 3. Si cambia la fecha de fin y resulta ser anterior a la de inicio, corrige inicio
      if (field === 'endDate') {
        const start = new Date(prevForm.startDate);
        const end = new Date(rawValue);
        if (end < start) {
          updated.startDate = rawValue;
        }
      }

      return updated;
    });
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      title: '', desc: '', category: 'OTROS', 
      startDate: new Date().toISOString().slice(0, 10), 
      startTime: '10:00', endDate: new Date().toISOString().slice(0, 10), 
      endTime: '11:00', long: false
    });
  };

  // Cerrar modal
  const closeModal = () => {
    setShowNewTask(false);
    setEditingId(null);
    resetForm();
  };
  
  // AsignaciÒ³n automÒ¡tica de categorÒ­a con IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    try {
      const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
      // Primero intentamos con reglas simples
      const sugerida = sugerirCategoria(titulo, descripcion);
      if (sugerida !== 'OTROS') return sugerida;
      
      // Si las reglas simples no funcionan, usamos IA
      const palabrasClave = {
        LUGAR: ['venue', 'location', 'lugar', 'sitio', 'espacio', 'salÒ³n', 'jardÒ­n', 'terraza'],
        INVITADOS: ['guests', 'invitados', 'personas', 'asistentes', 'confirmaciones', 'lista', 'rsvp'],
        COMIDA: ['catering', 'food', 'comida', 'bebida', 'menu', 'bocadillos', 'pastel', 'torta'],
        DECORACION: ['decoraciÒ³n', 'flores', 'arreglos', 'centros de mesa', 'iluminaciÒ³n', 'ambientaciÒ³n'],
        PAPELERIA: ['invitaciones', 'papelerÒ­a', 'save the date', 'tarjetas', 'programa', 'seating plan'],
        MUSICA: ['mÒºsica', 'dj', 'banda', 'playlist', 'sonido', 'baile', 'entretenimiento'],
        FOTOGRAFO: ['fotografÒ­a', 'video', 'recuerdos', 'Ò¡lbum', 'sesiÒ³n'],
        VESTUARIO: ['vestido', 'traje', 'accesorios', 'zapatos', 'maquillaje', 'peluquerÒ­a'],
      };
      
      // Contar coincidencias por categorÒ­a
      const scores = {};
      Object.entries(palabrasClave).forEach(([cat, palabras]) => {
        scores[cat] = palabras.filter(palabra => texto.includes(palabra)).length;
      });
      
      // Encontrar la categorÒ­a con mayor puntuaciÒ³n
      let maxScore = 0;
      let maxCat = 'OTROS';
      Object.entries(scores).forEach(([cat, score]) => {
        if (score > maxScore) {
          maxScore = score;
          maxCat = cat;
        }
      });
      
      return maxScore > 0 ? maxCat : 'OTROS';
    } catch (error) {
      console.error('Error al asignar categorÒ­a:', error);
      return 'OTROS';
    }
  };

  // Guardar una tarea en la subcolecciÒ³n de la boda
  const handleSaveTask = async () => {
    try {
      // Validar formulario bÒ¡sico
      if (!formData.title.trim()) {
        alert('Por favor ingresa un tÒ­tulo');
        return;
      }
      
      if (!formData.startDate) {
        alert('Por favor selecciona una fecha de inicio');
        return;
      }
      
      if (!formData.endDate) {
        alert('Por favor selecciona una fecha de fin');
        return;
      }
      
      // Construir fechas completas
      const startDateStr = formData.startDate;
      const startTimeStr = formData.startTime || '00:00';
      const endDateStr = formData.endDate;
      const endTimeStr = formData.endTime || '23:59';
      
      const startDate = new Date(`${startDateStr}T${startTimeStr}`);
      const endDate = new Date(`${endDateStr}T${endTimeStr}`);
      
      // Validar fechas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Fechas no vÒ¡lidas');
        return;
      }
      
      if (endDate < startDate) {
        alert('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
      
      // Asignar categorÒ­a con IA si no se especificÒ³
      let category = formData.category;
      if (category === 'OTROS') {
        category = await asignarCategoriaConIA(formData.title, formData.desc);
      }
      
      // Crear objeto de tarea/evento
      const taskData = {
        id: editingId || `task-${Date.now()}`,
        title: formData.title,
        desc: formData.desc,
        start: startDate,
        end: endDate,
        category: category,
        ...(editingId ? {} : { createdAt: serverTimestamp() })
      };
      
      // AÒ±adir/actualizar segÒºn sea una tarea de largo plazo o una reuniÒ³n
      if (formData.long) {
        // Para el diagrama Gantt
        const ganttTask = {
          ...taskData,
          name: taskData.title,
          progress: 0,
          type: 'task',
          isDisabled: false,
          dependencies: [],
          createdAt: serverTimestamp()
        };
        
        let savedId = editingId;
        if (editingId) {
          await updateTaskFS(editingId, ganttTask);
        } else {
          // Intentar con hook
          const saved = await addTaskFS(ganttTask);
          savedId = saved?.id || null;
          // Fallback directo a Firestore si no obtuvimos id
          if (!savedId && db && activeWedding) {
            const colRef = collection(db, 'weddings', activeWedding, 'tasks');
            const docRef = await addDoc(colRef, { ...ganttTask, createdAt: serverTimestamp() });
            savedId = docRef.id;
          }
          // Ò��&¡ltimo recurso: generar id local si todo falla
          if (!savedId) savedId = taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/tasks
        try {
          const uid = auth?.currentUser?.uid;
          if (uid && db && (savedId || editingId)) {
            const mirrorId = savedId || editingId;
            await setDoc(doc(db, 'users', uid, 'tasks', mirrorId), { ...ganttTask, id: mirrorId }, { merge: true });
          }
        } catch (_) {}
      } else {
        // Para el calendario
        let savedId = editingId;
        if (editingId) {
          // Buscar primero en tareas Gantt
          if (tasksState.some(t => t.id === editingId)) {
            await updateTaskFS(editingId, taskData);
          } else {
            await updateMeetingFS(editingId, taskData);
          }
        } else {
          // Nueva reuniÒ³n (evento puntual del calendario)
          const saved = await addMeetingFS({ ...taskData, createdAt: serverTimestamp() });
          savedId = saved?.id || taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/meetings
        try {
          const uid = auth?.currentUser?.uid;
          if (uid && db) {
            const mirrorId = savedId || editingId || taskData.id;
            if (mirrorId) {
              await setDoc(doc(db, 'users', uid, 'meetings', mirrorId), { ...taskData, id: mirrorId }, { merge: true });
            }
          }
        } catch (_) {}
      }

      // Persistir estado de completado en weddings/{id}/tasksCompleted/{taskId}
      try {
        const finalId = editingId || taskData.id;
        if (activeWedding && finalId) {
          const compRef = doc(db, 'weddings', activeWedding, 'tasksCompleted', finalId);
          if (formData.completed) {
            await setDoc(compRef, { id: finalId, taskId: finalId, completedAt: serverTimestamp() }, { merge: true });
          } else {
            await deleteDoc(compRef).catch(() => {});
          }
        }
      } catch (_) {}
      
      // Cerrar modal y limpiar
      closeModal();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Hubo un error al guardar la tarea');
    }
  };

  // Eliminar una tarea
  const handleDeleteTask = () => {
    try {
      console.log('[Tasks] Eliminar clicado', { editingId, isProcess: !!formData.long });
      if (!editingId) {
        closeModal();
        return;
      }

      // Cerrar el modal de forma optimista primero
      closeModal();

      // Ejecutar las eliminaciones en background (ambas colecciones + hooks)
      const ops = [];
      if (activeWedding && db) {
        ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'tasks', editingId)));
        ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'meetings', editingId)));
        ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'tasksCompleted', editingId)).catch(() => {}));
      }
      // Borrado espejo en users/{uid}/...
      try {
        const uid = auth?.currentUser?.uid;
        if (uid && db) {
          ops.push(deleteDoc(doc(db, 'users', uid, 'tasks', editingId)));
          ops.push(deleteDoc(doc(db, 'users', uid, 'meetings', editingId)));
        }
      } catch (_) {}
      ops.push(Promise.resolve(deleteTaskFS(editingId)).catch(() => {}));
      ops.push(Promise.resolve(deleteMeetingFS(editingId)).catch(() => {}));
      Promise.allSettled(ops)
        .then(() => console.log('[Tasks] EliminaciÒ³n completada', editingId))
        .catch(() => {});
    } catch (error) {
      console.error('Error eliminando tarea/proceso:', error);
      try { closeModal(); } catch (_) {}
    }
  };

  //

  // Procesar eventos para calendario/lista: SOLO tareas puntuales (meetings)

  // FunciÒ³n auxiliar para validar y normalizar fechas
  // Eventos y listas seguras via hooks
  const { safeEvents, sortedEvents, safeMeetings, safeMeetingsFiltered } = useSafeEvents(meetingsState);

  // Tareas Gantt normalizadas y acotadas
  const { uniqueGanttTasks } = useGanttNormalizedTasks(tasksState);
  const ganttTasksBounded = useGanttBoundedTasks(uniqueGanttTasks, projectStart, projectEnd, meetingsState);

  // Conjunto de tareas completadas (por id o por taskId)
  const completedIdSet = useMemo(() => {
    const s = new Set();
    try {
      const arr = Array.isArray(completedDocs) ? completedDocs : [];
      for (const d of arr) {
        if (!d) continue;
        if (d.id) s.add(String(d.id));
        if (d.taskId) s.add(String(d.taskId));
      }
    } catch (_) {}
    return s;
  }, [completedDocs]);

  // Toggle rápido de completado (lista/fallback)
  const toggleCompleteById = useCallback(async (id, nextCompleted) => {
    try {
      if (!activeWedding || !id) return;
      const compRef = doc(db, 'weddings', activeWedding, 'tasksCompleted', String(id));
      if (nextCompleted) {
        await setDoc(compRef, { id: String(id), taskId: String(id), completedAt: serverTimestamp() }, { merge: true });
      } else {
        await deleteDoc(compRef).catch(() => {});
      }
    } catch (_) {}
  }, [activeWedding]);
  const weddingMarkerDate = useMemo(() => {
    try {
      const m = (Array.isArray(meetingsState) ? meetingsState : []).find(ev => ev?.id === 'wedding-day' || ev?.autoKey === 'wedding-day' || /boda/i.test(String(ev?.title || '')));
      if (m) {
        const any = m.start || m.date || m.when || m.end;
        if (any) {
          const d = typeof any?.toDate === 'function' ? any.toDate() : new Date(any);
          if (!isNaN(d.getTime())) return d;
        }
      }
    } catch {}
    // Fallback: si no hay meeting, usar la fecha de proyecto (boda)
    if (projectEnd && projectEnd instanceof Date && !isNaN(projectEnd.getTime())) {
      return new Date(projectEnd);
    }
    return null;
  }, [projectEnd, meetingsState]);

  // Ajuste de Gantt (hooks deben estar a nivel superior del componente)
  useGanttSizing({
    uniqueGanttTasks,
    projectStart,
    projectEnd,
    containerRef: ganttContainerRef,
    columnWidthState,
    setColumnWidthState,
    ganttPreSteps,
    setGanttPreSteps,
    ganttViewDate,
    setGanttViewDate,
    ganttViewMode,
    setGanttViewMode,
  });
  
  // Calcular columna y vista (zoom) para que quepa todo el proceso en una vista// Ajuste reactivo del ancho mediante ResizeObserver para ocupar todo el ancho de la secciÒ³n// CÒ¡lculo de progreso - asegurando que los estados sean arrays
  // Indicador de progreso eliminado

  // 1) Escuchar info de la boda para fijar projectStart/projectEnd
  useEffect(() => {
    if (!activeWedding || !db) return;
    try {
      const ref = doc(db, 'weddings', activeWedding, 'info', 'weddingInfo');
      const unsub = onSnapshot(ref, (snap) => {
        try {
          const info = snap.exists() ? (snap.data() || {}) : {};
          let raw = info?.weddingDate || info?.date || null;
          let wDate = null;
          if (raw) {
            wDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
          }
          if (wDate && !isNaN(wDate.getTime())) {
            setProjectEnd(wDate);
            setProjectStart(addMonths(wDate, -6));
          }
        } catch (_) {}
      }, () => {});
      return () => { try { unsub && unsub(); } catch (_) {} };
    } catch (_) {}
  }, [activeWedding]);

  // 2) Crear/actualizar automáticamente el evento 'wedding-day' si hay fecha
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding || !db) return;
        if (!(projectEnd instanceof Date) || isNaN(projectEnd.getTime())) return;
        const start = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate(), 12, 0, 0, 0);
        const end = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate(), 14, 0, 0, 0);
        const ref = doc(db, 'weddings', activeWedding, 'meetings', 'wedding-day');
        const snap = await getDoc(ref).catch(() => null);
        const prev = snap && snap.exists() ? snap.data() : null;
        const next = {
          id: 'wedding-day',
          autoKey: 'wedding-day',
          title: prev?.title || 'Día de la boda',
          category: prev?.category || 'OTROS',
          start,
          end,
          createdAt: prev?.createdAt || serverTimestamp(),
        };
        const same = prev && prev.start && prev.end &&
          (new Date(prev.start).getTime() === start.getTime()) &&
          (new Date(prev.end).getTime() === end.getTime());
        if (!same) await setDoc(ref, next, { merge: true });
      } catch (_) {}
    })();
  }, [activeWedding, projectEnd]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-32">
      
      <TasksHeader syncStatus={syncStatus} onNewTask={() => { resetForm(); setShowNewTask(true); }} />
      
      {/* Componente para el diagrama Gantt */}
      <LongTermTasksGantt
        containerRef={ganttContainerRef}
        tasks={ganttTasksBounded}
        columnWidth={columnWidthState}
        rowHeight={rowHeight}
        preSteps={ganttPreSteps}
        viewDate={ganttViewDate}
        markerDate={weddingMarkerDate}
        projectStart={projectStart}
        projectEnd={projectEnd}
        onTaskClick={(task) => {
          setEditingId(task.id);
          setFormData({
            title: task.title,
            desc: task.desc || '',
            category: task.category || 'OTROS',
            startDate: task.start.toISOString().slice(0, 10),
            startTime: task.start.toTimeString().slice(0, 5),
            endDate: task.end.toISOString().slice(0, 10),
            endTime: task.end.toTimeString().slice(0, 5),
            long: true,
            assignee: task.assignee || '',
            completed: completedIdSet.has(String(task.id)),
          });
          setShowNewTask(true);
        }}
      />

      {/* Contenedor responsivo para Calendario y Lista */}
      <div className="flex flex-col lg:flex-row gap-6">
        <EventsCalendar
          currentView={currentView}
          setCurrentView={setCurrentView}
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          containerHeight={calendarContainerHeight}
          monthLabel={monthLabel}
          safeEvents={safeMeetings}
          sortedEvents={sortedEvents}
          categories={categories}
          completedSet={completedIdSet}
          onToggleComplete={(id, val) => toggleCompleteById(id, val)}
          ErrorBoundaryComponent={ErrorBoundary}
          localizer={localizer}
          eventStyleGetter={eventStyleGetter}
          EventComponent={Event}
          onEventEdit={(event) => {
            const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
            const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
            setEditingId(event.id);
            setFormData({
              title: event.title,
              desc: event.desc || '',
              category: event.category || 'OTROS',
              startDate: eventStart.toISOString().slice(0, 10),
              startTime: eventStart.toTimeString().slice(0, 5),
              endDate: eventEnd.toISOString().slice(0, 10),
              endTime: eventEnd.toTimeString().slice(0, 5),
              long: false,
              assignee: event.assignee || '',
              completed: completedIdSet.has(String(event.id)),
            });
            setShowNewTask(true);
          }}
        />
        <div className="w-full lg:w-1/3">
          <TaskList
            tasks={safeMeetingsFiltered}
            completedSet={completedIdSet}
            onToggleComplete={(id, val) => toggleCompleteById(id, val)}
            onTaskClick={(event) => {
              const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
              const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
              setEditingId(event.id);
              setFormData({
                title: event.title,
                desc: event.desc || '',
                category: event.category || 'OTROS',
                startDate: eventStart.toISOString().slice(0, 10),
                startTime: eventStart.toTimeString().slice(0, 5),
                endDate: eventEnd.toISOString().slice(0, 10),
                endTime: eventEnd.toTimeString().slice(0, 5),
                long: false,
                assignee: event.assignee || '',
                completed: completedIdSet.has(String(event.id)),
              });
              setShowNewTask(true);
            }}
          />
        </div>
      </div>
{/* Modal para nueva tarea */}
      {showNewTask && (
        <TaskForm 
          formData={formData} 
          editingId={editingId} 
          handleChange={handleChange}
          handleSaveTask={handleSaveTask}
          handleDeleteTask={handleDeleteTask}
          closeModal={closeModal}
          setFormData={setFormData}
        />
      )}

      </div>
   );
}
























