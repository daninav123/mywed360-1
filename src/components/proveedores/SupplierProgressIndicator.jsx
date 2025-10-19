import React, { useMemo } from 'react';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

const primaryColor = 'var(--color-primary, #6366f1)';
const softColor = 'var(--color-primary-soft, rgba(99, 102, 241, 0.16))';

function formatPercent(value) {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Math.round(value);
  return `${rounded}%`;
}

export default function SupplierProgressIndicator({
  stages = [],
  activeStageIndex = 0,
  progressPercent = 0,
  headline,
}) {
  const safeProgress = Number.isFinite(progressPercent) ? Math.max(0, Math.min(100, progressPercent)) : 0;
  const progressAngle = (safeProgress / 100) * 360;

  const currentStage = stages[activeStageIndex] || stages[0] || {};

  const stageItems = useMemo(
    () =>
      stages.map((stage, index) => ({
        ...stage,
        isCurrent: stage.isCurrent ?? index === activeStageIndex,
        completed: stage.completed ?? false,
      })),
    [stages, activeStageIndex]
  );

  return (
    <section className="relative w-full max-w-xs rounded-2xl border border-soft bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <header className="flex items-center justify-between text-sm font-semibold text-muted">
        <span>{headline || 'Avance hacia el contrato'}</span>
        <ChevronRight size={16} className="text-muted" />
      </header>
      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-[10px]"
            style={{
              background: `conic-gradient(${primaryColor} 0deg ${progressAngle}deg, ${softColor} ${progressAngle}deg 360deg)`,
              borderColor: 'rgba(148, 163, 184, 0.14)',
            }}
          />
          <div className="absolute inset-3 rounded-full border border-soft bg-white/80 backdrop-blur-sm" />
          <div className="relative flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-primary">{formatPercent(safeProgress)}</span>
            <span className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">
              {currentStage.label || 'Ideas'}
            </span>
            {currentStage?.hint && (
              <p className="mt-2 px-4 text-center text-[11px] leading-tight text-muted">{currentStage.hint}</p>
            )}
          </div>
        </div>
        <div className="w-full space-y-2">
          {stageItems.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-start gap-2 rounded-xl border p-2 text-xs transition ${
                stage.completed
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
                  : stage.isCurrent
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-soft bg-surface text-muted'
              }`}
            >
              <div className="pt-0.5">
                {stage.completed ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Circle size={16} className={stage.isCurrent ? 'text-primary' : 'text-muted'} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px]">{stage.label}</span>
                  {(Number(stage.count) || 0) > 0 && (
                    <span className="rounded-full border border-current/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {stage.count}
                    </span>
                  )}
                </div>
                {stage.hint && <p className="mt-1 text-[11px] leading-tight">{stage.hint}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

