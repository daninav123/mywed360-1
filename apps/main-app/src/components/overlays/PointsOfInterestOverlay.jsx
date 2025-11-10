import React from 'react';

const colors = {
  altar: '#f97316',
  stage: '#d946ef',
  dancefloor: '#2563eb',
  bar: '#0ea5e9',
  lounge: '#22c55e',
  dj: '#14b8a6',
  kids: '#facc15',
  exit: '#ef4444',
};

export default function PointsOfInterestOverlay({ points = [] }) {
  if (!Array.isArray(points) || points.length === 0) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {points.map((poi) => {
        const color = colors[poi.type] || '#64748b';
        return (
          <div
            key={poi.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: poi.x || 0, top: poi.y || 0 }}
          >
            <div
              className="px-2 py-1 rounded bg-white/90 border shadow text-[10px] text-gray-700"
              style={{ borderColor: color }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: color }} />
              {poi.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
