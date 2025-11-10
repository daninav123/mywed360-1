import React from 'react';

export default function DistanceOverlay({ hallSize, aisleMin = 120 }) {
  if (!hallSize) return null;
  const width = hallSize.width || 1800;
  const height = hallSize.height || 1200;
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      aria-hidden="true"
    >
      <div className="bg-blue-200/20 border border-blue-300 rounded-lg px-3 py-1 text-xs text-blue-800 shadow-sm">
        Pasillos mínimos: {Math.round(aisleMin)} cm
      </div>
    </div>
  );
}

