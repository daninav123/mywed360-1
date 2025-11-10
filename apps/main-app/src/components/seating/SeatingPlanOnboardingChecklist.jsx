import { Check, ChevronRight, X } from 'lucide-react';
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
    progress?.completed ?? steps.reduce((acc, step) => (step?.done ? acc + 1 : acc), 0);
  const percent =
    progress?.percent ??
    (totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0);
  const activeStepId =
    currentStep ?? steps.find((step) => !step?.done)?.id ?? (steps.length > 0 ? steps[0].id : null);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Primeros pasos</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Completa estas acciones para dejar tu plano listo
          </h3>
          <p className="text-xs text-slate-500">
            {completedSteps >= totalSteps
              ? 'Ya terminaste la preparacion inicial.'
              : `Progreso ${completedSteps}/${totalSteps} (${percent}%)`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
          aria-label="Omitir onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>

      <ul className="mt-6 space-y-3">
        {steps.map((step, index) => {
          const isDone = !!step?.done;
          const stepId = step?.id ?? index;
          const isActive = !isDone && stepId === activeStepId;
          const stepNumber = index + 1;

          return (
            <li
              key={stepId}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700"
            >
              <span
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  isDone
                    ? 'border-emerald-500 text-emerald-600'
                    : isActive
                      ? 'border-slate-900 text-slate-900'
                      : 'border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : stepNumber}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {step?.title || `Paso ${stepNumber}`}
                  </span>
                  {typeof step?.onAction === 'function' ? (
                    <button
                      type="button"
                      onClick={step.onAction}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                    >
                      {step?.actionLabel || 'Ir'}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
                {step?.description ? (
                  <p className="text-xs text-slate-600">{step.description}</p>
                ) : null}
                {!isDone && typeof step?.onMarkDone === 'function' ? (
                  <button
                    type="button"
                    onClick={step.onMarkDone}
                    className="self-start text-xs text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline"
                  >
                    Marcar como listo
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

