import React from 'react';

function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl shadow-md border p-6 bg-[var(--color-surface)] text-[color:var(--color-text)] border-[color:var(--color-text)]/15 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
export { Card };
