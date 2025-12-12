import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const tourSteps = [
  {
    id: 1,
    title: '👋 ¡Bienvenido al Diseñador de Web!',
    description: 'Vamos a crear la página web perfecta para tu boda en solo 4 pasos simples.',
    highlight: null,
    action: 'Comenzar',
  },
  {
    id: 2,
    title: '🎨 Paso 1: Elige una Plantilla',
    description:
      'Selecciona el estilo que mejor represente tu boda. Puedes cambiarla en cualquier momento.',
    highlight: 'template-gallery',
    action: 'Siguiente',
  },
  {
    id: 3,
    title: '✏️ Paso 2: Personaliza tu Web',
    description:
      'Describe cómo quieres tu web. Usa las variables para incluir tus datos automáticamente.',
    highlight: 'prompt-editor',
    action: 'Siguiente',
  },
  {
    id: 4,
    title: '👀 Paso 3: Vista Previa',
    description: 'Revisa cómo se verá tu web en diferentes dispositivos antes de publicarla.',
    highlight: 'preview-section',
    action: 'Siguiente',
  },
  {
    id: 5,
    title: '🚀 Paso 4: Publica y Comparte',
    description:
      'Una vez satisfecho con el resultado, publícala y comparte el enlace con tus invitados.',
    highlight: 'publish-section',
    action: 'Finalizar',
  },
];

const WelcomeTour = ({ onComplete, onSkip, show }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [show]);

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);

      // Scroll to highlighted element
      if (tourSteps[currentStep + 1]?.highlight) {
        setTimeout(() => {
          const element = document.getElementById(tourSteps[currentStep + 1].highlight);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
    localStorage.setItem('web_designer_tour_completed', 'true');
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
    localStorage.setItem('web_designer_tour_completed', 'true');
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50  z-40 transition-opacity" />

      {/* Highlight for current step */}
      {step.highlight && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}

      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg px-4">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            {/* Step Indicator */}
            <div className="text-sm font-semibold text-purple-600 mb-2">
              Paso {currentStep + 1} de {tourSteps.length}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>

            {/* Steps Preview */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${index <= currentStep ? 'w-8 bg-purple-600' : 'w-2 bg-gray-300'}
                  `}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
              <div>
                {!isFirst && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft size={20} />
                    <span className="font-medium">Atrás</span>
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Saltar tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:shadow-lg transition-all active:scale-95"
                >
                  <span>{step.action}</span>
                  {isLast ? <Check size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[var(--color-primary)] rounded-full opacity-20 blur-3xl" />
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-20 blur-3xl" />
        </div>
      </div>
    </>
  );
};

export default WelcomeTour;
