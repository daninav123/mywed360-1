import React from 'react';

const resolveThumb = (photo) =>
  photo?.urls?.thumb || photo?.urls?.optimized || photo?.urls?.original || '';

export default function HighlightRail({ photos = [], onSelect }) {
  if (!photos.length) {
    return (
      <p className="text-sm text-gray-500">
        Aún no hay highlights. Aprueba algunas fotos o espera a que se generen recomendaciones.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => onSelect?.(photo)}
            className="w-48 flex-shrink-0 text-left border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition"
          >
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={resolveThumb(photo)}
                alt={photo?.scene || 'Highlight'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="uppercase tracking-wide">{photo.scene || 'Otros'}</span>
                {typeof photo.highlight?.score === 'number' && (
                  <span className="font-semibold text-blue-600">
                    {Math.round((photo.highlight.score || 0) * 100)}%
                  </span>
                )}
              </div>
              <ul className="text-xs text-gray-500 space-y-1">
                {(photo.highlight?.reasons || []).slice(0, 3).map((reason) => (
                  <li key={reason} className="flex items-start gap-1">
                    <span>•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
