import React from 'react';

/**
 * Card component con diseño Soft Pastel & Modern SaaS
 * Sombras sutiles, bordes delicados, espaciado generoso
 */
function Card({ children, className = '', padding = true, hover = false, ...props }) {
  return (
    <div
      className={`transition-all duration-200 ${padding ? 'p-6' : ''} ${hover ? 'hover-lift' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border-soft)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
export { Card };
