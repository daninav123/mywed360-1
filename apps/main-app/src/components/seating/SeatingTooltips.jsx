/**
 * SeatingTooltips - Tooltips contextuales para guiar al usuario
 * FASE 4: Onboarding & UX
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  X,
  Lightbulb,
  MousePointer,
  Keyboard,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const TOOLTIPS = {
  'first-time': {
    id: 'first-time',
    title: '👋 Primera vez aquí',
    message: 'Configura el espacio y usa plantillas para empezar rápido',
    icon: Lightbulb,
    color: 'blue',
    actions: [
      { label: 'Ver tour', action: 'start-tour' },
      { label: 'Configurar espacio', action: 'open-space' },
    ],
  },
  'no-tables': {
    id: 'no-tables',
    title: '📋 Sin mesas todavía',
    message: 'Genera mesas automáticamente o usa una plantilla',
    icon: Info,
    color: 'indigo',
    actions: [
      { label: 'Ver plantillas', action: 'open-templates' },
      { label: 'Generar auto', action: 'auto-generate' },
    ],
  },
  'drag-drop': {
    id: 'drag-drop',
    title: '🖱️ Arrastra y suelta',
    message: 'Puedes arrastrar mesas para reorganizar el layout',
    icon: MousePointer,
    color: 'purple',
  },
  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: '⌨️ Atajos de teclado',
    message: 'Usa Ctrl+Z para deshacer, Ctrl+F para buscar, P para plantillas',
    icon: Keyboard,
    color: 'green',
  },
  'zoom-pan': {
    id: 'zoom-pan',
    title: '🔍 Zoom y Pan',
    message: 'Usa la rueda del ratón para zoom, arrastra para mover el canvas',
    icon: Zap,
    color: 'orange',
  },
  'export-ready': {
    id: 'export-ready',
    title: '✅ Listo para exportar',
    message: '¡Tu seating plan está completo! Exporta a PDF o PNG',
    icon: CheckCircle,
    color: 'green',
    actions: [{ label: 'Exportar ahora', action: 'open-export' }],
  },
};

const TOOLTIP_TRIGGERS = {
  'first-time': (state) => !state.hasVisited && !state.hasSpaceConfigured,
  'no-tables': (state) => state.hasSpaceConfigured && state.tables.length === 0,
  'drag-drop': (state) => state.tables.length > 0 && !state.hasDraggedTable,
  'keyboard-shortcuts': (state) => state.actionCount > 10 && !state.hasSeenKeyboardTip,
  'zoom-pan': (state) => state.hasZoomed === false && state.timeSpent > 60,
  'export-ready': (state) => state.tables.length >= 5 && state.assignedGuests >= 10,
};

export default function SeatingTooltips({ state = {}, onAction, position = 'bottom-right' }) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [dismissedTooltips, setDismissedTooltips] = useState(new Set());

  useEffect(() => {
    // Cargar tooltips desestimados
    const dismissed = JSON.parse(localStorage.getItem('seating-dismissed-tooltips') || '[]');
    setDismissedTooltips(new Set(dismissed));
  }, []);

  useEffect(() => {
    // Evaluar qué tooltip mostrar
    for (const [key, trigger] of Object.entries(TOOLTIP_TRIGGERS)) {
      if (dismissedTooltips.has(key)) continue;

      if (trigger(state)) {
        setActiveTooltip(TOOLTIPS[key]);
        break;
      }
    }
  }, [state, dismissedTooltips]);

  const handleDismiss = () => {
    if (activeTooltip) {
      const updated = new Set(dismissedTooltips);
      updated.add(activeTooltip.id);
      setDismissedTooltips(updated);
      localStorage.setItem('seating-dismissed-tooltips', JSON.stringify([...updated]));
      setActiveTooltip(null);
    }
  };

  const handleAction = (action) => {
    onAction?.(action);
    handleDismiss();
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  if (!activeTooltip) return null;

  const Icon = activeTooltip.icon;
  const colorClass = colorClasses[activeTooltip.color] || colorClasses.blue;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed ${positionClasses[position]} z-[9998] max-w-sm`}
      >
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header con gradiente */}
          <div className={`bg-gradient-to-r ${colorClass} p-4 text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg ">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">{activeTooltip.title}</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{activeTooltip.message}</p>

            {/* Actions */}
            {activeTooltip.actions && activeTooltip.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeTooltip.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                             rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    {action.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              No mostrar de nuevo
            </button>
          </div>
        </div>

        {/* Indicator animado */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r ${colorClass} rounded-full`}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para gestionar el estado de tooltips
export function useTooltipState() {
  const [state, setState] = useState({
    hasVisited: false,
    hasSpaceConfigured: false,
    tables: [],
    hasDraggedTable: false,
    actionCount: 0,
    hasSeenKeyboardTip: false,
    hasZoomed: false,
    timeSpent: 0,
    assignedGuests: 0,
  });

  useEffect(() => {
    // Cargar estado previo
    const saved = JSON.parse(localStorage.getItem('seating-tooltip-state') || '{}');
    setState((prev) => ({ ...prev, ...saved, hasVisited: true }));

    // Timer para timeSpent
    const timer = setInterval(() => {
      setState((prev) => ({ ...prev, timeSpent: prev.timeSpent + 1 }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const updateState = (updates) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('seating-tooltip-state', JSON.stringify(newState));
      return newState;
    });
  };

  return [state, updateState];
}
