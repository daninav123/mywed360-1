/**
 * TimelineView - Vista del timeline personalizado
 * Muestra timeline automático con alertas y progreso
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { generatePersonalizedTimeline, getUrgentTasks, getNextMilestone, formatTimelineDate } from '../../services/timelineGenerator';
import { toast } from 'react-toastify';

const UrgencyBadge = ({ urgency }) => {
  const styles = {
    overdue: 'bg-red-100 text-red-700 border-red-300',
    active: 'bg-blue-100 text-blue-700 border-blue-300',
    urgent: 'bg-orange-100 text-orange-700 border-orange-300',
    upcoming: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    planned: 'bg-gray-100 text-gray-600 border-gray-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
  };

  const labels = {
    overdue: '⏰ Atrasado',
    active: '🔥 Activo',
    urgent: '⚡ Urgente',
    upcoming: '📅 Próximo',
    planned: '📋 Planificado',
    completed: '✓ Completado',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${styles[urgency] || styles.planned}`}>
      {labels[urgency] || urgency}
    </span>
  );
};

const TaskItem = ({ task, onToggle }) => {
  const hasAlerts = task.alerts && task.alerts.length > 0;

  return (
    <div className={`border rounded-lg p-3 transition-all ${
      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {task.name}
          </p>
          
          {!task.completed && hasAlerts && (
            <div className="mt-2 space-y-1">
              {task.alerts.map((alert, idx) => (
                <div key={idx} className={`text-xs flex items-start gap-1 ${
                  alert.severity === 'critical' ? 'text-red-600' :
                  alert.severity === 'high' ? 'text-orange-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!task.completed && <UrgencyBadge urgency={task.urgency} />}
      </div>
    </div>
  );
};

const BlockCard = ({ block, onToggleTask, isExpanded, onToggleExpand }) => {
  const progressColor = 
    block.stats.progressPercentage === 100 ? 'bg-green-500' :
    block.stats.progressPercentage >= 50 ? 'bg-blue-500' :
    'bg-gray-300';

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-800 text-base">{block.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{block.admin.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <UrgencyBadge urgency={block.urgency} />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {block.stats.completed}/{block.stats.total}
              </p>
              <p className="text-xs text-gray-500">completadas</p>
            </div>
          </div>
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${block.stats.progressPercentage}%` }}
        />
      </div>

      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
            <Calendar className="w-4 h-4" />
            <span>
              {formatTimelineDate(block.startDate, 'short')} - {formatTimelineDate(block.endDate, 'short')}
            </span>
            <span className="text-gray-400">•</span>
            <span>{formatTimelineDate(block.endDate, 'relative')}</span>
          </div>

          <div className="space-y-2">
            {block.tasks.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function TimelineView({ weddingDate, completedTasks = {}, onTaskToggle }) {
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());

  const timeline = useMemo(() => {
    if (!weddingDate) return null;
    try {
      return generatePersonalizedTimeline(weddingDate, completedTasks);
    } catch (error) {
      console.error('Error generando timeline:', error);
      return null;
    }
  }, [weddingDate, completedTasks]);

  const urgentTasks = useMemo(() => {
    return timeline ? getUrgentTasks(timeline) : [];
  }, [timeline]);

  const nextMilestone = useMemo(() => {
    return timeline ? getNextMilestone(timeline) : null;
  }, [timeline]);

  useEffect(() => {
    if (timeline && nextMilestone && !expandedBlocks.has(nextMilestone.key)) {
      setExpandedBlocks(new Set([nextMilestone.key]));
    }
  }, [timeline, nextMilestone]);

  const handleToggleBlock = (blockKey) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockKey)) {
        next.delete(blockKey);
      } else {
        next.add(blockKey);
      }
      return next;
    });
  };

  const handleToggleTask = (task) => {
    if (onTaskToggle) {
      onTaskToggle(task);
      toast.success(task.completed ? 'Tarea marcada como pendiente' : 'Tarea completada ✓');
    }
  };

  if (!weddingDate) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Define la fecha de tu boda
        </h3>
        <p className="text-sm text-gray-500">
          Para generar tu timeline personalizado, primero configura la fecha del evento
        </p>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Error al generar timeline
        </h3>
        <p className="text-sm text-gray-500">
          No se pudo generar el timeline. Verifica la fecha de la boda.
        </p>
      </div>
    );
  }

  if (timeline.error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {timeline.message}
        </h3>
        <p className="text-sm text-gray-500">
          El timeline solo está disponible antes de la fecha del evento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Timeline Personalizado</h2>
            <p className="text-sm text-gray-600">
              {timeline.daysUntilWedding} días hasta tu boda • {formatTimelineDate(weddingDate, 'long')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {timeline.stats.progressPercentage}%
            </div>
            <div className="text-xs text-gray-600">completado</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{timeline.stats.completedTasks}</div>
            <div className="text-xs text-gray-600">Completadas</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{timeline.stats.activeTasks + timeline.stats.urgentTasks}</div>
            <div className="text-xs text-gray-600">Urgentes</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{timeline.stats.pendingTasks}</div>
            <div className="text-xs text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-2xl font-bold text-red-600">{timeline.stats.overdueTasks}</div>
            <div className="text-xs text-gray-600">Atrasadas</div>
          </div>
        </div>
      </div>

      {/* Alertas críticas */}
      {timeline.alerts.critical.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">Alertas Críticas</h3>
              <ul className="space-y-1">
                {timeline.alerts.critical.map((alert, idx) => (
                  <li key={idx} className="text-sm text-red-700">
                    • {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Próximo hito */}
      {nextMilestone && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 mb-1">Próximo Hito</h3>
              <p className="text-sm text-blue-700 mb-2">
                {nextMilestone.name} - {nextMilestone.stats.completed}/{nextMilestone.stats.total} completadas
              </p>
              <p className="text-xs text-blue-600">
                {formatTimelineDate(nextMilestone.endDate, 'relative')} • {formatTimelineDate(nextMilestone.endDate, 'short')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tareas urgentes */}
      {urgentTasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Tareas Urgentes ({urgentTasks.length})
          </h3>
          <div className="space-y-2">
            {urgentTasks.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
            ))}
          </div>
          {urgentTasks.length > 5 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              +{urgentTasks.length - 5} tareas urgentes más
            </p>
          )}
        </div>
      )}

      {/* Bloques del timeline */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 text-lg">Timeline Completo</h3>
        {timeline.blocks.map((block) => (
          <BlockCard
            key={block.key}
            block={block}
            onToggleTask={handleToggleTask}
            isExpanded={expandedBlocks.has(block.key)}
            onToggleExpand={() => handleToggleBlock(block.key)}
          />
        ))}
      </div>
    </div>
  );
}
