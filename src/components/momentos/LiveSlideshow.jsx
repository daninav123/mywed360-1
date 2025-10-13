import React, { useEffect, useMemo, useState } from 'react';

const resolveImage = (photo) =>
  photo?.urls?.optimized || photo?.urls?.original || photo?.urls?.thumb || '';

export default function LiveSlideshow({
  photos = [],
  autoAdvanceSeconds = 6,
  highlightMode = false,
}) {
  const sorted = useMemo(() => {
    if (!highlightMode) return photos;
    return [...photos].sort((a, b) => (b?.highlight?.score || 0) - (a?.highlight?.score || 0));
  }, [highlightMode, photos]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!sorted.length) return undefined;
    const timeout = setInterval(() => {
      setIndex((prev) => (prev + 1) % sorted.length);
    }, autoAdvanceSeconds * 1000);
    return () => clearInterval(timeout);
  }, [autoAdvanceSeconds, sorted.length]);

  useEffect(() => {
    setIndex(0);
  }, [sorted.length]);

  if (!sorted.length) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-sm text-gray-500">
        Aún no hay fotos aprobadas para mostrar en el slideshow.
      </div>
    );
  }

  const current = sorted[index] || null;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow relative bg-black">
      {current ? (
        <>
          <img
            src={resolveImage(current)}
            alt={current.scene || 'Slide'}
            className="w-full max-h-[480px] object-contain bg-black"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent text-white p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="space-y-1">
                <p className="uppercase tracking-wide text-xs text-white/70">
                  {current.scene || 'Momentos'}
                </p>
                {current.guestName && (
                  <p className="font-medium">Cortesía de {current.guestName}</p>
                )}
              </div>
              <div className="text-xs text-white/60">
                {index + 1}/{sorted.length}
              </div>
            </div>
            {highlightMode && current.highlight?.reasons?.length ? (
              <div className="text-xs text-white/70 mt-2">
                Destacado por {current.highlight.reasons.join(' · ')}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
        {highlightMode ? 'Modo highlights' : 'Modo secuencial'}
      </div>
    </div>
  );
}
