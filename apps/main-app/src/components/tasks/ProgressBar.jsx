import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Barra de progreso inteligente con análisis IA
 */
export default function ProgressBar({ tasks = [], aiAnalysis }) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const criticalTasks = tasks.filter(t => t.isCritical || t.metadata?.aiRecommendation === 'critical').length;
  const criticalCompleted = tasks.filter(t => (t.isCritical || t.metadata?.aiRecommendation === 'critical') && t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const criticalProgress = criticalTasks > 0 ? Math.round((criticalCompleted / criticalTasks) * 100) : 100;

  // Predicción simple: si progreso > 50% y quedan > 3 meses, va bien
  const getTrendIcon = () => {
    if (progressPercentage >= 70) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (progressPercentage >= 30) return <Minus className="w-5 h-5 text-blue-600" />;
    return <TrendingDown className="w-5 h-5 text-orange-600" />;
  };

  const getTrendText = () => {
    if (progressPercentage >= 70) return 'Excelente ritmo';
    if (progressPercentage >= 30) return 'En camino';
    return 'Necesitas acelerar';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
      {/* Header con tendencia */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {progressPercentage}%
            </h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Progreso general
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            {getTrendIcon()}
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {getTrendText()}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {completedTasks} de {totalTasks} tareas
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="relative w-full h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 mix-blend-difference">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        {/* Críticas */}
        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border-2 border-red-300 dark:border-red-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400" />
            <span className="text-sm font-bold text-red-900 dark:text-red-100">Críticas</span>
          </div>
          <div className="text-3xl font-bold text-red-900 dark:text-red-100">
            {criticalTasks - criticalCompleted}
          </div>
          <div className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">
            {criticalCompleted} de {criticalTasks} hechas
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span className="text-sm font-bold text-blue-900 dark:text-blue-100">Pendientes</span>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {totalTasks - completedTasks}
          </div>
          {overdueTasks > 0 && (
            <div className="text-sm font-bold text-red-700 dark:text-red-300 mt-1">
              {overdueTasks} vencidas
            </div>
          )}
        </div>

        {/* Completadas */}
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />
            <span className="text-sm font-bold text-green-900 dark:text-green-100">Completadas</span>
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100">
            {completedTasks}
          </div>
          <div className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">
            ¡Bien hecho!
          </div>
        </div>
      </div>

      {/* Mensaje de IA si hay análisis */}
      {aiAnalysis?.summary && (
        <div className="mt-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3">
          <p className="text-sm text-purple-900 dark:text-purple-200">
            💡 <strong>IA:</strong> {aiAnalysis.summary}
          </p>
        </div>
      )}
    </div>
  );
}
