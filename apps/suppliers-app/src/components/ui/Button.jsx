import React from 'react';

/**
 * Componente Button con variantes basadas en tokens CSS
 * Usa --color-primary, --color-text, --color-surface, --color-danger
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  startIcon,
  leftIcon,
  rightIcon,
  endIcon,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md';

  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:brightness-95',
    secondary:
      'bg-surface text-body border border-soft hover:bg-[var(--color-accent-20)]',
    outline:
      'bg-transparent border border-[color:var(--color-text-25)] text-body hover:bg-[var(--color-accent-10)]',
    ghost: 'bg-transparent text-body hover:bg-[var(--color-accent-10)]',
    destructive: 'bg-[var(--color-danger)] text-white hover:brightness-90',
    danger: 'bg-[var(--color-danger)] text-white hover:brightness-90',
    link: 'bg-transparent underline-offset-4 hover:underline text-primary hover:brightness-110',
  };

  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'px-3 py-1.5 text-sm',
    md: 'text-sm px-4 py-2',
    lg: 'px-5 py-2.5 text-base',
    xl: 'text-lg px-6 py-3',
  };

  const disabledClasses = disabled
    ? 'opacity-60 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabledClasses,
    className,
  ].join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      // Asegurar color del foco acorde al tema
      style={{ '--tw-ring-color': 'var(--color-primary)' }}
      {...props}
    >
      {(startIcon || leftIcon) && <span className="mr-2">{startIcon || leftIcon}</span>}
      {children}
      {(rightIcon || endIcon) && <span className="ml-2">{rightIcon || endIcon}</span>}
    </button>
  );
}
