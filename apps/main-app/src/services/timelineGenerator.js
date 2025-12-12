/**
 * Timeline Generator Service
 * Genera timeline personalizado basado en masterTimelineTemplate.json y fecha de boda
 */

import masterTemplate from '../data/tasks/masterTimelineTemplate.json';

/**
 * Calcula fechas de tareas basadas en porcentajes y fecha de boda
 * @param {Date} weddingDate - Fecha de la boda
 * @param {number} startPct - Porcentaje inicio (0.0 - 1.0)
 * @param {number} endPct - Porcentaje fin (0.0 - 1.0)
 * @returns {Object} {startDate, endDate, daysUntilWedding}
 */
const calculateDatesFromPercentage = (weddingDate, startPct, endPct) => {
  const now = new Date();
  const weddingTime = weddingDate.getTime();
  const nowTime = now.getTime();
  const totalTimeMs = weddingTime - nowTime;
  const totalDays = Math.ceil(totalTimeMs / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) {
    return {
      startDate: now,
      endDate: weddingDate,
      daysUntilWedding: 0,
      isOverdue: true,
    };
  }

  const startDaysFromNow = Math.floor(totalDays * (1 - startPct));
  const endDaysFromNow = Math.floor(totalDays * (1 - endPct));

  const startDate = new Date(nowTime + startDaysFromNow * 24 * 60 * 60 * 1000);
  const endDate = new Date(nowTime + endDaysFromNow * 24 * 60 * 60 * 1000);

  return {
    startDate,
    endDate,
    daysUntilWedding: totalDays,
    isOverdue: false,
  };
};

/**
 * Determina la urgencia de una tarea
 * @param {Date} startDate - Fecha inicio
 * @param {Date} endDate - Fecha fin
 * @param {Date} now - Fecha actual
 * @returns {string} 'overdue' | 'urgent' | 'upcoming' | 'planned'
 */
const getTaskUrgency = (startDate, endDate, now = new Date()) => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const nowTime = now.getTime();

  if (nowTime > endTime) return 'overdue';
  if (nowTime >= startTime && nowTime <= endTime) return 'active';
  
  const daysUntilStart = Math.ceil((startTime - nowTime) / (1000 * 60 * 60 * 24));
  
  if (daysUntilStart <= 7) return 'urgent';
  if (daysUntilStart <= 30) return 'upcoming';
  return 'planned';
};

/**
 * Genera alertas de "última llamada"
 * @param {Date} endDate - Fecha límite
 * @param {string} taskName - Nombre de la tarea
 * @returns {Array} Array de alertas
 */
const generateAlerts = (endDate, taskName) => {
  const now = new Date();
  const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const alerts = [];

  if (daysUntil <= 0) {
    alerts.push({
      type: 'overdue',
      message: `¡Atención! "${taskName}" ya debería estar completada`,
      daysUntil: 0,
      severity: 'critical',
    });
  } else if (daysUntil <= 7) {
    alerts.push({
      type: 'urgent',
      message: `¡Última llamada! "${taskName}" debe completarse en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`,
      daysUntil,
      severity: 'high',
    });
  } else if (daysUntil <= 15) {
    alerts.push({
      type: 'warning',
      message: `"${taskName}" debe completarse en ${daysUntil} días`,
      daysUntil,
      severity: 'medium',
    });
  } else if (daysUntil <= 30) {
    alerts.push({
      type: 'info',
      message: `"${taskName}" - quedan ${daysUntil} días`,
      daysUntil,
      severity: 'low',
    });
  }

  return alerts;
};

/**
 * Genera timeline personalizado completo
 * @param {Date} weddingDate - Fecha de la boda
 * @param {Object} completedTasks - Tareas ya completadas {blockKey: [taskIndex, ...]}
 * @returns {Object} Timeline generado
 */
export const generatePersonalizedTimeline = (weddingDate, completedTasks = {}) => {
  if (!weddingDate || !(weddingDate instanceof Date)) {
    throw new Error('weddingDate debe ser una instancia de Date válida');
  }

  const now = new Date();
  const daysUntilWedding = Math.ceil((weddingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilWedding < 0) {
    return {
      error: 'wedding_passed',
      message: 'La fecha de la boda ya pasó',
      weddingDate,
      blocks: [],
    };
  }

  const blocks = masterTemplate.blocks.map((block) => {
    const { startDate, endDate, isOverdue } = calculateDatesFromPercentage(
      weddingDate,
      block.range.startPct,
      block.range.endPct
    );

    const urgency = getTaskUrgency(startDate, endDate, now);

    const tasks = block.items.map((taskName, index) => {
      const isCompleted = completedTasks[block.key]?.includes(index) || false;
      const taskAlerts = isCompleted ? [] : generateAlerts(endDate, taskName);

      return {
        id: `${block.key}-${index}`,
        name: taskName,
        blockKey: block.key,
        index,
        completed: isCompleted,
        urgency: isCompleted ? 'completed' : urgency,
        alerts: taskAlerts,
      };
    });

    const completedCount = tasks.filter((t) => t.completed).length;
    const progressPercentage = Math.round((completedCount / tasks.length) * 100);

    return {
      ...block,
      startDate,
      endDate,
      isOverdue,
      urgency,
      tasks,
      stats: {
        total: tasks.length,
        completed: completedCount,
        pending: tasks.length - completedCount,
        progressPercentage,
      },
    };
  });

  const allTasks = blocks.flatMap((b) => b.tasks);
  const allAlerts = blocks.flatMap((b) => b.tasks.flatMap((t) => t.alerts));

  const criticalAlerts = allAlerts.filter((a) => a.severity === 'critical');
  const urgentAlerts = allAlerts.filter((a) => a.severity === 'high');

  return {
    weddingDate,
    daysUntilWedding,
    generatedAt: now,
    blocks,
    stats: {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter((t) => t.completed).length,
      pendingTasks: allTasks.filter((t) => !t.completed).length,
      overdueTasks: allTasks.filter((t) => t.urgency === 'overdue').length,
      activeTasks: allTasks.filter((t) => t.urgency === 'active').length,
      urgentTasks: allTasks.filter((t) => t.urgency === 'urgent').length,
      progressPercentage: Math.round(
        (allTasks.filter((t) => t.completed).length / allTasks.length) * 100
      ),
    },
    alerts: {
      critical: criticalAlerts,
      urgent: urgentAlerts,
      all: allAlerts,
    },
  };
};

/**
 * Obtiene tareas urgentes (próximos 30 días)
 * @param {Object} timeline - Timeline generado
 * @returns {Array} Tareas urgentes
 */
export const getUrgentTasks = (timeline) => {
  if (!timeline || !timeline.blocks) return [];

  return timeline.blocks
    .flatMap((block) => block.tasks)
    .filter((task) => !task.completed && ['urgent', 'upcoming', 'active'].includes(task.urgency))
    .sort((a, b) => {
      const urgencyOrder = { active: 0, urgent: 1, upcoming: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
};

/**
 * Obtiene el siguiente hito importante
 * @param {Object} timeline - Timeline generado
 * @returns {Object|null} Siguiente hito
 */
export const getNextMilestone = (timeline) => {
  if (!timeline || !timeline.blocks) return null;

  const activeBlock = timeline.blocks.find((b) => b.urgency === 'active');
  if (activeBlock) return activeBlock;

  const upcomingBlocks = timeline.blocks.filter((b) => 
    ['urgent', 'upcoming'].includes(b.urgency) && b.stats.completed < b.stats.total
  );

  return upcomingBlocks.length > 0 ? upcomingBlocks[0] : null;
};

/**
 * Formatea fecha en español
 * @param {Date} date - Fecha a formatear
 * @param {string} format - 'short' | 'long' | 'relative'
 * @returns {string} Fecha formateada
 */
export const formatTimelineDate = (date, format = 'short') => {
  if (!(date instanceof Date)) return '-';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (format === 'relative') {
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays <= 7) return `En ${diffDays} días`;
    if (diffDays <= 30) return `En ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays <= 365) return `En ${Math.floor(diffDays / 30)} meses`;
    return `En ${Math.floor(diffDays / 365)} años`;
  }

  const options = format === 'long' 
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' };

  return date.toLocaleDateString('es-ES', options);
};

export default {
  generatePersonalizedTimeline,
  getUrgentTasks,
  getNextMilestone,
  formatTimelineDate,
};
