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
import { GanttChart } from './GanttTasks';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import { Calendar } from 'react-big-calendar';
import { awardPoints } from '../../services/GamificationService';

// Importar hooks de Firestore
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { useWedding } from '../../context/WeddingContext';

// FunciÃƒÂ³n helper para cargar datos de Firestore de forma segura con fallbacks
const loadFirestoreData = async (path) => {
  try {
    let data = null;
    // Soportar rutas conocidas con docPath para obtener campos correctos
    if (path.endsWith('/weddingInfo')) {
      // Primero: leer weddingInfo como CAMPO del documento de la boda (weddings/{id})
      try {
        const parentPath = path.replace(/\/weddingInfo$/,'');
        const segments = parentPath.split('/').filter(Boolean);
        if (segments.length >= 2) {
          const ref = doc(db, ...segments);
          const { getDoc } = await import('firebase/firestore');
          const snap = await getDoc(ref);
          const d = snap.exists() ? (snap.data()?.weddingInfo || {}) : {};
          if (d && Object.keys(d).length > 0) data = d;
        }
      } catch {}

      // Segundo: compatibilidad con docPath directo (por si existiera como subdocumento)
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        try {
          const direct = await loadData('weddingInfo', { docPath: path });
          if (direct && typeof direct === 'object') data = direct;
        } catch {}
      }

      // Tercero: fallback al perfil de usuario guardado
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        const profile = await loadData('lovendaProfile', { collection: 'userProfiles' });
        data = (profile && profile.weddingInfo) ? profile.weddingInfo : (profile || {});
      }
    } else if (path.endsWith('/tasksCompleted')) {
      // Documento que guarda tareas completadas como mapa
      data = await loadData('tasksCompleted', { docPath: path });
    } else {
      // Fallback genÃƒÂ©rico: usar la clave tal cual (localStorage / users/{uid})
      data = await loadData(path);
    }
    return data || {};
  } catch (error) {
    console.error('Error cargando datos de Firestore:', error);
    return {};
  }
};

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
  });
  
  const [currentView, setCurrentView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
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
  // Calcular fechas de proyecto: registro (inicio) y boda (fin + 1 mes)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Inicio: fecha de registro del usuario
        let reg = null;
        try {
          const meta = clientAuth?.currentUser?.metadata;
          if (meta?.creationTime) {
            const d = new Date(meta.creationTime);
            if (!isNaN(d.getTime())) reg = d;
          }
        } catch {}
        if (!reg) {
          try {
            const savedProfile = localStorage.getItem('lovenda_user_profile');
            if (savedProfile) {
              const p = JSON.parse(savedProfile);
              if (p?.createdAt) {
                const d = new Date(p.createdAt);
                if (!isNaN(d.getTime())) reg = d;
              }
            }
          } catch {}
        }
        if (!reg) reg = new Date();

        // Fin: fecha de la boda
        let wedding = null;
        try {
          if (activeWedding) {
            const info = await loadFirestoreData(`weddings/${activeWedding}/weddingInfo`);
            const raw = info?.weddingDate || info?.date;
            if (raw) {
              const d = new Date(raw);
              if (!isNaN(d.getTime())) wedding = d;
            }
          }
        } catch {}

        // Fallback intermedio: permitir configurar una fecha por defecto via ENV o localStorage
        if (!wedding) {
          try {
            const parseLooseDate = (val) => {
              if (!val || typeof val !== 'string') return null;
              const trimmed = val.trim();
              // Soportar formato DD/MM/YYYY
              const m = trimmed.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/);
              if (m) {
                const dd = parseInt(m[1], 10);
                const mm = parseInt(m[2], 10) - 1;
                const yy = parseInt(m[3], 10);
                const d = new Date(yy, mm, dd);
                return isNaN(d.getTime()) ? null : d;
              }
              // ISO u otros formatos reconocidos por Date
              const d = new Date(trimmed);
              return isNaN(d.getTime()) ? null : d;
            };

            const envDate = (import.meta?.env?.VITE_DEFAULT_WEDDING_DATE) ? String(import.meta.env.VITE_DEFAULT_WEDDING_DATE) : null;
            const lsDate = localStorage.getItem('lovenda_default_wedding_date') || null;
            const candidate = parseLooseDate(envDate) || parseLooseDate(lsDate);
            if (candidate) wedding = candidate;
          } catch {}
        }

        // Fallback fin: usar el mayor end de tasks/meetings o +6 meses
        if (!wedding) {
          const ends = [];
          try {
            if (Array.isArray(tasksState)) {
              tasksState.forEach(t => {
                const d = t?.end ? new Date(t.end?.toDate?.() || t.end) : null;
                if (d && !isNaN(d.getTime())) ends.push(d);
              });
            }
            if (Array.isArray(meetingsState)) {
              meetingsState.forEach(m => {
                const d = m?.end ? new Date(m.end?.toDate?.() || m.end) : null;
                if (d && !isNaN(d.getTime())) ends.push(d);
              });
            }
          } catch {}
          if (ends.length) {
            wedding = new Date(Math.max(...ends.map(d => d.getTime())));
          } else {
            const plus6 = new Date(reg.getTime());
            plus6.setMonth(plus6.getMonth() + 6);
            wedding = plus6;
          }
        }

        // Asegurar orden
        if (wedding.getTime() <= reg.getTime()) {
          const nextDay = new Date(reg.getTime() + 24 * 60 * 60 * 1000);
          wedding = nextDay;
        }

        // Guardar fecha de registro y fecha de boda (el rango visible se extiende +1 mes en los límites)
        if (isMounted) {
          setProjectStart(reg);
          setProjectEnd(wedding);
        }
      } catch {}
    })();
    return () => { isMounted = false; };
  }, [activeWedding, clientAuth?.currentUser, tasksState, meetingsState]);

  // Crear/actualizar automaticamente la cita del dia de la boda en el calendario (solo meetings)
  useEffect(() => {
    if (!activeWedding) return;
    if (!projectEnd) return; // necesitamos fecha de boda
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    try {
      const weddingDate = new Date(projectEnd);
      if (isNaN(weddingDate.getTime())) return;

      const already = Array.isArray(meetingsState) && meetingsState.some(m => {
        try {
          const ms = m?.start ? (typeof m.start.toDate === 'function' ? m.start.toDate() : new Date(m.start)) : null;
          return m?.autoKey === 'wedding-day' || m?.id === 'wedding-day' || ((m?.title && /boda/i.test(String(m.title))) && ms && sameDay(ms, weddingDate));
        } catch { return false; }
      });
      if (already) return;

      const start = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate(), 10, 0, 0);
      const end = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate(), 23, 59, 0);
      const payload = {
        id: 'wedding-day',
        title: 'Dia de la boda',
        desc: 'Evento principal',
        start,
        end,
        allDay: true,
        category: 'OTROS',
        autoKey: 'wedding-day',
        createdAt: serverTimestamp()
      };
      if (clientDb) {
        const ref = doc(clientDb, 'weddings', activeWedding, 'meetings', 'wedding-day');
        setDoc(ref, payload, { merge: true }).catch(() => {});
      } else {
        addMeetingFS(payload).catch(() => {});
      }
    } catch (e) {
      console.warn('No se pudo crear el evento automatico del dia de la boda:', e?.message || e);
    }
  }, [activeWedding, projectEnd, meetingsState]);
  // Ocultar completamente la lista izquierda del Gantt
  const listCellWidth = "";
  // Altura de fila del Gantt
  const rowHeight = 44;
  // Ref para medir el contenedor del Gantt y ajustar el ancho de columna
  const ganttContainerRef = useRef(null);

  // Manejar eventos de calendario externos
  useEffect(() => {
    const handler = (evt) => {
      const meeting = evt?.detail?.meeting;
      if (meeting && meeting.start && meeting.end && meeting.title) {
        addMeeting(meeting);
      }
    };
    window.addEventListener('lovenda-tasks', handler);
    return () => window.removeEventListener('lovenda-tasks', handler);
  }, [meetingsState]);

  // FunciÃƒÂ³n para aÃƒÂ±adir una reuniÃƒÂ³n
  const addMeeting = useCallback(async (meeting) => {
    await addMeetingFS({
      ...meeting,
      title: meeting.title || 'Nueva reuniÃƒÂ³n',
      start: new Date(meeting.start),
      end: new Date(meeting.end)
    });
  }, [addMeetingFS]);

  // GeneraciÃƒÂ³n automÃƒÂ¡tica de timeline si estÃƒÂ¡ vacÃƒÂ­o
  useEffect(() => {
    // Desactivado: solo se desea el hito automÃƒÂ¡tico de la fecha de la boda en el Gantt
    return;
    if (!activeWedding) return;
    // Evitar regenerar si ya se generÃƒÂ³ para esta boda
    const flagKey = `lovenda_timeline_generated_${activeWedding}`;
    if (localStorage.getItem(flagKey) === 'true') return;

    const alreadyHasItems = Array.isArray(tasksState) && tasksState.length > 0 || Array.isArray(meetingsState) && meetingsState.length > 0;
    if (alreadyHasItems) return;

    (async () => {
      try {
        const info = await loadFirestoreData(`weddings/${activeWedding}/weddingInfo`);
        const dateRaw = info?.weddingDate || info?.date; // distintos esquemas
        const baseDate = dateRaw ? new Date(dateRaw) : null;
        if (!baseDate || isNaN(baseDate.getTime())) return;

        const addMonths = (d, delta) => { const x = new Date(d.getTime()); x.setMonth(x.getMonth() + delta); return x; };

        // DefiniciÃƒÂ³n mÃƒÂ­nima de tareas base (M1)
        const plan = [
          { monthsBefore: 12, title: 'Reservar lugar de celebraciÃƒÂ³n', category: 'LUGAR' },
          { monthsBefore: 9,  title: 'Contratar fotÃƒÂ³grafo', category: 'FOTOGRAFO' },
          { monthsBefore: 9,  title: 'Contratar catering', category: 'COMIDA' },
          { monthsBefore: 6,  title: 'Enviar Save the Date', category: 'INVITADOS' },
          { monthsBefore: 6,  title: 'Vestuario: iniciar pruebas', category: 'VESTUARIO' },
          { monthsBefore: 3,  title: 'Enviar invitaciones', category: 'PAPELERIA' },
          { monthsBefore: 1,  title: 'Confirmar asistentes y mesas', category: 'INVITADOS' },
          { monthsBefore: 1,  title: 'Prueba de menÃƒÂº con catering', category: 'COMIDA' },
        ];

        // Evitar duplicados por tÃƒÂ­tulo si el usuario ya aÃƒÂ±adiÃƒÂ³ algo manualmente
        const existingTitles = new Set([
          ...(Array.isArray(tasksState) ? tasksState.map(t => (t?.title || t?.name || '').toLowerCase()) : []),
          ...(Array.isArray(meetingsState) ? meetingsState.map(m => (m?.title || '').toLowerCase()) : []),
        ]);

        for (const item of plan) {
          const start = addMonths(baseDate, -item.monthsBefore);
          const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2h por defecto
          const title = item.title;
          if (existingTitles.has(title.toLowerCase())) continue;
          // Para simplicidad: crear como tarea Gantt (largo plazo) o evento puntual
          // HeurÃƒÂ­stica: hitos clave como eventos, resto como tareas largas de ~15 dÃƒÂ­as
          const milestoneTitles = ['Enviar Save the Date', 'Enviar invitaciones', 'Confirmar asistentes y mesas'];
          if (milestoneTitles.includes(title)) {
            // Evento puntual (calendario)
            await addMeetingFS({ title, start, end, category: item.category });
          } else {
            // Tarea de largo plazo (Gantt) de 15 dÃƒÂ­as
            const endTask = new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000);
            await addTaskFS({
              id: `auto-${item.monthsBefore}-${Date.now()}`,
              name: title,
              title,
              desc: '',
              start,
              end: endTask,
              category: item.category,
              type: 'task',
              progress: 0,
              isDisabled: false,
              dependencies: []
            });
          }
        }

        localStorage.setItem(flagKey, 'true');
        // Otorgar puntos de gamificaciÃƒÂ³n por crear timeline automÃƒÂ¡ticamente (no intrusivo)
        try {
          await awardPoints(activeWedding, 'create_timeline', { source: 'auto' });
        } catch (e) {
          // best-effort; no bloquear si falla
          console.warn('Gamification awardPoints fallÃƒÂ³:', e?.message || e);
        }
      } catch (err) {
        console.warn('No se pudo generar timeline automÃƒÂ¡tico:', err?.message);
      }
    })();
  }, [activeWedding, tasksState, meetingsState, addMeetingFS, addTaskFS]);

  // Estado para tareas completadas (inicial vacÃƒÂ­o, se cargarÃƒÂ¡ asÃƒÂ­ncronamente)
  const [completed, setCompleted] = useState({});

  // Cargar tareas completadas de Firestore/Storage sin bloquear render
  useEffect(() => {
    if (!activeWedding) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await loadFirestoreData(`weddings/${activeWedding}/tasksCompleted`);
        if (isMounted && data && typeof data === 'object' && !Array.isArray(data)) {
          setCompleted(data);
        }
      } catch (error) {
        console.error('Error cargando tasksCompleted:', error);
      }
    })();
    return () => { isMounted = false; };
  }, [activeWedding]);

  // Suscribirse al estado de sincronizaciÃƒÂ³n
  useEffect(() => {
    return subscribeSyncState(setSyncStatus);
  }, []);

  // Guardar cambios cuando cambie el estado (evitando sobrescribir con datos vacÃƒÂ­os al inicio)
  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [tasksState, activeWedding]);

  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [meetingsState, activeWedding]);

  useEffect(() => {
    if (dataLoadedRef.current) {
      // No es necesario guardar cambios ya que se utiliza Firestore
    }
  }, [completed, activeWedding]);

  // Sugerencia automÃƒÂ¡tica de categorÃƒÂ­a
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
  const validateAndNormalizeDate = (date) => {
    if (!date) return null;
    
    let validDate = date;
    // Aceptar Timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
      validDate = date.toDate();
    } else if (!(date instanceof Date)) {
      try {
        validDate = new Date(date);
      } catch (e) {
        return null;
      }
    }
    
    return isNaN(validDate.getTime()) ? null : validDate;
  };

  // Asegurar que todos los eventos tengan los campos necesarios
  const safeEvents = allEvents
    .filter(event => event !== null && event !== undefined)
    .map(event => {
      // Verificar que start y end existan
      if (!event.start || !event.end) {
        return null;
      }
      
      // Asegurar que start y end sean objetos Date vÃƒÂ¡lidos
      const start = validateAndNormalizeDate(event.start);
      const end = validateAndNormalizeDate(event.end);
      
      // Si alguna fecha no es vÃƒÂ¡lida, descartar evento
      if (!start || !end) {
        return null;
      }
      
      // Devolver evento normalizado
      return {
        ...event,
        start,
        end,
        title: event.title || event.name || "Sin tÃƒÂ­tulo"
      };
    })
    .filter(Boolean); // Eliminar eventos nulos

    // Ordenar eventos por fecha para uso posterior (listas, etc.)
    const sortedTasks = [...safeEvents].sort((a, b) => a.start - b.start);

  // Solo tareas puntuales (no procesos) para la lista: normalizar solo meetings
  const safeMeetingsRaw = (Array.isArray(meetingsState) ? meetingsState : [])
    .filter(event => event !== null && event !== undefined)
    .map(event => {
      if (!event.start || !event.end) return null;
      const start = validateAndNormalizeDate(event.start);
      const end = validateAndNormalizeDate(event.end);
      if (!start || !end) return null;
      return {
        ...event,
        start,
        end,
        title: event.title || event.name || 'Sin tÃƒÂ­tulo',
      };
    })
    .filter(Boolean);
  // De-duplicar por id para evitar claves repetidas en la lista
  const safeMeetings = (() => {
    const seen = new Set();
    const unique = [];
    for (const ev of safeMeetingsRaw) {
      const key = ev.id || `${ev.title}-${ev.start?.toISOString?.() ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(ev);
    }
    return unique;
  })();

  // Ocultar el hito automatico de la boda en la lista, pero mantenerlo en el sistema
  const safeMeetingsFiltered = Array.isArray(safeMeetings)
    ? safeMeetings.filter(ev => ev.id !== 'wedding-day' && ev.autoKey !== 'wedding-day')
    : [];

  // Filtro especÃƒÂ­fico para tareas del componente Gantt
  const taskIdSet = new Set(Array.isArray(tasksState) ? tasksState.filter(Boolean).map(t => t?.id).filter(Boolean) : []);

  const safeGanttTasks = Array.isArray(tasksState) 
    ? tasksState
        .filter(task => task !== null && task !== undefined)
        .map(task => {
          // Verificar que start y end existan
          if (!task.start || !task.end) {
            return null;
          }
          
          // Validar fechas
          const start = validateAndNormalizeDate(task.start);
          const end = validateAndNormalizeDate(task.end);
          
          // Si alguna fecha no es vÃƒÂ¡lida, descartar tarea
          if (!start || !end) {
            return null;
          }
          
          // Sanear dependencias para que solo contengan IDs de tareas existentes
          const deps = Array.isArray(task.dependencies)
            ? task.dependencies.filter(dep => taskIdSet.has(dep))
            : [];

          // Devolver tarea normalizada para formato Gantt
          return {
            ...task,
            start,
            end,
            name: task.name || task.title || "Sin tÃƒÂ­tulo",
            type: task.type || "task",
            id: task.id,
            progress: task.progress || 0,
            isDisabled: task.isDisabled || false,
            dependencies: deps
          };
        })
        .filter(Boolean) // Eliminar tareas nulas
    : [];

  // Capa extra de seguridad: descartar cualquier tarea con fechas no vÃƒÂ¡lidas antes de pintar
  const ganttTasksStrict = Array.isArray(safeGanttTasks)
    ? safeGanttTasks.filter(t => t && t.start instanceof Date && t.end instanceof Date && !isNaN(t.start.getTime()) && !isNaN(t.end.getTime()))
    : [];

  // Capa ultra-defensiva: aceptar campos legacy y descartar cualquier resto invÃƒÂ¡lido
  const __normalizeDate = (d) => {
    try {
      if (!d) return null;
      if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
      if (typeof d?.toDate === 'function') { const x = d.toDate(); return isNaN(x.getTime()) ? null : x; }
      if (typeof d === 'number') { const n = new Date(d); return isNaN(n.getTime()) ? null : n; }
      const parsed = new Date(d); return isNaN(parsed.getTime()) ? null : parsed;
    } catch { return null; }
  };
  const finalGanttTasks = Array.isArray(ganttTasksStrict)
    ? ganttTasksStrict
        .map(t => {
          if (!t) return null;
          const startRaw = t.start ?? t.startDate ?? t.date ?? t.when;
          const endRaw = t.end ?? t.endDate ?? t.until ?? t.finish ?? t.to;
          const start = __normalizeDate(startRaw);
          const end = __normalizeDate(endRaw);
          if (!start || !end || end < start) return null;
          return { ...t, start, end };
        })
        .filter(Boolean)
    : [];

  // De-duplicar por id para evitar claves repetidas en gantt-task-react (Row/RowLine)
  const uniqueGanttTasks = (() => {
    const seen = new Set();
    const out = [];
    for (const t of finalGanttTasks) {
      // Si falta id, generamos uno estable a partir de nombre+fechas
      const stableId = t.id || `${t.name || t.title || 't'}-${t.start?.toISOString?.() ?? ''}-${t.end?.toISOString?.() ?? ''}`;
      if (seen.has(stableId)) continue;
      seen.add(stableId);
      // Forzar que el id usado por la librerÃƒÂ­a sea el estable
      out.push({ ...t, id: stableId });
    }
    return out;
  })();

  const uniqueGanttTasksMemo = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const t of finalGanttTasks) {
      const stableId = t.id || `${t.name || t.title || 't'}-${t.start?.toISOString?.() ?? ''}-${t.end?.toISOString?.() ?? ''}`;
      if (seen.has(stableId)) continue;
      seen.add(stableId);
      out.push({ ...t, id: stableId });
    }
    return out;
  }, [finalGanttTasks]);

  // Extender el rango visual del Gantt para cubrir registro -> boda (con fallbacks)
  const ganttTasksBounded = useMemo(() => {
    const base = Array.isArray(uniqueGanttTasksMemo) ? uniqueGanttTasksMemo : [];
    const out = [];
    const addMonths = (d, m) => { const x = new Date(d.getTime()); x.setMonth(x.getMonth() + m); return x; };
    let startBound = (projectStart instanceof Date && !isNaN(projectStart.getTime())) ? projectStart : null;
    let endBound = (projectEnd instanceof Date && !isNaN(projectEnd.getTime())) ? projectEnd : null;

    // Fallback: usar meeting 'wedding-day' como fin si falta
    if (!endBound) {
      try {
        const m = (Array.isArray(meetingsState) ? meetingsState : []).find(ev => ev?.id === 'wedding-day' || ev?.autoKey === 'wedding-day');
        if (m?.start) {
          const d = typeof m.start.toDate === 'function' ? m.start.toDate() : new Date(m.start);
          if (!isNaN(d.getTime())) endBound = d;
        }
      } catch {}
    }

    if (!startBound && endBound) startBound = addMonths(endBound, -6);
    if (startBound && !endBound) endBound = addMonths(startBound, 6);

    if (startBound && endBound) {
      const endPlusOneMonth = addMonths(endBound, 1);
      // Limitar las tareas duras al rango visible
      for (const t of base) {
        try {
          const s = t?.start instanceof Date ? t.start : (t?.start ? new Date(t.start) : null);
          const e = t?.end instanceof Date ? t.end : (t?.end ? new Date(t.end) : null);
          if (!s || !e) continue;
          const cs = new Date(Math.max(s.getTime(), startBound.getTime()));
          const ce = new Date(Math.min(e.getTime(), endPlusOneMonth.getTime()));
          if (ce.getTime() < cs.getTime()) continue;
          out.push({ ...t, start: cs, end: ce });
        } catch {}
      }
      out.push({
        id: '__gantt_bounds',
        name: '',
        start: new Date(startBound),
        end: new Date(endPlusOneMonth),
        type: 'project',
        progress: 0,
        isDisabled: true,
        styles: {
          backgroundColor: 'transparent',
          backgroundSelectedColor: 'transparent',
          progressColor: 'transparent',
          progressSelectedColor: 'transparent',
        },
      });
      // No aÃ±adimos milestones visibles para evitar rombos en el grid; la marca se dibuja como bandera superpuesta.
    }

    // Si por cualquier motivo sigue vacÃ­o, crear un rango mÃ­nimo alrededor de hoy
    if (out.length === 0) {
      const today = new Date();
      const start = addMonths(today, -1);
      const end = addMonths(today, 1);
      out.push({ id: '__gantt_bounds_fallback', name: '', start, end, type: 'project', progress: 0, isDisabled: true, styles: { backgroundColor: 'transparent', backgroundSelectedColor: 'transparent', progressColor: 'transparent', progressSelectedColor: 'transparent' } });
    }
    // milestone visual desactivado (se usa bandera superpuesta en Gantt)
    return out;
  }, [uniqueGanttTasksMemo, projectStart, projectEnd, meetingsState]);

  // Fecha de marcador (boda) para el Gantt: derivar del meeting 'wedding-day' o weddingInfo (no usar projectEnd porque ya es +1 mes)
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
  
  // Calcular columna y vista (zoom) para que quepa todo el proceso en una vista
  useEffect(() => {
    if (!Array.isArray(uniqueGanttTasksMemo) || uniqueGanttTasksMemo.length === 0) return;
    // Si ya tenemos rango de proyecto, dejamos que el ResizeObserver gestione el ancho
    if (projectStart && projectEnd) return;
    // Medir ancho disponible
    const container = ganttContainerRef.current;
    const containerWidth = container && container.clientWidth ? container.clientWidth : 800;

    // Rango temporal (modo mes) usando las tareas actuales
    const starts = uniqueGanttTasksMemo
      .map(t => (t?.start instanceof Date ? t.start : (t?.start ? new Date(t.start) : null)))
      .filter(d => d && !isNaN(d));
    const ends = uniqueGanttTasksMemo
      .map(t => (t?.end instanceof Date ? t.end : (t?.end ? new Date(t.end) : null)))
      .filter(d => d && !isNaN(d));
    if (starts.length === 0 || ends.length === 0) return;
    const minStart = new Date(Math.min(...starts.map(d => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map(d => d.getTime())));

    // Elegir viewMode segÃƒÂºn duraciÃƒÂ³n total
    const msSpan = Math.max(1, maxEnd.getTime() - minStart.getTime());
    const daysSpan = Math.max(1, Math.ceil(msSpan / (1000 * 60 * 60 * 24)));
    let targetMode = ViewMode.Month;
    if (daysSpan > 730) targetMode = ViewMode.Year; // >2 aÃƒÂ±os
    else if (daysSpan > 120) targetMode = ViewMode.Month; // >4 meses
    else if (daysSpan > 21) targetMode = ViewMode.Week; // >3 semanas
    else targetMode = ViewMode.Day; // <=3 semanas

    // Calcular unidades visibles segÃƒÂºn el modo elegido
    let units = 1;
    if (targetMode === ViewMode.Year) {
      const startYear = minStart.getFullYear();
      const endYear = maxEnd.getFullYear();
      units = (endYear - startYear) + 1;
    } else if (targetMode === ViewMode.Month) {
      const startMonth = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
      const endMonth = new Date(maxEnd.getFullYear(), maxEnd.getMonth(), 1);
      units = (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1;
    } else if (targetMode === ViewMode.Week) {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      units = Math.max(1, Math.ceil((maxEnd - minStart) / msPerWeek) + 1);
    } else if (targetMode === ViewMode.Day) {
      units = daysSpan; // inclusivo
    }

    // Forzar vista mensual para mostrar meses y encajar todo el proyecto
    const startMonth = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
    const endMonth = new Date(maxEnd.getFullYear(), maxEnd.getMonth(), 1);
    units = (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1;
    targetMode = ViewMode.Month;

    // Sin pasos previos para no aÃƒÂ±adir espacio vacÃƒÂ­o
    const pre = 0;
    const totalUnits = units + pre;

    // Calcular ancho de columna para encajar sin scroll horizontal (lÃƒÂ­mites por modo)
    // Column width calculado para encajar sin scroll
    const MIN_COL = 72; // meses largos (Septiembre) sin solaparse
    const MAX_COL = 160; // px mÃƒÂ¡ximo
    const computedCol = Math.max(MIN_COL, Math.min(MAX_COL, Math.floor(containerWidth / totalUnits)));

    if (columnWidthState !== computedCol) setColumnWidthState(computedCol);
    if (ganttPreSteps !== pre) setGanttPreSteps(pre);
    if (!ganttViewDate || (ganttViewDate instanceof Date ? ganttViewDate.getTime() : Number(ganttViewDate)) !== minStart.getTime()) setGanttViewDate(minStart);
    if (ganttViewMode !== targetMode) setGanttViewMode(targetMode);

    // Recalcular en resize
    const onResize = () => {
      const w = ganttContainerRef.current?.clientWidth || 800;
      const col = Math.max(MIN_COL, Math.min(MAX_COL, Math.floor(w / totalUnits)));
      if (columnWidthState !== col) setColumnWidthState(col);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [tasksState, meetingsState, uniqueGanttTasksMemo, columnWidthState, ganttPreSteps, ganttViewDate, ganttViewMode, projectStart, projectEnd]);

  // Ajuste reactivo del ancho mediante ResizeObserver para ocupar todo el ancho de la secciÃƒÂ³n
  useEffect(() => {
    if (!projectStart || !projectEnd) return;
    if (!ganttContainerRef.current) return;

    const MIN_COL = 72; // meses largos (Septiembre) sin solaparse
    const MAX_COL = 160;

    const computeForWidth = (width) => {
      const startMonth = new Date(projectStart.getFullYear(), projectStart.getMonth(), 1);
      const endMonthBase = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), 1);
      const endMonth = new Date(endMonthBase.getFullYear(), endMonthBase.getMonth() + 1, 1);
      const units = Math.max(1, (endMonth.getFullYear() - startMonth.getFullYear()) * 12 + (endMonth.getMonth() - startMonth.getMonth()) + 1);
      const col = Math.max(MIN_COL, Math.min(MAX_COL, Math.floor(width / units)));
      if (columnWidthState !== col) setColumnWidthState(col);
      if (!ganttViewDate || (ganttViewDate instanceof Date ? ganttViewDate.getTime() : Number(ganttViewDate)) !== startMonth.getTime()) setGanttViewDate(startMonth);
      if (ganttViewMode !== ViewMode.Month) setGanttViewMode(ViewMode.Month);
    };

    const el = ganttContainerRef.current;
    computeForWidth(el.clientWidth || 800);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(entries => {
        const w = entries?.[0]?.contentRect?.width || el.clientWidth || 800;
        computeForWidth(w);
      });
      ro.observe(el);
    } else {
      const onResize = () => computeForWidth(ganttContainerRef.current?.clientWidth || 800);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    return () => { if (ro) ro.disconnect(); };
  }, [projectStart, projectEnd, columnWidthState, ganttViewDate, ganttViewMode]);

  // CÃƒÂ¡lculo de progreso - asegurando que los estados sean arrays
  // Indicador de progreso eliminado

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 pb-32">
      
      <div className="flex items-center justify-between">
        <h1 className="page-title">Gestión de Tareas</h1>
        <div className="flex items-center space-x-4">
          {/* Indicador de sincronizaciÃƒÂ³n */}
          <div className="flex items-center">
            {syncStatus.isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-yellow-500 mr-2" />
            ) : syncStatus.isOnline ? (
              syncStatus.pendingChanges ? (
                <Cloud className="w-4 h-4 text-orange-500 mr-2" />
              ) : (
                <Cloud className="w-4 h-4 text-green-500 mr-2" />
              )
            ) : (
              <CloudOff className="w-4 h-4 text-red-500 mr-2" />
            )}
            <div className="text-sm text-gray-500">
              {syncStatus.isOnline
                ? syncStatus.isSyncing
                  ? "Sincronizando..."
                  : syncStatus.pendingChanges
                  ? "Cambios pendientes"
                  : "Sincronizado"
                : "Sin conexiÃƒÂ³n"}
            </div>
          </div>
          {/* Botones de acciÃƒÂ³n */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                resetForm();
                setShowNewTask(true);
              }}
              className="bg-pink-500 text-white px-4 py-2 rounded-md transition-colors hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
            >
              Nueva Tarea
            </button>
          </div>
        </div>
      </div>
      
      {/* Componente para el diagrama Gantt */}
      <div className="bg-[var(--color-surface)] rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Tareas a Largo Plazo</h2>
        <div ref={ganttContainerRef} className="w-full overflow-hidden mb-4 border border-gray-100 rounded-lg" style={{ minHeight: (Array.isArray(ganttTasksBounded) ? ganttTasksBounded.length : 0) * rowHeight + 60 }}>
          {ganttTasksBounded && ganttTasksBounded.length > 0 ? (
            <GanttChart 
              tasks={ganttTasksBounded} 
              viewMode={ViewMode.Month}
              listCellWidth={listCellWidth}
              columnWidth={columnWidthState}
              rowHeight={rowHeight}
              ganttHeight={ganttTasksBounded.length * rowHeight}
              preStepsCount={ganttPreSteps}
              viewDate={ganttViewDate}
              markerDate={weddingMarkerDate}
              gridStartDate={(() => {
                const s = (projectStart instanceof Date && !isNaN(projectStart.getTime())) ? projectStart : (weddingMarkerDate || null);
                return s ? new Date(s.getFullYear(), s.getMonth(), 1) : undefined;
              })()}
              gridEndDate={(() => {
                const e = (projectEnd instanceof Date && !isNaN(projectEnd.getTime())) ? projectEnd : (weddingMarkerDate || null);
                if (!e) return undefined;
                // Último día del mes siguiente a la boda
                const base = new Date(e.getFullYear(), e.getMonth(), 1);
                const lastDayNextMonth = new Date(base.getFullYear(), base.getMonth() + 2, 0);
                return lastDayNextMonth;
              })()}
              onTaskClick={(task) => {
                // Abrir modal de ediciÃƒÂ³n para tareas de largo plazo
                setEditingId(task.id);
                setFormData({
                  title: task.title,
                  desc: task.desc || '',
                  category: task.category || 'OTROS',
                  startDate: task.start.toISOString().slice(0, 10),
                  startTime: task.start.toTimeString().slice(0,5),
                  endDate: task.end.toISOString().slice(0, 10),
                  endTime: task.end.toTimeString().slice(0,5),
                  long: true,
                });
                setShowNewTask(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[color:var(--color-text)]/70">
              No hay tareas de largo plazo que mostrar
            </div>
          )}
        </div>
        {/* Indicador de progreso general eliminado por solicitud */}
      </div>
      
      {/* Contenedor responsivo para Calendario y Lista */}
      <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendario de eventos */}
      <div className="flex-1 bg-[var(--color-surface)] rounded-xl shadow-md p-6 mt-4 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Calendario de Eventos</h2>
        
        {/* Controles de navegaciÃƒÂ³n del calendario */}
        <div className="flex justify-between items-center mb-4">
          <div className="space-x-2">
            <button 
              className={`px-3 py-1 rounded ${currentView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('month')}
            >
              Mes
            </button>
            <button 
              className={`px-3 py-1 rounded ${currentView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('week')}
            >
              Semana
            </button>
            <button 
              className={`px-3 py-1 rounded ${currentView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setCurrentView('day')}
            >
              DÃƒÂ­a
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setCalendarDate(newDate);
              }}
            >
              &#8592; Anterior
            </button>
            <button 
              className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200"
              onClick={() => setCalendarDate(new Date())}
            >
              Hoy
            </button>
            <button 
              className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
              onClick={() => {
                const newDate = new Date(calendarDate);
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setCalendarDate(newDate);
              }}
            >
              Siguiente &#8594;
            </button>
          </div>
        </div>
        
        
        <div className="rbc-calendar-container">
          {/* Componente Calendar con protecciÃƒÂ³n de errores */}
          <ErrorBoundary
            fallback={(
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Error al cargar el calendario</h3>
                  <p className="text-gray-600">Hubo un problema al cargar el calendario. Puedes gestionar tus eventos a travÃƒÂ©s de la lista inferior.</p>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto p-2">
                  {safeEvents && safeEvents.length > 0 ? (
                    sortedTasks
                      .map(event => {
                        const eventId = event.id || '';
                        const eventTitle = event.title || event.name || "Evento sin tÃƒÂ­tulo";
                        const eventStart = event.start instanceof Date ? event.start : new Date();
                        const formattedDate = eventStart.toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        return (
                          <div 
                            key={eventId} 
                            className="flex items-center p-3 border rounded-md hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                              setEditingId(eventId);
                              setFormData({
                                title: eventTitle,
                                desc: event.desc || '',
                                category: event.category || 'OTROS',
                                startDate: eventStart.toISOString().slice(0, 10),
                                startTime: eventStart.toTimeString().slice(0, 5),
                                endDate: event.end instanceof Date ? event.end.toISOString().slice(0, 10) : eventStart.toISOString().slice(0, 10),
                                endTime: event.end instanceof Date ? event.end.toTimeString().slice(0, 5) : '',
                                long: false,
                              });
                              setShowNewTask(true);
                            }}
                          >
                            <div className="mr-3">
                              <input 
                                type="checkbox" 
                                checked={completed[eventId] || false} 
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleCompleted(eventId);
                                }} 
                              />
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${completed[eventId] ? 'line-through text-gray-400' : ''}`}>{eventTitle}</div>
                              <div className="text-xs text-gray-500">{formattedDate}</div>
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categories[event.category || 'OTROS']?.color || '#ccc' }} />
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center text-gray-500">No hay tareas disponibles</div>
                  )}
                </div>
              </div>
            )}
          >
            <div className="calendar-container" style={{ height: '500px' }}>
              <style>{`
                /* Estilos para el contenedor del calendario */
                .calendar-container .rbc-calendar {
                  width: 100%;
                  height: 100%;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                }
                
                /* Ocultamos la barra de herramientas nativa ya que usamos nuestros botones */
                .calendar-container .rbc-toolbar {
                  display: none;
                }
                
                /* Estilos para la vista de mes */
                .calendar-container .rbc-month-view {
                  flex: 1;
                  height: 100%;
                  min-height: 400px;
                  display: flex;
                  flex-direction: column;
                  flex: 1 0 0;
                }
                
                /* Cabecera del mes */
                .calendar-container .rbc-month-header {
                  display: flex;
                  flex-direction: row;
                  font-weight: bold;
                  background-color: #f8f9fa;
                  border-bottom: 1px solid #ddd;
                }
                
                .calendar-container .rbc-header {
                  padding: 8px 3px;
                  text-align: center;
                  border-bottom: 1px solid #ddd;
                  flex: 1 0;
                }
                
                /* Filas del mes */
                .calendar-container .rbc-month-row {
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
                  flex: 1;
                  min-height: 0;
                }
                
                /* Celdas de dÃƒÂ­as */
                .calendar-container .rbc-day-bg {
                  flex: 1 0;
                  border-bottom: 1px solid #eee;
                  border-left: 1px solid #eee;
                  cursor: pointer;
                }
                
                .calendar-container .rbc-date-cell {
                  padding: 4px 5px 0 0;
                  text-align: right;
                  font-size: 0.9em;
                }
                
                .calendar-container .rbc-row-segment {
                  padding: 0 1px 1px 1px;
                }
                
                /* Eventos en el calendario */
                .calendar-container .rbc-event {
                  border-radius: 3px;
                  font-size: 0.85em;
                  padding: 2px 5px;
                  margin: 1px 2px;
                }

                /* Estilos para corregir la altura de las filas */
                .calendar-container .rbc-month-view .rbc-month-row {
                  height: 100% !important;
                  display: flex !important;
                  flex: 1 1 0 !important;
                  flex-flow: column !important;
                }
                
                .calendar-container .rbc-row-content {
                  flex: 1 1 0;
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                }
                
                .calendar-container .rbc-row {
                  display: flex;
                  flex: 1 1 0;
                  width: 100%;
                }
              `}</style>
              <Calendar
                localizer={localizer}
                events={safeMeetings}
                date={calendarDate}
                onNavigate={date => setCalendarDate(date)}
                startAccessor="start"
                endAccessor="end"
                views={{
                  month: true,
                  week: true,
                  day: true
                }}
                view={currentView}
                onView={setCurrentView}
                toolbar={false}
                popup={true}
                eventPropGetter={eventStyleGetter}
                components={{ event: Event }}
                onDoubleClickEvent={(event) => {
                  setEditingId(event.id);
                  setFormData({
                    title: event.title,
                    desc: event.desc || '',
                    category: event.category || 'OTROS',
                    startDate: event.start.toISOString().slice(0, 10),
                    startTime: event.start.toTimeString().slice(0, 5),
                    endDate: event.end.toISOString().slice(0, 10),
                    endTime: event.end.toTimeString().slice(0, 5),
                    long: false,
                  });
                  setShowNewTask(true);
                }}
                messages={{
                  next: "Siguiente",
                  previous: "Anterior",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "DÃƒÂ­a"
                }}
              />
            </div>
          </ErrorBoundary>
        </div>

      </div>

      {false && (
        <div className="w-full">
          <div className="calendar-container" style={{ height: '500px' }}>
            <style>{`
              /* Estilos para el contenedor del calendario */
              .calendar-container .rbc-calendar {
                width: 100%;
                height: 100%;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              
              /* Ocultamos la barra de herramientas nativa ya que usamos nuestros botones */
              .calendar-container .rbc-toolbar {
                display: none;
              }
              
              /* Estilos para la vista de mes */
              .calendar-container .rbc-month-view {
                flex: 1;
                height: 100%;
                min-height: 400px;
                display: flex;
                flex-direction: column;
                flex: 1 0 0;
              }
              
              /* Cabecera del mes */
              .calendar-container .rbc-month-header {
                display: flex;
                flex-direction: row;
                font-weight: bold;
                background-color: #f8f9fa;
                border-bottom: 1px solid #ddd;
              }
              
              .calendar-container .rbc-header {
                padding: 8px 3px;
                text-align: center;
                border-bottom: 1px solid #ddd;
                flex: 1 0;
              }
              
              /* Filas del mes */
              .calendar-container .rbc-month-row {
                display: flex;
                flex-direction: column;
                overflow: hidden;
                flex: 1;
                min-height: 0;
              }
              
              /* Celdas de dÃƒÂ­as */
              .calendar-container .rbc-day-bg {
                flex: 1 0;
                border-bottom: 1px solid #eee;
                border-left: 1px solid #eee;
                cursor: pointer;
              }
              
              .calendar-container .rbc-date-cell {
                padding: 4px 5px 0 0;
                text-align: right;
                font-size: 0.9em;
              }
              
              .calendar-container .rbc-row-segment {
                padding: 0 1px 1px 1px;
              }
              
              /* Eventos en el calendario */
              .calendar-container .rbc-event {
                border-radius: 3px;
                font-size: 0.85em;
                padding: 2px 5px;
                margin: 1px 2px;
              }

              /* Estilos para corregir la altura de las filas */
              .calendar-container .rbc-month-view .rbc-month-row {
                height: 100% !important;
                display: flex !important;
                flex: 1 1 0 !important;
                flex-flow: column !important;
              }
              
              .calendar-container .rbc-row-content {
                flex: 1 1 0;
                display: flex;
                flex-direction: column;
                width: 100%;
              }
              
              .calendar-container .rbc-row {
                display: flex;
                flex: 1 1 0;
                width: 100%;
              }
            `}</style>
              <Calendar
                localizer={localizer}
                events={safeMeetings}
                date={calendarDate}
                onNavigate={date => setCalendarDate(date)}
                startAccessor="start"
                endAccessor="end"
              views={{
                month: true,
                week: true,
                day: true
              }}
              view={currentView}
              onView={setCurrentView}
              toolbar={false}
              popup={true}
              eventPropGetter={eventStyleGetter}
              components={{ event: Event }}
              onDoubleClickEvent={(event) => {
                setEditingId(event.id);
                setFormData({
                  title: event.title,
                  desc: event.desc || '',
                  category: event.category || 'OTROS',
                  startDate: event.start.toISOString().slice(0, 10),
                  startTime: event.start.toTimeString().slice(0, 5),
                  endDate: event.end.toISOString().slice(0, 10),
                  endTime: event.end.toTimeString().slice(0, 5),
                  long: false,
                });
                setShowNewTask(true);
              }}
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "DÃƒÂ­a"
              }}
            />
          </div>
        </div>
      )}
       <div className="bg-white rounded-xl shadow-md p-6 mt-4 lg:mt-0 lg:w-80 flex-none transition-all hover:shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Listado de Tareas</h2>
        <div className="w-full">
          <TaskList 
            tasks={safeMeetingsFiltered} 
            onTaskClick={(event) => {
              setEditingId(event.id);
              setFormData({
                title: event.title,
                desc: event.desc || '',
                category: event.category || 'OTROS',
                startDate: event.start.toISOString().slice(0, 10),
                startTime: event.start.toTimeString().slice(0,5),
                endDate: event.end.toISOString().slice(0, 10),
                endTime: event.end.toTimeString().slice(0,5),
                long: false
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
     </div>
   );
}









