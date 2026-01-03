import React from 'react';
import { Calendar, Clock, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function NextStepHero({ task, onComplete, onPostpone, onViewDetails }) {
  if (!task) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Todo al día!
          </h2>
          <p className="text-gray-600">
            No tienes tareas urgentes pendientes. ¡Buen trabajo! 🎉
          </p>
        </div>
      </div>
    );
  }

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const due = new Date(dateString);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} días de retraso`, isOverdue: true };
    if (diffDays === 0) return { text: '¡Hoy!', isUrgent: true };
    if (diffDays === 1) return { text: 'Mañana', isUrgent: true };
    if (diffDays <= 3) return { text: `En ${diffDays} días`, isUrgent: true };
    return { text: `En ${diffDays} días`, isUrgent: false };
  };

  const daysInfo = getDaysUntil(task.dueDate);
  const aiSuggestion = task.metadata?.aiSuggestion || task.metadata?.aiRecommendation;

  return (
    <div className={`rounded-2xl p-8 border-2 shadow-xl transition-all hover:shadow-2xl ${
      daysInfo?.isOverdue 
        ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
        : daysInfo?.isUrgent
        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            daysInfo?.isOverdue ? 'bg-red-600' :
            daysInfo?.isUrgent ? 'bg-orange-600' : 'bg-purple-600'
          }`}>
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Tu Próximo Paso
            </p>
            <div className="flex items-center gap-2 mt-1">
              {daysInfo && (
                <span className={`text-sm font-bold ${
                  daysInfo.isOverdue ? 'text-red-600' :
                  daysInfo.isUrgent ? 'text-orange-600' : 'text-purple-600'
                }`}>
                  {daysInfo.text}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.isCritical && (
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              IA: Crítica
            </span>
          )}
          {task.priority && (
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
            </span>
          )}
        </div>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        {task.title || task.name}
      </h2>

      {task.category && (
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-white/50 backdrop-blur-sm text-gray-700 text-sm font-medium rounded-lg">
            📋 {task.category}
          </span>
        </div>
      )}

      {aiSuggestion && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-900 mb-1">Sugerencia IA</p>
              <p className="text-sm text-gray-700">
                {typeof aiSuggestion === 'string' ? aiSuggestion : 'Tarea recomendada por la IA para esta fase'}
              </p>
            </div>
          </div>
        </div>
      )}

      {task.notes && (
        <p className="text-gray-700 mb-6 bg-white/50 backdrop-blur-sm rounded-lg p-3">
          {task.notes}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onComplete(task)}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <CheckCircle className="w-5 h-5" />
          Marcar Completada
        </button>
        
        <button
          onClick={() => onPostpone && onPostpone(task)}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors border-2 border-gray-300 shadow-md hover:shadow-lg"
        >
          <Clock className="w-5 h-5 inline mr-2" />
          Posponer
        </button>

        <button
          onClick={() => onViewDetails && onViewDetails(task)}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors border-2 border-gray-300 shadow-md hover:shadow-lg"
        >
          Ver Detalles
        </button>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-sm font-medium rounded-full"
              style={{
                backgroundColor: tag.color + '30',
                color: tag.color,
                border: `1px solid ${tag.color}`
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
