/**
 * SnapGuides - Guías de alineación animadas
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Guide = ({ type, position, canvasWidth, canvasHeight }) => {
  const isVertical = type === 'vertical';

  return (
    <motion.line
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      x1={isVertical ? position : 0}
      y1={isVertical ? 0 : position}
      x2={isVertical ? position : canvasWidth}
      y2={isVertical ? canvasHeight : position}
      stroke="#6366F1"
      strokeWidth={1.5}
      strokeDasharray="8,4"
    />
  );
};

export default function SnapGuides({ guides = [], canvasWidth = 2000, canvasHeight = 1500 }) {
  return (
    <svg
      className="snap-guides"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 100,
      }}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
    >
      <g>
        <AnimatePresence>
          {guides.map((guide, index) => (
            <Guide
              key={`${guide.type}-${guide.position}-${index}`}
              type={guide.type}
              position={guide.position}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </AnimatePresence>

        {/* Puntos de intersección */}
        <AnimatePresence>
          {guides
            .filter((g) => g.type === 'vertical')
            .flatMap((v) =>
              guides
                .filter((g) => g.type === 'horizontal')
                .map((h) => ({ x: v.position, y: h.position }))
            )
            .map((point, i) => (
              <motion.circle
                key={`intersection-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#6366F1"
              />
            ))}
        </AnimatePresence>
      </g>
    </svg>
  );
}
