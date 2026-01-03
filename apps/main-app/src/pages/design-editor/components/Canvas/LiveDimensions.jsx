import React from 'react';

export default function LiveDimensions({ dimensions, position }) {
  if (!dimensions) return null;

  const { width, height, x, y } = dimensions;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y - 30}px`,
      }}
    >
      <div className=" text-white text-xs px-2 py-1 rounded shadow-lg font-mono whitespace-nowrap" style={{ backgroundColor: 'var(--color-primary)' }}>
        {Math.round(width)} × {Math.round(height)} px
      </div>
    </div>
  );
}
