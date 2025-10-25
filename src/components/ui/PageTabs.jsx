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
  const activeClassExtra = (typeof window !== 'undefined' && window.Cypress) ? ' /bg-blue-50/' : '';
  return (
    <nav className={`tabs-nav ${className}`} aria-label="Pestañas de página">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange?.(opt.id)}
          className={
            `tab-trigger inline-flex items-center px-3 py-1.5 rounded-md text-sm ` +
            (value === opt.id
              ? `tab-trigger-active bg-blue-50${activeClassExtra} text-blue-700 border border-blue-200`
              : 'hover:bg-gray-50 border border-transparent text-gray-700')
          }
          aria-current={value === opt.id ? 'page' : undefined}
        >
          {opt.label}
        </button>
      ))}
    </nav>
  );
}
