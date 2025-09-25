import {
  serverTimestamp,
  doc,
  deleteDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
// View mode string kept for internal sizing logic (no external lib)
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Importar componentes separados
import { localizer, categories, eventStyleGetter, Event } from './CalendarComponents.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import EventsCalendar from './EventsCalendar.jsx';
import { useGanttSizing } from './hooks/useGanttSizing.js';
import { useGanttNormalizedTasks, useGanttBoundedTasks } from './hooks/useGanttTasks.js';
import { useSafeEvents } from './hooks/useSafeEvents.js';
import LongTermTasksGantt from './LongTermTasksGantt.jsx';
import AllTasksModal from './AllTasksModal.jsx';
import TaskForm from './TaskForm.jsx';
import TaskList from './TaskList.jsx';
import TasksHeader from './TasksHeader.jsx';
import DebugTasksPanel from './DebugTasksPanel.jsx';
//

// Importar hooks de Firestore
import { addMonths, normalizeAnyDate } from './utils/dateUtils.js';
import { useWedding } from '../../context/WeddingContext';
import { db, auth } from '../../firebaseConfig';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { useWeddingCollection } from '../../hooks/useWeddingCollection';
import { useWeddingCollectionGroup } from '../../hooks/useWeddingCollectionGroup';
import { useUserCollection } from '../../hooks/useUserCollection';
import { migrateFlatSubtasksToNested, fixParentBlockDates } from '../../services/WeddingService';

// FunciÃ³n helper para cargar datos de Firestore de forma segura con fallbacks

import { subscribeSyncState, getSyncState } from '../../services/SyncService';

// Componente principal Tasks refactorizado
export default function Tasks() {
  // Estados - InicializaciÃ³n segura con manejo de errores

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
  } = useUserCollection('meetings', []);

  const {
    data: completedDocs,
    addItem: addCompletedFS,
    updateItem: updateCompletedFS,
    deleteItem: deleteCompletedFS,
    loading: completedLoading,
  } = useFirestoreCollection('tasksCompleted', []);

  // Subtareas anidadas (nuevo modelo): weddings/{id}/tasks|task/{parentId}/subtasks/*
  const { data: nestedSubtasks = [] } = useWeddingCollectionGroup('subtasks', activeWedding);

  // Fallback para estructura con colecciÃ³n singular 'task':
  // Escucha weddings/{id}/task/*/subtasks/* si el collectionGroup no devuelve nada
  

  // MigraciÃƒÆ’Ã‚Â³n suave de subtareas planas -> anidadas (una vez por boda)
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding) return;
        const flatCount = Array.isArray(tasksState)
          ? tasksState.filter((t) => String(t?.type || '') === 'subtask').length
          : 0;
        const nestedCount = Array.isArray(nestedSubtasks) ? nestedSubtasks.length : 0;
        if (flatCount > 0 && nestedCount < flatCount) {
          await migrateFlatSubtasksToNested(activeWedding);
        }
      } catch (_) {}
    })();
  }, [activeWedding, tasksState, nestedSubtasks]);

  // (movido mÃƒÆ’Ã‚Â¡s abajo tras declarar debugEnabled)

  // --- Los hooks de Firestore gestionan la carga reactiva ---

  const [showNewTask, setShowNewTask] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(() => {
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const raw = qs ? (qs.get('showAllTasks') || qs.get('allTasks') || qs.get('view') || '') : '';
      const v = String(raw).toLowerCase();
      return v === '1' || v === 'true' || v === 'yes' || v === 'all-tasks';
    } catch (_) {
      return false;
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [editingPath, setEditingPath] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    category: 'OTROS',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endDate: new Date().toISOString().slice(0, 10),
    endTime: '11:00',
    long: false,
    parentTaskId: '',
    assignee: '',
    completed: false,
    // Nuevos campos de planificaciÃ³n
    unscheduled: false, // para subtareas sin fecha
    rangeMode: 'auto', // para tareas padre: 'auto' | 'manual'
    autoAdjust: 'expand_only', // 'expand_only' | 'expand_and_shrink' | 'none'
    bufferDays: 3,
  });

  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [seedingDefaults, setSeedingDefaults] = useState(false);

  // Debug flag (localStorage, query param, or global)
  const debugEnabled = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.__GANTT_DEBUG__) return true;
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const q = qs ? qs.get('debug') || qs.get('ganttDebug') || qs.get('debugGantt') : '';
      const ls1 =
        typeof localStorage !== 'undefined' ? localStorage.getItem('lovenda_gantt_debug') : null;
      const ls2 =
        typeof localStorage !== 'undefined' ? localStorage.getItem('lovenda_debug') : null;
      return [q, ls1, ls2].some((v) => v && /^1|true$/i.test(String(v)));
    } catch {
      return false;
    }
  }, []);

  // Exponer helpers en modo debug para correcciÃƒÆ’Ã‚Â³n in-situ
  // (movido mÃƒÆ’Ã‚Â¡s abajo tras declarar projectStart/projectEnd para evitar TDZ)

  // Si no hay boda activa, mostrar aviso claro y no renderizar resto
  if (false && !activeWedding) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="page-title">Gestión de Tareas</h1>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded p-4">
          <div className="font-semibold mb-1">Selecciona o crea una boda para ver tareas</div>
          <div className="text-sm">No hay boda activa en este momento. Ve a la sección "Bodas" para seleccionar una existente o crear una nueva.</div>
        </div>
      </div>
    );
  }

  // Etiqueta de mes para el calendario (EJ: "septiembre 2025")
  const monthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
        calendarDate
      );
    } catch (_) {
      return '';
    }
  }, [calendarDate]);

  // Altura del contenedor del calendario (reactiva al tamaÃƒÂ¯Ã‚Â¿Ã‚Â½o de ventana)
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
      console.error('Error al obtener estado de sincronizaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n:', error);
      return { isOnline: navigator.onLine, isSyncing: false };
    }
  });

  // SuscripciÃƒÆ’Ã‚Â³n a cambios del estado de sincronizaciÃƒÆ’Ã‚Â³n (online/syncing/pending)
  useEffect(() => {
    const unsub = subscribeSyncState(setSyncStatus);
    return () => {
      try {
        unsub && unsub();
      } catch (_) {}
    };
  }, []);
  const [columnWidthState, setColumnWidthState] = useState(65);
  const [ganttPreSteps, setGanttPreSteps] = useState(0);
  const [ganttViewDate, setGanttViewDate] = useState(null);
  const [ganttViewMode, setGanttViewMode] = useState('month');
  // Rango del proyecto: inicio = fecha de registro, fin = fecha de boda
  const [projectStart, setProjectStart] = useState(null);
  const [projectEnd, setProjectEnd] = useState(null);
  // Calcular fechas de proyecto: registro (inicio) y boda (fin + 1 mes)// Crear/actualizar automaticamente la cita del DÃƒÂ¯Ã‚Â¿Ã‚Â½a de la boda en el calendario (solo meetings)// Ocultar completamente la lista izquierda del Gantt
  // Exponer helpers en modo debug para correcciÃ³n in-situ
  useEffect(() => {
    if (!debugEnabled) return;
    try {
      window.mywed = window.mywed || {};
      window.mywed.fixParentBlockDates = async () => {
        if (!activeWedding) return { ok: false };
        const startForBlocks =
          projectStart instanceof Date && !isNaN(projectStart)
            ? projectStart
            : projectEnd instanceof Date && !isNaN(projectEnd)
              ? addMonths(projectEnd, -12)
              : null;
        const res = await fixParentBlockDates(activeWedding, startForBlocks, projectEnd);
        console.log('[Debug] fixParentBlockDates', res);
        return res;
      };
    } catch (_) {}
  }, [debugEnabled, activeWedding, projectStart, projectEnd]);
  const listCellWidth = '';
  // Altura de fila del Gantt
  const rowHeight = 44;

  // Ref para medir el contenedor del Gantt y ajustar el ancho de columna
  const ganttContainerRef = useRef(null);

  // Manejar eventos de calendario externos// FunciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n para aÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â±adir una reuniÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n
  const addMeeting = useCallback(
    async (meeting) => {
      await addMeetingFS({
        ...meeting,
        title: meeting.title || 'Nueva reuniÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
        start: new Date(meeting.start),
        end: new Date(meeting.end),
      });
    },
    [addMeetingFS]
  );
  // keep for future use (avoid unused-var warnings)
  // eslint-disable-next-line no-unused-expressions
  addMeeting && null;

  // GeneraciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n automÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡tica de timeline si estÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡ vacÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­o// Estado para tareas completadas (inicial vacÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­o, se cargarÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡ asÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­ncronamente)

  // Cargar tareas completadas de Firestore/Storage sin bloquear render// Suscribirse al estado de sincronizaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n// Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vacÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­os al inicio)// Sugerencia automÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡tica de categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a
  const sugerirCategoria = (titulo, descripcion) => {
    const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
    if (
      texto.includes('lugar') ||
      texto.includes('venue') ||
      texto.includes('salon') ||
      texto.includes('espacio')
    ) {
      return 'LUGAR';
    } else if (texto.includes('invita') || texto.includes('guest') || texto.includes('persona')) {
      return 'INVITADOS';
    } else if (
      texto.includes('comida') ||
      texto.includes('catering') ||
      texto.includes('menu') ||
      texto.includes('bebida')
    ) {
      return 'COMIDA';
    } else if (texto.includes('decora') || texto.includes('adorno') || texto.includes('flor')) {
      return 'DECORACION';
    } else if (
      texto.includes('invitacion') ||
      texto.includes('papel') ||
      texto.includes('tarjeta')
    ) {
      return 'PAPELERIA';
    } else if (
      texto.includes('mÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Âºsica') ||
      texto.includes('music') ||
      texto.includes('dj') ||
      texto.includes('band')
    ) {
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

      // 1. Sugerir categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a si se cambia el tÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­tulo y la categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a es OTROS
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
          updated.endDate = rawValue; // Ajustar fin al mismo dÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a por defecto
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
      title: '',
      desc: '',
      category: 'OTROS',
      startDate: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endDate: new Date().toISOString().slice(0, 10),
      endTime: '11:00',
      long: false,
      parentTaskId: '',
    });
  };

  // Cerrar modal
  const closeModal = () => {
    setShowNewTask(false);
    setEditingId(null);
    setEditingPath(null);
    resetForm();
  };

  // AsignaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n automÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡tica de categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a con IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    try {
      const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
      // Primero intentamos con reglas simples
      const sugerida = sugerirCategoria(titulo, descripcion);
      if (sugerida !== 'OTROS') return sugerida;

      // Si las reglas simples no funcionan, usamos IA
      const palabrasClave = {
        LUGAR: [
          'venue',
          'location',
          'lugar',
          'sitio',
          'espacio',
          'salÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
          'jardÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­n',
          'terraza',
        ],
        INVITADOS: [
          'guests',
          'invitados',
          'personas',
          'asistentes',
          'confirmaciones',
          'lista',
          'rsvp',
        ],
        COMIDA: ['catering', 'food', 'comida', 'bebida', 'menu', 'bocadillos', 'pastel', 'torta'],
        DECORACION: [
          'decoraciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
          'flores',
          'arreglos',
          'centros de mesa',
          'iluminaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
          'ambientaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
        ],
        PAPELERIA: [
          'invitaciones',
          'papelerÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a',
          'save the date',
          'tarjetas',
          'programa',
          'seating plan',
        ],
        MUSICA: [
          'mÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Âºsica',
          'dj',
          'banda',
          'playlist',
          'sonido',
          'baile',
          'entretenimiento',
        ],
        FOTOGRAFO: [
          'fotografÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a',
          'video',
          'recuerdos',
          'ÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡lbum',
          'sesiÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n',
        ],
        VESTUARIO: [
          'vestido',
          'traje',
          'accesorios',
          'zapatos',
          'maquillaje',
          'peluquerÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a',
        ],
      };

      // Contar coincidencias por categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a
      const scores = {};
      Object.entries(palabrasClave).forEach(([cat, palabras]) => {
        scores[cat] = palabras.filter((palabra) => texto.includes(palabra)).length;
      });

      // Encontrar la categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a con mayor puntuaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n
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
      console.error('Error al asignar categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a:', error);
      return 'OTROS';
    }
  };

  // Guardar una tarea en la subcolecciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n de la boda
  const handleSaveTask = async () => {
    try {
      // Validar formulario bÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡sico
      if (!formData.title.trim()) {
        alert('Por favor ingresa un tÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­tulo');
        return;
      }

      const isSubtask = !!(formData.long && formData.parentTaskId);
      const unscheduled = Boolean(formData.unscheduled);

      if (!formData.startDate && !(isSubtask && unscheduled)) {
        alert('Por favor selecciona una fecha de inicio');
        return;
      }

      if (!formData.endDate && !(isSubtask && unscheduled)) {
        alert('Por favor selecciona una fecha de fin');
        return;
      }

      // Construir fechas completas
      const startDateStr = formData.startDate;
      const startTimeStr = formData.startTime || '00:00';
      const endDateStr = formData.endDate;
      const endTimeStr = formData.endTime || '23:59';

      const startDate = startDateStr ? new Date(`${startDateStr}T${startTimeStr}`) : null;
      const endDate = endDateStr ? new Date(`${endDateStr}T${endTimeStr}`) : null;

      // Validar fechas
      if (!(isSubtask && unscheduled) && (isNaN(startDate?.getTime?.() || NaN) || isNaN(endDate?.getTime?.() || NaN))) {
        alert('Fechas no vÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡lidas');
        return;
      }

      if (!(isSubtask && unscheduled) && endDate < startDate) {
        alert('La fecha de fin debe ser posterior a la de inicio');
        return;
      }

      // Asignar categorÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â­a con IA si no se especificÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³
      let category = formData.category;
      if (category === 'OTROS') {
        category = await asignarCategoriaConIA(formData.title, formData.desc);
      }

      // Crear objeto de tarea/evento
      const taskData = {
        id: editingId || `task-${Date.now()}`,
        title: formData.title,
        desc: formData.desc,
        ...(isSubtask && unscheduled ? {} : { start: startDate, end: endDate }),
        category: category,
        ...(editingId ? {} : { createdAt: serverTimestamp() }),
      };

      // AÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â±adir/actualizar segÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Âºn sea una tarea de largo plazo o una reuniÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n
      if (formData.long) {
        // Si no se eligiÃƒÆ’Ã‚Â³ tarea padre, asignar por defecto a "OTROS"
        try {
          if (!formData.parentTaskId) {
            const arr = Array.isArray(tasksState) ? tasksState : [];
            let others = arr.find(
              (t) =>
                String(t?.type || 'task') === 'task' &&
                (String(t?.name || '')
                  .trim()
                  .toUpperCase() === 'OTROS' ||
                  String(t?.title || '')
                    .trim()
                    .toUpperCase() === 'OTROS')
            );
            if (!others && activeWedding && db) {
              const pStart =
                projectStart instanceof Date && !isNaN(projectStart) ? projectStart : startDate;
              const pEndBase =
                projectEnd instanceof Date && !isNaN(projectEnd) ? projectEnd : endDate;
              const pEnd =
                pEndBase && pEndBase > pStart
                  ? pEndBase
                  : new Date(pStart.getTime() + 7 * 24 * 60 * 60 * 1000);
              const colRef = collection(db, 'weddings', activeWedding, 'tasks');
              const docRef = await addDoc(colRef, {
                title: 'OTROS',
                name: 'OTROS',
                type: 'task',
                start: pStart,
                end: pEnd,
                progress: 0,
                isDisabled: false,
                createdAt: serverTimestamp(),
                category: 'OTROS',
              });
              await setDoc(docRef, { id: docRef.id }, { merge: true });
              others = { id: docRef.id };
            }
            if (others?.id) {
              // Forzar que se guarde como SUBTAREA asignada a OTROS
              formData.parentTaskId = String(others.id);
            }
          }
        } catch (_) {}

        // Replicar subtareas al modelo anidado para el modal y Gantt
        try {
          if (formData.parentTaskId) {
            const subId = editingId || taskData.id;
            const nestedSubtask = {
              id: String(subId),
              title: taskData.title,
              name: taskData.title,
              desc: taskData.desc || '',
              category,
              assignee: formData.assignee || '',
              parentId: String(formData.parentTaskId),
              weddingId: activeWedding,
              mode: unscheduled ? 'unscheduled' : 'scheduled',
              ...(unscheduled ? {} : { start: startDate, end: endDate }),
              updatedAt: serverTimestamp(),
              ...(editingId ? {} : { createdAt: serverTimestamp() }),
            };
            const targetRef = doc(
              db,
              'weddings', activeWedding,
              'tasks', String(formData.parentTaskId),
              'subtasks', String(subId)
            );
            await setDoc(targetRef, nestedSubtask, { merge: true });

            // Si estamos editando y el padre cambi3, eliminar el documento antiguo
            try {
              if (editingPath) {
                const parts = String(editingPath).split('/');
                const idx = parts.indexOf('tasks');
                const oldPid = idx >= 0 && parts.length > idx + 1 ? parts[idx + 1] : null;
                if (oldPid && oldPid !== String(formData.parentTaskId)) {
                  const oldRef = doc(db, ...String(editingPath).split('/'));
                  await deleteDoc(oldRef).catch(() => {});
                }
              }
            } catch (_) {}

            // Evitar duplicados: eliminar la subtarea plana en tasks/{id} si existe
            try {
              await deleteDoc(doc(db, 'weddings', activeWedding, 'tasks', String(subId)));
            } catch (_) {}
          }
        } catch (_) {}
        // Para el diagrama Gantt
        const ganttTask = {
          ...taskData,
          name: taskData.title,
          progress: 0,
          type: formData.parentTaskId ? 'subtask' : 'task',
          parentId: formData.parentTaskId || undefined,
          isDisabled: false,
          dependencies: [],
          createdAt: serverTimestamp(),
          mode: formData.parentTaskId ? (formData.unscheduled ? 'unscheduled' : 'scheduled') : undefined,
          rangeMode: formData.rangeMode || 'auto',
          autoAdjust: formData.autoAdjust || 'expand_only',
          bufferDays: Number(formData.bufferDays ?? 0),
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
          // ÃƒÆ’Ã¢â‚¬â„¢ÃƒÂ¯Ã‚Â¿Ã‚Â½ÃƒÂ¯Ã‚Â¿Ã‚Â½&Ãƒâ€šÃ‚Â¡ltimo recurso: generar id local si todo falla
          if (!savedId) savedId = taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/tasks
        try {
          const uid = auth?.currentUser?.uid;
          if (uid && db && (savedId || editingId)) {
            const mirrorId = savedId || editingId;
            await setDoc(
              doc(db, 'users', uid, 'tasks', mirrorId),
              { ...ganttTask, id: mirrorId },
              { merge: true }
            );
          }
        } catch (_) {}
      } else {
        // Para el calendario
        let savedId = editingId;
        if (editingId) {
          // Buscar primero en tareas Gantt
          if (tasksState.some((t) => t.id === editingId)) {
            await updateTaskFS(editingId, taskData);
          } else {
            await updateMeetingFS(editingId, taskData);
          }
        } else {
          // Nueva reuniÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n (evento puntual del calendario)
          const saved = await addMeetingFS({ ...taskData, createdAt: serverTimestamp() });
          savedId = saved?.id || taskData.id;
        }
        // Espejo opcional para feeds antiguos que leen users/{uid}/meetings
        try {
          const uid = auth?.currentUser?.uid;
          if (uid && db) {
            const mirrorId = savedId || editingId || taskData.id;
            if (mirrorId) {
              await setDoc(
                doc(db, 'users', uid, 'meetings', mirrorId),
                { ...taskData, id: mirrorId },
                { merge: true }
              );
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
            await setDoc(
              compRef,
              { id: finalId, taskId: finalId, completedAt: serverTimestamp() },
              { merge: true }
            );
          } else {
            await deleteDoc(compRef).catch(() => {});
          }
        }
      } catch (_) {}

      // Ajustar rango del padre si procede (modo automÃ¡tico)
      try {
        if (formData.parentTaskId) {
          await computeAndUpdateParentRange(String(formData.parentTaskId));
        }
      } catch (_) {}

      // Cerrar modal y limpiar
      closeModal();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Hubo un error al guardar la tarea');
    }
  };

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
        // Si es una subtarea anidada, borrar usando la ruta del documento
        if (editingPath && String(editingPath).includes('/subtasks/')) {
          try {
            ops.push(deleteDoc(doc(db, ...String(editingPath).split('/'))));
          } catch (_) {
            ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'tasks', editingId)));
          }
        } else {
          ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'tasks', editingId)));
        }
        ops.push(deleteDoc(doc(db, 'weddings', activeWedding, 'meetings', editingId)));
        ops.push(
          deleteDoc(doc(db, 'weddings', activeWedding, 'tasksCompleted', editingId)).catch(() => {})
        );
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
        .then(() => console.log('[Tasks] EliminaciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n completada', editingId))
        .catch(() => {});
    } catch (error) {
      console.error('Error eliminando tarea/proceso:', error);
      try {
        closeModal();
      } catch (_) {}
    }
  };

  //

  // Procesar eventos para calendario/lista: SOLO tareas puntuales (meetings)

  // FunciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n auxiliar para validar y normalizar fechas
  // Eventos y listas seguras via hooks
  const { safeEvents, sortedEvents, safeMeetings, safeMeetingsFiltered } =
    useSafeEvents(meetingsState);

  // Tareas Gantt normalizadas y acotadas
  const { uniqueGanttTasks } = useGanttNormalizedTasks(tasksState);
  const ganttTasksBounded = useGanttBoundedTasks(
    uniqueGanttTasks,
    projectStart,
    projectEnd,
    meetingsState
  );

  // Progreso por tarea padre: % de subtareas completadas
  // (se declara tras completedIdSet para evitar dependencias circulares)
  let parentProgressMap = new Map();

  // Inyectar progreso calculado en tareas padre visibles en el Gantt
  const ganttDisplayTasks = useMemo(() => {
    try {
      const bounded = Array.isArray(ganttTasksBounded) ? ganttTasksBounded : [];
      const injected = bounded.map((t) => {
        if (!t) return t;
        const ty = String(t.type || 'task');
        if (ty !== 'task') return t;
        const pid = String(t.id || '');
        const pct = parentProgressMap.get(pid);
        if (typeof pct === 'number' && Number.isFinite(pct)) {
          return { ...t, progress: Math.max(0, Math.min(100, pct)) };
        }
        return t;
      });

      // Si tras todo lo anterior no hay ninguna tarea padre en el rango,
      // intentar un fallback directo desde tasksState (por si algÃƒÆ’Ã‚Âºn normalizador filtrÃƒÆ’Ã‚Â³ de mÃƒÆ’Ã‚Â¡s)
      const hasParent = injected.some((x) => String(x?.type || 'task') === 'task');
      if (!hasParent) {
        const raw = Array.isArray(tasksState) ? tasksState : [];
        const parents = raw
          .filter((x) => x && String(x.type || 'task') === 'task' && x.start && x.end)
          .map((x) => {
            const s = normalizeAnyDate(x.start);
            const e = normalizeAnyDate(x.end);
            if (!s || !e || e < s) return null;
            return {
              id: String(x.id || `${x.title}-${s.getTime()}-${e.getTime()}`),
              name: x.name || x.title || 'Tarea',
              title: x.title || x.name || 'Tarea',
              start: s,
              end: e,
              type: 'task',
              progress: Number(x.progress) || 0,
              isDisabled: Boolean(x.isDisabled) || false,
              category: x.category || 'OTROS',
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.start - b.start);
        return parents;
      }
      return injected;
    } catch {
      return Array.isArray(ganttTasksBounded) ? ganttTasksBounded : [];
    }
  }, [ganttTasksBounded, parentProgressMap, tasksState]);

  // Subtareas (lista): combinar modelo nuevo (nested) y legacy (flat con type='subtask')
  const subtaskEvents = useMemo(() => {
    try {
      // a) Subtareas planas visibles (con fechas válidas)
      const flat = (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [])
        .filter((t) => String(t.type || 'task') === 'subtask')
        .map((t) => ({
          id: String(t.id),
          title: t.name || t.title || 'Subtarea',
          desc: t.desc || '',
          category: t.category || 'OTROS',
          start: t.start instanceof Date ? t.start : new Date(t.start),
          end: t.end instanceof Date ? t.end : new Date(t.end),
          assignee: t.assignee || '',
          parentId: t.parentId || '',
          __kind: 'subtask',
        }));

      // b) Subtareas anidadas (modelo nuevo)
      const nestedSource = Array.isArray(nestedSubtasks) ? nestedSubtasks : [];
      const nested = nestedSource.map((s) => {
        const mode = String(s?.mode || '').toLowerCase() || (s?.start ? 'scheduled' : 'unscheduled');
        const start = mode === 'unscheduled'
          ? null
          : (s.start instanceof Date
              ? s.start
              : s.start && typeof s.start.toDate === 'function'
                ? s.start.toDate()
                : (s.start ? new Date(s.start) : null));
        const end = mode === 'unscheduled'
          ? null
          : (s.end instanceof Date
              ? s.end
              : s.end && typeof s.end.toDate === 'function'
                ? s.end.toDate()
                : (s.end ? new Date(s.end) : (start || null)));
        // Derivar parentId desde el path si no viene
        const parentFromPath = (() => {
          try {
            const parts = String(s.__path || '').split('/');
            let idx = parts.indexOf('tasks');
            if (idx < 0) idx = parts.indexOf('task');
            if (idx >= 0 && parts.length > idx + 1) return String(parts[idx + 1]);
          } catch {}
          return '';
        })();
        return {
          id: String(s.id),
          title: s.name || s.title || 'Subtarea',
          desc: s.desc || '',
          category: s.category || 'OTROS',
          start,
          end,
          assignee: s.assignee || '',
          parentId: s.parentId || s.parentTaskId || s.parent || parentFromPath || '',
          __kind: 'subtask',
          __path: s.__path || undefined,
        };
      });

      // c) Fallback: si no hay nested, incluir todas las planas (aunque no tengan fecha)
      let flatAll = [];
      if (nested.length === 0) {
        const src = Array.isArray(tasksState) ? tasksState : [];
        flatAll = src
          .filter((t) => String(t?.type || '') === 'subtask')
          .map((t) => {
            const s = t?.start?.toDate ? t.start.toDate() : (t?.start ? new Date(t.start) : null);
            const e = t?.end?.toDate ? t.end.toDate() : (t?.end ? new Date(t.end) : (s || null));
            return {
              id: String(t.id),
              title: t.name || t.title || 'Subtarea',
              desc: t.desc || '',
              category: t.category || 'OTROS',
              start: s || null,
              end: e || null,
              assignee: t.assignee || '',
              parentId: t.parentId || '',
              __kind: 'subtask',
            };
          });
      }

      // Unir por clave única evitando colisiones de id entre distintos padres
      const byKey = new Map();
      for (const it of flat) {
        const k = `flat:${it.parentId || ''}:${it.id}`;
        if (!byKey.has(k)) byKey.set(k, it);
      }
      for (const it of nested) {
        const k = String(it.__path || `nested:${it.parentId || ''}:${it.id}`);
        byKey.set(k, it);
      }
      for (const it of flatAll) {
        const k = `flatAll:${it.parentId || ''}:${it.id}`;
        if (!byKey.has(k)) byKey.set(k, it);
      }
      return Array.from(byKey.values());
    } catch {
      return [];
    }
  }, [uniqueGanttTasks, nestedSubtasks, tasksState]);

  // (se declara mÃ¡s abajo tras parentNameMap)

  const taskListItems = useMemo(() => {
    const a = Array.isArray(safeMeetingsFiltered) ? safeMeetingsFiltered : [];
    const b = Array.isArray(subtaskEvents) ? subtaskEvents : [];
    return [...a, ...b];
  }, [safeMeetingsFiltered, subtaskEvents]);

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
  const parentTaskOptions = useMemo(() => {
    try {
      return (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [])
        .filter((t) => String(t.type || 'task') === 'task' && !t.isDisabled)
        .map((t) => ({ id: String(t.id), name: t.name || t.title || 'Tarea' }));
    } catch {
      return [];
    }
  }, [uniqueGanttTasks]);

  // Recalcular y actualizar el rango del padre basado en sus subtareas programadas
  const computeAndUpdateParentRange = useCallback(async (parentId) => {
    try {
      if (!parentId) return;
      const MS_DAY = 24 * 60 * 60 * 1000;
      const kids = (Array.isArray(subtaskEvents) ? subtaskEvents : [])
        .filter((st) => String(st.parentId || '') === String(parentId) && (st.start instanceof Date));
      if (!kids.length) {
        let parent = {};
        try {
          if (activeWedding && db) {
            const pref = doc(db, 'weddings', activeWedding, 'tasks', String(parentId));
            const psnap = await getDoc(pref).catch(() => null);
            if (!psnap || !psnap.exists()) throw new Error('no-parent');
            parent = psnap.data() || {};
          }
        } catch (_) {
          // Fallback: buscar en tasksState
          try {
            const p = (Array.isArray(tasksState) ? tasksState : []).find((t) => String(t?.id||'')===String(parentId));
            parent = p || {};
          } catch {}
        }
        const update = { computedStart: null, computedEnd: null };
        if (String(parent?.rangeMode || 'auto') === 'auto' && String(parent?.autoAdjust || 'expand_only') === 'expand_and_shrink') {
          update.start = parent.manualStart || parent.start || null;
          update.end = parent.manualEnd || parent.end || null;
        }
        try { if (activeWedding && db) { const pref = doc(db, 'weddings', activeWedding, 'tasks', String(parentId)); await updateDoc(pref, update).catch(() => {}); } } catch {}
        try { await updateTaskFS(String(parentId), update); } catch {}
        return;
      }
      const starts = kids.map((k) => k.start);
      const ends = kids.map((k) => (k.end instanceof Date ? k.end : k.start));
      const envStart = new Date(Math.min.apply(null, starts.map((d) => d.getTime())));
      const envEnd = new Date(Math.max.apply(null, ends.map((d) => d.getTime())));
      let parent = {};
      try {
        if (activeWedding && db) {
          const pref = doc(db, 'weddings', activeWedding, 'tasks', String(parentId));
          const psnap = await getDoc(pref).catch(() => null);
          if (!psnap || !psnap.exists()) throw new Error('no-parent');
          parent = psnap.data() || {};
        }
      } catch (_) {
        try {
          const p = (Array.isArray(tasksState) ? tasksState : []).find((t) => String(t?.id||'')===String(parentId));
          parent = p || {};
        } catch {}
      }
      const bufferDays = Number(parent?.bufferDays ?? 0);
      const computedStart = new Date(envStart.getTime() - Math.max(0, bufferDays) * MS_DAY);
      const computedEnd = new Date(envEnd.getTime() + Math.max(0, bufferDays) * MS_DAY);
      const rangeMode = String(parent?.rangeMode || 'auto');
      const autoAdjust = String(parent?.autoAdjust || 'expand_only');
      const update = { computedStart, computedEnd };
      if (rangeMode === 'auto') {
        const prevStart = parent?.start?.toDate ? parent.start.toDate() : (parent?.start ? new Date(parent.start) : null);
        const prevEnd = parent?.end?.toDate ? parent.end.toDate() : (parent?.end ? new Date(parent.end) : null);
        if (autoAdjust === 'expand_and_shrink') {
          update.start = computedStart;
          update.end = computedEnd;
        } else if (autoAdjust === 'expand_only') {
          update.start = (prevStart && prevStart <= computedStart) ? prevStart : computedStart;
          update.end = (prevEnd && prevEnd >= computedEnd) ? prevEnd : computedEnd;
        }
      }
      try { if (activeWedding && db) { const pref = doc(db, 'weddings', activeWedding, 'tasks', String(parentId)); await updateDoc(pref, update).catch(() => {}); } } catch {}
      try { await updateTaskFS(String(parentId), update); } catch {}
    } catch (_) {}
  }, [activeWedding, db, subtaskEvents, tasksState, updateTaskFS]);

  // Padres para el modal: combinar padres reales y los derivados de subtareas
  const modalParents = useMemo(() => {
    try {
      const parentsReal = (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [])
        .filter((t) => String(t.type || 'task') === 'task' && !t.isDisabled)
        .map((t) => ({ id: String(t.id), name: t.name || t.title || 'Tarea', start: t.start instanceof Date ? t.start : new Date(t.start), type: 'task' }));

      const byId = new Map();
      parentsReal.forEach((p) => byId.set(p.id, p));
      const nameById = new Map();
      try {
        const arr = Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
        for (const t of arr) {
          if (String(t?.type || 'task') !== 'task') continue;
          const id = String(t.id || '');
          if (!id) continue;
          nameById.set(id, t.name || t.title || 'Tarea');
        }
      } catch {}

      const subs = Array.isArray(subtaskEvents) ? subtaskEvents : [];
      const grouped = new Map();
      for (const st of subs) {
        const pid = String(st.parentId || '');
        if (!pid) continue;
        const cur = grouped.get(pid) || { id: pid, name: (nameById.get(pid) || 'Tarea'), start: st.start instanceof Date ? st.start : new Date(st.start), type: 'task' };
        const stStart = st.start instanceof Date ? st.start : new Date(st.start);
        if (!cur.start || (stStart && stStart < cur.start)) cur.start = stStart;
        grouped.set(pid, cur);
      }
      for (const [pid, p] of grouped.entries()) {
        if (!byId.has(pid)) byId.set(pid, p);
      }
      return Array.from(byId.values()).sort((a, b) => (a.start?.getTime?.() || 0) - (b.start?.getTime?.() || 0));
    } catch {
      return [];
    }
  }, [uniqueGanttTasks, subtaskEvents]);

  

  

  // Mapa id->nombre para contextualizar subtareas en la lista lateral
  const parentNameMap = useMemo(() => {
    try {
      const out = {};
      const arr = Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
      for (const t of arr) {
        if (String(t?.type || 'task') !== 'task') continue;
        const id = String(t.id || '');
        if (!id) continue;
        out[id] = t.name || t.title || 'Tarea';
      }
      return out;
    } catch {
      return {};
    }
  }, [uniqueGanttTasks]);

  parentProgressMap = useMemo(() => {
    try {
      const parents = new Map(); // id -> {done,total}
      const source = Array.isArray(subtaskEvents) ? subtaskEvents : [];
      for (const st of source) {
        if (!st) continue;
        const pid = String(st.parentId || '');
        if (!pid) continue;
        const entry = parents.get(pid) || { done: 0, total: 0 };
        entry.total += 1;
        if (completedIdSet.has(String(st.id))) entry.done += 1;
        parents.set(pid, entry);
      }
      const out = new Map();
      for (const [pid, agg] of parents.entries()) {
        const pct = agg.total > 0 ? Math.round((agg.done / agg.total) * 100) : 0;
        out.set(pid, pct);
      }
      return out;
    } catch {
      return new Map();
    }
  }, [subtaskEvents, completedIdSet]);

  // AcciÃƒÆ’Ã‚Â³n manual para crear tareas por defecto
  const handleSeedDefaultTasks = useCallback(async () => {
    try {
      if (!activeWedding || !db) return;
      setSeedingDefaults(true);
      const seedRef = doc(db, 'weddings', activeWedding, 'tasks', '_seed_meta');
      const seedSnap = await getDoc(seedRef).catch(() => null);
      if (seedSnap && seedSnap.exists()) {
        setSeedingDefaults(false);
        return;
      }
      const endBase =
        projectEnd instanceof Date && !isNaN(projectEnd.getTime()) ? projectEnd : new Date();
      const startBase =
        projectEnd instanceof Date && !isNaN(projectEnd.getTime())
          ? addMonths(projectEnd, -12)
          : addMonths(endBase, -12);
      const span = Math.max(1, endBase.getTime() - startBase.getTime());
      const at = (p) => new Date(startBase.getTime() + span * p);

      const blocks = [
        {
          key: 'A',
          name: 'Bloque A - Fundamentos',
          p0: 0.0,
          p1: 0.2,
          items: [
            'Difundir la noticia y organizar la planificaciÃƒÆ’Ã‚Â³n (perfil, invitar pareja, anillo, presupuesto inicial)',
            'Crear primera versiÃƒÆ’Ã‚Â³n de la lista de invitados',
            'Investigar lugares de celebraciÃƒÆ’Ã‚Â³n y comenzar visitas',
            'Decidir cortejo nupcial',
          ],
        },
        {
          key: 'B',
          name: 'Bloque B - Proveedores Clave',
          p0: 0.1,
          p1: 0.8,
          items: [
            'FotografÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ contacto inicial pronto, cierre de contrato a mitad del proceso',
            'VideografÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ decisiÃƒÆ’Ã‚Â³n temprana, reuniones finales hacia el final',
            'Catering ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ investigaciÃƒÆ’Ã‚Â³n inicial, prueba de menÃƒÆ’Ã‚Âº, cierre cercano a la boda',
            'Florista ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ inspiraciÃƒÆ’Ã‚Â³n y primeras ideas, confirmaciÃƒÆ’Ã‚Â³n en la fase final',
            'MÃƒÆ’Ã‚Âºsica ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ banda/DJ reservados pronto, reuniÃƒÆ’Ã‚Â³n final mÃƒÆ’Ã‚Â¡s tarde',
            'ReposterÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ bÃƒÆ’Ã‚Âºsqueda inicial, prueba de sabores meses despuÃƒÆ’Ã‚Â©s, pedido final cerca de la boda',
          ],
        },
        {
          key: 'C',
          name: 'Bloque C - Vestuario y Moda',
          p0: 0.15,
          p1: 0.9,
          items: [
            'Novia ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ visitas iniciales, decisiÃƒÆ’Ã‚Â³n intermedia, pruebas finales en los ÃƒÆ’Ã‚Âºltimos meses',
            'Novio ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ compra traje en mitad del proceso, ajustes finales poco antes',
            'Cortejo ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ definir vestidos/trajes, confirmar tallas y ajustes finales mÃƒÆ’Ã‚Â¡s tarde',
          ],
        },
        {
          key: 'D',
          name: 'Bloque D - Estilo y Detalles',
          p0: 0.2,
          p1: 0.95,
          items: [
            'Invitaciones digitales y save-the-dates (inicio medio)',
            'Invitaciones fÃƒÆ’Ã‚Â­sicas y papelerÃƒÆ’Ã‚Â­a (fase intermedia)',
            'DecoraciÃƒÆ’Ã‚Â³n y DIY (se puede trabajar meses antes y ultimar al final)',
            'Recuerdos y regalos (elecciÃƒÆ’Ã‚Â³n temprana, cierre antes del evento)',
          ],
        },
        {
          key: 'E',
          name: 'Bloque E - OrganizaciÃƒÆ’Ã‚Â³n y LogÃƒÆ’Ã‚Â­stica',
          p0: 0.3,
          p1: 1.0,
          items: [
            'Transporte (se puede definir pronto, confirmar al final)',
            'Extras y bÃƒÆ’Ã‚Â¡sicos del dÃƒÆ’Ã‚Â­a (ir acumulando, revisiÃƒÆ’Ã‚Â³n final cercana a la boda)',
            'Confirmaciones con proveedores (ÃƒÆ’Ã‚Âºltimas semanas)',
            'Plan B clima (al final)',
            'Ensayo general (ÃƒÆ’Ã‚Âºltima fase)',
          ],
        },
        {
          key: 'F',
          name: 'Bloque F - Celebraciones y Emociones',
          p0: 0.4,
          p1: 0.95,
          items: [
            'Eventos adicionales (preboda, brunchÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦)',
            'Despedidas (planificaciÃƒÆ’Ã‚Â³n antes, celebraciÃƒÆ’Ã‚Â³n final)',
            'Votos y discursos (escribir con calma, repasar justo antes)',
          ],
        },
        {
          key: 'G',
          name: 'Bloque G - Belleza y Cuidado',
          p0: 0.6,
          p1: 0.95,
          items: [
            'Reservas peluquerÃƒÆ’Ã‚Â­a/maquillaje con antelaciÃƒÆ’Ã‚Â³n',
            'Pruebas intermedias',
            'Rutinas de cuidado personal (ÃƒÆ’Ã‚Âºltimos meses)',
          ],
        },
        {
          key: 'H',
          name: 'Bloque H - Anillos y Luna de Miel',
          p0: 0.7,
          p1: 1.0,
          items: [
            'Comprar anillos (se puede hacer pronto, recoger justo antes)',
            'Planificar luna de miel (elecciÃƒÆ’Ã‚Â³n pronto, reservas intermedias, maletas al final)',
          ],
        },
        {
          key: 'I',
          name: 'Bloque I - DespuÃƒÆ’Ã‚Â©s de la Boda',
          p0: 1.0,
          p1: 1.05,
          items: ['Disfrutar inicio del matrimonio', 'Organizar ÃƒÆ’Ã‚Â¡lbum y recuerdos'],
        },
      ];

      const colRef = collection(db, 'weddings', activeWedding, 'tasks');
      for (const b of blocks) {
        const parent = {
          title: b.name,
          name: b.name,
          type: 'task',
          start: at(b.p0),
          end: at(b.p1),
          progress: 0,
          isDisabled: false,
          createdAt: serverTimestamp(),
          category: 'OTROS',
        };
        const pDoc = await addDoc(colRef, parent);
        await setDoc(pDoc, { id: pDoc.id }, { merge: true });
        for (const item of b.items) {
          const s = at(b.p0 + Math.random() * (b.p1 - b.p0) * 0.6);
          const e = at(Math.min(b.p1, b.p0 + 0.4 + Math.random() * (b.p1 - b.p0) * 0.5));
          const sub = {
            title: item,
            name: item,
            parentId: pDoc.id,
            weddingId: activeWedding,
            start: s,
            end: e.getTime() < s.getTime() ? new Date(s.getTime() + 3 * 24 * 60 * 60 * 1000) : e,
            progress: 0,
            isDisabled: false,
            createdAt: serverTimestamp(),
            category: 'OTROS',
          };
          const subCol = collection(db, 'weddings', activeWedding, 'tasks', pDoc.id, 'subtasks');
          const sDoc = await addDoc(subCol, sub);
          await setDoc(sDoc, { id: sDoc.id }, { merge: true });
        }
      }

      await setDoc(seedRef, { seededAt: serverTimestamp(), version: 1 }, { merge: true });
    } catch (_) {
    } finally {
      setSeedingDefaults(false);
    }
  }, [activeWedding, db, projectStart, projectEnd]);

  // Seed automÃƒÆ’Ã‚Â¡tico de Bloques A-I (padres + subtareas) si no hay tareas
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding || !db) return;
        const hasAny = Array.isArray(tasksState) && tasksState.length > 0;
        if (hasAny) return;

        // Evitar doble seed con flag en weddings/{id}/tasks/_seed_meta (evita depender de 'config')
        const seedRef = doc(db, 'weddings', activeWedding, 'tasks', '_seed_meta');
        const seedSnap = await getDoc(seedRef).catch(() => null);
        if (seedSnap && seedSnap.exists()) return;

        // Permitir seed aunque aÃƒÆ’Ã‚Âºn no haya weddingDate: usar fallbacks razonables
        // Base de fechas para bloques: si hay fecha de boda, usar 12 meses antes como inicio
        const endBase =
          projectEnd instanceof Date && !isNaN(projectEnd.getTime()) ? projectEnd : new Date();
        const startBase =
          projectEnd instanceof Date && !isNaN(projectEnd.getTime())
            ? addMonths(projectEnd, -12)
            : addMonths(endBase, -12);
        const span = Math.max(1, endBase.getTime() - startBase.getTime());
        const at = (p) => new Date(startBase.getTime() + span * p);

        const blocks = [
          {
            key: 'A',
            name: 'Fundamentos',
            p0: 0.0,
            p1: 0.2,
            items: [
              'Difundir la noticia y organizar la planificaciÃƒÆ’Ã‚Â³n (perfil, invitar pareja, anillo, presupuesto inicial)',
              'Crear primera versiÃƒÆ’Ã‚Â³n de la lista de invitados',
              'Investigar lugares de celebraciÃƒÆ’Ã‚Â³n y comenzar visitas',
              'Decidir cortejo nupcial',
            ],
          },
          {
            key: 'B',
            name: 'Proveedores Clave',
            p0: 0.1,
            p1: 0.8,
            items: [
              'FotografÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ contacto inicial pronto, cierre de contrato a mitad del proceso',
              'VideografÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ decisiÃƒÆ’Ã‚Â³n temprana, reuniones finales hacia el final',
              'Catering ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ investigaciÃƒÆ’Ã‚Â³n inicial, prueba de menÃƒÆ’Ã‚Âº, cierre cercano a la boda',
              'Florista ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ inspiraciÃƒÆ’Ã‚Â³n y primeras ideas, confirmaciÃƒÆ’Ã‚Â³n en la fase final',
              'MÃƒÆ’Ã‚Âºsica ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ banda/DJ reservados pronto, reuniÃƒÆ’Ã‚Â³n final mÃƒÆ’Ã‚Â¡s tarde',
              'ReposterÃƒÆ’Ã‚Â­a ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ bÃƒÆ’Ã‚Âºsqueda inicial, prueba de sabores meses despuÃƒÆ’Ã‚Â©s, pedido final cerca de la boda',
            ],
          },
          {
            key: 'C',
            name: 'Vestuario y Moda',
            p0: 0.15,
            p1: 0.9,
            items: [
              'Novia ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ visitas iniciales, decisiÃƒÆ’Ã‚Â³n intermedia, pruebas finales en los ÃƒÆ’Ã‚Âºltimos meses',
              'Novio ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ compra traje en mitad del proceso, ajustes finales poco antes',
              'Cortejo ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ definir vestidos/trajes, confirmar tallas y ajustes finales mÃƒÆ’Ã‚Â¡s tarde',
            ],
          },
          {
            key: 'D',
            name: 'Estilo y Detalles',
            p0: 0.2,
            p1: 0.95,
            items: [
              'Invitaciones digitales y save-the-dates (inicio medio)',
              'Invitaciones fÃƒÆ’Ã‚Â­sicas y papelerÃƒÆ’Ã‚Â­a (fase intermedia)',
              'DecoraciÃƒÆ’Ã‚Â³n y DIY (se puede trabajar meses antes y ultimar al final)',
              'Recuerdos y regalos (elecciÃƒÆ’Ã‚Â³n temprana, cierre antes del evento)',
            ],
          },
          {
            key: 'E',
            name: 'OrganizaciÃƒÆ’Ã‚Â³n y LogÃƒÆ’Ã‚Â­stica',
            p0: 0.3,
            p1: 1.0,
            items: [
              'Transporte (se puede definir pronto, confirmar al final)',
              'Extras y bÃƒÆ’Ã‚Â¡sicos del dÃƒÆ’Ã‚Â­a (ir acumulando, revisiÃƒÆ’Ã‚Â³n final cercana a la boda)',
              'Confirmaciones con proveedores (ÃƒÆ’Ã‚Âºltimas semanas)',
              'Plan B clima (al final)',
              'Ensayo general (ÃƒÆ’Ã‚Âºltima fase)',
            ],
          },
          {
            key: 'F',
            name: 'Celebraciones y Emociones',
            p0: 0.4,
            p1: 0.95,
            items: [
              'Eventos adicionales (preboda, brunchÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦)',
              'Despedidas (planificaciÃƒÆ’Ã‚Â³n antes, celebraciÃƒÆ’Ã‚Â³n final)',
              'Votos y discursos (escribir con calma, repasar justo antes)',
            ],
          },
          {
            key: 'G',
            name: 'Belleza y Cuidado',
            p0: 0.6,
            p1: 0.95,
            items: [
              'Reservas peluquerÃƒÆ’Ã‚Â­a/maquillaje con antelaciÃƒÆ’Ã‚Â³n',
              'Pruebas intermedias',
              'Rutinas de cuidado personal (ÃƒÆ’Ã‚Âºltimos meses)',
            ],
          },
          {
            key: 'H',
            name: 'Anillos y Luna de Miel',
            p0: 0.7,
            p1: 1.0,
            items: [
              'Comprar anillos (se puede hacer pronto, recoger justo antes)',
              'Planificar luna de miel (elecciÃƒÆ’Ã‚Â³n pronto, reservas intermedias, maletas al final)',
            ],
          },
          {
            key: 'I',
            name: 'DespuÃƒÆ’Ã‚Â©s de la Boda',
            p0: 1.0,
            p1: 1.05,
            items: ['Disfrutar inicio del matrimonio', 'Organizar ÃƒÆ’Ã‚Â¡lbum y recuerdos'],
          },
        ];

        const colRef = collection(db, 'weddings', activeWedding, 'tasks');
        for (const b of blocks) {
          const parent = {
            title: b.name,
            name: b.name,
            type: 'task',
            start: at(b.p0),
            end: at(b.p1),
            progress: 0,
            isDisabled: false,
            createdAt: serverTimestamp(),
            category: 'OTROS',
          };
          const pDoc = await addDoc(colRef, parent);
          await setDoc(pDoc, { id: pDoc.id }, { merge: true });
          for (const item of b.items) {
            const s = at(b.p0 + Math.random() * (b.p1 - b.p0) * 0.6);
            const e = at(Math.min(b.p1, b.p0 + 0.4 + Math.random() * (b.p1 - b.p0) * 0.5));
            const sub = {
              title: item,
              name: item,
              parentId: pDoc.id,
              weddingId: activeWedding,
              start: s,
              end: e.getTime() < s.getTime() ? new Date(s.getTime() + 3 * 24 * 60 * 60 * 1000) : e,
              progress: 0,
              isDisabled: false,
              createdAt: serverTimestamp(),
              category: 'OTROS',
            };
            const subCol = collection(db, 'weddings', activeWedding, 'tasks', pDoc.id, 'subtasks');
            const sDoc = await addDoc(subCol, sub);
            await setDoc(sDoc, { id: sDoc.id }, { merge: true });
          }
        }

        await setDoc(seedRef, { seededAt: serverTimestamp(), version: 1 }, { merge: true });
      } catch (e) {
        console.warn('[Tasks] Seed de bloques no completado:', e);
      }
    })();
  }, [activeWedding, db, projectStart, projectEnd, tasksState, tasksLoading]);
  // Toggle rÃƒÆ’Ã‚Â¡pido de completado (lista/fallback)
  const toggleCompleteById = useCallback(
    async (id, nextCompleted) => {
      try {
        if (!activeWedding || !id) return;
        const compRef = doc(db, 'weddings', activeWedding, 'tasksCompleted', String(id));
        if (nextCompleted) {
          await setDoc(
            compRef,
            { id: String(id), taskId: String(id), completedAt: serverTimestamp() },
            { merge: true }
          );
        } else {
          await deleteDoc(compRef).catch(() => {});
        }
      } catch (_) {}
    },
    [activeWedding]
  );
  const weddingMarkerDate = useMemo(() => {
    return projectEnd instanceof Date && !isNaN(projectEnd.getTime()) ? new Date(projectEnd) : null;
  }, [projectEnd]);

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

  // Calcular columna y vista (zoom) para que quepa todo el proceso en una vista// Ajuste reactivo del ancho mediante ResizeObserver para ocupar todo el ancho de la secciÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â³n// CÃƒÆ’Ã¢â‚¬â„¢Ãƒâ€šÃ‚Â¡lculo de progreso - asegurando que los estados sean arrays
  // Indicador de progreso eliminado

  // 1) Escuchar info de la boda para fijar projectEnd (weddings/{id}/weddingInfo.weddingDate)
  useEffect(() => {
    // Deshabilitado: sÃƒÆ’Ã‚Â³lo usar weddings/{id}.weddingDate como fuente
    return;
    if (!activeWedding || !db) return;
    try {
      const refPrimary = doc(db, 'weddings', activeWedding, 'weddingInfo');
      const refLegacy = doc(db, 'weddings', activeWedding, 'info', 'weddingInfo');
      // VariaciÃƒÆ’Ã‚Â³n en minÃƒÆ’Ã‚Âºsculas que algunos entornos crean: weddings/{id}/weddinginfo
      const refLower = doc(db, 'weddings', activeWedding, 'weddinginfo');
      const handler = (snap) => {
        try {
          if (!snap || !snap.exists()) return;
          const info = snap.data() || {};
          const raw =
            info?.weddingDate ||
            info?.weddingdate ||
            info?.date ||
            info?.eventDate ||
            info?.eventdate ||
            null;
          const d =
            raw && typeof raw?.toDate === 'function' ? raw.toDate() : raw ? new Date(raw) : null;
          if (d && !isNaN(d.getTime())) setProjectEnd(d);
        } catch (_) {}
      };
      const unsub1 = onSnapshot(refPrimary, handler, () => {});
      const unsub2 = onSnapshot(refLegacy, handler, () => {});
      const unsub3 = onSnapshot(refLower, handler, () => {});
      return () => {
        try {
          unsub1 && unsub1();
        } catch (_) {}
        try {
          unsub2 && unsub2();
        } catch (_) {}
        try {
          unsub3 && unsub3();
        } catch (_) {}
      };
    } catch (_) {}
  }, [activeWedding, db]);

  // 1a-bis) Leer weddingDate desde weddings/{id}/info/weddingInfo (ruta comÃƒÆ’Ã‚Âºn)
  useEffect(() => {
    if (!activeWedding || !db) return;
    try {
      const ref = doc(db, 'weddings', activeWedding, 'info', 'weddingInfo');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          try {
            if (!snap || !snap.exists()) return;
            const info = snap.data() || {};
            const raw =
              (info?.weddingInfo &&
                (info.weddingInfo.weddingDate || info.weddingInfo.weddingdate)) ||
              info?.weddingDate ||
              info?.weddingdate ||
              info?.date ||
              null;
            let d = null;
            if (raw && typeof raw?.toDate === 'function') d = raw.toDate();
            else if (raw && typeof raw === 'object' && typeof raw.seconds === 'number')
              d = new Date(raw.seconds * 1000);
            else if (typeof raw === 'number') d = new Date(raw < 1e12 ? raw * 1000 : raw);
            else if (typeof raw === 'string') {
              const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (ymd) {
                const y = parseInt(ymd[1], 10);
                const mo = parseInt(ymd[2], 10) - 1;
                const da = parseInt(ymd[3], 10);
                const local = new Date(y, mo, da, 0, 0, 0, 0);
                if (!isNaN(local.getTime())) d = local;
                else {
                  const iso = new Date(raw);
                  if (!isNaN(iso.getTime())) d = iso;
                }
              } else {
                const iso = new Date(raw);
                if (!isNaN(iso.getTime())) d = iso;
              }
            }
            if (d && !isNaN(d.getTime())) {
              try {
                console.log('[Tasks] projectEnd from root', d);
              } catch (_) {}
              setProjectEnd(d);
            }
          } catch (_) {}
        },
        () => {}
      );
      return () => {
        try {
          unsub && unsub();
        } catch (_) {}
      };
    } catch (_) {}
  }, [activeWedding, db]);

  // 1a) Fallback adicional: leer weddingDate del documento raÃƒÆ’Ã‚Â­z weddings/{id}
  useEffect(() => {
    if (!activeWedding || !db) return;
    try {
      const ref = doc(db, 'weddings', activeWedding);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          try {
            if (!snap || !snap.exists()) return;
            const info = snap.data() || {};
            const raw =
              (info?.weddingInfo &&
                (info.weddingInfo.weddingDate || info.weddingInfo.weddingdate)) ||
              info?.weddingDate ||
              info?.weddingdate ||
              info?.date ||
              null;
            let d = null;
            if (raw && typeof raw?.toDate === 'function') d = raw.toDate();
            else if (raw && typeof raw === 'object' && typeof raw.seconds === 'number')
              d = new Date(raw.seconds * 1000);
            else if (typeof raw === 'number') d = new Date(raw < 1e12 ? raw * 1000 : raw);
            else if (typeof raw === 'string') {
              const ymd0 = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (ymd0) {
                const y = parseInt(ymd0[1], 10);
                const mo = parseInt(ymd0[2], 10) - 1;
                const da = parseInt(ymd0[3], 10);
                const local = new Date(y, mo, da, 0, 0, 0, 0);
                if (!isNaN(local.getTime())) d = local;
              }
              const iso = new Date(raw);
              if (!isNaN(iso.getTime())) d = iso;
              else {
                const m = raw.match(
                  /(\d{1,2})\s+de\s+([a-zA-ZÃƒÆ’Ã‚Â±ÃƒÆ’Ã¢â‚¬ËœÃƒÆ’Ã‚Â¡ÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â­ÃƒÆ’Ã‚Â³ÃƒÆ’Ã‚ÂºÃƒÆ’Ã‚ÂÃƒÆ’Ã¢â‚¬Â°ÃƒÆ’Ã‚ÂÃƒÆ’Ã¢â‚¬Å“ÃƒÆ’Ã…Â¡]+)\s+de\s+(\d{4})/
                );
                if (m) {
                  const day = parseInt(m[1], 10);
                  const name = m[2].toLowerCase();
                  const year = parseInt(m[3], 10);
                  const map = {
                    enero: 0,
                    febrero: 1,
                    marzo: 2,
                    abril: 3,
                    mayo: 4,
                    junio: 5,
                    julio: 6,
                    agosto: 7,
                    septiembre: 8,
                    setiembre: 8,
                    octubre: 9,
                    noviembre: 10,
                    diciembre: 11,
                  };
                  const mon = map[name];
                  if (mon !== undefined) d = new Date(year, mon, day);
                }
              }
            }
            if (d && !isNaN(d.getTime())) {
              try {
                console.log('[Tasks] projectEnd from subdoc info/weddingInfo', d);
              } catch (_) {}
              setProjectEnd(d);
            }
          } catch (_) {}
        },
        () => {}
      );
      return () => {
        try {
          unsub && unsub();
        } catch (_) {}
      };
    } catch (_) {}
  }, [activeWedding, db]);

  // 1b) Fijar projectStart desde users/{uid}.createdAt (fallback: auth.metadata.creationTime)
  useEffect(() => {
    (async () => {
      try {
        const uid = auth?.currentUser?.uid;
        if (!uid || !db) return;
        const uref = doc(db, 'users', uid);
        const snap = await getDoc(uref).catch(() => null);
        let d = null;
        if (snap && snap.exists()) {
          const data = snap.data() || {};
          const raw =
            data?.createdAt || data?.created_at || data?.created || data?.createdat || null;
          if (raw && typeof raw?.toDate === 'function') {
            d = raw.toDate();
          } else if (raw && typeof raw === 'object' && typeof raw.seconds === 'number') {
            d = new Date(raw.seconds * 1000);
          } else if (typeof raw === 'number') {
            d = new Date(raw < 1e12 ? raw * 1000 : raw);
          } else if (typeof raw === 'string') {
            const iso = new Date(raw);
            if (!isNaN(iso.getTime())) d = iso;
            else {
              const m = raw.match(
                /(\d{1,2})\s+de\s+([a-zA-ZÃƒÆ’Ã‚Â±ÃƒÆ’Ã¢â‚¬ËœÃƒÆ’Ã‚Â¡ÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â­ÃƒÆ’Ã‚Â³ÃƒÆ’Ã‚ÂºÃƒÆ’Ã‚ÂÃƒÆ’Ã¢â‚¬Â°ÃƒÆ’Ã‚ÂÃƒÆ’Ã¢â‚¬Å“ÃƒÆ’Ã…Â¡]+)\s+de\s+(\d{4})/
              );
              if (m) {
                const day = parseInt(m[1], 10);
                const name = m[2].toLowerCase();
                const year = parseInt(m[3], 10);
                const map = {
                  enero: 0,
                  febrero: 1,
                  marzo: 2,
                  abril: 3,
                  mayo: 4,
                  junio: 5,
                  julio: 6,
                  agosto: 7,
                  septiembre: 8,
                  setiembre: 8,
                  octubre: 9,
                  noviembre: 10,
                  diciembre: 11,
                };
                const mon = map[name];
                if (mon !== undefined) d = new Date(year, mon, day);
              }
            }
          }
        }
        // Fallback adicional: colecciÃƒÆ’Ã‚Â³n de perfiles si existiese
        if (!d) {
          try {
            const pref = await getDoc(doc(db, 'userProfiles', uid)).catch(() => null);
            if (pref && pref.exists()) {
              const pdata = pref.data() || {};
              const praw = pdata?.createdAt || pdata?.created_at || pdata?.created || null;
              if (praw) d = typeof praw?.toDate === 'function' ? praw.toDate() : new Date(praw);
            }
          } catch (_) {}
        }
        if (!d && auth?.currentUser?.metadata?.creationTime) {
          d = new Date(auth.currentUser.metadata.creationTime);
        }
        if (d && !isNaN(d.getTime())) setProjectStart(d);
      } catch (_) {}
    })();
  }, [auth?.currentUser?.uid, db]);

  // 2) Crear/actualizar automÃƒÆ’Ã‚Â¡ticamente el evento 'wedding-day' si hay fecha
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding || !db) return;
        if (!(projectEnd instanceof Date) || isNaN(projectEnd.getTime())) return;
        const start = new Date(
          projectEnd.getFullYear(),
          projectEnd.getMonth(),
          projectEnd.getDate(),
          12,
          0,
          0,
          0
        );
        const end = new Date(
          projectEnd.getFullYear(),
          projectEnd.getMonth(),
          projectEnd.getDate(),
          14,
          0,
          0,
          0
        );
        const ref = doc(db, 'weddings', activeWedding, 'meetings', 'wedding-day');
        const snap = await getDoc(ref).catch(() => null);
        const prev = snap && snap.exists() ? snap.data() : null;
        const next = {
          id: 'wedding-day',
          autoKey: 'wedding-day',
          title: prev?.title || 'DÃƒÆ’Ã‚Â­a de la boda',
          category: prev?.category || 'OTROS',
          start,
          end,
          createdAt: prev?.createdAt || serverTimestamp(),
        };
        const same =
          prev &&
          prev.start &&
          prev.end &&
          new Date(prev.start).getTime() === start.getTime() &&
          new Date(prev.end).getTime() === end.getTime();
        if (!same) await setDoc(ref, next, { merge: true });
      } catch (_) {}
    })();
  }, [activeWedding, projectEnd]);

  // Alinear fechas de tareas padre cada vez que cambia la fecha de la boda
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding) return;
        if (!(projectEnd instanceof Date) || isNaN(projectEnd.getTime())) return;
        const startForBlocks =
          projectStart instanceof Date && !isNaN(projectStart)
            ? projectStart
            : addMonths(projectEnd, -12);
        await fixParentBlockDates(activeWedding, startForBlocks, projectEnd);
      } catch (_) {}
    })();
  }, [activeWedding, projectStart, projectEnd]);

  
  // Exponer utilidades de debug en consola: mywed.tasks.*
  useEffect(() => {
    try {
      window.mywed = window.mywed || {};
      const parents = (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : []).filter((t)=>String(t?.type||'task')==='task');
      window.mywed.tasks = {
        activeWedding,
        parentsCount: () => parents.length,
        getParent: (id) => {
          try {
            const p = parents.find((x) => String(x.id) === String(id));
            if (!p) return null;
            return { id: String(p.id), name: p.name || p.title, start: p.start, end: p.end };
          } catch { return null; }
        },
        getParentByName: (name) => {
          try {
            const p = parents.find((x) => (x.name || x.title) === name);
            if (!p) return null;
            return { id: String(p.id), name: p.name || p.title, start: p.start, end: p.end };
          } catch { return null; }
        },
        nestedCount: () => (Array.isArray(nestedSubtasks) ? nestedSubtasks.length : 0),
        subtaskEventsCount: () => (Array.isArray(subtaskEvents) ? subtaskEvents.length : 0),
        listNestedPaths: () => (Array.isArray(nestedSubtasks) ? nestedSubtasks.map(s=>s.__path || s.id) : []),
        sampleNested: (n=5) => (Array.isArray(nestedSubtasks) ? nestedSubtasks.slice(0,n) : []),
        sampleSubtasks: (n=10) => (Array.isArray(subtaskEvents) ? subtaskEvents.slice(0,n) : []),
        byParent: () => {
          const map = {};
          const arr = Array.isArray(subtaskEvents) ? subtaskEvents : [];
          for (const st of arr) {
            const pid = String(st.parentId || '');
            if (!pid) continue;
            (map[pid] ||= []).push({ id: st.id, title: st.title, start: st.start, end: st.end, path: st.__path });
          }
          return map;
        },
        explainMissing: () => {
          try {
            return {
              activeWedding,
              parents: parents.map(p=>({id:String(p.id), name:p.name||p.title})),
              nestedTotal: Array.isArray(nestedSubtasks) ? nestedSubtasks.length : 0,
              subtaskEventsTotal: Array.isArray(subtaskEvents) ? subtaskEvents.length : 0,
              parentsWithKids: Object.keys((window.mywed.tasks.byParent())).length,
            };
          } catch (e) { return { error: String(e) }; }
        },
      };
      console.log('[Tasks Debug] Usa mywed.tasks.explainMissing() para ver el estado');
    } catch {}
  }, [activeWedding, uniqueGanttTasks, nestedSubtasks, subtaskEvents]);

  // Renderizado condicionado tras ejecutar todos los hooks para mantener el orden estable
  if (!activeWedding) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="page-title">Gestión de Tareas</h1>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded p-4">
          <div className="font-semibold mb-1">Selecciona o crea una boda para ver tareas</div>
          <div className="text-sm">No hay boda activa en este momento. Ve a la sección \"Bodas\" para seleccionar una existente o crear una nueva.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-32">
      <TasksHeader
        syncStatus={syncStatus}
        onShowAllTasks={() => setShowAllTasks(true)}
        onNewTask={() => {
          resetForm();
          setEditingId(null);
          setEditingPath(null);
          setShowNewTask(true);
        }}
      />

      {/* Componente para el diagrama Gantt */}
      <div className="mt-6 mb-8" ref={ganttContainerRef}>
        <h2 className="text-xl font-semibold mb-4">PlanificaciÃ³n a Largo Plazo</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <LongTermTasksGantt
            tasks={ganttDisplayTasks || []}
            subtasks={subtaskEvents || []}
            projectStart={projectStart || new Date()}
            projectEnd={projectEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // Default to 30 days from now
            containerRef={ganttContainerRef}
            columnWidth={120}
            rowHeight={40}
            onTaskClick={(task) => {
              if (!task) return;
              try {
                const eventStart = task.start instanceof Date ? task.start : new Date(task.start);
                const eventEnd = task.end instanceof Date ? task.end : new Date(task.end);
                setEditingId(task.id);
                setEditingPath(task.__path || null);
                setFormData((prev) => ({
                  ...prev,
                  title: task.title || '',
                  desc: task.desc || '',
                  category: task.category || 'OTROS',
                  startDate: eventStart.toISOString().slice(0, 10),
                  startTime: eventStart.toTimeString().slice(0, 5),
                  endDate: eventEnd.toISOString().slice(0, 10),
                  endTime: eventEnd.toTimeString().slice(0, 5),
                  long: task.__kind === 'subtask',
                  parentTaskId: task.__kind === 'subtask' ? task.parentId || '' : '',
                  assignee: task.assignee || '',
                  completed: completedIdSet?.has?.(String(task.id)) || false,
                }));
                setShowNewTask(true);
              } catch (error) {
                console.error('Error al manejar clic en tarea:', error);
              }
            }}
          />
        </div>
      </div>

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
            setEditingPath(event.__path || null);
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
            tasks={taskListItems}
            completedSet={completedIdSet}
            onToggleComplete={(id, val) => toggleCompleteById(id, val)}
            parentNameMap={parentNameMap}
          onTaskClick={(event) => {
            const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
            const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
            setEditingId(event.id);
            setEditingPath(event.__path || null);
            setFormData({
              title: event.title,
              desc: event.desc || '',
              category: event.category || 'OTROS',
              startDate: eventStart.toISOString().slice(0, 10),
                startTime: eventStart.toTimeString().slice(0, 5),
                endDate: eventEnd.toISOString().slice(0, 10),
                endTime: eventEnd.toTimeString().slice(0, 5),
                long: event.__kind === 'subtask' ? true : false,
                parentTaskId: event.__kind === 'subtask' ? event.parentId || '' : '',
                assignee: event.assignee || '',
                completed: completedIdSet.has(String(event.id)),
              });
              setShowNewTask(true);
            }}
          />
        </div>
      </div>

      {debugEnabled && (
        <DebugTasksPanel
          projectStart={projectStart}
          projectEnd={projectEnd}
          parentsRaw={(Array.isArray(tasksState) ? tasksState : []).filter(
            (t) => String(t?.type || 'task') === 'task'
          )}
          uniqueGanttTasks={uniqueGanttTasks}
          ganttTasksBounded={ganttTasksBounded}
          ganttDisplayTasks={ganttDisplayTasks}
          nestedSubtasks={nestedSubtasks}
        />
      )}
      {/* Modal: Todas las tareas agrupadas por padre */}
      {showAllTasks && (
        <AllTasksModal
          isOpen={showAllTasks}
          onClose={() => setShowAllTasks(false)}
          parents={modalParents.length ? modalParents : uniqueGanttTasks}
          subtasks={subtaskEvents}
          completedSet={completedIdSet}
          onToggleComplete={(id, val) => toggleCompleteById(id, val)}
          onTaskClick={(task) => {
            if (!task) return;
            try {
              const eventStart = task.start instanceof Date ? task.start : new Date(task.start);
              const eventEnd = task.end instanceof Date ? task.end : new Date(task.end);
              setEditingId(task.id);
              setEditingPath(task.__path || null);
              setFormData((prev) => ({
                ...prev,
                title: task.title || '',
                desc: task.desc || '',
                category: task.category || 'OTROS',
                startDate: eventStart.toISOString().slice(0, 10),
                startTime: eventStart.toTimeString().slice(0, 5),
                endDate: eventEnd.toISOString().slice(0, 10),
                endTime: eventEnd.toTimeString().slice(0, 5),
                long: task.__kind === 'subtask',
                parentTaskId: task.__kind === 'subtask' ? task.parentId || '' : '',
                assignee: task.assignee || '',
                completed: completedIdSet?.has?.(String(task.id)) || false,
              }));
              setShowNewTask(true);
            } catch (error) {
              console.error('Error al abrir tarea desde el modal:', error);
            }
          }}
          onQuickSchedule={async (st, range) => {
            try {
              if (!st?.id || !st?.parentId) return;
              // Persistencia nested (si hay permisos)
              try {
                if (activeWedding && db) {
                  const ref = doc(
                    db,
                    'weddings', activeWedding,
                    'tasks', String(st.parentId),
                    'subtasks', String(st.id)
                  );
                  await setDoc(
                    ref,
                    { start: range.start, end: range.end, mode: 'scheduled', updatedAt: serverTimestamp() },
                    { merge: true }
                  );
                }
              } catch (_) {}
              // Fallback local: actualizar subtarea plana para refrescar el modal
              try {
                await updateTaskFS(String(st.id), {
                  start: range.start,
                  end: range.end,
                  type: 'subtask',
                });
              } catch (_) {}
              // Recalcular rango del padre
              try { await computeAndUpdateParentRange(String(st.parentId)); } catch {}
            } catch (e) { console.warn('quickSchedule error', e); }
          }}
        />
      )}
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
          parentOptions={parentTaskOptions}
        />
      )}
    </div>
  );
}


