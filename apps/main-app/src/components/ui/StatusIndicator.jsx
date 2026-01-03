import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

/**
 * StatusIndicator - Indicador de estado visual con icono y color
 * Para mostrar estados de guardado, error, pendiente, etc.
 */
const StatusIndicator = ({
  status = 'idle', // idle, saved, unsaved, loading, error, success
  message,
  size = 'sm',
  className = '',
  showIcon = true,
  ...props
}) => {
  const statusConfig = {
    idle: {
      icon: null,
      bgClass: 'bg-[var(--color-text-5)]',
      textClass: 'text-[var(--color-text-60)]',
      defaultMessage: 'Listo',
    },
    saved: {
      icon: CheckCircle,
      bgClass: 'bg-[var(--color-success-10)]',
      textClass: 'text-[var(--color-success)]',
      defaultMessage: 'Guardado',
    },
    unsaved: {
      icon: AlertCircle,
      bgClass: 'bg-[var(--color-info-10)]',
      textClass: 'text-[var(--color-info)]',
      defaultMessage: 'Cambios sin guardar',
      animate: true,
    },
    loading: {
      icon: Clock,
      bgClass: 'bg-[var(--color-primary-10)]',
      textClass: 'text-[var(--color-primary)]',
      defaultMessage: 'Guardando...',
      animate: true,
    },
    error: {
      icon: XCircle,
      bgClass: 'bg-[var(--color-danger-10)]',
      textClass: 'text-[var(--color-danger)]',
      defaultMessage: 'Error',
    },
    success: {
      icon: CheckCircle,
      bgClass: 'bg-[var(--color-success-10)]',
      textClass: 'text-[var(--color-success)]',
      defaultMessage: 'Éxito',
    },
  };

  const config = statusConfig[status] || statusConfig.idle;
  const Icon = config.icon;
  const displayMessage = message || config.defaultMessage;

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgClass}
        ${config.textClass}
        ${sizeClasses[size]}
        ${config.animate ? 'animate-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      {showIcon && Icon && <Icon className={iconSizes[size]} />}
      {displayMessage}
    </span>
  );
};

export default StatusIndicator;
