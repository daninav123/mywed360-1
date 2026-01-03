import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Circle, ArrowRight, Calendar } from 'lucide-react';

export default function RoadmapView({ tasks = [], onTaskClick, nextTask }) {
  const [expandedPhases, setExpandedPhases] = useState(new Set());

  const phases = useMemo(() => {
    const phaseDefinitions = [
      { 
        id: 'phase-1', 
        title: '12-9 MESES ANTES', 
        minDays: 270, 
        maxDays: 365,
        emoji: '📅'
      },
      { 
        id: 'phase-2', 
        title: '9-6 MESES ANTES', 
        minDays: 180, 
        maxDays: 270,
        emoji: '🎯'
      },
      { 
        id: 'phase-3', 
        title: '6-3 MESES ANTES', 
        minDays: 90, 
        maxDays: 180,
        emoji: '📋'
      },
      { 
        id: 'phase-4', 
        title: '3-1 MESES ANTES', 
        minDays: 30, 
        maxDays: 90,
        emoji: '⚡'
      },
      { 
        id: 'phase-5', 
        title: 'ÚLTIMO MES', 
        minDays: 0, 
        maxDays: 30,
        emoji: '🎊'
      },
      { 
        id: 'phase-overdue', 
        title: 'ATRASADAS', 
        minDays: -999, 
        maxDays: 0,
        emoji: '⚠️'
      },
      { 
        id: 'phase-nodate', 
        title: 'SIN FECHA', 
        minDays: null, 
        maxDays: null,
        emoji: '📝'
      }
    ];

    const now = new Date();
    const groupedTasks = {};

    phaseDefinitions.forEach(phase => {
      groupedTasks[phase.id] = {
        ...phase,
        tasks: []
      };
    });

    tasks.forEach(task => {
      if (!task.dueDate) {
        groupedTasks['phase-nodate'].tasks.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let assigned = false;
      for (const phase of phaseDefinitions) {
        if (phase.minDays !== null && phase.maxDays !== null) {
          if (diffDays >= phase.minDays && diffDays < phase.maxDays) {
            groupedTasks[phase.id].tasks.push(task);
            assigned = true;
            break;
          }
        }
      }

      if (!assigned && diffDays < 0) {
        groupedTasks['phase-overdue'].tasks.push(task);
      }
    });

    Object.keys(groupedTasks).forEach(phaseId => {
      groupedTasks[phaseId].tasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    });

    return Object.values(groupedTasks).filter(phase => phase.tasks.length > 0);
  }, [tasks]);

  const currentPhaseId = useMemo(() => {
    if (nextTask) {
      const phase = phases.find(p => p.tasks.some(t => t.id === nextTask.id));
      return phase?.id;
    }
    return phases.find(p => p.tasks.some(t => !t.completed))?.id;
  }, [phases, nextTask]);

  React.useEffect(() => {
    if (currentPhaseId) {
      setExpandedPhases(new Set([currentPhaseId]));
    }
  }, [currentPhaseId]);

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          🗺️ Roadmap de tu Boda
        </h2>
        <button
          onClick={() => {
            if (expandedPhases.size === phases.length) {
              setExpandedPhases(new Set([currentPhaseId]));
            } else {
              setExpandedPhases(new Set(phases.map(p => p.id)));
            }
          }}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {expandedPhases.size === phases.length ? 'Contraer todas' : 'Expandir todas'}
        </button>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => {
          const completedCount = phase.tasks.filter(t => t.completed).length;
          const totalCount = phase.tasks.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const isExpanded = expandedPhases.has(phase.id);
          const isCurrentPhase = phase.id === currentPhaseId;
          const allCompleted = completedCount === totalCount && totalCount > 0;

          return (
            <div
              key={phase.id}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                isCurrentPhase 
                  ? 'border-purple-400 shadow-lg' 
                  : allCompleted
                  ? 'border-green-200'
                  : 'border-gray-200'
              }`}
            >
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                    allCompleted ? 'bg-green-100' : isCurrentPhase ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {phase.emoji}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {phase.title}
                      </h3>
                      {isCurrentPhase && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                          ← ESTÁS AQUÍ
                        </span>
                      )}
                      {allCompleted && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          ✓ COMPLETADA
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-sm font-semibold ${
                        allCompleted ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {completedCount}/{totalCount} tareas
                      </span>
                      
                      <div className="flex-1 max-w-xs">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              allCompleted ? 'bg-green-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-2">
                    {phase.tasks.map((task, idx) => {
                      const isNext = nextTask && task.id === nextTask.id;
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick && onTaskClick(task)}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                            task.completed 
                              ? 'bg-green-50 border-green-200 opacity-75'
                              : isNext
                              ? 'bg-purple-100 border-purple-400 shadow-md'
                              : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {task.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className={`font-semibold mb-1 ${
                                    task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    {task.title || task.name}
                                    {isNext && (
                                      <span className="ml-2 text-xs font-bold text-purple-600">
                                        ← PRÓXIMO
                                      </span>
                                    )}
                                  </h4>
                                  
                                  {task.dueDate && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(task.dueDate)}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  {task.isCritical && (
                                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                                      ⚡ Crítica
                                    </span>
                                  )}
                                  {task.priority && (
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
