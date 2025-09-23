import React from 'react';

import { categories } from './CalendarComponents';

// Componente para mostrar la lista de próximas tareas
const TaskList = ({ tasks, onTaskClick, maxItems = 8, completedSet, onToggleComplete }) => {
  const sortedTasks = Array.isArray(tasks)
    ? (() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        // De-duplicar por id (evita claves duplicadas durante actualizaciones optimistas)
        const byId = new Map();
        tasks.forEach((e) => {
          if (!e || !(e.start instanceof Date)) return;
          const key = e.id ?? `${e.title}-${e.start?.toISOString?.() ?? ''}`;
          if (!byId.has(key)) byId.set(key, e);
        });
        return (
          Array.from(byId.values())
            .filter((e) => e && e.start instanceof Date)
            .sort((a, b) => a.start - b.start)
            // Mostrar tareas con fin en futuro o inicio desde hoy
            .filter((e) => {
              const end = e.end instanceof Date ? e.end : e.start;
              return (end >= todayStart) || (e.start >= todayStart);
            })
            .slice(0, maxItems)
        );
      })()
    : [];

  return (
    <div className="rounded-xl shadow-md overflow-hidden h-full flex flex-col bg-[var(--color-surface)] text-[color:var(--color-text)] border border-[color:var(--color-text)]/10">
      <div className="p-4 border-b border-[color:var(--color-text)]/10">
        <h2 className="text-xl font-semibold">Próximas Tareas</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {sortedTasks.map((event) => {
          const cat = categories[event.category] || categories.OTROS;
          const isCompleted = completedSet ? completedSet.has(String(event.id)) : false;
          return (
            <div
              key={event.id}
              className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTaskClick(event)}
              style={{
                borderColor: cat.borderColor,
                backgroundColor: `${cat.bgColor}40`,
              }}
            >
              <div className="flex items-start">
                <div className="mr-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (typeof onToggleComplete === 'function') {
                        onToggleComplete(String(event.id), e.target.checked);
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">{event.title}</div>
                  <div className="text-xs text-[color:var(--color-text)]/60">
                    {event.start.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {event.desc && (
                    <div className="text-sm text-[color:var(--color-text)]/70 mt-1 line-clamp-2">
                      {event.desc}
                    </div>
                  )}
                  {event.assignee && (
                    <div className="text-xs text-[color:var(--color-text)]/60 mt-1">
                      Asignado a: {event.assignee}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {sortedTasks.length === 0 && (
          <div className="text-center py-4 text-[color:var(--color-text)]/60">
            No hay próximas tareas programadas
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
