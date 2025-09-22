import React from 'react';
import { Card } from '../ui';

const toneToVar = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)'
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon = null,
  tone = 'primary',
  className = '',
  onClick,
  role,
  tabIndex,
  // visual extras
  compact = false,
  loading = false,
  tooltip,
  // delta meta
  deltaValue,
  deltaTrend = 'neutral', // 'up' | 'down' | 'neutral'
  deltaLabel,
  // sparkline
  sparklineData,
}) {
  const color = toneToVar[tone] || toneToVar.primary;
  const clickable = typeof onClick === 'function';

  const padding = compact ? 'p-4 md:p-5' : 'p-5 md:p-6';

  const renderSparkline = () => {
    const data = Array.isArray(sparklineData) ? sparklineData : null;
    if (!data || data.length < 2) return null;
    const w = 84;
    const h = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);
    const points = data
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      })
      .join(' ');
    return (
      <svg width={w} height={h} className="absolute right-3 bottom-3 opacity-70" aria-hidden="true" focusable="false">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const renderDelta = () => {
    if (typeof deltaValue !== 'number') return null;
    const trendColor = deltaTrend === 'up' ? 'var(--color-success)' : deltaTrend === 'down' ? 'var(--color-danger)' : 'var(--color-text)';
    const arrow = deltaTrend === 'up' ? '▲' : deltaTrend === 'down' ? '▼' : '•';
    return (
      <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
        <span aria-hidden>{arrow}</span>
        <span>{Math.abs(deltaValue).toFixed(1)}%</span>
        {deltaLabel && <span className="text-[color:var(--color-text)]/60">{deltaLabel}</span>}
      </div>
    );
  };

  return (
    <Card
      className={`${padding} relative overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md border-soft ${clickable ? 'cursor-pointer transition hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]/40' : 'transition'} ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      title={tooltip}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="text-sm font-medium text-[color:var(--color-text)]/70">{title}</p>}
          <div className="mt-1">
            {loading ? (
              <div className="h-7 md:h-8 w-28 bg-[color:var(--color-text)]/10 rounded animate-pulse" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-[color:var(--color-text)]">{value}</div>
            )}
            {subtitle && !loading && (
              <p className="text-xs md:text-sm text-[color:var(--color-text)]/60 mt-1">{subtitle}</p>
            )}
            {!loading && renderDelta()}
          </div>
        </div>
        {icon && (
          <div className="p-2 md:p-3 rounded-full" style={{ backgroundColor: `${color}1A` }}>
            {/* 1A ~ 10% opacity */}
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      <div style={{ color }}>{renderSparkline()}</div>
    </Card>
  );
}
