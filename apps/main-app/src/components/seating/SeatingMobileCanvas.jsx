import React, { useRef, useEffect, useState } from 'react';
import useSeatingGestures from '../../hooks/useSeatingGestures';
import useTranslations from '../../hooks/useTranslations';

/**
 * Canvas Móvil para Seating Plan
 * Visualización interactiva con gestos táctiles
 */
const SeatingMobileCanvas = ({
  tables = [],
  selectedTableId,
  onSelectTable,
  hallSize = { width: 800, height: 600 },
}) => {
  const { t } = useTranslations();
  const canvasContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Gestos táctiles
  const {
    ref: gesturesRef,
    scale,
    position,
    reset,
  } = useSeatingGestures({
    onDoubleTap: (x, y) => {
      // Reset zoom en double tap
      reset();
    },
    minZoom: 0.3,
    maxZoom: 2.5,
  });

  // Medir container
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calcular escala para ajustar el hall al viewport
  const calculateFitScale = () => {
    if (dimensions.width === 0 || hallSize.width === 0) return 1;
    
    const scaleX = (dimensions.width - 40) / hallSize.width;
    const scaleY = (dimensions.height - 40) / hallSize.height;
    return Math.min(scaleX, scaleY, 1);
  };

  const fitScale = calculateFitScale();

  // Renderizar mesa como SVG element
  const renderTable = (table) => {
    const tableScale = fitScale * scale;
    const x = (table.x || 0) * tableScale + position.x;
    const y = (table.y || 0) * tableScale + position.y;
    const width = (table.width || 80) * tableScale;
    const height = (table.height || 80) * tableScale;
    
    const isSelected = table.id === selectedTableId;
    const occupancy = (table.guests?.length || 0) / (table.capacity || 1);
    
    // Color según ocupación
    let fillColor = '#E5E7EB'; // Vacía
    if (occupancy >= 1) fillColor = '#10B981'; // Llena
    else if (occupancy >= 0.5) fillColor = '#FBBF24'; // Media
    else if (occupancy > 0) fillColor = '#F59E0B'; // Parcial

    return (
      <g
        key={table.id}
        onClick={() => onSelectTable?.(table)}
        style={{ cursor: 'pointer' }}
      >
        {/* Mesa */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={8 * tableScale}
          fill={fillColor}
          stroke={isSelected ? '#3B82F6' : '#9CA3AF'}
          strokeWidth={isSelected ? 3 : 1.5}
          opacity={0.9}
        />
        
        {/* Nombre de mesa */}
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(12 * tableScale, 10)}
          fontWeight="600"
          fill="#1F2937"
        >
          {table.name}
        </text>
        
        {/* Ocupación */}
        <text
          x={x + width / 2}
          y={y + height / 2 + 16 * tableScale}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(10 * tableScale, 8)}
          fill="#6B7280"
        >
          {table.guests?.length || 0}/{table.capacity || 0}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={canvasContainerRef}
      className="relative w-full h-full bg-gray-50 overflow-hidden"
    >
      {/* Canvas SVG */}
      <svg
        ref={gesturesRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
        style={{ touchAction: 'none' }}
      >
        {/* Grid de fondo */}
        <defs>
          <pattern
            id="grid"
            width={40 * fitScale * scale}
            height={40 * fitScale * scale}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${40 * fitScale * scale} 0 L 0 0 0 ${40 * fitScale * scale}`}
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Mesas */}
        {tables.map((table) => renderTable(table))}
      </svg>

      {/* Controles de zoom */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={reset}
          className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          aria-label={t('seatingMobile.canvas.resetZoom', { defaultValue: 'Reset zoom' })}
        >
          ⟲
        </button>
        <div className="text-xs text-center text-gray-600">
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Indicador de gestos */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 flex items-center gap-2">
        <span>👆</span>
        <span>{t('seatingMobile.canvas.gesture', { defaultValue: 'Pinch para zoom' })}</span>
      </div>

      {/* Leyenda */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold text-gray-700 mb-2">
          {t('seatingMobile.canvas.legend', { defaultValue: 'Leyenda' })}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200" />
            <span className="text-gray-600">{t('seatingMobile.canvas.empty', { defaultValue: 'Vacía' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400" />
            <span className="text-gray-600">{t('seatingMobile.canvas.partial', { defaultValue: 'Parcial' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-600">{t('seatingMobile.canvas.full', { defaultValue: 'Llena' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingMobileCanvas;
