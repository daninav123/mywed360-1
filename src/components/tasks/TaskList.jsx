import React, { useEffect, useMemo, useState } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { formatDate } from '../../utils/formatUtils';
import { categories } from './CalendarComponents.jsx';
import { DependencyIndicator, DependencyTooltip } from './hooks/useTaskDependencies.jsx';

const DEFAULT_PAGE_SIZE = 4;

export default function TaskList({
  tasks,
  onTaskClick,
  maxItems = DEFAULT_PAGE_SIZE,
  completedSet,
  onToggleComplete,
  parentNameMap = {},
  dependencyStatuses = new Map(),
  containerHeight = null,
}) {
  const todayStart = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }, []);

  const targetHeight = useMemo(() => {
    if (!containerHeight) return null;
    return Math.max(0, containerHeight);
  }, [containerHeight]);

  const [pageSize, setPageSize] = useState(() => Math.max(1, Number(maxItems) || DEFAULT_PAGE_SIZE));
  const [page, setPage] = useState(0);

  useEffect(() => {
    const explicit = Math.max(1, Number(maxItems) || DEFAULT_PAGE_SIZE);
    if (!targetHeight) {
      setPageSize(explicit);
      return;
    }
    const HEADER_RESERVE = 120;
    const FOOTER_RESERVE = 72;
    const CARD_APPROX = 122;
    const available = Math.max(CARD_APPROX, targetHeight - HEADER_RESERVE - FOOTER_RESERVE);
    const computed = Math.max(1, Math.floor(available / CARD_APPROX));
    setPageSize(Math.max(1, Math.min(explicit, computed)));
  }, [maxItems, targetHeight]);

  const sortedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    const dedup = new Map();
    tasks.forEach((task) => {
      if (!task) return;
      const key = task.id ?? `${task.title}-${task.start?.toISOString?.() ?? ''}`;
      if (!dedup.has(key)) dedup.set(key, task);
    });

    const filtered = Array.from(dedup.values()).filter((task) => {
      if (!task) return false;
      if (task.__kind === 'subtask') return true;
      const start =
        task?.start instanceof Date ? task.start : task?.start ? new Date(task.start) : null;
      const end =
        task?.end instanceof Date
          ? task.end
          : task?.end
          ? new Date(task.end)
          : start;
      if (!start) return false;

      const completed = completedSet ? completedSet.has(String(task.id)) : Boolean(task.completed);
      if (!completed && end instanceof Date && end < todayStart) return true;
      return !end || end >= todayStart || start >= todayStart;
    });

    return filtered.sort((a, b) => {
      const aIsSub = a?.__kind === 'subtask';
      const bIsSub = b?.__kind === 'subtask';
      if (aIsSub && bIsSub) {
        const aTitle = String(a?.title || a?.name || '').toLowerCase();
        const bTitle = String(b?.title || b?.name || '').toLowerCase();
        return aTitle.localeCompare(bTitle);
      }
      if (aIsSub) return -1;
      if (bIsSub) return 1;
      const aStart = a?.start instanceof Date ? a.start.getTime() : Number.MAX_SAFE_INTEGER;
      const bStart = b?.start instanceof Date ? b.start.getTime() : Number.MAX_SAFE_INTEGER;
      return aStart - bStart;
    });
  }, [tasks, completedSet, todayStart]);

  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [pageSize, sortedTasks.length]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const startIndex = page * pageSize;
  const pagedTasks = sortedTasks.slice(startIndex, startIndex + pageSize);

  const subtaskItems = pagedTasks.filter((task) => task?.__kind === 'subtask');
  const meetingItems = pagedTasks.filter((task) => task?.__kind !== 'subtask');

  const groupedSubtasks = useMemo(() => {
    const map = new Map();
    subtaskItems.forEach((task) => {
      const pid = String(task.parentId || '');
      if (!pid) return;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(task);
    });
    map.forEach((list) =>
      list.sort((a, b) =>
        String(a?.title || a?.name || '').toLowerCase().localeCompare(
          String(b?.title || b?.name || '').toLowerCase()
        )
      )
    );
    return map;
  }, [subtaskItems]);

  const isTaskOverdue = (task, completed) => {
    const end =
      task?.end instanceof Date
        ? task.end
        : task?.end
        ? new Date(task.end)
        : task?.start instanceof Date
        ? task.start
        : null;
    return !completed && end instanceof Date && end < todayStart;
  };

  const scrollToGanttParent = (parentId) => {
    try {
      const el = document.getElementById(`gantt-row-parent-${parentId}`);
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {}
  };

  const containerStyle = targetHeight
    ? { height: targetHeight, minHeight: targetHeight, maxHeight: targetHeight }
    : undefined;

  return (
    <div
      className="flex-1 rounded-xl shadow-md overflow-hidden h-full flex flex-col bg-[var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-text)]/10"
      style={containerStyle}
    >
      <div className="px-4 py-3 border-b border-[color:var(--color-text)]/10">
        <h2 className="text-lg font-semibold">Tareas críticas de esta semana</h2>
        <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-[color:var(--color-text)]/60">
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-3 space-y-3 flex-1 overflow-y-auto">
        {Array.from(groupedSubtasks.entries()).map(([pid, items]) => {
          const parentName = parentNameMap[pid] || 'Bloque';
          return (
            <div key={`group-${pid}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-[color:var(--color-text)]/80">
                  {parentName}
                </div>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:underline"
                  onClick={() => scrollToGanttParent(pid)}
                >
                  Ver en Gantt
                </button>
              </div>
              {items.map((event) => {
                const cat = categories[event.category] || categories.OTROS;
                const completed = completedSet ? completedSet.has(String(event.id)) : false;
                const depStatus = dependencyStatuses.get(String(event.id));
                const isBlocked = depStatus?.isBlocked || false;
                const overdue = isTaskOverdue(event, completed);

                const cardClasses = [
                  'p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer',
                  isBlocked && !completed ? 'opacity-60' : '',
                  overdue ? 'border-red-400 bg-red-50/80' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                const cardStyle = overdue
                  ? { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' }
                  : {
                      borderColor: isBlocked && !completed ? '#ef4444' : cat.borderColor,
                      backgroundColor:
                        isBlocked && !completed ? '#fee2e2' : `${cat.bgColor}40`,
                    };

                return (
                  <div
                    key={event.id}
                    className={cardClasses}
                    onClick={() => onTaskClick(event)}
                    style={cardStyle}
                    title={isBlocked ? 'Tarea bloqueada por dependencias' : undefined}
                  >
                    <div className="flex items-start">
                      <div className="mr-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={completed}
                          disabled={isBlocked && !completed}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleComplete?.(String(event.id), e.target.checked);
                          }}
                          className={isBlocked && !completed ? 'cursor-not-allowed opacity-50' : ''}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`font-medium ${overdue ? 'text-red-700' : ''}`}>
                            {event.title}
                          </div>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${cat.bgColor}30`,
                              color: cat.color,
                              border: `1px solid ${cat.borderColor}`,
                            }}
                          >
                            {cat.name}
                          </span>
                          {overdue && (
                            <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              Vencida
                            </span>
                          )}
                          {depStatus && <DependencyIndicator depStatus={depStatus} />}
                        </div>
                        {event.desc && (
                          <div
                            className={`text-[13px] mt-1 line-clamp-2 ${
                              overdue ? 'text-red-700/90' : 'text-[color:var(--color-text)]/70'
                            }`}
                          >
                            {event.desc}
                          </div>
                        )}
                        {event.assignee && (
                          <div className="text-[11px] text-[color:var(--color-text)]/60 mt-1">
                            Asignado a: {event.assignee}
                          </div>
                        )}
                        {depStatus && depStatus.allDeps.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <DependencyTooltip depStatus={depStatus} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {meetingItems.map((event) => {
          const cat = categories[event.category] || categories.OTROS;
          const completed = completedSet ? completedSet.has(String(event.id)) : false;
          const overdue = isTaskOverdue(event, completed);

          const cardClasses = [
            'p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer',
            overdue ? 'border-red-400 bg-red-50/80' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const cardStyle = overdue
            ? { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)' }
            : { borderColor: cat.borderColor, backgroundColor: `${cat.bgColor}40` };

          return (
            <div
              key={event.id}
              className={cardClasses}
              onClick={() => onTaskClick(event)}
              style={cardStyle}
            >
              <div className="flex items-start">
                <div className="mr-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={completed}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleComplete?.(String(event.id), e.target.checked);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className={`font-medium mb-0.5 ${overdue ? 'text-red-700' : ''}`}>
                    {event.title}
                  </div>
                  {overdue && (
                    <span className="inline-flex items-center text-[10px] font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-1">
                      Vencida
                    </span>
                  )}
                  <div className="text-[11px] text-[color:var(--color-text)]/60">
                    {event.start ? formatDate(event.start, 'custom') + ' ' + event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  {event.desc && (
                    <div
                      className={`text-[13px] mt-1 line-clamp-2 ${
                        overdue ? 'text-red-700/90' : 'text-[color:var(--color-text)]/70'
                      }`}
                    >
                      {event.desc}
                    </div>
                  )}
                  {event.assignee && (
                    <div className="text-[11px] text-[color:var(--color-text)]/60 mt-1">
                      Asignado a: {event.assignee}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {pagedTasks.length === 0 && (
          <div className="text-center py-6 text-[color:var(--color-text)]/60 text-sm">
            No hay próximas tareas programadas
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-[color:var(--color-text)]/10 flex items-center justify-between text-sm bg-[var(--color-surface)]">
          <span className="text-[color:var(--color-text)]/60">
            Página {Math.min(page, totalPages - 1) + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded border border-[color:var(--color-text)]/20 text-xs hover:bg-[color:var(--color-text)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page <= 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded border border-[color:var(--color-text)]/20 text-xs hover:bg-[color:var(--color-text)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
