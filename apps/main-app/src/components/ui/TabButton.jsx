import React from 'react';

/**
 * TabButton - Botón de pestaña con estados activo/inactivo
 * Consistente con el diseño Soft Pastel & Modern SaaS
 */
const TabButton = ({
  children,
  active = false,
  onClick,
  className = '',
  disabled = false,
  variant = 'default', // default, pill, underline
  ...props
}) => {
  const baseClasses = 'px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: active
      ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
      : 'border-b-2 border-transparent text-[var(--color-text-60)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]',
    
    pill: active
      ? 'rounded-full bg-[var(--color-primary)] text-white'
      : 'rounded-full bg-transparent text-[var(--color-text-60)] hover:bg-[var(--color-text-5)] hover:text-[var(--color-text)]',
    
    underline: active
      ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-text)]'
      : 'border-b-2 border-transparent text-[var(--color-text-60)] hover:border-[var(--color-text-20)]',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const combinedClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    disabledClasses,
    className,
  ].join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      aria-selected={active}
      role="tab"
      style={{ '--tw-ring-color': 'var(--color-primary)' }}
      {...props}
    >
      {children}
    </button>
  );
};

export default TabButton;
