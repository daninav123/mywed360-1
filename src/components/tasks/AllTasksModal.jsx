import React, { useMemo, useCallback } from 'react';

import { categories } from './CalendarComponents.jsx';
import BaseModal from '../ui/BaseModal.jsx';

/**
 * Modal: Lista completa de tareas agrupadas por tarea padre
 * - Muestra todas las subtareas ordenadas por su bloque/tarea padre
 * - Permite marcar como completadas desde la lista
 */
export default function AllTasksModal({
  isOpen,
  onClose,
  parents = [], // array de tareas padre (type === 'task')
  subtasks = [], // array de subtareas normalizadas { id, title, start: Date, end: Date, parentId, __kind: 'subtask' }
  completedSet, // Set de ids completados
  onToggleComplete, // (id, checked) => void
  onTaskClick, // (task) => void
}) {
  // Padres ordenados por fecha de inicio
  const sortedParents = useMemo(() => {
    try {
      const arr = Array.isArray(parents) ? parents : [];
      return arr
        .filter((p) => String(p?.type || 'task') === 'task' && !p.isDisabled)
        .map((p) => ({
          id: String(p.id),
          name: p.name || p.title || 'Tarea',
          start: p.start instanceof Date ? p.start : p.start ? new Date(p.start) : null,
        }))
        .sort((a, b) => {
          const as = a.start instanceof Date && !isNaN(a.start) ? a.start.getTime() : 0;
          const bs = b.start instanceof Date && !isNaN(b.start) ? b.start.getTime() : 0;
          return as - bs;
        });
    } catch (_) {
      return [];
    }
  }, [parents]);

  // Agrupar subtareas por parentId y ordenarlas dentro del grupo
  const grouped = useMemo(() => {
    const map = new Map();
    const orphans = [];
    const items = Array.isArray(subtasks) ? subtasks : [];
    for (const st of items) {
      if (!st) continue;
      const pid = String(st.parentId || '');
      const start = st.start instanceof Date ? st.start : st.start ? new Date(st.start) : null;
      const norm = { ...st, start };
      if (pid) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(norm);
      } else {
        orphans.push(norm);
      }
    }
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => {
        const as = a.start instanceof Date && !isNaN(a.start) ? a.start.getTime() : 0;
        const bs = b.start instanceof Date && !isNaN(b.start) ? b.start.getTime() : 0;
        return as - bs;
      });
    }
    orphans.sort((a, b) => {
      const as = a.start instanceof Date && !isNaN(a.start) ? a.start.getTime() : 0;
      const bs = b.start instanceof Date && !isNaN(b.start) ? b.start.getTime() : 0;
      return as - bs;
    });
    return { map, orphans };
  }, [subtasks]);

  const renderSubtaskRow = useCallback(
    (st) => {
      const cat = categories[st.category] || categories.OTROS;
      const isCompleted = completedSet ? completedSet.has(String(st.id)) : false;
      return (
        <div
          key={st.id}
          className="flex items-start gap-3 p-2 rounded border border-gray-200 hover:shadow-sm cursor-pointer"
          style={{ backgroundColor: `${cat.bgColor}25`, borderColor: cat.borderColor }}
          onClick={() => typeof onTaskClick === 'function' && onTaskClick(st)}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={isCompleted}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              if (typeof onToggleComplete === 'function') {
                onToggleComplete(String(st.id), e.target.checked);
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <div
              className={`flex items-center gap-2 ${isCompleted ? 'line-through text-gray-500' : ''}`}
            >
              <div className="font-medium truncate">{st.title || st.name || 'Tarea'}</div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${cat.bgColor}30`,
                  color: cat.color,
                  borderColor: cat.borderColor,
                }}
              >
                {cat.name}
              </span>
            </div>
            {st.start && (
              <div className="text-xs text-gray-600">
                {st.start.toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
            {st.assignee && <div className="text-xs text-gray-500">Asignado a: {st.assignee}</div>}
          </div>
        </div>
      );
    },
    [completedSet, onToggleComplete, onTaskClick]
  );

  const scrollToGanttParent = (parentId) => {
    try {
      const el = document.getElementById(`gantt-row-parent-${parentId}`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    } catch {}
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Todas las tareas" size="xl" scrollable>
      <div className="space-y-6">
        {sortedParents.map((p) => {
          const items = grouped.map.get(p.id) || [];
          return (
            <div key={p.id} className="">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-gray-800">
                  {p.name}
                  <span className="ml-2 text-xs text-gray-500">({items.length})</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:underline"
                  onClick={() => scrollToGanttParent(p.id)}
                  title="Ver bloque en Gantt"
                >
                  Ver en Gantt
                </button>
              </div>
              {items.length > 0 ? (
                <div className="grid gap-2">{items.map(renderSubtaskRow)}</div>
              ) : (
                <div className="text-xs text-gray-500">Sin subtareas</div>
              )}
            </div>
          );
        })}

        {grouped.orphans.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2">
              Sin padre{' '}
              <span className="ml-2 text-xs text-gray-500">({grouped.orphans.length})</span>
            </div>
            <div className="grid gap-2">{grouped.orphans.map(renderSubtaskRow)}</div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
