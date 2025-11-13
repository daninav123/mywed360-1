/**
 * Minimap - Minimapa para navegación rápida del canvas
 * Muestra una vista en miniatura del layout completo
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function Minimap({
  tables = [],
  hallSize = { width: 2000, height: 1500 },
  viewport = { x: 0, y: 0, width: 800, height: 600 },
  scale = 1,
  onViewportChange,
  position = 'bottom-right',
  size = { width: 200, height: 150 },
}) {
  // Calcular escala del minimap
  const minimapScale = useMemo(() => {
    const scaleX = size.width / hallSize.width;
    const scaleY = size.height / hallSize.height;
    return Math.min(scaleX, scaleY);
  }, [size, hallSize]);

  // Calcular posición del viewport en el minimap
  const viewportRect = useMemo(() => {
    const vpWidth = viewport.width / scale;
    const vpHeight = viewport.height / scale;
    const vpX = -viewport.x / scale;
    const vpY = -viewport.y / scale;

    return {
      x: vpX * minimapScale,
      y: vpY * minimapScale,
      width: vpWidth * minimapScale,
      height: vpHeight * minimapScale,
    };
  }, [viewport, scale, minimapScale]);

  // Click en minimap para mover viewport
  const handleMinimapClick = (e) => {
    if (!onViewportChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convertir coordenadas de minimap a coordenadas del canvas
    const canvasX = clickX / minimapScale;
    const canvasY = clickY / minimapScale;

    // Centrar el viewport en el punto clickeado
    const newViewportX = -(canvasX - viewport.width / scale / 2);
    const newViewportY = -(canvasY - viewport.height / scale / 2);

    onViewportChange({
      x: newViewportX * scale,
      y: newViewportY * scale,
    });
  };

  // Posición del minimap en la pantalla
  const positionStyles = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`fixed ${positionStyles[position]} z-50`}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-2 shadow-2xl">
        {/* Header */}
        <div className="text-xs text-gray-400 mb-1 px-1 flex items-center justify-between">
          <span>Minimap</span>
          <span className="text-indigo-400">{Math.round(scale * 100)}%</span>
        </div>

        {/* Minimap Canvas */}
        <svg
          width={size.width}
          height={size.height}
          className="bg-gray-800 rounded cursor-pointer"
          onClick={handleMinimapClick}
        >
          {/* Fondo del salón */}
          <rect
            x={0}
            y={0}
            width={hallSize.width * minimapScale}
            height={hallSize.height * minimapScale}
            fill="#1f2937"
            stroke="#374151"
            strokeWidth={1}
          />

          {/* Mesas */}
          {tables.map((table, tableIndex) => {
            const tableWidth = (table.width || table.diameter || 120) * minimapScale;
            const tableHeight = (table.height || table.diameter || 120) * minimapScale;
            const tableX = table.x * minimapScale;
            const tableY = table.y * minimapScale;

            const isCircle = table.shape === 'circle';
            const guestCount = table.guests?.length || 0;
            const capacity = table.capacity || 8;
            const fillPercent = capacity > 0 ? guestCount / capacity : 0;

            // Color según ocupación
            const getColor = () => {
              if (fillPercent === 0) return '#4B5563'; // Gris
              if (fillPercent < 0.5) return '#F59E0B'; // Naranja
              if (fillPercent < 1) return '#FBBF24'; // Amarillo
              return '#10B981'; // Verde
            };

            return (
              <g key={`${table.id}-${tableIndex}`}>
                {isCircle ? (
                  <circle
                    cx={tableX + tableWidth / 2}
                    cy={tableY + tableHeight / 2}
                    r={tableWidth / 2}
                    fill={getColor()}
                    opacity={0.8}
                  />
                ) : (
                  <rect
                    x={tableX}
                    y={tableY}
                    width={tableWidth}
                    height={tableHeight}
                    fill={getColor()}
                    opacity={0.8}
                    rx={2}
                  />
                )}
              </g>
            );
          })}

          {/* Viewport actual (rectángulo que muestra lo que ves) */}
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.width}
            height={viewportRect.height}
            fill="none"
            stroke="#6366F1"
            strokeWidth={2}
            strokeDasharray="4,2"
            pointerEvents="none"
          />

          {/* Esquinas del viewport para indicar área visible */}
          {[
            { x: viewportRect.x, y: viewportRect.y },
            { x: viewportRect.x + viewportRect.width, y: viewportRect.y },
            { x: viewportRect.x, y: viewportRect.y + viewportRect.height },
            { x: viewportRect.x + viewportRect.width, y: viewportRect.y + viewportRect.height },
          ].map((corner, i) => (
            <circle key={i} cx={corner.x} cy={corner.y} r={2} fill="#6366F1" pointerEvents="none" />
          ))}
        </svg>

        {/* Info */}
        <div className="text-xs text-gray-500 mt-1 px-1">{tables.length} mesas</div>
      </div>
    </motion.div>
  );
}
