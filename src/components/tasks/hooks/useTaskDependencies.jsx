/**
 * Hook para gestionar dependencias entre tareas
 * Fase 3: Runtime Frontend - Bloqueo/Desbloqueo de tareas
 */

import { useMemo, useCallback } from 'react';

import useTranslations from '../../../hooks/useTranslations';

/**
 * Verifica si una tarea tiene dependencias completadas
 * @param {Object} task - Tarea a verificar
 * @param {Array} allTasks - Todas las tareas disponibles
 * @param {Set} completedSet - Set de IDs de tareas completadas
 * @param {Object} labels - Textos de fallback
 * @returns {Object} Estado de dependencias { isBlocked, missingDeps, completedDeps }
 */
export function checkTaskDependencies(task, allTasks, completedSet, labels = {}) {
  if (!task || !Array.isArray(task.dependsOn) || task.dependsOn.length === 0) {
    return { isBlocked: false, missingDeps: [], completedDeps: [], allDeps: [] };
  }

  const allDeps = [];
  const missingDeps = [];
  const completedDeps = [];

  for (const dep of task.dependsOn) {
    const depTask = findTaskByIndices(allTasks, dep.blockIndex, dep.itemIndex);

    if (!depTask) {
      continue;
    }

    const depInfo = {
      taskId: depTask.id,
      taskTitle:
        dep.itemTitle || depTask.title || labels.fallbackTaskTitle || 'Tarea sin título',
      blockName: dep.blockName || labels.defaultBlock || 'Bloque',
      isCompleted: completedSet.has(String(depTask.id)),
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
    allDeps,
  };
}

function findTaskByIndices(tasks, blockIndex, itemIndex) {
  if (!Array.isArray(tasks)) return null;
  for (const task of tasks) {
    if (task.__blockIndex === blockIndex && task.__itemIndex === itemIndex) {
      return task;
    }
  }
  return null;
}

export function useTaskDependencies(tasks, completedSet) {
  const { t } = useTranslations();

  const labels = useMemo(
    () => ({
      fallbackTaskTitle: t('tasks.page.common.fallbacks.untitledTask', {
        defaultValue: 'Tarea sin título',
      }),
      defaultBlock: t('tasks.page.list.defaults.parent'),
      unblockedTitle: t('tasks.page.common.fallbacks.untitled', { defaultValue: 'Sin título' }),
    }),
    [t]
  );

  const blockedTasksMap = useMemo(() => {
    const map = new Map();

    if (!Array.isArray(tasks)) return map;

    for (const task of tasks) {
      if (!task || !task.id) continue;

      const depStatus = checkTaskDependencies(task, tasks, completedSet, labels);

      if (depStatus.isBlocked || depStatus.allDeps.length > 0) {
        map.set(String(task.id), depStatus);
      }
    }

    return map;
  }, [tasks, completedSet, labels]);

  const isTaskBlocked = useCallback(
    (taskId) => {
      const status = blockedTasksMap.get(String(taskId));
      return status ? status.isBlocked : false;
    },
    [blockedTasksMap]
  );

  const getTaskDependencyStatus = useCallback(
    (taskId) => {
      return blockedTasksMap.get(String(taskId)) || {
        isBlocked: false,
        missingDeps: [],
        completedDeps: [],
        allDeps: [],
      };
    },
    [blockedTasksMap]
  );

  const getUnblockedTasks = useCallback(
    (justCompletedTaskId) => {
      const unblocked = [];

      for (const task of tasks) {
        if (!task || !task.id || !Array.isArray(task.dependsOn)) continue;

        const dependedOnCompleted = task.dependsOn.some((dep) => {
          const depTask = findTaskByIndices(tasks, dep.blockIndex, dep.itemIndex);
          return depTask && String(depTask.id) === String(justCompletedTaskId);
        });

        if (!dependedOnCompleted) continue;

        const newCompletedSet = new Set(completedSet);
        newCompletedSet.add(String(justCompletedTaskId));

        const newStatus = checkTaskDependencies(task, tasks, newCompletedSet, labels);
        const oldStatus = checkTaskDependencies(task, tasks, completedSet, labels);

        if (oldStatus.isBlocked && !newStatus.isBlocked) {
          unblocked.push({
            id: task.id,
            title: task.title || labels.unblockedTitle || labels.fallbackTaskTitle,
            task: task,
          });
        }
      }

      return unblocked;
    },
    [tasks, completedSet, labels]
  );

  return {
    isTaskBlocked,
    getTaskDependencyStatus,
    getUnblockedTasks,
    blockedTasksMap,
  };
}

export function DependencyIndicator({ depStatus }) {
  const { t } = useTranslations();

  if (!depStatus || depStatus.allDeps.length === 0) {
    return null;
  }

  if (depStatus.isBlocked) {
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
        <span>🔒</span>
        <span className="font-medium">
          {t('tasks.page.list.dependencies.blocked', {
            count: depStatus.missingDeps.length,
          })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
      <span>✅</span>
      <span className="font-medium">
        {t('tasks.page.list.dependencies.resolved', {
          count: depStatus.completedDeps.length,
        })}
      </span>
    </div>
  );
}

export function DependencyTooltip({ depStatus }) {
  const { t } = useTranslations();

  if (!depStatus || depStatus.allDeps.length === 0) {
    return null;
  }

  return (
    <div className="text-xs space-y-2">
      {depStatus.missingDeps.length > 0 && (
        <div>
          <div className="font-semibold text-red-700 mb-1">
            {t('tasks.page.list.dependencies.pendingTitle')}
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
            {t('tasks.page.list.dependencies.completedTitle')}
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
