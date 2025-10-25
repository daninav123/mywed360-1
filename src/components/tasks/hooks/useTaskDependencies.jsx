/**
 * Hook para gestionar dependencias entre tareas
 * Fase 3: Runtime Frontend - Bloqueo/Desbloqueo de tareas
 */

import { useMemo, useCallback } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

/**
 * Verifica si una tarea tiene dependencias completadas
 * @param {Object} task - Tarea a verificar
 * @param {Array} allTasks - Todas las tareas disponibles
 * @param {Set} completedSet - Set de IDs de tareas completadas
 * @returns {Object} Estado de dependencias { isBlocked, missingDeps, completedDeps }
 */
export function checkTaskDependencies(task, allTasks, completedSet) {
  const { t } = useTranslations();

  if (!task || !Array.isArray(task.dependsOn) || task.dependsOn.length === 0) {
    return { isBlocked: false, missingDeps: [], completedDeps: [], allDeps: [] };
  }

  const allDeps = [];
  const missingDeps = [];
  const completedDeps = [];

  for (const dep of task.dependsOn) {
    // Encontrar la tarea dependencia
    const depTask = findTaskByIndices(allTasks, dep.blockIndex, dep.itemIndex);
    
    if (!depTask) {
      // Dependencia no encontrada (posiblemente eliminada)
      continue;
    }

    const depInfo = {
      taskId: depTask.id,
      taskTitle: dep.itemTitle || depTask.title || {t('common.tarea_sin_titulo')},
      blockName: dep.blockName || 'Bloque',
      isCompleted: completedSet.has(String(depTask.id))
    };

    allDeps.push(depInfo);

    if (depInfo.isCompleted) {
      completedDeps.push(depInfo);
    } else {
      missingDeps.push(depInfo);
    }
  }

  return {
    isBlocked: missingDeps.length > 0,
    missingDeps,
    completedDeps,
    allDeps
  };
}

/**
 * Encuentra una tarea por sus índices de bloque e ítem
 * @param {Array} tasks - Array de tareas
 * @param {number} blockIndex - Índice del bloque padre
 * @param {number} itemIndex - Índice del ítem dentro del bloque
 * @returns {Object|null} Tarea encontrada o null
 */
function findTaskByIndices(tasks, blockIndex, itemIndex) {
  if (!Array.isArray(tasks)) return null;

  // Las tareas vienen aplanadas, necesitamos reconstruir la estructura
  // o usar metadata adicional si existe
  for (const task of tasks) {
    if (task.__blockIndex === blockIndex && task.__itemIndex === itemIndex) {
      return task;
    }
  }

  return null;
}

/**
 * Hook principal para gestión de dependencias
 * @param {Array} tasks - Array de todas las tareas
 * @param {Set} completedSet - Set de IDs de tareas completadas
 * @returns {Object} Utilidades para manejar dependencias
 */
export function useTaskDependencies(tasks, completedSet) {
  // Memoizar el mapa de tareas bloqueadas
  const blockedTasksMap = useMemo(() => {
    const map = new Map();

    if (!Array.isArray(tasks)) return map;

    for (const task of tasks) {
      if (!task || !task.id) continue;

      const depStatus = checkTaskDependencies(task, tasks, completedSet);
      
      if (depStatus.isBlocked || depStatus.allDeps.length > 0) {
        map.set(String(task.id), depStatus);
      }
    }

    return map;
  }, [tasks, completedSet]);

  // Verificar si una tarea está bloqueada
  const isTaskBlocked = useCallback(
    (taskId) => {
      const status = blockedTasksMap.get(String(taskId));
      return status ? status.isBlocked : false;
    },
    [blockedTasksMap]
  );

  // Obtener estado de dependencias de una tarea
  const getTaskDependencyStatus = useCallback(
    (taskId) => {
      return blockedTasksMap.get(String(taskId)) || {
        isBlocked: false,
        missingDeps: [],
        completedDeps: [],
        allDeps: []
      };
    },
    [blockedTasksMap]
  );

  // Obtener todas las tareas desbloqueadas después de completar una tarea
  const getUnblockedTasks = useCallback(
    (justCompletedTaskId) => {
      const unblocked = [];

      for (const task of tasks) {
        if (!task || !task.id || !Array.isArray(task.dependsOn)) continue;

        // Verificar si esta tarea dependía de la recién completada
        const dependedOnCompleted = task.dependsOn.some(dep => {
          const depTask = findTaskByIndices(tasks, dep.blockIndex, dep.itemIndex);
          return depTask && String(depTask.id) === String(justCompletedTaskId);
        });

        if (!dependedOnCompleted) continue;

        // Verificar si ahora está desbloqueada
        // Crear un nuevo Set incluyendo la tarea recién completada
        const newCompletedSet = new Set(completedSet);
        newCompletedSet.add(String(justCompletedTaskId));

        const newStatus = checkTaskDependencies(task, tasks, newCompletedSet);
        const oldStatus = checkTaskDependencies(task, tasks, completedSet);

        // Si antes estaba bloqueada y ahora no
        if (oldStatus.isBlocked && !newStatus.isBlocked) {
          unblocked.push({
            id: task.id,
            title: task.title || {t('common.sin_titulo')},
            task: task
          });
        }
      }

      return unblocked;
    },
    [tasks, completedSet]
  );

  return {
    isTaskBlocked,
    getTaskDependencyStatus,
    getUnblockedTasks,
    blockedTasksMap
  };
}

/**
 * Componente de indicador visual de dependencias
 * @param {Object} depStatus - Estado de dependencias { isBlocked, missingDeps, completedDeps }
 * @returns {JSX.Element|null}
 */
export function DependencyIndicator({ depStatus }) {
  if (!depStatus || depStatus.allDeps.length === 0) {
    return null;
  }

  if (depStatus.isBlocked) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
        <span>🔒</span>
        <span className="font-medium">
          Bloqueada ({depStatus.missingDeps.length} pendiente{depStatus.missingDeps.length !== 1 ? 's' : ''})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
      <span>✅</span>
      <span className="font-medium">
        Dependencias OK ({depStatus.completedDeps.length})
      </span>
    </div>
  );
}

/**
 * Tooltip con detalle de dependencias
 * @param {Object} depStatus - Estado de dependencias
 * @returns {JSX.Element|null}
 */
export function DependencyTooltip({ depStatus }) {
  if (!depStatus || depStatus.allDeps.length === 0) {
    return null;
  }

  return (
    <div className="text-xs space-y-2">
      {depStatus.missingDeps.length > 0 && (
        <div>
          <div className="font-semibold text-red-700 mb-1">
            Tareas pendientes para desbloquear:
          </div>
          <ul className="space-y-1">
            {depStatus.missingDeps.map((dep, idx) => (
              <li key={idx} className="flex items-start gap-1 text-red-600">
                <span>❌</span>
                <span>{dep.taskTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {depStatus.completedDeps.length > 0 && (
        <div>
          <div className="font-semibold text-green-700 mb-1">
            Tareas completadas:
          </div>
          <ul className="space-y-1">
            {depStatus.completedDeps.map((dep, idx) => (
              <li key={idx} className="flex items-start gap-1 text-green-600">
                <span>✅</span>
                <span>{dep.taskTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
