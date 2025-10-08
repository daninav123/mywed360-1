import React from 'react';

export default function HeatmapPlaceholder({ notes = [] }) {
  if (!notes || notes.length === 0) return null;
  return (
    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-none" aria-hidden="true">
      <div className="bg-orange-100/90 border border-orange-300 rounded-lg px-3 py-2 shadow text-xs text-orange-700 max-w-xs">
        <div className="font-medium text-orange-800 mb-1">Notas del venue</div>
        <ul className="list-disc pl-4 space-y-1">
          {notes.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
