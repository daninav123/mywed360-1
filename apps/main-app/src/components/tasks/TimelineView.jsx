import React, { useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Tag } from 'lucide-react';

export default function TimelineView({ tasks = [] }) {
  const timelineData = useMemo(() => {
    const now = new Date();
    const weddingDate = tasks[0]?.weddingDate ? new Date(tasks[0].weddingDate) : null;
    
    const grouped = {
      overdue: [],
      thisWeek: [],
      thisMonth: [],
      next3Months: [],
      later: [],
      noDate: []
    };

    tasks.forEach(task => {
      if (task.completed) return;
      
      if (!task.dueDate) {
        grouped.noDate.push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        grouped.overdue.push(task);
      } else if (diffDays <= 7) {
        grouped.thisWeek.push(task);
      } else if (diffDays <= 30) {
        grouped.thisMonth.push(task);
      } else if (diffDays <= 90) {
        grouped.next3Months.push(task);
      } else {
        grouped.later.push(task);
      }
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    });

    return grouped;
  }, [tasks]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const due = new Date(dateString);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} días de retraso`;
    if (diffDays === 0) return '¡Hoy!';
    if (diffDays === 1) return 'Mañana';
    return `En ${diffDays} días`;
  };

  const TimelineSection = ({ title, tasks, color, icon: Icon, emptyMessage }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-8">
        <div className={`flex items-center gap-3 mb-4 pb-2 border-b-2 border-${color}-200`}>
          <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-600`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold text-${color}-900`}>{title}</h3>
            <p className="text-sm text-gray-600">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="space-y-3 pl-6">
          {tasks.map(task => (
            <div
              key={task.id}
              className="relative pl-6 pb-4 border-l-2 border-gray-200 hover:border-purple-300 transition-colors"
            >
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {task.title || task.name}
                    </h4>
                    
                    {task.category && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{task.category}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(task.dueDate)}</span>
                      </div>
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className={getDaysUntil(task.dueDate).includes('retraso') ? 'text-red-600 font-semibold' : ''}>
                            {getDaysUntil(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color
                            }}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {task.priority && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    )}

                    {task.isCritical && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white">
                        ⚡ Crítica
                      </span>
                    )}

                    {task.status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'blocked' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status === 'in_progress' ? 'En progreso' :
                         task.status === 'blocked' ? 'Bloqueada' : 'Pendiente'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📅 Timeline de Tareas</h2>
            <p className="text-gray-600">
              Vista temporal de todas tus tareas organizadas por fechas de vencimiento
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">{totalCount - completedCount}</div>
            <div className="text-sm text-gray-600">tareas pendientes</div>
            <div className="text-xs text-gray-500 mt-1">{completedCount} completadas</div>
          </div>
        </div>
      </div>

      {timelineData.overdue.length === 0 && 
       timelineData.thisWeek.length === 0 && 
       timelineData.thisMonth.length === 0 && 
       timelineData.next3Months.length === 0 && 
       timelineData.later.length === 0 && 
       timelineData.noDate.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¡Todo completado!
          </h3>
          <p className="text-gray-600">
            No tienes tareas pendientes en este momento
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <TimelineSection
            title="⏰ Atrasadas"
            tasks={timelineData.overdue}
            color="red"
            icon={AlertCircle}
          />

          <TimelineSection
            title="📌 Esta Semana"
            tasks={timelineData.thisWeek}
            color="orange"
            icon={Clock}
          />

          <TimelineSection
            title="📅 Este Mes"
            tasks={timelineData.thisMonth}
            color="blue"
            icon={Calendar}
          />

          <TimelineSection
            title="🗓️ Próximos 3 Meses"
            tasks={timelineData.next3Months}
            color="purple"
            icon={Calendar}
          />

          <TimelineSection
            title="🔮 Más Adelante"
            tasks={timelineData.later}
            color="gray"
            icon={Calendar}
          />

          <TimelineSection
            title="📝 Sin Fecha"
            tasks={timelineData.noDate}
            color="gray"
            icon={Calendar}
          />
        </div>
      )}
    </div>
  );
}
