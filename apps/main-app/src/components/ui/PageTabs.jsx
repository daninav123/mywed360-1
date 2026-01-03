import React from 'react';

/**
 * PageTabs - pestañas ligeras estilo Proveedores, basadas en tokens
 * props:
 *  - value: string (tab activa)
 *  - onChange: (val) => void
 *  - options: [{ id, label }]
 *  - className: string (opcional)
 */
export default function PageTabs({ value, onChange, options = [], className = '' }) {
  return (
    <nav className={`tabs-nav ${className}`} aria-label="Pestañas de página">
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            data-testid={`tab-${opt.id}`}
            className="tab-trigger inline-flex items-center px-3 py-1.5 rounded-md text-sm border transition-all"
            style={{
              backgroundColor: isActive ? 'var(--color-lavender)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
              borderColor: isActive ? 'var(--color-primary)' : 'transparent',
            }}
            onMouseEnter={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'var(--color-yellow)')}
            onMouseLeave={(e) => !isActive && (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-current={isActive ? 'page' : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </nav>
  );
}
