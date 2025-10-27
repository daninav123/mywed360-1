import React from 'react';

import { Card } from '../ui';

const toneToVar = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

const toneToGradient = {
  primary: 'from-[#5ebbff]/20 via-[#5ebbff]/5 to-transparent',
  success: 'from-[#22c55e]/20 via-[#22c55e]/5 to-transparent',
  warning: 'from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent',
  danger: 'from-[#ef4444]/20 via-[#ef4444]/5 to-transparent',
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
  const gradient = toneToGradient[tone] || toneToGradient.primary;
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
    
    // Crear área para el gradiente
    const areaPoints = `${points} ${w},${h} 0,${h}`;
    
    return (
      <svg
        width={w}
        height={h}
        className="absolute right-4 bottom-4 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`gradient-${tone}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={areaPoints}
          fill={`url(#gradient-${tone})`}
        />
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
        {deltaLabel && <span className="text-[color:var(--color-text)]/60 font-normal ml-1">{deltaLabel}</span>}
      </div>
    );
  };

  return (
    <Card
      className={`${padding} group relative overflow-hidden bg-gradient-to-br ${gradient} backdrop-blur-xl border-soft shadow-lg ${clickable ? 'cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]/50' : 'transition-all duration-300'} ${className}`}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      title={tooltip}
    >
      {/* Gradiente superior con efecto shimmer */}
      <div 
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r opacity-90 group-hover:opacity-100 transition-opacity duration-300" 
        style={{ 
          backgroundImage: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, white))` 
        }} 
      />
      
      {/* Efecto de luz de fondo */}
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          {title && (
            <p className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">{title}</p>
          )}
          <div className="space-y-2">
            {loading ? (
              <div className="h-9 md:h-10 w-32 bg-[color:var(--color-text)]/10 rounded-lg animate-pulse" />
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
            className="relative p-3 md:p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
            style={{ 
              backgroundColor: `color-mix(in srgb, ${color} 15%, var(--color-surface))`,
              boxShadow: `0 4px 14px color-mix(in srgb, ${color} 25%, transparent)`
            }}
          >
            <div className="w-6 h-6 md:w-7 md:h-7" style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      <div style={{ color }} className="relative z-10">{renderSparkline()}</div>
    </Card>
  );
}
