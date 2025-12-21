import React from 'react';
import useTranslations from '../../hooks/useTranslations';

/**
 * Componente de carga animado
 * Muestra un spinner o indicador de carga visual
 *
 * @param {object} props - Propiedades del componente
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.size - Tamaño del loader (sm, md, lg)
 * @param {string} props.color - Color del loader
 * @returns {JSX.Element} - Componente de carga
 */
export const Loader = ({ className = '', size = 'md', color = 'primary' }) => {
  const { t } = useTranslations();
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-[color:var(--color-primary)]',
    secondary: 'border-[color:var(--color-text-30)]',
    accent: 'border-[color:var(--color-accent)]',
    success: 'border-[color:var(--color-success)]',
    warning: 'border-[color:var(--color-warning)]',
    error: 'border-[color:var(--color-danger)]',
  };

  const classes = `
    inline-block 
    rounded-full 
    border-4 
    border-t-transparent 
    animate-spin 
    ${sizeClasses[size] || sizeClasses.md} 
    ${colorClasses[color] || colorClasses.primary}
    ${className}
  `;

  return (
    <div className={classes.trim().replace(/\s+/g, ' ')} role="status" aria-label={t('app.loading')}>
      <span className="sr-only">{t('app.loading')}</span>
    </div>
  );
};

export default Loader;
