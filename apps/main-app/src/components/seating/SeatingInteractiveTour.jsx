/**
 * SeatingInteractiveTour - Tour interactivo paso a paso
 * FASE 4: Onboarding & UX
 */
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { Sparkles } from 'lucide-react';

const TOUR_STEPS = [
  {
    target: '[data-tour="tabs"]',
    content:
      '¡Bienvenido al Seating Plan! Aquí puedes organizar tanto la Ceremonia como el Banquete.',
    title: '👋 ¡Bienvenido!',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    content:
      'Usa Ctrl+F para buscar invitados rápidamente. Puedes filtrar por mesa, grupo o estado de asignación.',
    title: '🔍 Búsqueda Avanzada',
    placement: 'bottom',
  },
  {
    target: '[data-tour="toolbar"]',
    content:
      'Aquí tienes todas las herramientas: deshacer, rehacer, dibujar áreas, exportar y más.',
    title: '🛠️ Barra de Herramientas',
    placement: 'bottom',
  },
  {
    target: '[data-tour="canvas"]',
    content:
      'Este es tu lienzo. Arrastra mesas, asigna invitados, y diseña el layout perfecto. Usa la rueda del ratón para hacer zoom.',
    title: '🎨 Canvas Interactivo',
    placement: 'center',
  },
  {
    target: '[data-tour="config-space"]',
    content: 'Primero configura las dimensiones de tu salón para empezar.',
    title: '📏 Configurar Espacio',
    placement: 'left',
  },
  {
    target: '[data-tour="templates"]',
    content: '¿No sabes por dónde empezar? Usa nuestras plantillas predefinidas (tecla P).',
    title: '✨ Plantillas',
    placement: 'left',
  },
  {
    target: '[data-tour="auto-layout"]',
    content:
      'Si ya tienes invitados asignados, genera el layout automáticamente con un solo click.',
    title: '🤖 Layout Automático',
    placement: 'left',
  },
  {
    target: '[data-tour="export"]',
    content: 'Cuando termines, exporta tu seating plan en PDF, PNG, SVG o Excel.',
    title: '📥 Exportar',
    placement: 'left',
  },
  {
    target: '[data-tour="guests-panel"]',
    content: 'Aquí verás los invitados pendientes de asignar. Arrástralos a las mesas.',
    title: '👥 Panel de Invitados',
    placement: 'left',
  },
  {
    target: '[data-tour="help"]',
    content: '¿Necesitas ayuda? Siempre puedes volver a ver este tour desde el menú de ayuda.',
    title: '❓ Ayuda',
    placement: 'bottom',
  },
];

const STORAGE_KEY = 'seating-tour-completed';

export default function SeatingInteractiveTour({
  isEnabled = true,
  autoStart = false,
  onComplete,
  onSkip,
}) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourCompleted, setTourCompleted] = useState(false);

  // Verificar si el tour ya fue completado
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    setTourCompleted(!!completed);

    // Auto-iniciar si es la primera vez
    if (autoStart && !completed) {
      setTimeout(() => setRun(true), 1000);
    }
  }, [autoStart]);

  const handleJoyrideCallback = (data) => {
    const { status, action, index, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Avanzar al siguiente paso
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completado o saltado
      setRun(false);
      setStepIndex(0);

      if (status === STATUS.FINISHED) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setTourCompleted(true);
        onComplete?.();
      } else if (status === STATUS.SKIPPED) {
        onSkip?.();
      }
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTourCompleted(false);
    startTour();
  };

  // Exponer función para iniciar tour externamente
  React.useImperativeHandle(React.useRef(), () => ({
    start: startTour,
    reset: resetTour,
  }));

  if (!isEnabled) return null;

  return (
    <>
      <Joyride
        steps={TOUR_STEPS}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#6366f1',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            arrowColor: '#ffffff',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 12,
            padding: 20,
            fontSize: 14,
          },
          tooltipTitle: {
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
          },
          tooltipContent: {
            padding: '8px 0',
            lineHeight: 1.6,
          },
          buttonNext: {
            backgroundColor: '#6366f1',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 12,
          },
          buttonSkip: {
            color: '#9ca3af',
          },
        }}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: '¡Terminar!',
          next: 'Siguiente',
          skip: 'Saltar tour',
        }}
      />

      {/* Botón flotante para reiniciar tour */}
      {tourCompleted && (
        <button
          onClick={startTour}
          className="fixed bottom-6 right-6 p-4 bg-[var(--color-primary)] 
                     text-white rounded-full shadow-lg hover:shadow-xl transition-all
                     hover:scale-110 z-[9999] group"
          title="Ver tour de nuevo"
        >
          <Sparkles className="w-6 h-6" />
          <span
            className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm
                         rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
                         transition-opacity pointer-events-none"
          >
            Ver tour de nuevo
          </span>
        </button>
      )}
    </>
  );
}

// Hook para usar el tour programáticamente
export function useSeatingTour() {
  const [tourRef, setTourRef] = useState(null);

  const startTour = () => {
    if (tourRef) {
      tourRef.start?.();
    }
  };

  const resetTour = () => {
    if (tourRef) {
      tourRef.reset?.();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const isTourCompleted = () => {
    return !!localStorage.getItem(STORAGE_KEY);
  };

  return {
    tourRef: setTourRef,
    startTour,
    resetTour,
    isTourCompleted,
  };
}
