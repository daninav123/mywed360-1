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
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange?.(opt.id)}
          className={`tab-trigger ${value === opt.id ? 'tab-trigger-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </nav>
  );
}

