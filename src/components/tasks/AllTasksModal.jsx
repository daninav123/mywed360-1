import React, { useMemo, useCallback, useState } from 'react';

import useTranslations from '../../hooks/useTranslations';
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
  parents = [],
  subtasks = [],
  completedSet,
  onToggleComplete,
  onTaskClick,
}) {
  const { t } = useTranslations();

  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | PENDING | COMPLETED

  const fallbackTaskLabel = useCallback(
    () => t('tasks.page.allTasks.defaults.task', { defaultValue: 'Tarea' }),
    [t]
  );

  const getCategoryName = useCallback(
    (key) => t(`tasks.categories.${key}`, { defaultValue: categories[key]?.name || key }),
    [t]
  );

  const sortedParents = useMemo(() => {
    try {
      const arr = Array.isArray(parents) ? parents : [];
      return arr
        .filter((p) => String(p?.type || 'task') === 'task' && !p.isDisabled)
        .map((p) => ({
          id: String(p.id),
          name: p.name || p.title || fallbackTaskLabel(),
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
  }, [parents, fallbackTaskLabel]);

  // Agrupar subtareas por parentId y ordenarlas dentro del grupo
  const grouped = useMemo(() => {
    const map = new Map();
    const orphans = [];
    const items = Array.isArray(subtasks) ? subtasks : [];
    for (const st of items) {
      if (!st) continue;
      const pid = String(st.parentId || '');
      const norm = { ...st };
      if (pid) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(norm);
      } else {
        orphans.push(norm);
      }
    }
    const sorter = (a, b) => {
      const aTitle = String(a?.title || a?.name || '').toLowerCase();
      const bTitle = String(b?.title || b?.name || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    };
    for (const [, arr] of map.entries()) {
      arr.sort(sorter);
    }
    orphans.sort(sorter);
    return { map, orphans };
  }, [subtasks]);

  // Opciones de filtros
  const categoryOptions = useMemo(() => {
    try {
      const opts = Object.entries(categories || {}).map(([key]) => ({
        id: key,
        name: getCategoryName(key),
      }));
      return [{ id: 'ALL', name: t('tasks.page.allTasks.filters.categoryAll') }, ...opts];
    } catch {
      return [{ id: 'ALL', name: t('tasks.page.allTasks.filters.categoryAll') }];
    }
  }, [getCategoryName, t]);

  const assigneeOptions = useMemo(() => {
    try {
      const set = new Set();
      const items = Array.isArray(subtasks) ? subtasks : [];
      for (const s of items) {
        const a = String(s?.assignee || '').trim();
        if (a) set.add(a);
      }
      const arr = Array.from(set).sort((a, b) => a.localeCompare(b));
      return [{ id: 'ALL', name: t('tasks.page.allTasks.filters.assigneeAll') }, ...arr.map((a) => ({ id: a, name: a }))];
    } catch {
      return [{ id: 'ALL', name: t('tasks.page.allTasks.filters.assigneeAll') }];
    }
  }, [subtasks, t]);

  const passesFilters = useCallback(
    (st) => {
      try {
        const q = String(query || '').toLowerCase().trim();
        if (q) {
          const hay = `${st.title || st.name || ''} ${(st.desc || '')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (filterCategory !== 'ALL') {
          if (String(st.category || '') !== filterCategory) return false;
        }
        if (filterAssignee !== 'ALL') {
          const a = String(st.assignee || '').trim();
          if (a !== filterAssignee) return false;
        }
        if (filterStatus !== 'ALL') {
          const isCompleted = completedSet ? completedSet.has(String(st.id)) : false;
          if (filterStatus === 'PENDING' && isCompleted) return false;
          if (filterStatus === 'COMPLETED' && !isCompleted) return false;
        }
        return true;
      } catch {
        return true;
      }
    },
    [query, filterCategory, filterAssignee, filterStatus, completedSet]
  );

  const totalFiltered = useMemo(() => {
    try {
      const countParents = (Array.isArray(parents) ? parents : [])
        .filter((p) => String(p?.type || 'task') === 'task' && !p.isDisabled)
        .map((p) => String(p.id))
        .reduce((acc, pid) => acc + ((grouped.map.get(pid) || []).filter(passesFilters).length), 0);
      const orphanCount = (grouped.orphans || []).filter(passesFilters).length;
      return countParents + orphanCount;
    } catch {
      return 0;
    }
  }, [parents, grouped, passesFilters]);

  const renderSubtaskCell = useCallback(
    (st) => {
      const catKey = st.category || 'OTROS';
      const cat = categories[catKey] || categories.OTROS;
      const isCompleted = completedSet ? completedSet.has(String(st.id)) : false;
      const showNoDate = !st.start && !st.end;
      return (
        <div
          key={st.id}
          className="flex items-start gap-2 p-2 rounded border border-gray-200 hover:shadow-sm cursor-pointer bg-white"
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
            <div className={`flex items-center gap-2 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
              <div className="font-medium truncate">{st.title || st.name || fallbackTaskLabel()}</div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${cat.bgColor}30`,
                  color: cat.color,
                  borderColor: cat.borderColor,
                }}
              >
                {getCategoryName(catKey)}
              </span>
              {showNoDate && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-dashed text-orange-700 bg-orange-50">
                  {t('tasks.page.allTasks.badges.noDate')}
                </span>
              )}
            </div>
            {st.assignee && (
              <div className="text-xs text-gray-500">
                {t('tasks.page.allTasks.badges.assigned', { name: st.assignee })}
              </div>
            )}
            {st.desc && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{st.desc}</div>
            )}
          </div>
        </div>
      );
    },
    [completedSet, onToggleComplete, onTaskClick, fallbackTaskLabel, getCategoryName, t]
  );

  // Preparar columnas: una por tarea padre; si hay subtareas sin padre, añadir columna "Sin padre"
  const columns = useMemo(() => {
    const cols = [];
    for (const p of sortedParents) {
      const items = (grouped.map.get(p.id) || []).filter(passesFilters);
      cols.push({ id: p.id, name: p.name, items });
    }
    const orphanItems = (grouped.orphans || []).filter(passesFilters);
    if (orphanItems.length > 0) {
      cols.push({ id: '__orphans__', name: t('tasks.page.allTasks.orphans'), items: orphanItems });
    }
    return cols;
  }, [sortedParents, grouped, passesFilters, t]);

  const maxRows = useMemo(() => {
    return columns.reduce((acc, c) => Math.max(acc, Array.isArray(c.items) ? c.items.length : 0), 0);
  }, [columns]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('tasks.page.allTasks.title')} size="xl" scrollable>
      {/* Controles de filtro */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('tasks.page.allTasks.searchPlaceholder')}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-white"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm bg-white"
          >
            {assigneeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="ALL">{t('tasks.page.allTasks.filters.status.all')}</option>
            <option value="PENDING">{t('tasks.page.allTasks.filters.status.pending')}</option>
            <option value="COMPLETED">{t('tasks.page.allTasks.filters.status.completed')}</option>
          </select>
          <button
            type="button"
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            onClick={() => { setQuery(''); setFilterCategory('ALL'); setFilterAssignee('ALL'); setFilterStatus('ALL'); }}
            title={t('tasks.page.allTasks.filters.clear')}
          >
            {t('tasks.page.allTasks.filters.clear')}
          </button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">{t('tasks.page.allTasks.filters.results', { count: totalFiltered })}</div>

      {/* Tabla: primera fila padres, siguientes filas subtareas alineadas por columna */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Cabecera con padres */}
          <div
            className="grid gap-3 border-b border-gray-200 pb-2 mb-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(220px, 1fr))` }}
          >
            {columns.length > 0 ? (
              columns.map((col) => (
                <div key={col.id} className="text-sm font-semibold text-gray-800">
                  {col.name} <span className="ml-1 text-xs text-gray-500">({col.items.length})</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">{t('tasks.page.allTasks.empty.columns')}</div>
            )}
          </div>

          {/* Filas de subtareas */}
          {maxRows > 0 ? (
            Array.from({ length: maxRows }).map((_, rowIdx) => (
              <div
                key={`row-${rowIdx}`}
                className="grid gap-3 mb-3"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, columns.length)}, minmax(220px, 1fr))` }}
              >
                {columns.map((col, ci) => {
                  const st = col.items[rowIdx];
                  return (
                    <div key={`${ci}-${st ? st.id : 'empty'}`}>
                      {st ? (
                        renderSubtaskCell(st)
                      ) : (
                        <div className="h-10 rounded border border-dashed border-gray-200 bg-gray-50" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-6">{t('tasks.page.allTasks.empty.filters')}</div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
