/**
 * InitialSetupWizard - Wizard de configuración inicial del Seating Plan
 * Primera vez que el usuario entra: Salón → Template → Listo
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ruler, 
  LayoutGrid, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

const STEP_DEFINITIONS = [
  {
    id: 'dimensions',
    icon: Ruler,
    titleKey: 'initialWizard.steps.dimensions.title',
    descriptionKey: 'initialWizard.steps.dimensions.description',
  },
  {
    id: 'template',
    icon: LayoutGrid,
    titleKey: 'initialWizard.steps.template.title',
    descriptionKey: 'initialWizard.steps.template.description',
  },
  {
    id: 'complete',
    icon: CheckCircle,
    titleKey: 'initialWizard.steps.complete.title',
    descriptionKey: 'initialWizard.steps.complete.description',
  },
];

export default function InitialSetupWizard({ 
  onComplete, 
  onOpenHallConfig,
  onOpenTemplates,
  hallDimensions = null,
  selectedTemplate = null,
  guestCount = 0,
}) {
  const { t, tPlural } = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () =>
      STEP_DEFINITIONS.map((step) => ({
        ...step,
        title: t(step.titleKey),
        description: t(step.descriptionKey),
      })),
    [t]
  );

  const step = steps[currentStep] || steps[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const canProceed = 
    (currentStep === 0 && hallDimensions) ||
    (currentStep === 1 && selectedTemplate) ||
    currentStep === 2;

  const handleNext = () => {
    if (currentStep === 0 && !hallDimensions) {
      // Abrir configuración de salón
      onOpenHallConfig?.();
    } else if (currentStep === 0 && hallDimensions) {
      // Ya tiene dimensiones, avanzar
      setCurrentStep(1);
    } else if (currentStep === 1 && !selectedTemplate) {
      // Abrir selector de templates
      onOpenTemplates?.();
    } else if (currentStep === 1 && selectedTemplate) {
      // Ya tiene template, avanzar
      setCurrentStep(2);
    } else if (isLast) {
      // Completar wizard
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const Icon = step.icon;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const summaryPoints = useMemo(() => {
    const points = t('initialWizard.sections.complete.points', {
      ns: 'seating',
      returnObjects: true,
    });
    return Array.isArray(points) ? points : [];
  }, [t]);

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-gray-800"
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 dark:bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-[var(--color-primary)]"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Icon y título */}
            <div className="flex flex-col items-center text-center mb-8">
              <motion.div
                key={currentStep}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-[var(--color-primary)] rounded-lg flex items-center justify-center mb-4 shadow"
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-2">
                {step.title}
              </h2>
              <p className="text-[var(--color-muted)]">
                {step.description}
              </p>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-8"
              >
                {currentStep === 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border-2 border-dashed border-indigo-300 dark:border-indigo-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-indigo-600" />
                      {t('initialWizard.sections.dimensions.title', { ns: 'seating' })}
                    </h3>
                    {hallDimensions ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            <strong>{(hallDimensions.width / 100).toFixed(1)} m</strong> de ancho × <strong>{(hallDimensions.height / 100).toFixed(1)} m</strong> de alto
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[Button Click] Cambiar dimensiones');
                            onOpenHallConfig?.();
                          }}
                          type="button"
                          className="text-sm text-[var(--color-primary)] hover:opacity-80 font-medium flex items-center gap-1 cursor-pointer hover:underline"
                        >
                          {t('initialWizard.sections.dimensions.change', { ns: 'seating' })}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {t('initialWizard.sections.dimensions.prompt', { ns: 'seating' })}
                        </p>
                        {guestCount > 0 && (
                          <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                            {tPlural('initialWizard.sections.dimensions.detectedGuests', guestCount, {
                              ns: 'seating',
                              count: guestCount,
                            })}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-2">
                          {t('initialWizard.sections.dimensions.cta', { ns: 'seating' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-2 border-dashed border-purple-300 dark:border-purple-700">
                    <h3 className="font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-[var(--color-primary)]" />
                      {t('initialWizard.sections.template.title', { ns: 'seating' })}
                    </h3>
                    {selectedTemplate ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {t('initialWizard.sections.template.selectedPrefix', { ns: 'seating' })}{' '}
                            <strong>{selectedTemplate.name || selectedTemplate.id}</strong>
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[Button Click] Cambiar plantilla');
                            onOpenTemplates?.();
                          }}
                          type="button"
                          className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {t('initialWizard.sections.template.change', { ns: 'seating' })}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[var(--color-muted)] text-sm">
                        {t('initialWizard.sections.template.prompt', { ns: 'seating' })}
                      </p>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="bg-[var(--color-surface)] rounded-lg p-5 border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-start gap-4">
                      <Sparkles className="w-6 h-6 text-[var(--color-success)] flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-[var(--color-text)] mb-2">
                          {t('initialWizard.sections.complete.title', { ns: 'seating' })}
                        </h3>
                        <p className="text-[var(--color-text)] text-sm mb-4">
                          {t('initialWizard.sections.complete.description', { ns: 'seating' })}
                        </p>
                        <ul className="space-y-2 text-sm text-[var(--color-muted)]">
                          {summaryPoints.map((point) => (
                            <li key={point} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              {!isFirst ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('initialWizard.buttons.back', { ns: 'seating' })}
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center gap-3">
                {!isLast && (
                  <>
                    <button
                      onClick={onComplete}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    >
                      {t('initialWizard.buttons.skipNow', { ns: 'seating' })}
                    </button>
                    {step.id === 'dimensions' && (
                      <button
                        onClick={onOpenHallConfig}
                        disabled={!canProceed}
                        className={`px-6 py-2.5 rounded-md font-medium text-white flex items-center gap-2 transition-colors ${
                          !canProceed
                            ? 'bg-[var(--color-primary)] hover:opacity-90'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {t('initialWizard.buttons.configureHall', { ns: 'seating' })}
                        <Ruler className="w-4 h-4" />
                      </button>
                    )}
                    {step.id === 'template' && !selectedTemplate && (
                      <button
                        onClick={onOpenTemplates}
                        className="px-6 py-2.5 bg-[var(--color-primary)] hover:opacity-90 text-white rounded-md font-medium flex items-center gap-2 transition-colors"
                      >
                        {t('initialWizard.buttons.chooseTemplate', { ns: 'seating' })}
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    )}
                    {step.id === 'template' && selectedTemplate && (
                      <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-[var(--color-primary)] hover:opacity-90 text-white rounded-md font-medium flex items-center gap-2 transition-colors"
                      >
                        {t('initialWizard.buttons.next', { ns: 'seating' })}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}

                {step.id === 'complete' && (
                  <>
                    <button
                      onClick={onComplete}
                      className="px-5 py-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    >
                      {t('initialWizard.buttons.doLater', { ns: 'seating' })}
                    </button>
                    <button
                      onClick={onComplete}
                      className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('initialWizard.buttons.startPlanning', { ns: 'seating' })}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Solo permitir volver atrás, no adelante si no está completo
                    if (idx < currentStep) {
                      setCurrentStep(idx);
                    }
                  }}
                  className={`
                    h-1.5 rounded-full transition-all
                    ${idx === currentStep
                      ? 'w-8 bg-[var(--color-primary)]'
                      : idx < currentStep
                      ? 'w-2 bg-[var(--color-success)] cursor-pointer hover:w-6'
                      : 'w-2 bg-[var(--color-border)]'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
