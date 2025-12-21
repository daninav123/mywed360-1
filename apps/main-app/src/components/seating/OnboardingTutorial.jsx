/**
 * OnboardingTutorial - Tutorial interactivo paso a paso
 * FASE 4: Onboarding Interactivo
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Sparkles,
  MousePointer,
  Move,
  Users,
  Layout,
  Download
} from 'lucide-react';
import Confetti from 'react-confetti';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: '�Bienvenido al Seating Plan! <�',
    description: 'Te guiaremos paso a paso para crear el layout perfecto de tu evento.',
    icon: Sparkles,
    position: 'center',
    highlight: null,
  },
  {
    id: 'add-table',
    title: 'A�adir Mesas',
    description: 'Click en el bot�n + flotante para a�adir una mesa. Tambi�n puedes usar templates predefinidos.',
    icon: Layout,
    position: 'bottom-right',
    highlight: '.quick-add-button',
    action: 'Click en el bot�n +',
  },
  {
    id: 'move-table',
    title: 'Mover Mesas',
    description: 'Arrastra las mesas para posicionarlas. Las gu�as de alineaci�n te ayudar�n a mantener todo ordenado.',
    icon: Move,
    position: 'center',
    highlight: '.table-item',
    action: 'Arrastra una mesa',
  },
  {
    id: 'select-multiple',
    title: 'Selecci�n M�ltiple',
    description: 'Mant�n Shift y arrastra para seleccionar varias mesas. Luego puedes alinearlas o distribuirlas.',
    icon: MousePointer,
    position: 'center',
    highlight: null,
    action: 'Shift + Arrastrar',
  },
  {
    id: 'assign-guests',
    title: 'Asignar Invitados',
    description: 'Abre el panel lateral, busca un invitado y arr�stralo a una mesa. Ver�s un preview mientras lo mueves.',
    icon: Users,
    position: 'left',
    highlight: '.guest-drawer',
    action: 'Arrastra un invitado',
  },
  {
    id: 'export',
    title: 'Exportar Layout',
    description: 'Cuando termines, exporta tu layout en PNG, PDF, SVG o CSV. �Listo para compartir!',
    icon: Download,
    position: 'top-right',
    highlight: '.export-button',
    action: 'Click en Exportar',
  },
  {
    id: 'complete',
    title: '�Todo Listo! <�',
    description: 'Ya sabes lo b�sico. Explora las dem�s funciones y crea el layout perfecto.',
    icon: Check,
    position: 'center',
    highlight: null,
  },
];

export default function OnboardingTutorial({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  // Highlight del elemento si existe
  useEffect(() => {
    if (step.highlight) {
      const element = document.querySelector(step.highlight);
      setHighlightedElement(element);
    } else {
      setHighlightedElement(null);
    }
  }, [step.highlight]);

  const handleNext = () => {
    if (isLast) {
      setCompleted(true);
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  // Calcular posici�n del tooltip
  const getTooltipPosition = () => {
    if (!highlightedElement || step.position === 'center') {
      return 'center';
    }

    const rect = highlightedElement.getBoundingClientRect();
    
    switch (step.position) {
      case 'bottom-right':
        return { top: rect.bottom + 20, left: rect.right - 400 };
      case 'top-right':
        return { top: rect.top - 200, left: rect.right - 400 };
      case 'left':
        return { top: rect.top, left: rect.left - 420 };
      default:
        return 'center';
    }
  };

  const tooltipPosition = getTooltipPosition();
  const Icon = step.icon;

  return (
    <>
      {/* Confetti al completar */}
      {completed && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Overlay oscuro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60  z-[100]"
        onClick={handleSkip}
      />

      {/* Highlight del elemento */}
      {highlightedElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: highlightedElement.getBoundingClientRect().top - 4,
            left: highlightedElement.getBoundingClientRect().left - 4,
            width: highlightedElement.offsetWidth + 8,
            height: highlightedElement.offsetHeight + 8,
            zIndex: 101,
            pointerEvents: 'none',
          }}
          className="rounded-lg ring-2 ring-[color:var(--color-primary)] shadow-lg"
        >
          {/* Pulso animado */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-[var(--color-primary-20)] rounded-lg"
          />
        </motion.div>
      )}

      {/* Tooltip del tutorial */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={
          tooltipPosition === 'center'
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 102,
              }
            : {
                position: 'fixed',
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                zIndex: 102,
              }
        }
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-md w-[400px]"
      >
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-[var(--color-primary)]"
          />
        </div>

        <div className="p-6">
          {/* Header con icono */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Paso {currentStep + 1} de {TUTORIAL_STEPS.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Descripci�n */}
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {step.description}
          </p>

          {/* Action hint */}
          {step.action && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                {step.action}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Saltar tutorial
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrevious}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center gap-2"
              >
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {TUTORIAL_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${idx === currentStep
                    ? 'w-6 bg-indigo-600'
                    : idx < currentStep
                    ? 'bg-indigo-400'
                    : 'bg-gray-300 dark:bg-gray-700'
                  }
                `}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
