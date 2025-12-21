import React from 'react';

function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl shadow-md border border-soft p-6 bg-surface text-body ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
export { Card };
