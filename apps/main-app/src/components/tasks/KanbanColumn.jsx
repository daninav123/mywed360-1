import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Circle, Sparkles } from 'lucide-react';

/**
 * Columna para vista Kanban
 */
export default function KanbanColumn({ title, tasks = [], color, icon: Icon, onTaskClick, onTaskComplete }) {
  const getColorClasses = () => {
    const colors = {
      red: 'bg-red-500 text-red-600 border-red-200 dark:border-red-800',
      orange: 'bg-orange-500 text-orange-600 border-orange-200 dark:border-orange-800',
      gray: 'bg-gray-500 text-gray-600 border-gray-200 dark:border-gray-700',
      blue: 'bg-blue-500 text-blue-600 border-blue-200 dark:border-blue-800',
      green: 'bg-green-500 text-green-600 border-green-200 dark:border-green-800',
    };
    return colors[color] || colors.gray;
  };

  const colorClasses = getColorClasses();
  const [bgClass, textClass, borderClass] = colorClasses.split(' ');

  return (
    <div className="flex flex-col h-full min-w-[320px]">
      {/* Header */}
      <div className={`rounded-t-xl p-4 border-b-2 ${borderClass} bg-white dark:bg-gray-800`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${bgClass} rounded-lg flex items-center justify-center`}>
              {Icon && <Icon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className={`font-bold ${textClass}`}>
                {title}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-600">
            <Circle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay tareas aquí</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id}>
              {/* TaskCard se importará dinámicamente aquí */}
              <div
                onClick={() => onTaskClick?.(task)}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white flex-1">
                    {task.title || task.name || 'Sin título'}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete?.(task);
                    }}
                    className={`
                      w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                      ${task.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }
                    `}
                  >
                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
                  </div>
                )}

                {task.metadata?.aiRecommendation === 'critical' && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <Sparkles className="w-3 h-3" />
                    <span>IA: Crítica</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
