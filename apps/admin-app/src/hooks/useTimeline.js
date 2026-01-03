import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect, useCallback, useRef } from 'react';

import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import useSpecialMoments from './useSpecialMoments';

// Estados posibles de los bloques
const BLOCK_STATES = {
  ON_TIME: 'on-time',
  SLIGHTLY_DELAYED: 'slightly-delayed',
  DELAYED: 'delayed',
};

// Colores para los estados
const STATE_COLORS = {
  [BLOCK_STATES.ON_TIME]: 'green',
  [BLOCK_STATES.SLIGHTLY_DELAYED]: 'yellow',
  [BLOCK_STATES.DELAYED]: 'red',
};

// Bloques por defecto del timeline
const DEFAULT_BLOCKS = [
  {
    id: 'preparativos',
    name: 'Preparativos',
    startTime: '08:00',
    endTime: '11:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'ceremonia',
    name: 'Ceremonia',
    startTime: '11:00',
    endTime: '12:30',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'coctel',
    name: 'Cóctel',
    startTime: '12:30',
    endTime: '14:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'banquete',
    name: 'Banquete',
    startTime: '14:00',
    endTime: '18:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
  {
    id: 'fiesta',
    name: 'Fiesta',
    startTime: '18:00',
    endTime: '02:00',
    status: BLOCK_STATES.ON_TIME,
    alerts: [],
    moments: [],
  },
];

export default function useTimeline() {
  const { activeWedding } = useWedding();
  const { moments: specialMoments } = useSpecialMoments();
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [alerts, setAlerts] = useState([]);
  const [automaticAlerts, setAutomaticAlerts] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const unsubRef = useRef(null);
  const alertTimersRef = useRef({});

  // Sincronizar momentos especiales con el timeline
  useEffect(() => {
    if (!specialMoments) return;

    setBlocks((prev) => {
      const updated = prev.map((block) => {
        // Mapear IDs de bloques (coctail -> coctel)
        const momentBlockId = block.id === 'coctel' ? 'coctail' : block.id;
        const blockMoments = specialMoments[momentBlockId] || [];
        
        // Convertir momentos a formato del timeline
        const timelineMoments = blockMoments.map((moment) => ({
          id: moment.id,
          title: moment.title,
          time: moment.time || block.startTime,
          duration: moment.duration || '15',
          responsible: moment.responsables?.[0]?.name || '',
          status: moment.state || 'pendiente',
          song: moment.song,
          type: moment.type,
        }));

        return {
          ...block,
          moments: timelineMoments,
        };
      });

      return updated;
    });
  }, [specialMoments]);

  // Cargar y suscribirse a cambios en Firestore
  useEffect(() => {
    if (!activeWedding) return;

    const ref = doc(db, 'weddings', activeWedding, 'timeline', 'main');
    
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      
      const data = snap.data();
      if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
      }
      if (data.alerts && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      }
      if (typeof data.automaticAlerts === 'boolean') {
        setAutomaticAlerts(data.automaticAlerts);
      }
    }, (error) => {
      // console.warn('Error al cargar timeline:', error);
    });

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [activeWedding]);

  // Guardar cambios en Firestore
  const saveToFirestore = useCallback(async () => {
    if (!activeWedding || syncInProgress) return;

    setSyncInProgress(true);
    try {
      const ref = doc(db, 'weddings', activeWedding, 'timeline', 'main');
      await setDoc(
        ref,
        {
          blocks,
          alerts,
          automaticAlerts,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      // console.error('Error al guardar timeline:', error);
    } finally {
      setSyncInProgress(false);
    }
  }, [activeWedding, blocks, alerts, automaticAlerts, syncInProgress]);

  // Guardar cambios con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToFirestore();
    }, 1000);

    return () => clearTimeout(timer);
  }, [blocks, alerts, automaticAlerts]);

  // Actualizar bloque
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  }, []);

  // Añadir bloque personalizado
  const addBlock = useCallback((name, startTime, endTime) => {
    const id = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-');

    const newBlock = {
      id,
      name,
      startTime,
      endTime,
      status: BLOCK_STATES.ON_TIME,
      alerts: [],
      moments: [],
    };

    setBlocks((prev) => [...prev, newBlock]);
  }, []);

  // Eliminar bloque
  const removeBlock = useCallback((blockId) => {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId));
  }, []);

  // Reordenar bloques (drag & drop)
  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    setBlocks((prev) => {
      const updated = [...prev];
      const [item] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, item);
      return updated;
    });
  }, []);

  // Cambiar estado de un bloque
  const setBlockStatus = useCallback((blockId, status) => {
    if (!Object.values(BLOCK_STATES).includes(status)) return;

    updateBlock(blockId, { status });

    // Generar alerta automática si está habilitado
    if (automaticAlerts && status !== BLOCK_STATES.ON_TIME) {
      const block = blocks.find((b) => b.id === blockId);
      if (block) {
        const alertType = status === BLOCK_STATES.SLIGHTLY_DELAYED ? 'warning' : 'error';
        const message = status === BLOCK_STATES.SLIGHTLY_DELAYED
          ? `${block.name} tiene un ligero retraso`
          : `${block.name} está retrasado`;

        addAlert(alertType, message, blockId);
      }
    }
  }, [automaticAlerts, blocks, updateBlock]);

  // Añadir alerta manual
  const addAlert = useCallback((type, message, blockId = null) => {
    const alert = {
      id: Date.now(),
      type,
      message,
      blockId,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    setAlerts((prev) => [...prev, alert]);

    // Auto-descartar alertas de información después de 5 minutos
    if (type === 'info') {
      alertTimersRef.current[alert.id] = setTimeout(() => {
        acknowledgeAlert(alert.id);
      }, 300000);
    }
  }, []);

  // Reconocer/descartar alerta
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );

    // Limpiar timer si existe
    if (alertTimersRef.current[alertId]) {
      clearTimeout(alertTimersRef.current[alertId]);
      delete alertTimersRef.current[alertId];
    }
  }, []);

  // Eliminar alerta
  const removeAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));

    // Limpiar timer si existe
    if (alertTimersRef.current[alertId]) {
      clearTimeout(alertTimersRef.current[alertId]);
      delete alertTimersRef.current[alertId];
    }
  }, []);

  // Calcular tiempo restante/excedido para un bloque
  const calculateBlockTiming = useCallback((block) => {
    const now = new Date();
    const [startHour, startMin] = block.startTime.split(':').map(Number);
    const [endHour, endMin] = block.endTime.split(':').map(Number);

    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date();
    if (endHour < startHour) {
      // El bloque cruza medianoche
      endDate.setDate(endDate.getDate() + 1);
    }
    endDate.setHours(endHour, endMin, 0, 0);

    const isActive = now >= startDate && now <= endDate;
    const isPast = now > endDate;
    const isFuture = now < startDate;

    let minutesRemaining = 0;
    let minutesExceeded = 0;

    if (isActive) {
      minutesRemaining = Math.floor((endDate - now) / 60000);
    } else if (isPast) {
      minutesExceeded = Math.floor((now - endDate) / 60000);
    }

    return {
      isActive,
      isPast,
      isFuture,
      minutesRemaining,
      minutesExceeded,
    };
  }, []);

  // Verificar coherencia de horarios
  const validateSchedule = useCallback(() => {
    const issues = [];

    for (let i = 0; i < blocks.length - 1; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];

      const [currEndHour, currEndMin] = current.endTime.split(':').map(Number);
      const [nextStartHour, nextStartMin] = next.startTime.split(':').map(Number);

      const currEndMinutes = currEndHour * 60 + currEndMin;
      let nextStartMinutes = nextStartHour * 60 + nextStartMin;

      // Ajustar si el siguiente bloque es después de medianoche
      if (nextStartHour < currEndHour) {
        nextStartMinutes += 24 * 60;
      }

      if (currEndMinutes > nextStartMinutes) {
        issues.push({
          type: 'overlap',
          blocks: [current.name, next.name],
          message: `${current.name} termina después de que comience ${next.name}`,
        });
      } else if (currEndMinutes < nextStartMinutes) {
        const gap = nextStartMinutes - currEndMinutes;
        if (gap > 60) {
          issues.push({
            type: 'gap',
            blocks: [current.name, next.name],
            message: `Hay ${gap} minutos sin actividad entre ${current.name} y ${next.name}`,
          });
        }
      }
    }

    return issues;
  }, [blocks]);

  // Obtener resumen del estado actual
  const getTimelineSummary = useCallback(() => {
    const activeBlock = blocks.find((block) => {
      const timing = calculateBlockTiming(block);
      return timing.isActive;
    });

    const delayedBlocks = blocks.filter(
      (block) => block.status !== BLOCK_STATES.ON_TIME
    );

    const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);

    const scheduleIssues = validateSchedule();

    return {
      activeBlock,
      delayedBlocks,
      unacknowledgedAlerts,
      scheduleIssues,
      totalBlocks: blocks.length,
      onTimeBlocks: blocks.filter((b) => b.status === BLOCK_STATES.ON_TIME).length,
    };
  }, [blocks, alerts, calculateBlockTiming, validateSchedule]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(alertTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  return {
    // Datos
    blocks,
    alerts,
    automaticAlerts,
    syncInProgress,

    // Gestión de bloques
    updateBlock,
    addBlock,
    removeBlock,
    reorderBlocks,
    setBlockStatus,

    // Gestión de alertas
    addAlert,
    acknowledgeAlert,
    removeAlert,
    setAutomaticAlerts,

    // Utilidades
    calculateBlockTiming,
    validateSchedule,
    getTimelineSummary,

    // Constantes
    BLOCK_STATES,
    STATE_COLORS,
  };
}
