import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFirestoreCollection } from '../../../hooks/useFirestoreCollection';

// Devuelve prioridad calculada según cercanía de la fecha
const computePriority = (startDate) => {
  try {
    const now = new Date();
    const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'high';
    if (diffDays <= 21) return 'medium';
    return 'low';
  } catch (_) {
    return 'low';
  }
};

const normalizeDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  if (typeof d?.toDate === 'function') {
    const conv = d.toDate();
    return isNaN(conv.getTime()) ? null : conv;
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const TasksWidget = ({ config }) => {
  const navigate = useNavigate();
  const { data: meetings = [] } = useFirestoreCollection('meetings', []);

  const items = useMemo(() => {
    const mapped = (Array.isArray(meetings) ? meetings : [])
      .map((m) => {
        const start = normalizeDate(m.start);
        const end = normalizeDate(m.end) || start;
        if (!start) return null;
        const title = m.title || m.name || 'Sin título';
        const completed = Boolean(m.completed);
        const priority = m.priority || computePriority(start);
        return {
          id: m.id,
          title,
          dueDate: start,
          endDate: end,
          completed,
          priority,
        };
      })
      .filter(Boolean)
      // Solo desde hoy (00:00) en adelante
      .filter((t) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return t.dueDate >= todayStart;
      });

    const filtered = config?.showCompleted ? mapped : mapped.filter((t) => !t.completed);

    const sorted = [...filtered].sort((a, b) => {
      const sortBy = config?.sortBy || 'date';
      if (sortBy === 'priority') {
        const order = { high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 99) - (order[b.priority] || 99);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.dueDate - b.dueDate;
    });
    return sorted;
  }, [meetings, config?.showCompleted, config?.sortBy]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full">
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((task) => (
            <div
              key={task.id}
              className={`p-2 rounded border ${
                task.completed ? 'bg-gray-50 opacity-70' : 'bg-white'
              }`}
            >
              <div className="flex items-start">
                <input type="checkbox" checked={task.completed} readOnly className="mt-1 mr-2" />
                <div className="flex-1">
                  <div className={`flex justify-between ${task.completed ? 'line-through' : ''}`}>
                    <span>{task.title}</span>
                    <span className="text-sm text-gray-500">
                      {task.dueDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  {!task.completed && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority === 'high'
                        ? 'Alta'
                        : task.priority === 'medium'
                          ? 'Media'
                          : 'Baja'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">No hay tareas pendientes</div>
        )}
      </div>
      <div className="mt-4 text-right">
        <button
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => navigate('/tasks?showAllTasks=1')}
        >
          Ver todas las tareas →
        </button>
      </div>
    </div>
  );
};

