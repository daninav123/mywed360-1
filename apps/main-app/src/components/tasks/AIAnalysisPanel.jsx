import React from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Clock, Lightbulb, Download, RefreshCw } from 'lucide-react';

/**
 * Panel que muestra el análisis IA del plan de tareas personalizado
 */
export default function AIAnalysisPanel({ 
  analysis, 
  weddingContext, 
  onRegenerate, 
  onExport,
  isRegenerating = false 
}) {
  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plan de tareas estándar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Este plan no ha sido personalizado con IA. Usa el botón "Regenerar con IA" para obtener recomendaciones personalizadas.
            </p>
          </div>
        </div>
        
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Personalizar con IA
            </>
          )}
        </button>
      </div>
    );
  }

  const { summary, criticalBlocks = [], optionalBlocks = [], timelineAdjustments } = analysis;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              🤖 Tu plan personalizado con IA
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Adaptado para tu {weddingContext?.ceremonyType || 'boda'}
              {weddingContext?.leadTimeMonths && ` • ${weddingContext.leadTimeMonths} meses de preparación`}
              {weddingContext?.guestCount && ` • ${weddingContext.guestCount} invitados`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors flex items-center gap-2"
            title="Exportar análisis"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Regenerar plan"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Regenerar</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Análisis de tu boda
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tareas críticas */}
        {criticalBlocks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Críticas
              </h4>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {criticalBlocks.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Tareas de máxima prioridad para tu tipo de boda
            </p>
          </div>
        )}

        {/* Tareas opcionales */}
        {optionalBlocks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Opcionales
              </h4>
            </div>
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {optionalBlocks.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Puedes omitirlas para simplificar
            </p>
          </div>
        )}

        {/* Timeline */}
        {timelineAdjustments?.recommendation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Ritmo
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {timelineAdjustments.recommendation}
            </p>
          </div>
        )}
      </div>

      {/* Fases urgentes */}
      {timelineAdjustments?.urgentPhases && timelineAdjustments.urgentPhases.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            Fases que requieren atención urgente
          </h4>
          <div className="flex flex-wrap gap-2">
            {timelineAdjustments.urgentPhases.map((phase, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 text-sm rounded-full font-medium"
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
