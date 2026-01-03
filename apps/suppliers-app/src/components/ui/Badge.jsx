import React from 'react';

/**
 * Componente Badge para mostrar etiquetas pequeñas con diferentes estilos
 * @param {string} type - Tipo de badge ('default', 'info', 'success', 'warning', 'error')
 * @param {ReactNode} children - Contenido del badge
 * @param {string} className - Clases adicionales
 */
const Badge = ({ type = 'default', children, className = '', ...props }) => {
  const typeStyles = {
    default: { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' },
    primary: { backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' },
    info: { backgroundColor: 'var(--color-info-10)', color: 'var(--color-info)' },
    success: { backgroundColor: 'var(--color-success-10)', color: 'var(--color-success)' },
    warning: { backgroundColor: 'var(--color-yellow)', color: 'var(--color-text)' },
    error: { backgroundColor: 'var(--color-danger-10)', color: 'var(--color-danger)' },
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={typeStyles[type] || typeStyles.default}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
