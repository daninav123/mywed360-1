import React from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle2, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Card moderna de tarea para vista Kanban
 */
export default function TaskCard({ task, onClick, onComplete }) {
  const isPastDue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCriticalAI = task.metadata?.aiRecommendation === 'critical' || task.isCritical;
  const isOptional = task.metadata?.aiRecommendation === 'optional' || task.isOptional;

  const getDueDateText = () => {
    if (!task.dueDate) return null;
    
    const date = new Date(task.dueDate);
    const distance = formatDistanceToNow(date, { addSuffix: true, locale: es });
    
    return isPastDue ? `Vencida ${distance}` : distance;
  };

  const getPriorityColor = () => {
    if (isCriticalAI) return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (task.priority === 'high') return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (task.priority === 'medium') return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    return 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800';
  };

  const getCategoryIcon = () => {
    const icons = {
      FUNDAMENTOS: '🎯',
      PROVEEDORES: '🤝',
      VESTUARIO: '👗',
      CEREMONIA: '💒',
      BANQUETE: '🍽️',
      INVITACIONES: '💌',
      DECORACION: '🎨',
      FOTOGRAFIA: '📸',
      MUSICA: '🎵',
      LOGISTICA: '🚗',
      GENERAL: '📋',
    };
    return icons[task.category] || '📋';
  };

  return (
    <div
      onClick={onClick}
      className={`
        group relative p-4 rounded-lg border-2 cursor-pointer transition-all
        hover:shadow-lg hover:-translate-y-1
        ${getPriorityColor()}
        ${task.completed ? 'opacity-60' : ''}
      `}
    >
      {/* Badge crítica IA */}
      {isCriticalAI && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Sparkles className="w-3 h-3" />
          IA: Crítica
        </div>
      )}

      {/* Badge opcional */}
      {isOptional && (
        <div className="absolute -top-2 -right-2 bg-gray-400 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
          Opcional
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">
          {getCategoryIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {task.title || task.name || 'Sin título'}
          </h4>
          {task.category && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {task.category}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete?.(task);
          }}
          className={`
            flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center
            transition-all hover:scale-110
            ${task.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
            }
          `}
        >
          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Fecha límite */}
      {task.dueDate && (
        <div className={`
          flex items-center gap-2 text-sm mb-2
          ${isPastDue ? 'text-red-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}
        `}>
          {isPastDue ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          <span>{getDueDateText()}</span>
        </div>
      )}

      {/* Análisis IA */}
      {task.metadata?.priorityReason && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-2 mb-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-800 dark:text-purple-300">
              {task.metadata.priorityReason}
            </p>
          </div>
        </div>
      )}

      {/* Presupuesto estimado */}
      {task.estimatedCost && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <DollarSign className="w-4 h-4" />
          <span>{task.estimatedCost}</span>
        </div>
      )}

      {/* Subtareas progress */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Subtareas</span>
            <span>
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{
                width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Hover arrow */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
