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
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Importar componentes separados
import { localizer, categories, eventStyleGetter, Event } from './CalendarComponents.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import EventsCalendar from './EventsCalendar.jsx';
import { useGanttSizing } from './hooks/useGanttSizing.js';
import { useGanttNormalizedTasks, useGanttBoundedTasks } from './hooks/useGanttTasks.js';
import { useSafeEvents } from './hooks/useSafeEvents.js';
import { useTaskDependencies } from './hooks/useTaskDependencies.jsx';
import LongTermTasksGantt from './LongTermTasksGantt.jsx';
import AllTasksModal from './AllTasksModal.jsx';
import TaskForm from './TaskForm.jsx';
import TaskList from './TaskList.jsx';
import TasksHeader from './TasksHeader.jsx';
import TaskSidePanel from './TaskSidePanel.jsx';
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
import { seedWeddingTasksFromTemplate } from '../../services/taskTemplateSeeder';
import useTranslations from '../../hooks/useTranslations';

const GANTT_UNASSIGNED = '__gantt_unassigned__';
const GANTT_ZOOM_STORAGE_KEY = 'maloveapp_gantt_zoom';
const GANTT_ZOOM_MIN = 0.001;
const GANTT_ZOOM_MAX = 2.4;
const GANTT_ZOOM_STEP = 0.05;
const GANTT_EXTEND_MONTHS = 1;
const GANTT_ZOOM_FLOOR = 0.0001;
const GANTT_COLUMN_WIDTH_MIN = 0.1;

const clampZoomValue = (value, { min = GANTT_ZOOM_MIN, max = GANTT_ZOOM_MAX } = {}) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  const safeMin = Math.min(max, Math.max(min, GANTT_ZOOM_FLOOR));
  const safeMax = Math.max(safeMin, max);
  if (!Number.isFinite(numeric)) return safeMin;
  return Math.min(safeMax, Math.max(safeMin, numeric));
};

// Funcin helper para cargar datos de Firestore de forma segura con fallbacks


// Componente principal Tasks refactorizado
export default function TasksRefactored() {
  // Estados - Inicializacin segura con manejo de errores

  // Contexto de boda activa
  const { activeWedding } = useWedding();
  const navigate = useNavigate();
  const { t } = useTranslations();

  const fallbackTaskLabel = useMemo(() => t('tasks.page.common.fallbacks.task'), [t]);
  const fallbackUntitledTask = useMemo(
    () => t('tasks.page.common.fallbacks.untitledTask'),
    [t]
  );
  const fallbackSubtaskLabel = useMemo(
    () => t('tasks.page.sidePanel.subtasks.default'),
    [t]
  );

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

  // Memorizar IDs de tareas padre para evitar re-ejecutar el useEffect en cada render
  const parentTaskIds = useMemo(() => {
    return (Array.isArray(tasksState) ? tasksState : [])
      .filter((t) => String(t?.type || 'task') === 'task' && t?.id)
      .map((t) => String(t.id))
      .sort()
      .join(',');
  }, [tasksState]);

  // Fallback listener: if collectionGroup('subtasks') returns nothing
  // (e.g., due to rules in some environments), subscribe each parent's
  // subtasks subcollection and merge results locally.
  const [nestedSubtasksFallback, setNestedSubtasksFallback] = useState([]);
  const nestedFallbackUnsubsRef = useRef([]);
  useEffect(() => {
    try {
      const hasCG = Array.isArray(nestedSubtasks) && nestedSubtasks.length > 0;
      if (hasCG) {
        try { nestedFallbackUnsubsRef.current.forEach((u) => u && u()); } catch {}
        nestedFallbackUnsubsRef.current = [];
        setNestedSubtasksFallback([]);
        return;
      }
      if (!activeWedding || !db) return;
      try { nestedFallbackUnsubsRef.current.forEach((u) => u && u()); } catch {}
      nestedFallbackUnsubsRef.current = [];

      const parents = parentTaskIds.split(',').filter(Boolean);
      if (parents.length === 0) { setNestedSubtasksFallback([]); return; }

      const acc = new Map();
      parents.forEach((pid) => {
        try {
          const colRef = collection(db, 'weddings', activeWedding, 'tasks', pid, 'subtasks');
          const unsub = onSnapshot(colRef, (snap) => {
            try {
              for (const [k, v] of Array.from(acc.entries())) {
                if (String(v.__path || '').includes(`/tasks/${pid}/subtasks/`)) acc.delete(k);
              }
              snap.docs.forEach((d) => {
                const data = d.data() || {};
                const docObj = { ...data, id: d.id, __path: d.ref.path, parentId: data.parentId || pid, weddingId: activeWedding };
                acc.set(docObj.__path || `${pid}:${d.id}`, docObj);
              });
              setNestedSubtasksFallback(Array.from(acc.values()));
            } catch {}
          }, () => {});
          nestedFallbackUnsubsRef.current.push(unsub);
        } catch {}
        // Intentar tambi�n ruta singular 'task/{pid}/subtasks' por compatibilidad
        try {
          const colRefAlt = collection(db, 'weddings', activeWedding, 'task', pid, 'subtasks');
          const unsubAlt = onSnapshot(colRefAlt, (snap) => {
            try {
              for (const [k, v] of Array.from(acc.entries())) {
                if (String(v.__path || '').includes(`/task/${pid}/subtasks/`)) acc.delete(k);
              }
              snap.docs.forEach((d) => {
                const data = d.data() || {};
                const docObj = { ...data, id: d.id, __path: d.ref.path, parentId: data.parentId || pid, weddingId: activeWedding };
                acc.set(docObj.__path || `${pid}:${d.id}`, docObj);
              });
              setNestedSubtasksFallback(Array.from(acc.values()));
            } catch {}
          }, () => {});
          nestedFallbackUnsubsRef.current.push(unsubAlt);
        } catch {}
      });

      return () => {
        try { nestedFallbackUnsubsRef.current.forEach((u) => u && u()); } catch {}
        nestedFallbackUnsubsRef.current = [];
      };
    } catch (_) {}
  }, [activeWedding, db, parentTaskIds, nestedSubtasks]);

  // Fallback para estructura con coleccin singular 'task':
  // Escucha weddings/{id}/task/*/subtasks/* si el collectionGroup no devuelve nada
  

  // Migracin suave de subtareas planas -> anidadas (una vez por boda)
  const migrationAttemptedRef = useRef(new Set());
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding) return;
        
        // Prevenir múltiples migraciones para la misma boda
        if (migrationAttemptedRef.current.has(activeWedding)) return;
        
        const flatCount = Array.isArray(tasksState)
          ? tasksState.filter((t) => String(t?.type || '') === 'subtask').length
          : 0;
        const nestedCount = Array.isArray(nestedSubtasks) ? nestedSubtasks.length : 0;
        
        if (flatCount > 0 && nestedCount < flatCount) {
          // Marcar como intentado antes de ejecutar
          migrationAttemptedRef.current.add(activeWedding);
          await migrateFlatSubtasksToNested(activeWedding);
        }
      } catch (error) {
        console.warn('[Tasks] migration failed', error);
        // Si falla, permitir reintentar
        if (activeWedding) {
          migrationAttemptedRef.current.delete(activeWedding);
        }
      }
    })();
  }, [activeWedding, tasksState, nestedSubtasks]);

  // (movido m�s abajo tras declarar debugEnabled)

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
    // Nuevos campos de planificacin
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
        typeof localStorage !== 'undefined' ? localStorage.getItem('maloveapp_gantt_debug') : null;
      const ls2 =
        typeof localStorage !== 'undefined' ? localStorage.getItem('maloveapp_debug') : null;
      return [q, ls1, ls2].some((v) => v && /^1|true$/i.test(String(v)));
    } catch {
      return false;
    }
  }, []);

  // Quick intents: algunas tareas abren rutas espec)ficas de la app
  // Quick intents mapping (route by title/category)
  const getQuickRouteForTask = useCallback((task) => {
    try {
      const raw = String(task?.title || task?.name || '').toLowerCase();
      const category = String(task?.category || '').toUpperCase();
      let title = raw;
      try { title = raw.normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''); } catch {}

      // Guests / RSVP
      if (category === 'INVITADOS') return '/invitados';
      if (title.includes('invitad') || title.includes('rsvp') || title.includes('lista de invitados') || title.includes('confirmaciones')) return '/invitados';

      if (category === 'CEREMONIA' || title.includes('ceremonia') || title.includes('protocolo'))
        return '/protocolo/momentos-especiales';

      // Website / design
      if (title.includes('pagina web') || title.includes('hacer pagina web') || title.includes('crear web') || title.includes('diseno web') || title.includes('wedding site') || title.includes('web boda') || title.includes('diseno-web')) return '/diseno-web';
      // Public website
      if (title.includes('web publica') || title.includes('publicar web') || title.includes('editar web publica')) return '/web';

      // Invitations / stationery
      if (category === 'PAPELERIA' || title.includes('invitacion') || title.includes('invitaciones') || title.includes('save-the-date') || title.includes('save the date') || title.includes('papeleria')) return '/disenos/invitaciones';

      // Seating plan
      if (title.includes('plano de mesas') || title.includes('seating') || title.includes('asiento') || title.includes('colocar mesas')) return '/disenos/seating-plan';

      // Menu / catering
      if (category === 'COMIDA' || title.includes('menu') || title.includes('catering') || title.includes('degustacion')) return '/disenos/menu-catering';

      // Suppliers (contracts and budgets)
      if (title.includes('contrato') || title.includes('firmar contrato')) return '/proveedores/contratos';
      if (title.includes('presupuesto') || title.includes('proveedor')) return '/proveedores';

      // Protocol
      if (title.includes('lista de verificacion') || title.includes('checklist')) return '/protocolo/checklist';
      if (title.includes('momentos especiales') || title.includes('votos') || title.includes('discurso')) return '/protocolo/momentos-especiales';
      if (title.includes('ensayo') || title.includes('timing') || title.includes('cronograma')) return '/protocolo/timing';
      if (title.includes('documentos legales') || title.includes('documentacion')) return '/protocolo/documentos';

      // Ideas / inspiration
      if (title.includes('ideas') || title.includes('inspiracion') || title.includes('moodboard')) return '/inspiracion';

      // Finance
      if (title.includes('presupuesto general') || title.includes('gastos') || title.includes('pagos') || title.includes('facturas') || title.includes('deposito') || title.includes('senal')) return '/finance';

      return null;
    } catch { return null; }
  }, []);
  const handleTaskIntent = useCallback((task, fallback) => {
    const kind = String(task?.__kind || '').toLowerCase();
    const taskType = String(task?.type || (kind === 'subtask' ? 'subtask' : 'task')).toLowerCase();
    if (taskType !== 'subtask') {
      if (typeof fallback === 'function') fallback();
      return false;
    }
    const route = getQuickRouteForTask(task);
    if (route) {
      try { navigate(route); } catch {}
      // Cerrar modales si se abri) desde el modal de "todas las tareas"
      try { setShowAllTasks(false); } catch {}
      return true;
    }
    if (typeof fallback === 'function') fallback();
    return false;
  }, [getQuickRouteForTask, navigate]);

  // Exponer helpers en modo debug para correccin in-situ
  // (movido m�s abajo tras declarar projectStart/projectEnd para evitar TDZ)

  // Si no hay boda activa, mostrar aviso claro y no renderizar resto
  if (false && !activeWedding) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="page-title">{t('tasks.page.header.title')}</h1>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded p-4">
          <div className="font-semibold mb-1">{t('tasks.page.common.noWeddingTitle')}</div>
          <div className="text-sm">{t('tasks.page.common.noWeddingDescription')}</div>
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

  // Altura del contenedor del calendario (reactiva al tama�o de ventana)
  const [calendarContainerHeight, setCalendarContainerHeight] = useState(520);
  const calendarColumnRef = useRef(null);
  const [calendarColumnHeight, setCalendarColumnHeight] = useState(null);
  const measureCalendarColumn = useCallback(() => {
    if (!calendarColumnRef?.current) return;
    const rect = calendarColumnRef.current.getBoundingClientRect();
    if (rect?.height) setCalendarColumnHeight(rect.height);
  }, []);
  useLayoutEffect(() => {
    measureCalendarColumn();
  }, [measureCalendarColumn]);
  useEffect(() => {
    const onResize = () => measureCalendarColumn();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measureCalendarColumn]);
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

  const [showGanttSubtasks, setShowGanttSubtasks] = useState(false);
  const [ganttCategoryFilter, setGanttCategoryFilter] = useState('ALL');
  const [ganttAssigneeFilter, setGanttAssigneeFilter] = useState('ALL');
  const [ganttRiskFilter, setGanttRiskFilter] = useState('ALL');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const filtersActive =
    ganttCategoryFilter !== 'ALL' || ganttAssigneeFilter !== 'ALL' || ganttRiskFilter !== 'ALL';

  const normalizeCategory = useCallback((value) => String(value || 'OTROS').toUpperCase(), []);
  const extractAssignees = useCallback((item) => {
    if (!item || typeof item !== 'object') return [];
    const collected = new Set();
    if (Array.isArray(item.assignees)) {
      item.assignees.filter(Boolean).forEach((val) => collected.add(String(val)));
    }
    const fallbackKeys = ['assignee', 'responsible', 'responsable', 'assignedTo', 'assigned', 'owner'];
    for (const key of fallbackKeys) {
      if (item[key]) collected.add(String(item[key]));
    }
    return Array.from(collected);
  }, []);


  // Suscripcin a cambios del estado de sincronizaci�nn (online/syncing/pending)
  useEffect(() => {
    return () => {
      try {
        unsub && unsub();
      } catch (_) {}
    };
  }, []);
  const [columnWidthState, setColumnWidthState] = useState(65);
  const ganttZoomMetaRef = useRef({
    fromStorage: false,
    persistReady: false,
    initialFitApplied: false,
  });
  const [ganttZoom, setGanttZoom] = useState(() => {
    let fromStorage = false;
    let value = 1;
    if (typeof window === 'undefined') {
      ganttZoomMetaRef.current.fromStorage = false;
      ganttZoomMetaRef.current.persistReady = false;
      return value;
    }
    try {
      const raw = window.localStorage?.getItem?.(GANTT_ZOOM_STORAGE_KEY);
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          value = clampZoomValue(parsed);
          fromStorage = true;
        }
      }
    } catch {
    }
    ganttZoomMetaRef.current.fromStorage = fromStorage;
    ganttZoomMetaRef.current.persistReady = fromStorage;
    return value;
  });
  const [ganttPreSteps, setGanttPreSteps] = useState(0);
  const [ganttViewDate, setGanttViewDate] = useState(null);
  const [ganttViewMode, setGanttViewMode] = useState('month');
  // Rango del proyecto: inicio = fecha de registro, fin = fecha de boda
  const [projectStart, setProjectStart] = useState(null);
  const [projectEnd, setProjectEnd] = useState(null);

  useEffect(() => {
    if (!ganttZoomMetaRef.current.persistReady) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.setItem?.(GANTT_ZOOM_STORAGE_KEY, String(ganttZoom));
    } catch (_) {}
  }, [ganttZoom]);
  // Calcular fechas de proyecto: registro (inicio) y boda (fin + 1 mes)// Crear/actualizar automaticamente la cita del D�a de la boda en el calendario (solo meetings)// Ocultar completamente la lista izquierda del Gantt
  // Exponer helpers en modo debug para correccin in-situ
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
  // Manejar eventos de calendario externos// Funci�³n para a�±adir una reuni�³n
  const addMeeting = useCallback(
    async (meeting) => {
      await addMeetingFS({
        ...meeting,
        title: meeting.title || 'Nueva reunion',
        start: new Date(meeting.start),
        end: new Date(meeting.end),
      });
    },
    [addMeetingFS]
  );
  // keep for future use (avoid unused-var warnings)
  // eslint-disable-next-line no-unused-expressions
  addMeeting && null;

  // Generaci�³n autom��tica de timeline si est�� vac�­o// Estado para tareas completadas (inicial vac�­o, se cargar�� as�­ncronamente)

  // Cargar tareas completadas de Firestore/Storage sin bloquear render// Suscribirse al estado de sincronizaci�n³n// Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vac�­os al inicio)// Sugerencia autom��tica de categor�­a
  const sugerirCategoria = (titulo, descripcion) => {
    const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
    if (
      texto.includes('lugar') ||
      texto.includes('venue') ||
      texto.includes('saln') ||
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
    } else if (texto.includes('ceremon') || texto.includes('protocolo') || texto.includes('ensayo')) {
      return 'CEREMONIA';
    } else if (texto.includes('decora') || texto.includes('adorno') || texto.includes('flor')) {
      return 'decoraci�n';
    } else if (
      texto.includes('invitacion') ||
      texto.includes('papel') ||
      texto.includes('tarjeta')
    ) {
      return 'papeler�a';
    } else if (
      texto.includes('m�ºsica') ||
      texto.includes('music') ||
      texto.includes('dj') ||
      texto.includes('band')
    ) {
      return 'm�sica';
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

      // 1. Sugerir categor�­a si se cambia el t�­tulo y la categor�­a es OTROS
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
          updated.endDate = rawValue; // Ajustar fin al mismo d�­a por defecto
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

  // Asignaci�³n autom��tica de categor�­a con IA
  const asignarCategoriaConIA = async (titulo, descripcion) => {
    try {
      const texto = (titulo + ' ' + (descripcion || '')).toLowerCase();
      // Primero intentamos con reglas simples
      const sugerida = sugerirCategoria(titulo, descripcion);
      if (sugerida !== 'OTROS') return sugerida;

      // Si las reglas simples no funcionan, usamos IA
      const palabrasClave = {
  LUGAR: ['venue','location','lugar','sitio','espacio','sal�n','jard�n','terraza'],
  INVITADOS: ['guests','invitados','personas','asistentes','confirmaciones','lista','rsvp'],
  COMIDA: ['catering','food','comida','bebida','menu','bocadillos','pastel','torta'],
  CEREMONIA: ['ceremonia','protocolo','votos','ensayo','celebrante','testigos','expediente'],
  DECORACION: ['decoraci�n','flores','arreglos','centros de mesa','iluminaci�n','ambientaci�n'],
  PAPELERIA: ['invitaciones','papeler�a','save the date','tarjetas','programa','seating plan'],
  MUSICA: ['m�sica','dj','banda','playlist','sonido','baile','entretenimiento'],
  FOTOGRAFO: ['fotograf�a','video','recuerdos','�lbum','sesi�n'],
  VESTUARIO: ['vestido','traje','accesorios','zapatos','maquillaje','peluquer�a'],
};

      // Contar coincidencias por categor�­a
      const scores = {};
      Object.entries(palabrasClave).forEach(([cat, palabras]) => {
        scores[cat] = palabras.filter((palabra) => texto.includes(palabra)).length;
      });

      // Encontrar la categor�­a con mayor puntuaci�³n
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
      console.error('Error al asignar categor�­a:', error);
      return 'OTROS';
    }
  };

  // Guardar una tarea en la subcolecci�³n de la boda
  const handleSaveTask = async () => {
    try {
      // Validar formulario b��sico
      if (!formData.title.trim()) {
        toast.error(t('tasks.page.form.validation.titleRequired'));
        return;
      }

      const isSubtask = !!(formData.long && formData.parentTaskId);
      const unscheduled = Boolean(formData.unscheduled);

      if (!formData.startDate && !(isSubtask && unscheduled)) {
        toast.error(t('tasks.page.form.validation.startRequired'));
        return;
      }

      if (!formData.endDate && !(isSubtask && unscheduled)) {
        toast.error(t('tasks.page.form.validation.endRequired'));
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
      if (
        !(isSubtask && unscheduled) &&
        (isNaN(startDate?.getTime?.() || NaN) || isNaN(endDate?.getTime?.() || NaN))
      ) {
        toast.error(t('tasks.page.form.validation.invalidDates'));
        return;
      }

      if (!(isSubtask && unscheduled) && endDate < startDate) {
        toast.error(t('tasks.page.form.validation.endAfterStart'));
        return;
      }

      // Asignar categor�­a con IA si no se especific�³
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

      // A�±adir/actualizar seg�ºn sea una tarea de largo plazo o una reuni�³n
      if (formData.long) {
        // Si no se eligi tarea padre, asignar por defecto a "OTROS"
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
          // ���&��ltimo recurso: generar id local si todo falla
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
          // Nueva reuni�n
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

      // Ajustar rango del padre si procede (modo automtico)
      try {
        if (formData.parentTaskId) {
          await computeAndUpdateParentRange(String(formData.parentTaskId));
        }
      } catch (_) {}

      // Cerrar modal y limpiar
      closeModal();
      } catch (error) {
        console.error('Error al guardar tarea:', error);
        toast.error(t('tasks.page.form.errors.saveFailed'));
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
        .then(() => console.log('[Tasks] Eliminaci�³n completada', editingId))
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

  // Funci�³n auxiliar para validar y normalizar fechas
  // Eventos y listas seguras via hooks
  const { safeEvents, sortedEvents, safeMeetings, safeMeetingsFiltered } =
    useSafeEvents(meetingsState);

  // Tareas Gantt normalizadas y acotadas
  const { uniqueGanttTasks } = useGanttNormalizedTasks(tasksState);

  const authCreationDate = useMemo(() => {
    try {
      const raw = auth?.currentUser?.metadata?.creationTime || null;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch (_) {
      return null;
    }
  }, [auth?.currentUser?.metadata?.creationTime]);

  const taskTemporalBounds = useMemo(() => {
    const tasks = Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
    let minStart = null;
    let maxEnd = null;
    for (const task of tasks) {
      if (!task) continue;
      const start = normalizeAnyDate(task.start || task.startDate || task.date || task.when);
      if (start && !isNaN(start.getTime())) {
        if (!minStart || start.getTime() < minStart.getTime()) minStart = start;
      }
      const end = normalizeAnyDate(
        task.end || task.endDate || task.until || task.finish || task.to || null
      );
      if (end && !isNaN(end.getTime())) {
        if (!maxEnd || end.getTime() > maxEnd.getTime()) maxEnd = end;
      }
    }
    return { minStart, maxEnd };
  }, [uniqueGanttTasks]);

  const ganttProjectStart = useMemo(() => {
    const candidates = [
      projectStart,
      authCreationDate,
      taskTemporalBounds.minStart,
    ]
      .map((candidate) => {
        if (!candidate) return null;
        if (candidate instanceof Date) return Number.isNaN(candidate.getTime()) ? null : candidate;
        const normalized = normalizeAnyDate(candidate);
        return normalized && !Number.isNaN(normalized.getTime()) ? normalized : null;
      })
      .filter(Boolean);
    if (candidates.length === 0) return null;
    return candidates.reduce((earliest, current) =>
      current.getTime() < earliest.getTime() ? current : earliest
    );
  }, [projectStart, authCreationDate, taskTemporalBounds]);

  const weddingDateFromMeetings = useMemo(() => {
    const meetings = Array.isArray(meetingsState) ? meetingsState : [];
    for (const meeting of meetings) {
      if (!meeting) continue;
      const key = String(meeting.id || meeting.autoKey || '').toLowerCase();
      if (key === 'wedding-day' || key === 'weddingday' || key === 'wedding') {
        const normalized = normalizeAnyDate(
          meeting.start || meeting.date || meeting.when || meeting.metadata?.start
        );
        if (normalized && !isNaN(normalized.getTime())) return normalized;
      }
    }
    return null;
  }, [meetingsState]);

  const ganttProjectEnd = useMemo(() => {
    const candidates = [
      projectEnd,
      weddingDateFromMeetings,
      taskTemporalBounds.maxEnd,
    ]
      .map((candidate) => {
        if (!candidate) return null;
        if (candidate instanceof Date) return Number.isNaN(candidate.getTime()) ? null : candidate;
        const normalized = normalizeAnyDate(candidate);
        return normalized && !Number.isNaN(normalized.getTime()) ? normalized : null;
      })
      .filter(Boolean);
    if (candidates.length === 0) {
      return ganttProjectStart ? addMonths(ganttProjectStart, 12) : null;
    }
    return candidates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest
    );
  }, [projectEnd, weddingDateFromMeetings, taskTemporalBounds, ganttProjectStart]);

  const ganttRangeStart = useMemo(() => {
    const base =
      ganttProjectStart instanceof Date && !isNaN(ganttProjectStart?.getTime?.())
        ? ganttProjectStart
        : new Date();
    return new Date(base.getTime());
  }, [ganttProjectStart]);

  const ganttRangeEnd = useMemo(() => {
    const fallback = addMonths(ganttRangeStart, 12);
    const candidate =
      ganttProjectEnd instanceof Date && !isNaN(ganttProjectEnd?.getTime?.())
        ? new Date(ganttProjectEnd.getTime())
        : null;
    if (!candidate) return fallback;
    if (candidate.getTime() < ganttRangeStart.getTime()) return fallback;
    return candidate;
  }, [ganttProjectEnd, ganttRangeStart]);

  const ganttTimelineMonths = useMemo(() => {
    if (!(ganttRangeStart instanceof Date) || Number.isNaN(ganttRangeStart?.getTime?.()))
      return null;
    if (!(ganttRangeEnd instanceof Date) || Number.isNaN(ganttRangeEnd?.getTime?.())) return null;
    const startMonth = new Date(ganttRangeStart.getFullYear(), ganttRangeStart.getMonth(), 1);
    const endMonth = new Date(ganttRangeEnd.getFullYear(), ganttRangeEnd.getMonth(), 1);
    const afterEnd = new Date(
      endMonth.getFullYear(),
      endMonth.getMonth() + 1 + GANTT_EXTEND_MONTHS,
      1
    );
    const diff =
      (afterEnd.getFullYear() - startMonth.getFullYear()) * 12 +
      (afterEnd.getMonth() - startMonth.getMonth());
    return Math.max(1, diff);
  }, [ganttRangeStart, ganttRangeEnd]);

  const zoomedColumnWidth = useMemo(() => {
    const base = Math.max(1, Number(columnWidthState) || 90);
    const width = Math.max(GANTT_COLUMN_WIDTH_MIN, base * ganttZoom);
    const normalized = Math.round(width * 1000) / 1000;
    return Math.max(GANTT_COLUMN_WIDTH_MIN, Math.min(360, normalized));
  }, [columnWidthState, ganttZoom]);
  const [fitZoomObserved, setFitZoomObserved] = useState(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = ganttContainerRef?.current;
    if (!root) return;
    const scrollEl = root.querySelector('[data-testid="longterm-gantt-scroll"]');
    if (!scrollEl) return;

    let frame = null;
    const evaluate = () => {
      frame = null;
      try {
        const viewport = scrollEl.clientWidth || 0;
        const content = scrollEl.scrollWidth || 0;
        const base = Math.max(1, Number(columnWidthState) || 90);
        const colWidth = Math.max(GANTT_COLUMN_WIDTH_MIN, Number(zoomedColumnWidth) || base);
        if (viewport <= 0 || content <= 0 || base <= 0 || colWidth <= 0) return;
        const units = content / colWidth;
        if (!Number.isFinite(units) || units <= 0) return;
        const targetColumnWidth = viewport / units;
        if (!Number.isFinite(targetColumnWidth) || targetColumnWidth <= 0) return;
        const ratio = targetColumnWidth / base;
        const ratioWithSlack = ratio > 0 ? ratio * 0.985 : ratio;
        if (!Number.isFinite(ratio) || ratio <= 0) return;
        const normalized = Math.min(
          1,
          clampZoomValue(ratioWithSlack, { min: GANTT_ZOOM_FLOOR, max: GANTT_ZOOM_MAX })
        );
        setFitZoomObserved((prev) =>
          prev !== null && Math.abs(prev - normalized) < 0.001 ? prev : normalized
        );
      } catch (_) {}
    };
    const schedule = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(evaluate);
    };

    schedule();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      try {
        ro = new ResizeObserver(() => schedule());
        ro.observe(scrollEl);
      } catch (_) {}
    }
    const onWindowResize = () => schedule();
    window.addEventListener('resize', onWindowResize);

    return () => {
      if (frame !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener('resize', onWindowResize);
      if (ro) {
        try {
          ro.disconnect();
        } catch (_) {}
      }
    };
  }, [
    ganttContainerRef,
    columnWidthState,
    zoomedColumnWidth,
    ganttZoom,
    ganttTimelineMonths,
    showGanttSubtasks,
    ganttRangeStart,
    ganttRangeEnd,
  ]);
  const minZoomAllowed = useMemo(() => {
    if (!fitZoomObserved || !Number.isFinite(fitZoomObserved) || fitZoomObserved <= 0) {
      return GANTT_ZOOM_MIN;
    }
    if (fitZoomObserved >= 1) return GANTT_ZOOM_MIN;
    return Math.min(1, Math.max(GANTT_ZOOM_FLOOR, fitZoomObserved));
  }, [fitZoomObserved]);
  useEffect(() => {
    if (ganttZoomMetaRef.current.fromStorage) {
      ganttZoomMetaRef.current.persistReady = true;
      return;
    }
    if (ganttZoomMetaRef.current.initialFitApplied) return;
    if (!minZoomAllowed || !Number.isFinite(minZoomAllowed)) return;
    const normalized = Math.round(minZoomAllowed * 1000) / 1000;
    const tolerance = Math.max(0.0001, minZoomAllowed * 0.02);
    ganttZoomMetaRef.current.initialFitApplied = true;
    ganttZoomMetaRef.current.persistReady = true;
    setGanttZoom((prev) => (Math.abs(prev - normalized) < tolerance ? prev : normalized));
  }, [minZoomAllowed]);
  useEffect(() => {
    const enforceTolerance = Math.max(0.0005, minZoomAllowed * 0.05);
    if (ganttZoom < minZoomAllowed - enforceTolerance) {
      setGanttZoom(minZoomAllowed);
    }
  }, [ganttZoom, minZoomAllowed]);
  const handleZoomChange = useCallback((next) => {
    const clamped = clampZoomValue(next, { min: minZoomAllowed });
    const normalized = Math.round(clamped * 1000) / 1000;
    const tolerance = Math.max(0.0001, minZoomAllowed * 0.02);
    setGanttZoom((prev) => {
      if (Math.abs(prev - normalized) < tolerance) return prev;
      return normalized;
    });
  }, [minZoomAllowed]);
  const handleZoomIn = useCallback(() => {
    handleZoomChange(ganttZoom + GANTT_ZOOM_STEP);
  }, [ganttZoom, handleZoomChange]);
  const handleZoomOut = useCallback(() => {
    handleZoomChange(ganttZoom - GANTT_ZOOM_STEP);
  }, [ganttZoom, handleZoomChange]);
  const handleZoomSlider = useCallback(
    (value) => {
      const numeric = typeof value === 'number' ? value : Number(value);
      handleZoomChange(numeric);
    },
    [handleZoomChange]
  );
  const zoomPercent = Math.round(ganttZoom * 100);
  const zoomMinTolerance = Math.max(0.0005, minZoomAllowed * 0.05);
  const isZoomMin = ganttZoom <= minZoomAllowed + zoomMinTolerance;
  const isZoomMax = ganttZoom >= GANTT_ZOOM_MAX - 0.001;
  const fitZoomValue = minZoomAllowed;
  const fitTolerance = fitZoomValue != null ? Math.max(0.0025, fitZoomValue * 0.1) : 0.01;
  const isFitApplied =
    fitZoomValue !== null && Math.abs(fitZoomValue - ganttZoom) < fitTolerance;
  const handleFitToScreen = useCallback(() => {
    if (fitZoomValue == null) return;
    handleZoomChange(fitZoomValue);
  }, [fitZoomValue, handleZoomChange]);

  const ganttTasksBounded = useGanttBoundedTasks(
    uniqueGanttTasks,
    ganttRangeStart,
    ganttRangeEnd,
    meetingsState
  );

  // Progreso por tarea padre: % de subtareas completadas
  // (se declara tras completedIdSet para evitar dependencias circulares)
  let parentProgressMap = new Map();

  // Inyectar progreso calculado en tareas padre visibles en el Gantt
  const ganttBaseTasks = useMemo(() => {
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
      // intentar un fallback directo desde tasksState (por si algn normalizador filtr de m�s)
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
              name: x.name || x.title || fallbackTaskLabel,
              title: x.title || x.name || fallbackUntitledTask,
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
    const toNumberOrNull = (value) => {
      if (value === null || value === undefined) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const getValueFromPath = (obj, path) => {
      if (!obj || typeof obj !== 'object') return undefined;
      if (!path || typeof path !== 'string') return undefined;
      if (!path.includes('.')) return obj?.[path];
      return path.split('.').reduce((acc, key) => {
        if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
          return acc[key];
        }
        return undefined;
      }, obj);
    };

    const extractIndexFromSource = (source, keys) => {
      for (const key of keys) {
        const value = getValueFromPath(source, key);
        const num = toNumberOrNull(value);
        if (num !== null) return num;
      }
      return null;
    };

    const normalizeDependencyList = (list) => {
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const dep of list) {
        if (!dep) continue;
        if (typeof dep === 'string' || typeof dep === 'number') {
          out.push({ id: String(dep) });
          continue;
        }
        if (typeof dep !== 'object') continue;
        const meta = dep;
        const idCandidate =
          meta.taskId ??
          meta.taskID ??
          meta.subtaskId ??
          meta.subtaskID ??
          meta.itemId ??
          meta.id ??
          meta.targetId ??
          meta.targetID ??
          meta.task?.id ??
          meta.nodeId ??
          meta.nodeID;
        const blockIndex = toNumberOrNull(
          meta.blockIndex ??
            meta.block ??
            meta.blockIdx ??
            meta.parentBlockIndex ??
            meta.block_index ??
            meta.blockID
        );
        const itemIndex = toNumberOrNull(
          meta.itemIndex ??
            meta.item ??
            meta.itemIdx ??
            meta.parentItemIndex ??
            meta.item_index ??
            meta.taskIndex ??
            meta.stepIndex ??
            meta.subtaskIndex
        );
        const parentId =
          meta.parentId ??
          meta.parentID ??
          (meta.parent && meta.parent.id ? meta.parent.id : null) ??
          meta.taskParentId ??
          meta.blockId ??
          meta.blockID ??
          null;
        const normalized = {};
        if (idCandidate !== undefined && idCandidate !== null && idCandidate !== '') {
          normalized.id = String(idCandidate);
        }
        if (blockIndex !== null) normalized.blockIndex = blockIndex;
        if (itemIndex !== null) normalized.itemIndex = itemIndex;
        if (parentId) normalized.parentId = String(parentId);
        if (
          normalized.id === undefined &&
          normalized.blockIndex === undefined &&
          normalized.itemIndex === undefined &&
          !normalized.parentId
        ) {
          continue;
        }
        normalized.raw = meta;
        out.push(normalized);
      }
      return out;
    };

    const collectDependencyIds = (normalizedEntries, source) => {
      const ids = new Set();
      normalizedEntries.forEach((entry) => {
        if (entry && entry.id) ids.add(String(entry.id));
      });
      const extras = [
        source?.ganttDependsOnIds,
        source?.dependsOnIds,
        source?.dependencyIds,
        source?.dependsOnTaskIds,
        source?.dependsOnTaskId,
        source?.dependsOnSubtaskIds,
        source?.dependsOnSubtaskId,
        source?.blockedBy,
        source?.blocked_by,
      ];
      extras.forEach((candidate) => {
        if (candidate === null || candidate === undefined) return;
        if (Array.isArray(candidate)) {
          candidate.forEach((value) => {
            if (value !== null && value !== undefined && value !== '') {
              ids.add(String(value));
            }
          });
        } else if (candidate !== '') {
          ids.add(String(candidate));
        }
      });
      return Array.from(ids);
    };

    const BLOCK_INDEX_KEYS = [
      'ganttBlockIndex',
      'blockIndex',
      'parentBlockIndex',
      '__blockIndex',
      'block_index',
      'blockIdx',
      'meta.blockIndex',
      'metadata.blockIndex',
      'admin.blockIndex',
    ];

    const ITEM_INDEX_KEYS = [
      'ganttItemIndex',
      'itemIndex',
      'parentItemIndex',
      '__itemIndex',
      'item_index',
      'itemIdx',
      'taskIndex',
      'meta.itemIndex',
      'metadata.itemIndex',
      'admin.itemIndex',
      'index',
    ];

    const enrichWithDependencyMeta = (source, base) => {
      const dependsOnRaw = Array.isArray(source?.dependsOn) ? source.dependsOn : [];
      const normalizedDeps = normalizeDependencyList(dependsOnRaw);
      const dependencyIds = collectDependencyIds(normalizedDeps, source || {});
      const blockIndex = extractIndexFromSource(source || {}, BLOCK_INDEX_KEYS);
      const itemIndex = extractIndexFromSource(source || {}, ITEM_INDEX_KEYS);
      return {
        ...base,
        dependsOn: dependsOnRaw,
        ganttDependsOn: normalizedDeps,
        ganttDependsOnIds: dependencyIds,
        ganttBlockIndex: blockIndex,
        ganttItemIndex: itemIndex,
      };
    };

    try {
      // a) Subtareas planas con fechas v�lidas (provenientes del normalizador Gantt)
      const flatScheduled = (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [])
        .filter((t) => String(t.type || 'task') === 'subtask')
        .map((t) => {
          const base = {
            id: String(t.id),
            title: t.name || t.title || fallbackSubtaskLabel,
            desc: t.desc || '',
            category: t.category || 'OTROS',
            start: t.start instanceof Date ? t.start : new Date(t.start),
            end: t.end instanceof Date ? t.end : new Date(t.end),
            assignee: t.assignee || '',
            parentId: t.parentId || '',
            __kind: 'subtask',
          };
          return enrichWithDependencyMeta(t, base);
        });

      // b) Subtareas anidadas (modelo nuevo)
      const nestedSource = (Array.isArray(nestedSubtasks) && nestedSubtasks.length > 0)
        ? nestedSubtasks
        : (Array.isArray(nestedSubtasksFallback) ? nestedSubtasksFallback : []);
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
        const base = {
          id: String(s.id),
          title: s.name || s.title || fallbackSubtaskLabel,
          desc: s.desc || '',
          category: s.category || 'OTROS',
          start,
          end,
          assignee: s.assignee || '',
          parentId: s.parentId || s.parentTaskId || s.parent || parentFromPath || '',
          __kind: 'subtask',
          __path: s.__path || undefined,
        };
        return enrichWithDependencyMeta(s, base);
      });

      // c) Subtareas planas (todas, incluso sin fecha)  siempre incluir para compatibilidad
      const src = Array.isArray(tasksState) ? tasksState : [];
      const flatAll = src
        .filter((t) => String(t?.type || '') === 'subtask')
        .map((t) => {
          const s = t?.start?.toDate ? t.start.toDate() : (t?.start ? new Date(t.start) : null);
          const e = t?.end?.toDate ? t.end.toDate() : (t?.end ? new Date(t.end) : (s || null));
          const base = {
            id: String(t.id),
            title: t.name || t.title || fallbackSubtaskLabel,
            desc: t.desc || '',
            category: t.category || 'OTROS',
            start: s || null,
            end: e || null,
            assignee: t.assignee || '',
            parentId: t.parentId || t.parentTaskId || '',
            __kind: 'subtask',
          };
          return enrichWithDependencyMeta(t, base);
        });

      // Unificar con prioridad: nested > flatScheduled > flatAll
      const byStable = new Map(); // key = `${parentId}:${id}`
      const consider = (item, priority) => {
        try {
          const pid = String(item?.parentId || '');
          const sid = String(item?.id || '');
          if (!sid) return;
          const key = `${pid}:${sid}`;
          if (!byStable.has(key)) {
            byStable.set(key, { item, priority });
            return;
          }
          const cur = byStable.get(key);
          // Reemplazar si la nueva fuente tiene mayor prioridad o aporta fecha donde antes no hab�a
          if (
            priority < cur.priority ||
            (!cur.item?.start && item?.start)
          ) {
            byStable.set(key, { item, priority });
          }
        } catch {}
      };

      // prioridad: 0 nested, 1 flatScheduled, 2 flatAll
      for (const it of nested) consider(it, 0);
      for (const it of flatScheduled) consider(it, 1);
      for (const it of flatAll) consider(it, 2);

      return Array.from(byStable.values()).map((e) => e.item);
    } catch {
      return [];
    }
  }, [uniqueGanttTasks, nestedSubtasks, nestedSubtasksFallback, tasksState]);

  // (se declara ms abajo tras parentNameMap)

  const taskListItems = useMemo(() => {
    const a = Array.isArray(safeMeetingsFiltered) ? safeMeetingsFiltered : [];
    const b = Array.isArray(subtaskEvents) ? subtaskEvents : [];
    return [...a, ...b];
  }, [safeMeetingsFiltered, subtaskEvents]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => measureCalendarColumn());
    return () => cancelAnimationFrame(raf);
  }, [
    measureCalendarColumn,
    calendarContainerHeight,
    currentView,
    calendarDate,
    safeMeetings,
    sortedEvents,
    taskListItems.length,
  ]);

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
        .map((t) => ({ id: String(t.id), name: t.name || t.title || fallbackTaskLabel }));
    } catch {
      return [];
    }
  }, [uniqueGanttTasks]);

  const selectedParent = useMemo(() => {
    if (!selectedParentId) return null;
    const pid = String(selectedParentId);
    const fromGantt = (Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : []).find(
      (t) => String(t?.id || '') === pid && String(t?.type || 'task') === 'task'
    );
    if (fromGantt) return fromGantt;
    const fromState = (Array.isArray(tasksState) ? tasksState : []).find(
      (t) => String(t?.id || '') === pid
    );
    return fromState || null;
  }, [selectedParentId, uniqueGanttTasks, tasksState]);

  const selectedParentSubtasks = useMemo(() => {
    if (!selectedParentId) return [];
    const pid = String(selectedParentId);
    return (Array.isArray(subtaskEvents) ? subtaskEvents : []).filter(
      (sub) => String(sub?.parentId || '') === pid
    );
  }, [selectedParentId, subtaskEvents]);

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
        .map((t) => ({
          id: String(t.id),
          name: t.name || t.title || fallbackTaskLabel,
          start: t.start instanceof Date ? t.start : new Date(t.start),
          type: 'task',
        }));

      const byId = new Map();
      parentsReal.forEach((p) => byId.set(p.id, p));
      const nameById = new Map();
      try {
        const arr = Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
        for (const t of arr) {
          if (String(t?.type || 'task') !== 'task') continue;
          const id = String(t.id || '');
          if (!id) continue;
          nameById.set(id, t.name || t.title || fallbackTaskLabel);
        }
      } catch {}

      const subs = Array.isArray(subtaskEvents) ? subtaskEvents : [];
      const grouped = new Map();
      for (const st of subs) {
        const pid = String(st.parentId || '');
        if (!pid) continue;
        const cur =
          grouped.get(pid) || {
            id: pid,
            name: nameById.get(pid) || fallbackTaskLabel,
            start: st.start instanceof Date ? st.start : new Date(st.start),
            type: 'task',
          };
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
        out[id] = t.name || t.title || fallbackTaskLabel;
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

  const parentRiskMap = useMemo(() => {
    try {
      const map = new Map();
      const parents = (Array.isArray(ganttBaseTasks) ? ganttBaseTasks : []).filter(
        (task) => task && String(task.type || 'task') === 'task'
      );
      if (parents.length === 0) return map;

      const subsByParent = new Map();
      const subs = Array.isArray(subtaskEvents) ? subtaskEvents : [];
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

      const isCompleted = (sub) => {
        if (!sub) return false;
        if (completedIdSet.has(String(sub.id))) return true;
        if (typeof sub.done === 'boolean') return sub.done;
        if (typeof sub.completed === 'boolean') return sub.completed;
        return false;
      };

      for (const sub of subs) {
        if (!sub) continue;
        const pid = String(sub.parentId || '');
        if (!pid) continue;
        const start =
          sub.start instanceof Date
            ? sub.start
            : sub.start
              ? new Date(sub.start)
              : null;
        const end =
          sub.end instanceof Date
            ? sub.end
            : sub.end
              ? new Date(sub.end)
              : start;
        if (!subsByParent.has(pid)) subsByParent.set(pid, []);
        subsByParent.get(pid).push({
          ...sub,
          start,
          end,
          isDone: isCompleted(sub),
        });
      }

      parents.forEach((parent) => {
        const pid = String(parent.id || '');
        if (!pid) return;
        const list = subsByParent.get(pid) || [];
        const total = list.length;
        const completed = list.filter((item) => item.isDone).length;

        const completionPct =
          total > 0 ? Math.round((completed / total) * 100) : Math.round(Number(parent.progress || 0));

        const overdue = list.filter((item) => {
          if (!item.end || !(item.end instanceof Date)) return false;
          const due = new Date(
            item.end.getFullYear(),
            item.end.getMonth(),
            item.end.getDate(),
            0,
            0,
            0,
            0
          );
          return due.getTime() < todayStart.getTime() && !item.isDone;
        }).length;

        const start =
          parent.start instanceof Date ? parent.start : parent.start ? new Date(parent.start) : null;
        const end = parent.end instanceof Date ? parent.end : parent.end ? new Date(parent.end) : null;
        let timeRatio = 0;
        if (start && end) {
          const span = end.getTime() - start.getTime();
          if (span > 0) {
            timeRatio = (todayStart.getTime() - start.getTime()) / span;
            timeRatio = Math.max(0, Math.min(1, timeRatio));
          }
        }
        const expectedProgress = Math.round(timeRatio * 100);

        let level = 'ok';
        let reason = '';
        if (end && end.getTime() < todayStart.getTime() && completionPct < 90) {
          level = 'critical';
          reason = t('tasks.page.notifications.blocks.delayed');
        } else if (overdue > 0 && overdue >= Math.max(2, Math.ceil(total * 0.3))) {
          level = 'critical';
          reason = t('tasks.page.notifications.blocks.overdueSubtasks', { count: overdue });
        } else if (overdue > 0) {
          level = 'warning';
          reason = t('tasks.page.notifications.blocks.overdueSubtasks', { count: overdue });
        } else if (timeRatio > 0.3 && completionPct + 15 < expectedProgress) {
          level = 'warning';
          reason = t('tasks.page.notifications.blocks.progressBehind');
        } else if (completionPct >= 100) {
          level = 'ok';
          reason = t('tasks.page.notifications.blocks.completed');
        }

        map.set(pid, {
          level,
          overdue,
          completionPct,
          expectedProgress,
          message: reason,
        });
      });

      return map;
    } catch (error) {
      console.warn('[Tasks] Error calculando mapa de riesgo', error);
      return new Map();
    }
  }, [ganttBaseTasks, subtaskEvents, completedIdSet]);

  const ganttDisplayTasks = useMemo(() => {
    const base = Array.isArray(ganttBaseTasks) ? ganttBaseTasks : [];
    if (base.length === 0) return base;
    return base.map((task) => {
      if (!task || String(task.type || 'task') !== 'task') return task;
      const pid = String(task.id || '');
      const risk = parentRiskMap.get(pid);
      if (!risk) return task;
      return { ...task, risk };
    });
  }, [ganttBaseTasks, parentRiskMap]);

  const ganttCategoryOptions = useMemo(() => {
    const tasks = Array.isArray(ganttDisplayTasks) ? ganttDisplayTasks : [];
    const categories = new Set();
    for (const task of tasks) {
      if (!task) continue;
      if (String(task.type || 'task') !== 'task') continue;
      categories.add(normalizeCategory(task.category));
    }
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [ganttDisplayTasks, normalizeCategory]);

  const ganttAssigneeOptions = useMemo(() => {
    const tasks = Array.isArray(ganttDisplayTasks) ? ganttDisplayTasks : [];
    const names = new Set();
    let includeUnassigned = false;
    for (const task of tasks) {
      if (!task) continue;
      if (String(task.type || 'task') !== 'task') continue;
      const assignees = extractAssignees(task);
      if (assignees.length === 0) includeUnassigned = true;
      assignees.forEach((name) => names.add(name));
    }
    const ordered = Array.from(names).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    const opts = ordered.map((value) => ({ value, label: value }));
    if (includeUnassigned) {
      opts.push({
        value: GANTT_UNASSIGNED,
        label: t('tasks.page.gantt.filters.assigneeUnassigned'),
      });
    }
    return opts;
  }, [ganttDisplayTasks, extractAssignees, t]);

  const filteredGanttTasks = useMemo(() => {
    const tasks = Array.isArray(ganttDisplayTasks) ? ganttDisplayTasks : [];
    if (!filtersActive) return tasks;
    return tasks.filter((task) => {
      if (!task) return false;
      const type = String(task.type || 'task');
      if (type !== 'task') return true;
      if (ganttCategoryFilter !== 'ALL' && normalizeCategory(task.category) !== ganttCategoryFilter) return false;
      if (ganttRiskFilter !== 'ALL') {
        const riskLevel = String(task?.risk?.level || 'ok');
        if (riskLevel !== ganttRiskFilter) return false;
      }
      if (ganttAssigneeFilter === 'ALL') return true;
      const assignees = extractAssignees(task);
      if (ganttAssigneeFilter === GANTT_UNASSIGNED) return assignees.length === 0;
      return assignees.includes(ganttAssigneeFilter);
    });
  }, [ganttDisplayTasks, filtersActive, ganttCategoryFilter, ganttRiskFilter, ganttAssigneeFilter, normalizeCategory, extractAssignees]);

  const filteredParentIds = useMemo(() => {
    const ids = new Set();
    const tasks = Array.isArray(filteredGanttTasks) ? filteredGanttTasks : [];
    for (const task of tasks) {
      if (!task) continue;
      if (String(task.type || 'task') !== 'task') continue;
      if (!task.id) continue;
      ids.add(String(task.id));
    }
    return ids;
  }, [filteredGanttTasks]);

  const filteredSubtaskEvents = useMemo(() => {
    const base = Array.isArray(subtaskEvents) ? subtaskEvents : [];
    if (!filtersActive) return base;
    if (filteredParentIds.size === 0) return [];
    return base.filter((sub) => {
      if (!sub) return false;
      const pid = String(sub.parentId || '');
      if (pid && !filteredParentIds.has(pid)) return false;
      if (ganttCategoryFilter !== 'ALL' && normalizeCategory(sub.category) !== ganttCategoryFilter) return false;
      if (ganttAssigneeFilter === 'ALL') return true;
      const assignees = extractAssignees(sub);
      if (ganttAssigneeFilter === GANTT_UNASSIGNED) return assignees.length === 0;
      return assignees.includes(ganttAssigneeFilter);
    });
  }, [subtaskEvents, filtersActive, filteredParentIds, ganttCategoryFilter, ganttAssigneeFilter, normalizeCategory, extractAssignees]);

  const totalParentCount = useMemo(() => {
    const tasks = Array.isArray(ganttDisplayTasks) ? ganttDisplayTasks : [];
    return tasks.filter((task) => String(task?.type || 'task') === 'task').length;
  }, [ganttDisplayTasks]);

  const showEmptyGanttState = filtersActive && totalParentCount > 0 && filteredParentIds.size === 0;

  useEffect(() => {
    if (!selectedParentId) return;
    if (!filtersActive) return;
    const pid = String(selectedParentId);
    if (filteredParentIds.size === 0 || !filteredParentIds.has(pid)) {
      setSelectedParentId(null);
    }
  }, [selectedParentId, filtersActive, filteredParentIds]);

  const ganttSizingTasks = useMemo(() => {
    const source = filtersActive ? filteredGanttTasks : ganttDisplayTasks;
    const candidate = (Array.isArray(source) ? source : []).filter((task) => task && task.start && task.end);
    if (candidate.length > 0) return candidate;
    const fallback = Array.isArray(ganttDisplayTasks)
      ? ganttDisplayTasks.filter((task) => task && task.start && task.end)
      : [];
    if (fallback.length > 0) return fallback;
    return Array.isArray(uniqueGanttTasks) ? uniqueGanttTasks : [];
  }, [filtersActive, filteredGanttTasks, ganttDisplayTasks, uniqueGanttTasks]);

  const ganttTasksToRender = useMemo(() => {
    const source = filtersActive ? filteredGanttTasks : ganttDisplayTasks;
    return Array.isArray(source) ? source : [];
  }, [filtersActive, filteredGanttTasks, ganttDisplayTasks]);

  const ganttSubtasksToRender = useMemo(() => {
    const source = filtersActive ? filteredSubtaskEvents : subtaskEvents;
    return Array.isArray(source) ? source : [];
  }, [filtersActive, filteredSubtaskEvents, subtaskEvents]);

  const resolveBlockRange = useCallback((block) => {
    const range = block?.range && typeof block.range === 'object' ? block.range : null;
    const startPct =
      typeof range?.startPct === 'number'
        ? range.startPct
        : typeof block?.p0 === 'number'
        ? block.p0
        : 0;
    const endPctRaw =
      typeof range?.endPct === 'number'
        ? range.endPct
        : typeof block?.p1 === 'number'
        ? block.p1
        : startPct + 0.2;
    const endPct = endPctRaw <= startPct ? startPct + 0.2 : endPctRaw;
    return { startPct, endPct };
  }, []);

  const buildTemplateMeta = useCallback((block, range, version) => {
    const adminMeta = block?.admin && typeof block.admin === 'object' ? block.admin : {};
    const templateKey = String(block?.key || block?.name || '').trim() || null;
    const adminCategory = adminMeta?.category
      ? String(adminMeta.category).toUpperCase()
      : null;
    return {
      key: templateKey,
      version: Number(version) || 1,
      range,
      adminEditable: adminMeta?.editable !== false,
      adminDeletable: adminMeta?.deletable !== false,
      adminCategory,
      panelPath: adminMeta?.panelPath || 'admin/timeline',
    };
  }, []);

  const noTasksScheduled = totalParentCount === 0;

  // Accin manual para crear tareas por defecto
  const handleSeedDefaultTasks = useCallback(async () => {
    if (!activeWedding || !db) return;
    try {
      setSeedingDefaults(true);
      await seedWeddingTasksFromTemplate({
        db,
        weddingId: activeWedding,
        projectEnd,
        skipIfSeeded: true,
        forceRefresh: true,
      });
    } catch (error) {
      console.warn('[Tasks] seed defaults failed', error);
    } finally {
      setSeedingDefaults(false);
    }
  }, [activeWedding, db, projectEnd]);

  // Seed autom�tico de Bloques A-I (padres + subtareas) si no hay tareas
  // Usar ref para ejecutar solo una vez por boda
  const seedAttemptedRef = useRef(new Set());
  useEffect(() => {
    (async () => {
      try {
        if (!activeWedding || !db) return;
        
        // Prevenir múltiples intentos para la misma boda
        if (seedAttemptedRef.current.has(activeWedding)) return;
        
        const hasAny = Array.isArray(tasksState) && tasksState.length > 0;
        if (hasAny) return;
        
        // Marcar como intentado antes de ejecutar
        seedAttemptedRef.current.add(activeWedding);
        
        await seedWeddingTasksFromTemplate({
          db,
          weddingId: activeWedding,
          projectEnd,
          skipIfSeeded: true,
        });
      } catch (error) {
        console.warn('[Tasks] automatic seed failed', error);
        // Si falla, permitir reintentar en el próximo mount
        if (activeWedding) {
          seedAttemptedRef.current.delete(activeWedding);
        }
      }
    })();
  }, [activeWedding, db, projectEnd, tasksState]);
  
  // Hook de dependencias entre tareas
  const allTasksForDeps = useMemo(() => {
    const combined = [
      ...(Array.isArray(tasksState) ? tasksState : []),
      ...(Array.isArray(subtaskEvents) ? subtaskEvents : [])
    ];
    return combined;
  }, [tasksState, subtaskEvents]);

  const { 
    isTaskBlocked, 
    getTaskDependencyStatus, 
    getUnblockedTasks,
    blockedTasksMap 
  } = useTaskDependencies(allTasksForDeps, completedIdSet);

  // Estado para notificaciones de desbloqueo
  const [unlockNotification, setUnlockNotification] = useState(null);

  // Toggle r�pido de completado con detecci�n de desbloqueos
  const toggleCompleteById = useCallback(
    async (id, nextCompleted) => {
      try {
        if (!activeWedding || !id) return;
        
        if (nextCompleted && isTaskBlocked(id)) {
          const depStatus = getTaskDependencyStatus(id);
          const missingNames = depStatus.missingDeps.map(d => d.taskTitle).join(', ');
          toast.warning(t('tasks.page.dependencies.blocked', { tasks: missingNames }));
          return;
        }
        
        const compRef = doc(db, 'weddings', activeWedding, 'tasksCompleted', String(id));
        if (nextCompleted) {
          await setDoc(
            compRef,
            { id: String(id), taskId: String(id), completedAt: serverTimestamp() },
            { merge: true }
          );
          
          const unblocked = getUnblockedTasks(id);
          if (unblocked.length > 0) {
            const unblockedNames = unblocked.map(t => t.title).join(', ');
            setUnlockNotification({
              message: `<� �Excelente! Ahora puedes trabajar en: ${unblockedNames}`,
              timestamp: Date.now()
            });
            
            setTimeout(() => setUnlockNotification(null), 6000);
            console.log('[Dependencies] Tareas desbloqueadas:', unblocked);
          }
        } else {
          await deleteDoc(compRef).catch(() => {});
        }
      } catch (_) {}
    },
    [activeWedding, isTaskBlocked, getTaskDependencyStatus, getUnblockedTasks]
  );

  // Ajuste de Gantt (hooks deben estar a nivel superior del componente)
  useGanttSizing({
    uniqueGanttTasks: ganttSizingTasks,
    projectStart: ganttRangeStart,
    projectEnd: ganttRangeEnd,
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

  // Calcular columna y vista (zoom) para que quepa todo el proceso en una vista// Ajuste reactivo del ancho mediante ResizeObserver para ocupar todo el ancho de la secci�³n// C��lculo de progreso - asegurando que los estados sean arrays
  // Indicador de progreso eliminado

  // 1) Escuchar info de la boda para fijar projectEnd (weddings/{id}/weddingInfo.weddingDate)
  useEffect(() => {
    // Deshabilitado: slo usar weddings/{id}.weddingDate como fuente
    return;
    if (!activeWedding || !db) return;
    try {
      const refPrimary = doc(db, 'weddings', activeWedding, 'weddingInfo');
      const refLegacy = doc(db, 'weddings', activeWedding, 'info', 'weddingInfo');
      // Variacin en minsculas que algunos entornos crean: weddings/{id}/weddinginfo
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

  // 1a-bis) Leer weddingDate desde weddings/{id}/info/weddingInfo (ruta comn)
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

  // 1a) Fallback adicional: leer weddingDate del documento raz weddings/{id}
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
                  /(\d{1,2})\s+de\s+([a-zA-Z����Í��]+)\s+de\s+(\d{4})/
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
                /(\d{1,2})\s+de\s+([a-zA-Z����Í��]+)\s+de\s+(\d{4})/
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
        // Fallback adicional: coleccin de perfiles si existiese
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

  // 2) Crear/actualizar autom�ticamente el evento 'wedding-day' si hay fecha
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
          title: prev?.title || 'D�a de la boda',
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
        <h1 className="page-title">{t('tasks.page.header.title')}</h1>
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded p-4">
          <div className="font-semibold mb-1">{t('tasks.page.common.noWeddingTitle')}</div>
          <div className="text-sm">{t('tasks.page.common.noWeddingDescription')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      <TasksHeader
        onShowAllTasks={() => setShowAllTasks(true)}
        onNewTask={() => {
          resetForm();
          setEditingId(null);
          setEditingPath(null);
          setShowNewTask(true);
        }}
      />

      
      <div className="mt-6 mb-8" ref={ganttContainerRef}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">{t('tasks.page.gantt.title')}</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={showGanttSubtasks}
                onChange={(e) => setShowGanttSubtasks(e.target.checked)}
              />
              {t('tasks.page.gantt.controls.showSubtasks')}
            </label>
            <select
              className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={ganttCategoryFilter}
              onChange={(e) => setGanttCategoryFilter(e.target.value)}
            >
              <option value="ALL">{t('tasks.page.gantt.filters.categoryAll')}</option>
              {ganttCategoryOptions.map((cat) => {
                const pretty = cat ? cat.charAt(0) + cat.slice(1).toLowerCase() : '';
                const label = pretty
                  ? pretty.charAt(0).toUpperCase() + pretty.slice(1)
                  : t('tasks.page.gantt.filters.categoryNone');
                return (
                  <option key={cat} value={cat}>
                    {label}
                  </option>
                );
              })}
            </select>
            <select
              className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={ganttAssigneeFilter}
              onChange={(e) => setGanttAssigneeFilter(e.target.value)}
            >
              <option value="ALL">{t('tasks.page.gantt.filters.assigneeAll')}</option>
              {ganttAssigneeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={ganttRiskFilter}
              onChange={(e) => setGanttRiskFilter(e.target.value)}
            >
              <option value="ALL">{t('tasks.page.gantt.filters.statusAll')}</option>
              <option value="critical">{t('tasks.page.gantt.filters.statusCritical')}</option>
              <option value="warning">{t('tasks.page.gantt.filters.statusWarning')}</option>
              <option value="ok">{t('tasks.page.gantt.filters.statusOk')}</option>
            </select>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <span className="font-medium text-gray-500">
                {t('tasks.page.gantt.controls.zoomLabel')}
              </span>
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
                onClick={handleZoomOut}
                disabled={isZoomMin}
                aria-label={t('tasks.page.calendar.zoom.less')}
              >
                -
              </button>
              <input
                type="range"
                min={minZoomAllowed}
                max={GANTT_ZOOM_MAX}
                step={0.0001}
                value={ganttZoom}
                onChange={(e) => handleZoomSlider(e.target.value)}
                className="w-24 accent-indigo-500"
                aria-label={t('tasks.page.calendar.zoom.label')}
              />
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
                onClick={handleZoomIn}
                disabled={isZoomMax}
                aria-label={t('tasks.page.calendar.zoom.more')}
              >
                +
              </button>
              <button
                type="button"
                className="h-8 px-3 flex items-center justify-center border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition disabled:opacity-40 disabled:hover:bg-transparent"
                onClick={handleFitToScreen}
                disabled={fitZoomValue === null || isFitApplied}
                aria-label={t('tasks.page.calendar.zoom.reset')}
              >
                {t('tasks.page.gantt.controls.fit')}
              </button>
              <span className="w-12 text-right tabular-nums text-gray-500">{zoomPercent}%</span>
            </div>
            {filtersActive && (
              <button
                type="button"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                onClick={() => {
                  setGanttCategoryFilter('ALL');
                  setGanttAssigneeFilter('ALL');
                  setGanttRiskFilter('ALL');
                }}
              >
                {t('tasks.page.gantt.controls.clearFilters')}
              </button>
            )}
          </div>
        </div>
        {showEmptyGanttState ? (
          <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-gray-100 px-6 py-10 text-center text-sm text-gray-500">
            {t('tasks.page.list.empty.filters')}
          </div>
        ) : noTasksScheduled ? (
          <div className="bg-[var(--color-surface)] rounded-xl shadow-md border border-gray-100 px-6 py-10 text-center text-sm text-gray-500">
            {t('tasks.page.gantt.empty.noScheduled')}
          </div>
        ) : (
          <LongTermTasksGantt
            tasks={ganttTasksToRender}
            subtasks={ganttSubtasksToRender}
            projectStart={ganttRangeStart}
            projectEnd={ganttRangeEnd}
            containerRef={ganttContainerRef}
            columnWidth={zoomedColumnWidth}
            rowHeight={40}
            showSubtasks={showGanttSubtasks}
            extendMonthsAfterEnd={GANTT_EXTEND_MONTHS}
            onParentSelect={(task) => {
              if (!task || !task.id) {
                setSelectedParentId(null);
                return;
              }
              setSelectedParentId(String(task.id));
            }}
            onTaskClick={(task) => {
              if (!task) return;
              if (handleTaskIntent(task)) return;
              try {
                const normalizeDate = (value) => {
                  if (!value) return null;
                  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
                  if (typeof value?.toDate === 'function') {
                    const d = value.toDate();
                    return Number.isNaN(d.getTime()) ? null : d;
                  }
                  try {
                    const d = new Date(value);
                    return Number.isNaN(d.getTime()) ? null : d;
                  } catch {
                    return null;
                  }
                };
                const eventStart =
                  normalizeDate(task.start) ||
                  normalizeDate(task.startDate) ||
                  normalizeDate(task.when);
                const eventEnd =
                  normalizeDate(task.end) ||
                  normalizeDate(task.endDate) ||
                  normalizeDate(task.until) ||
                  normalizeDate(task.finish) ||
                  normalizeDate(task.to) ||
                  eventStart;
                if (!eventStart || !eventEnd) {
                  console.warn('[Tasks] Gantt task sin fechas v�lidas al abrir detalle', task);
                  return;
                }
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
        )}
      </div>
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        <div className="w-full lg:flex-1 flex" ref={calendarColumnRef}>
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
        </div>
        <div className="w-full lg:w-1/3 flex">
          <TaskList
            tasks={taskListItems}
            completedSet={completedIdSet}
            onToggleComplete={(id, val) => toggleCompleteById(id, val)}
            parentNameMap={parentNameMap}
            dependencyStatuses={blockedTasksMap}
            containerHeight={calendarColumnHeight ?? calendarContainerHeight}
            onTaskClick={(event) => {
            if (handleTaskIntent(event)) return;
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
            // Navegacin rpida desde el modal si corresponde
            if (handleTaskIntent(task)) return;
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
        />
      )}
      
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
      <TaskSidePanel
        isOpen={Boolean(selectedParent)}
        onClose={() => setSelectedParentId(null)}
        weddingId={activeWedding}
        parent={selectedParent}
        subtasks={selectedParentSubtasks}
      />
    </div>
  );
}
