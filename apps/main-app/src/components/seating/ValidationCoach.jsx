/**
 * Sistema de validaciones en modo "Coach"
 * Muestra sugerencias amigables en lugar de advertencias agresivas
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Wand2, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

const SEVERITY = {
  info: {
    icon: Info,
    color: 'blue',
    bgClass: 'bg-blue-50 dark:bg-blue-900/20',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-900 dark:text-blue-100',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-900/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-900 dark:text-amber-100',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'purple',
    bgClass: 'bg-purple-50 dark:bg-purple-900/20',
    borderClass: 'border-purple-200 dark:border-purple-800',
    textClass: 'text-purple-900 dark:text-purple-100',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  success: {
    icon: CheckCircle,
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-900/20',
    borderClass: 'border-green-200 dark:border-green-800',
    textClass: 'text-green-900 dark:text-green-100',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  improvement: {
    icon: TrendingUp,
    color: 'indigo',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    textClass: 'text-indigo-900 dark:text-indigo-100',
    iconClass: 'text-indigo-600 dark:text-indigo-400',
  },
};

export default function ValidationCoach({
  suggestions = [],
  onDismiss,
  onAutoFix,
  position = 'bottom-right',
}) {
  const [dismissed, setDismissed] = useState(new Set());

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  const handleDismiss = (id) => {
    setDismissed((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const handleAutoFix = (suggestion) => {
    onAutoFix?.(suggestion);
    handleDismiss(suggestion.id);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  if (visibleSuggestions.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-30 max-w-md space-y-3`}>
      <AnimatePresence>
        {visibleSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={() => handleDismiss(suggestion.id)}
            onAutoFix={() => handleAutoFix(suggestion)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function SuggestionCard({ suggestion, onDismiss, onAutoFix }) {
  const severity = SEVERITY[suggestion.severity] || SEVERITY.info;
  const Icon = severity.icon;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`
        ${severity.bgClass} ${severity.borderClass}
        border rounded-lg shadow-lg p-4 relative
        pointer-events-auto
      `}
    >
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        title="Cerrar"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-2 pr-6">
        <div className={`${severity.iconClass} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${severity.textClass} font-semibold text-sm`}>{suggestion.title}</h4>
        </div>
      </div>

      {/* Message */}
      <div className="pl-8 mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">{suggestion.message}</p>
        {suggestion.details && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{suggestion.details}</p>
        )}
      </div>

      {/* Actions */}
      {(suggestion.canAutoFix || suggestion.actions) && (
        <div className="pl-8 flex gap-2 flex-wrap">
          {suggestion.canAutoFix && (
            <button
              onClick={onAutoFix}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md
                transition-colors flex items-center gap-1.5
                ${severity.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
                ${severity.color === 'amber' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                ${severity.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              `}
            >
              <Wand2 className="w-3 h-3" />
              {suggestion.autoFixLabel || 'Arreglar automáticamente'}
            </button>
          )}
          {suggestion.actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Ignorar
          </button>
        </div>
      )}

      {/* Progress bar for temporary suggestions */}
      {suggestion.temporary && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: suggestion.duration || 5, ease: 'linear' }}
          onAnimationComplete={onDismiss}
          className={`absolute bottom-0 left-0 h-1 ${
            severity.color === 'purple'
              ? 'bg-purple-500'
              : severity.color === 'amber'
                ? 'bg-amber-500'
                : 'bg-blue-500'
          } origin-left`}
        />
      )}
    </motion.div>
  );
}

/**
 * Helper para crear sugerencias desde validaciones
 */
export function createSuggestionFromValidation(table, validationIssue) {
  const baseId = `${table.id}-${validationIssue.type}`;

  const suggestions = {
    'insufficient-distance': {
      id: baseId,
      severity: 'suggestion',
      title: '💡 Espacio entre mesas',
      message: `Las mesas ${validationIssue.tables?.join(' y ')} están un poco juntas (${validationIssue.distance}cm).`,
      details: 'Considera separarlas a 60cm para mejor circulación.',
      canAutoFix: true,
      autoFixLabel: 'Separar automáticamente',
      autoFixAction: {
        type: 'adjust-spacing',
        tables: validationIssue.tables,
        targetSpacing: 60,
      },
    },
    'out-of-bounds': {
      id: baseId,
      severity: 'warning',
      title: '⚠️ Mesa fuera del perímetro',
      message: `La mesa ${table.name || table.id} está fuera del área del salón.`,
      details: 'Muévela dentro del perímetro o ajusta el tamaño del salón.',
      canAutoFix: true,
      autoFixLabel: 'Mover dentro',
      autoFixAction: {
        type: 'move-inside-boundary',
        tableId: table.id,
      },
    },
    'obstacle-collision': {
      id: baseId,
      severity: 'warning',
      title: '⚠️ Colisión con obstáculo',
      message: `La mesa ${table.name || table.id} está sobre un obstáculo.`,
      details: 'Muévela a otra posición o elimina el obstáculo.',
      canAutoFix: true,
      autoFixLabel: 'Encontrar mejor posición',
      autoFixAction: {
        type: 'find-free-spot',
        tableId: table.id,
      },
    },
    overbooking: {
      id: baseId,
      severity: 'info',
      title: 'ℹ️ Mesa llena',
      message: `La mesa ${table.name || table.id} tiene más invitados (${validationIssue.assigned}) que su capacidad (${validationIssue.capacity}).`,
      details: 'Aumenta la capacidad o redistribuye invitados.',
      actions: [
        {
          label: 'Aumentar capacidad',
          onClick: () => console.log('Increase capacity'),
        },
        {
          label: 'Redistribuir',
          onClick: () => console.log('Redistribute'),
        },
      ],
    },
  };

  return (
    suggestions[validationIssue.type] || {
      id: baseId,
      severity: 'info',
      title: 'Validación',
      message: validationIssue.message || 'Se detectó un problema con esta mesa.',
      canAutoFix: false,
    }
  );
}

/**
 * Helper para crear sugerencias de mejora proactivas
 */
export function createImprovementSuggestions(tables, guests, hallSize) {
  const suggestions = [];

  // Sugerencia: Layout subóptimo
  if (tables.length > 0 && tables.length < guests.length / 10) {
    suggestions.push({
      id: 'layout-too-few-tables',
      severity: 'improvement',
      title: '📈 Optimización sugerida',
      message: `Tienes ${guests.length} invitados pero solo ${tables.length} mesas.`,
      details: 'Considera agregar más mesas para una mejor distribución.',
      canAutoFix: true,
      autoFixLabel: 'Optimizar layout',
      autoFixAction: {
        type: 'optimize-layout',
      },
    });
  }

  // Sugerencia: Espacio desaprovechado
  const usedArea = tables.reduce((sum, t) => {
    const size = t.shape === 'circle' ? Math.PI * Math.pow(t.diameter / 2, 2) : t.width * t.height;
    return sum + size;
  }, 0);
  const totalArea = hallSize.width * hallSize.height;
  const utilization = usedArea / totalArea;

  if (utilization < 0.3 && tables.length > 5) {
    suggestions.push({
      id: 'layout-underutilized',
      severity: 'info',
      title: 'ℹ️ Espacio disponible',
      message: `Solo estás usando ~${Math.round(utilization * 100)}% del espacio del salón.`,
      details: 'Podrías agregar más mesas o redistribuir mejor las existentes.',
      temporary: true,
      duration: 8,
    });
  }

  return suggestions;
}
