import { CheckCircle, Circle, ChevronRight, X } from 'lucide-react';
import React from 'react';

const noop = () => {};

export default function SeatingPlanOnboardingChecklist({
  steps = [],
  currentStep = null,
  progress,
  onDismiss = noop,
}) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  const totalSteps = progress?.total ?? steps.length;
  const completedSteps =
    progress?.completed ??
    steps.reduce((acc, step) => (step?.done ? acc + 1 : acc), 0);
  const percent =
    progress?.percent ??
    (totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0);
  const activeStepId =
    currentStep ??
    steps.find((step) => !step?.done)?.id ??
    (steps.length > 0 ? steps[steps.length - 1].id : null);

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Primeros pasos</h3>
          <p className="text-xs text-blue-700">
            {completedSteps >= totalSteps
              ? '¡Listo! Ya completaste la preparación básica.'
              : `Progreso ${completedSteps}/${totalSteps} (${percent}%)`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-blue-500 transition hover:bg-blue-50 hover:text-blue-700"
          aria-label="Omitir onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>

      <ul className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const isDone = !!step?.done;
          const stepId = step?.id ?? index;
          const isActive = !isDone && stepId === activeStepId;
          const Icon = isDone ? CheckCircle : Circle;
          const stepNumber = index + 1;

          return (
            <li
              key={stepId}
              className={`rounded-xl border p-3 transition ${
                isDone
                  ? 'border-green-200 bg-green-50/60 text-green-800'
                  : isActive
                    ? 'border-blue-300 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                    isDone ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-gray-400'
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">
                      {step?.title || `Paso ${stepNumber}`}
                    </span>
                    {!isDone && (
                      <span className="rounded-full border border-current px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        Paso {stepNumber}
                      </span>
                    )}
                    {isDone && (
                      <span className="rounded-full border border-green-300 bg-white px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Completado
                      </span>
                    )}
                  </div>
                  {step?.description ? (
                    <p className="text-xs leading-5 text-inherit">{step.description}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {typeof step?.onAction === 'function' && (
                      <button
                        type="button"
                        onClick={step.onAction}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          isDone
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {step?.actionLabel || 'Ir al paso'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!isDone && typeof step?.onMarkDone === 'function' && (
                      <button
                        type="button"
                        onClick={step.onMarkDone}
                        className="inline-flex items-center gap-1 rounded-full border border-current px-2.5 py-1 text-xs font-medium text-inherit transition hover:bg-white"
                      >
                        Marcar completado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

