/**
 * MarqueeSelection - Componente para selección por área (drag selection)
 * Permite seleccionar múltiples mesas arrastrando un rectángulo
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarqueeSelection({ isActive, startPoint, endPoint, selectionBox }) {
  if (!isActive || !startPoint || !endPoint) {
    return null;
  }

  // Calcular rectángulo de selección
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);

  return (
    <AnimatePresence>
      <g className="marquee-selection" pointerEvents="none">
        {/* Rectángulo de selección */}
        <motion.rect
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          x={x}
          y={y}
          width={width}
          height={height}
          fill="rgba(99, 102, 241, 0.1)"
          stroke="#6366F1"
          strokeWidth={2}
          strokeDasharray="8,4"
          rx={4}
        />

        {/* Esquinas del rectángulo */}
        {[
          { x, y },
          { x: x + width, y },
          { x, y: y + height },
          { x: x + width, y: y + height },
        ].map((corner, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            cx={corner.x}
            cy={corner.y}
            r={4}
            fill="#6366F1"
          />
        ))}

        {/* Contador de elementos seleccionados */}
        {selectionBox && selectionBox.count > 0 && (
          <motion.g initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <rect x={x + width / 2 - 30} y={y - 35} width={60} height={25} rx={12} fill="#6366F1" />
            <text
              x={x + width / 2}
              y={y - 18}
              textAnchor="middle"
              fill="white"
              fontSize={12}
              fontWeight="600"
            >
              {selectionBox.count} {selectionBox.count === 1 ? 'mesa' : 'mesas'}
            </text>
          </motion.g>
        )}
      </g>
    </AnimatePresence>
  );
}
