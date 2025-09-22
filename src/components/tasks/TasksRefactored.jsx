import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ViewMode } from 'gantt-task-react';
import { serverTimestamp, doc, deleteDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db as clientDb, auth as clientAuth } from '../../firebaseConfig';
import { db } from '../../firebaseConfig';
import { subscribeSyncState, getSyncState, loadData } from '../../services/SyncService';
import { Cloud, CloudOff, RefreshCw, Download } from 'lucide-react';

// Importar componentes separados
import ErrorBoundary from './ErrorBoundary';
import { downloadAllICS } from './CalendarUtils';
import { localizer, categories, eventStyleGetter, Event } from './CalendarComponents';
import EventsCalendar from './EventsCalendar';
import TaskList from './TaskList';
import TasksHeader from './TasksHeader';
import TaskForm from './TaskForm';
import { awardPoints } from '../../services/GamificationService';

// Importar hooks de Firestore
import { useWedding } from '../../context/WeddingContext';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';

import { useGanttNormalizedTasks, useGanttBoundedTasks } from './hooks/useGanttTasks';


import LongTermTasksGantt from './LongTermTasksGantt';

import { useSafeEvents } from './hooks/useSafeEvents';

// FunciÃƒÂ³n helper para cargar datos de Firestore de forma segura con fallbacks

import { validateAndNormalizeDate, normalizeAnyDate, addMonths } from './utils/dateUtils';
import { useGanttSizing } from './hooks/useGanttSizing';

// Componente principal Tasks refactorizado
export default function Tasks() {
  // Estados - InicializaciÃƒÂ³n segura con manejo de errores

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

  // --- Ya no se requiere estado local ni carga inicial mediante loadData; los hooks de Firestore se encargan ---
  const dataLoadedRef = useRef(false);

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

  // Altura del contenedor del calendario (reactiva al tamaño de ventana)
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
      console.error('Error al obtener estado de sincronizaciÃƒÂ³n:', error);
      return { isOnline: navigator.onLine, isSyncing: false };
    }
  });
  
  const [columnWidthState, setColumnWidthState] = useState(65);
  const [ganttPreSteps, setGanttPreSteps] = useState(0);
  const [ganttViewDate, setGanttViewDate] = useState(null);
  const [ganttViewMode, setGanttViewMode] = useState(ViewMode.Month);
  // Rango del proyecto: inicio = fecha de registro, fin = fecha de boda
  const [projectStart, setProjectStart] = useState(null);
  const [projectEnd, setProjectEnd] = useState(null);
  // Calcular fechas de proyecto: registro (inicio) y boda (fin + 1 mes)// Crear/actualizar automaticamente la cita del Día de la boda en el calendario (solo meetings)// Ocultar completamente la lista izquierda del Gantt
  const listCellWidth = "";
  // Altura de fila del Gantt
  const rowHeight = 44;
  
  // Ref para medir el contenedor del Gantt y ajustar el ancho de columna
  const ganttContainerRef = useRef(null);

  // Manejar eventos de calendario externos// FunciÃƒÂ³n para aÃƒÂ±adir una reuniÃƒÂ³n
  const addMeeting = useCallback(async (meeting) => {
    await addMeetingFS({
      ...meeting,
      title: meeting.title || 'Nueva reuniÃƒÂ³n',
      start: new Date(meeting.start),
      end: new Date(meeting.end)
    });
  }, [addMeetingFS]);

  // GeneraciÃƒÂ³n automÃƒÂ¡tica de timeline si estÃƒÂ¡ vacÃƒÂ­o// Estado para tareas completadas (inicial vacÃƒÂ­o, se cargarÃƒÂ¡ asÃƒÂ­ncronamente)
  const [completed, setCompleted] = useState({});

  // Cargar tareas completadas de Firestore/Storage sin bloquear render// Suscribirse al estado de sincronizaciÃƒÂ³n// Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vacÃƒÂ­os al inicio)// Sugerencia automÃƒÂ¡tica de categorÃƒÂ­a
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
    } else if (texto.includes('mÃƒÂºsica') || texto.includes('music') || texto.includes('dj') || texto.includes('band')) {
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

      // 1. Sugerir categorÃƒÂ­a si se cambia el tÃƒÂ­tulo y la categorÃƒÂ­a es OTROS
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
          updated.endDate = rawValue; // Ajustar fin al mismo dÃƒÂ­a por defecto
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
  
  // AsignaciÃƒÂ³n automÃƒÂ¡tica de categorÃƒÂ­a con IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    try {
      const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
      // Primero intentamos con reglas simples
      const sugerida = sugerirCategoria(titulo, descripcion);
      if (sugerida !== 'OTROS') return sugerida;
      
      // Si las reglas simples no funcionan, usamos IA
      const palabrasClave = {
        LUGAR: ['venue', 'location', 'lugar', 'sitio', 'espacio', 'salÃƒÂ³n', 'jardÃƒÂ­n', 'terraza'],
        INVITADOS: ['guests', 'invitados', 'personas', 'asistentes', 'confirmaciones', 'lista', 'rsvp'],
        COMIDA: ['catering', 'food', 'comida', 'bebida', 'menu', 'bocadillos', 'pastel', 'torta'],
        DECORACION: ['decoraciÃƒÂ³n', 'flores', 'arreglos', 'centros de mesa', 'iluminaciÃƒÂ³n', 'ambientaciÃƒÂ³n'],
        PAPELERIA: ['invitaciones', 'papelerÃƒÂ­a', 'save the date', 'tarjetas', 'programa', 'seating plan'],
        MUSICA: ['mÃƒÂºsica', 'dj', 'banda', 'playlist', 'sonido', 'baile', 'entretenimiento'],
        FOTOGRAFO: ['fotografÃƒÂ­a', 'video', 'recuerdos', 'ÃƒÂ¡lbum', 'sesiÃƒÂ³n'],
        VESTUARIO: ['vestido', 'traje', 'accesorios', 'zapatos', 'maquillaje', 'peluquerÃƒÂ­a'],
      };
      
      // Contar coincidencias por categorÃƒÂ­a
      const scores = {};
      Object.entries(palabrasClave).forEach(([cat, palabras]) => {
        scores[cat] = palabras.filter(palabra => texto.includes(palabra)).length;
      });
      
      // Encontrar la categorÃƒÂ­a con mayor puntuaciÃƒÂ³n
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
      console.error('Error al asignar categorÃƒÂ­a:', error);
      return 'OTROS';
    }
  };

  // Guardar una tarea en la subcolecciÃƒÂ³n de la boda
  const handleSaveTask = async () => {
    try {
      // Validar formulario bÃƒÂ¡sico
      if (!formData.title.trim()) {
        alert('Por favor ingresa un tÃƒÂ­tulo');
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
        alert('Fechas no vÃƒÂ¡lidas');
        return;
      }
      
      if (endDate < startDate) {
        alert('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
      
      // Asignar categorÃƒÂ­a con IA si no se especificÃƒÂ³
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
      
      // AÃƒÂ±adir/actualizar segÃƒÂºn sea una tarea de largo plazo o una reuniÃƒÂ³n
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
          if (!savedId && clientDb && activeWedding) {
            const colRef = collection(clientDb, 'weddings', activeWedding, 'tasks');
            const docRef = await addDoc(colRef, { ...ganttTask, createdAt: serverTimestamp() });
            savedId = docRef.id;
          }
          // ÃƒÆ’Ã…Â¡ltimo recurso: generar id local si todo falla
          if (!savedId) savedId = taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/tasks
        try {
          const uid = clientAuth?.currentUser?.uid;
          if (uid && clientDb && (savedId || editingId)) {
            const mirrorId = savedId || editingId;
            await setDoc(doc(clientDb, 'users', uid, 'tasks', mirrorId), { ...ganttTask, id: mirrorId }, { merge: true });
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
          // Nueva reuniÃƒÂ³n (evento puntual del calendario)
          const saved = await addMeetingFS({ ...taskData, createdAt: serverTimestamp() });
          savedId = saved?.id || taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/meetings
        try {
          const uid = clientAuth?.currentUser?.uid;
          if (uid && clientDb) {
            const mirrorId = savedId || editingId || taskData.id;
            if (mirrorId) {
              await setDoc(doc(clientDb, 'users', uid, 'meetings', mirrorId), { ...taskData, id: mirrorId }, { merge: true });
            }
          }
        } catch (_) {}
      }
      
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
      }
      // Borrado espejo en users/{uid}/...
      try {
        const uid = clientAuth?.currentUser?.uid;
        if (uid && clientDb) {
          ops.push(deleteDoc(doc(clientDb, 'users', uid, 'tasks', editingId)));
          ops.push(deleteDoc(doc(clientDb, 'users', uid, 'meetings', editingId)));
        }
      } catch (_) {}
      ops.push(Promise.resolve(deleteTaskFS(editingId)).catch(() => {}));
      ops.push(Promise.resolve(deleteMeetingFS(editingId)).catch(() => {}));
      Promise.allSettled(ops)
        .then(() => console.log('[Tasks] EliminaciÃƒÂ³n completada', editingId))
        .catch(() => {});
    } catch (error) {
      console.error('Error eliminando tarea/proceso:', error);
      try { closeModal(); } catch (_) {}
    }
  };

  // Marcar tarea como completada
  const toggleCompleted = id => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Procesar eventos para calendario/lista: SOLO tareas puntuales (meetings)
  const allEvents = [
    ...(Array.isArray(meetingsState) ? meetingsState : [])
  ];

  // FunciÃƒÂ³n auxiliar para validar y normalizar fechas
  // Eventos y listas seguras via hooks
  const { safeEvents, sortedEvents, safeMeetings, safeMeetingsFiltered } = useSafeEvents(meetingsState);

  // Tareas Gantt normalizadas y acotadas
  const { uniqueGanttTasks } = useGanttNormalizedTasks(tasksState);
  const ganttTasksBounded = useGanttBoundedTasks(uniqueGanttTasks, projectStart, projectEnd, meetingsState);
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
  
  // Calcular columna y vista (zoom) para que quepa todo el proceso en una vista// Ajuste reactivo del ancho mediante ResizeObserver para ocupar todo el ancho de la secciÃƒÂ³n// CÃƒÂ¡lculo de progreso - asegurando que los estados sean arrays
  // Indicador de progreso eliminado

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
            });
            setShowNewTask(true);
          }}
        />
        <div className="w-full lg:w-1/3">
          <TaskList
            tasks={safeMeetingsFiltered}
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
























