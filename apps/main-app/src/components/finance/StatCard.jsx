import React from 'react';

import { Card } from '../ui';

const toneToVar = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

const toneToBg = {
  primary: 'bg-[var(--color-primary-10)]',
  success: 'bg-[var(--color-success-10)]',
  warning: 'bg-[var(--color-warning-10)]',
  danger: 'bg-[var(--color-danger-10)]',
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
  const bgTone = toneToBg[tone] || toneToBg.primary;
  const clickable = typeof onClick === 'function';

  const padding = compact ? 'p-5 md:p-6' : 'p-6 md:p-7';

  const renderSparkline = () => {
    const data = Array.isArray(sparklineData) ? sparklineData : null;
    if (!data || data.length < 2) return null;
    const w = 100;
    const h = 32;
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
      <svg
        width={w}
        height={h}
        className="absolute right-4 bottom-4 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
        aria-hidden="true"
        focusable="false"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const renderDelta = () => {
    if (typeof deltaValue !== 'number') return null;
    const trendColor =
      deltaTrend === 'up'
        ? 'var(--color-success)'
        : deltaTrend === 'down'
          ? 'var(--color-danger)'
          : 'var(--color-text)';
    const arrow = deltaTrend === 'up' ? '▲' : deltaTrend === 'down' ? '▼' : '•';
    const bgColor = deltaTrend === 'up' 
      ? 'color-mix(in srgb, var(--color-success) 15%, transparent)'
      : deltaTrend === 'down'
        ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
        : 'color-mix(in srgb, var(--color-text) 10%, transparent)';
    
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm"
        style={{ color: trendColor, backgroundColor: bgColor }}
      >
        <span aria-hidden className="text-sm">{arrow}</span>
        <span>{Math.abs(deltaValue).toFixed(1)}%</span>
        {deltaLabel && <span className="text-[color:var(--color-text-60)] font-normal ml-1">{deltaLabel}</span>}
      </div>
    );
  };

  return (
    <Card
      className={`${padding} group relative ${clickable ? 'cursor-pointer transition-shadow duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-[color:var(--color-primary-50)]' : 'transition-shadow duration-300'} ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      title={tooltip}
    >
      {/* Barra de color superior */}
      <div 
        className="absolute inset-x-0 top-0 h-1 opacity-90 rounded-t-xl" 
        style={{ backgroundColor: color }} 
      />
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          {title && (
            <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">{title}</p>
          )}
          <div className="space-y-2">
            {loading ? (
              <div className="h-9 md:h-10 w-32 bg-[color:var(--color-text-10)] rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl md:text-4xl font-bold text-body tracking-tight">
                {value}
              </div>
            )}
            {subtitle && !loading && (
              <p className="text-xs md:text-sm text-muted font-medium">
                {subtitle}
              </p>
            )}
            {!loading && renderDelta()}
          </div>
        </div>
        {icon && (
          <div 
            className={`relative p-3 md:p-4 rounded-2xl border border-soft ${bgTone}`}
          >
            <div className="w-6 h-6 md:w-7 md:h-7" style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      <div style={{ color }} className="relative z-10">{renderSparkline()}</div>
    </Card>
  );
}
