import React from 'react';

/**
 * Modal
 * Props:
 *  - open: boolean
 *  - title: string | ReactNode
 *  - onClose: () => void
 *  - size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 *  - className: string (clases extra para el contenedor)
 */
export default function Modal({
  open,
  title,
  children,
  onClose,
  size = 'md',
  className = '',
  ...rest
}) {
  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[92vw]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} max-h-[90vh] flex flex-col rounded-lg shadow-lg border border-soft bg-[var(--color-surface)] text-[color:var(--color-text)] ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-soft">
          <h3 className="text-lg font-semibold leading-none">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded hover:bg-[var(--color-accent)]/20 focus:outline-none focus:ring-2 ring-primary"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 flex-1">{children}</div>
      </div>
    </div>
  );
}
