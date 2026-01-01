import React from 'react';

/**
 * Componente Alert para mostrar mensajes informativos, errores, advertencias y éxitos
 * @param {string} type - Tipo de alerta ('info', 'success', 'warning', 'error')
 * @param {ReactNode} children - Contenido de la alerta
 * @param {string} className - Clases adicionales
 */
const Alert = ({ type = 'info', children, className = '', ...props }) => {
  const typeStyles = {
    info: { 
      backgroundColor: 'var(--color-info-10)', 
      color: 'var(--color-text)', 
      borderColor: 'var(--color-info)' 
    },
    success: { 
      backgroundColor: 'var(--color-success-10)', 
      color: 'var(--color-text)', 
      borderColor: 'var(--color-success)' 
    },
    warning: { 
      backgroundColor: 'var(--color-yellow)', 
      color: 'var(--color-text)', 
      borderColor: 'var(--color-border)' 
    },
    error: { 
      backgroundColor: 'var(--color-danger-10)', 
      color: 'var(--color-text)', 
      borderColor: 'var(--color-danger)' 
    },
  };

  return (
    <div
      className={`p-4 rounded-md border ${className}`}
      style={typeStyles[type] || typeStyles.info}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

export default Alert;
