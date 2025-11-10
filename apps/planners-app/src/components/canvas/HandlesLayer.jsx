import React from 'react';

/**
 * HandlesLayer
 * Muestra manijas en el punto medio de cada segmento de un polígono y permite insertar un vértice curvo.
 * Props:
 *  - points: array de {x,y}
 *  - scale, offset: transformaciones actuales (los puntos ya están transformados, sólo son necesarios si pintas absoluto)
 *  - visible: boolean para mostrar/ocultar
 *  - onInsert(idx, point): callback al hacer pointerDown en la manija para insertar un punto en `idx+1`
 */
export default function HandlesLayer({ points = [], drawMode, visible = true, onInsert }) {
  if (!visible || points.length < 2) return null;
  return (
    <g data-layer="handles">
      {points.map((p, idx) => {
        if (idx === points.length - 1) return null;
        const next = points[idx + 1];
        const midX = (p.x + next.x) / 2;
        const midY = (p.y + next.y) / 2;
        return (
          <circle
            key={`handle-${idx}`}
            cx={midX}
            cy={midY}
            r={4}
            fill="#6b7280"
            opacity={0.6}
            style={{ cursor: 'pointer', pointerEvents: 'all' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onInsert?.(idx + 1, { x: midX, y: midY });
            }}
          />
        );
      })}
    </g>
  );
}
