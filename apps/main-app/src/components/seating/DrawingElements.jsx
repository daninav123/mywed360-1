/**
 * DrawingElements.jsx
 * Renderiza los elementos dibujados en el canvas del Seating Plan
 */

import React from 'react';
import { ZONE_TYPES } from './DrawingTools';

export default function DrawingElements({
  elements = [],
  scale = 1,
  onSelectElement,
  selectedIds = [],
}) {
  const renderElement = (element) => {
    const isSelected = selectedIds.includes(element.id);

    switch (element.type) {
      case 'perimeter':
        return (
          <g key={element.id} onClick={() => onSelectElement(element.id)}>
            <polygon
              points={element.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={isSelected ? '#4f46e5' : '#9ca3af'}
              strokeWidth={3 / scale}
              strokeDasharray={isSelected ? '10,5' : 'none'}
              className="cursor-pointer hover:stroke-indigo-500"
            />
            {/* Puntos de control cuando está seleccionado */}
            {isSelected &&
              element.points.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={5 / scale}
                  fill="#4f46e5"
                  className="cursor-move"
                />
              ))}
          </g>
        );

      case 'door':
        return (
          <g
            key={element.id}
            onClick={() => onSelectElement(element.id)}
            transform={`rotate(${element.angle || 0} ${element.x + element.width / 2} ${element.y + element.height / 2})`}
          >
            <rect
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              fill="#10b981"
              stroke={isSelected ? '#4f46e5' : '#059669'}
              strokeWidth={2 / scale}
              rx={2}
              className="cursor-pointer"
            />
            {/* Símbolo de puerta */}
            <path
              d={`M ${element.x + 10} ${element.y} 
                  Q ${element.x + element.width / 2} ${element.y - 10} 
                  ${element.x + element.width - 10} ${element.y}`}
              stroke="#059669"
              strokeWidth={2 / scale}
              fill="none"
            />
          </g>
        );

      case 'obstacle':
        if (element.shape === 'circle') {
          return (
            <g key={element.id} onClick={() => onSelectElement(element.id)}>
              <circle
                cx={element.x}
                cy={element.y}
                r={element.radius}
                fill="#6b7280"
                stroke={isSelected ? '#4f46e5' : '#4b5563'}
                strokeWidth={2 / scale}
                opacity={0.8}
                className="cursor-pointer"
              />
              {/* Patrón de columna */}
              <circle
                cx={element.x}
                cy={element.y}
                r={element.radius * 0.7}
                fill="none"
                stroke="#4b5563"
                strokeWidth={1 / scale}
              />
            </g>
          );
        } else {
          return (
            <rect
              key={element.id}
              x={element.x}
              y={element.y}
              width={element.width || 60}
              height={element.height || 60}
              fill="#6b7280"
              stroke={isSelected ? '#4f46e5' : '#4b5563'}
              strokeWidth={2 / scale}
              opacity={0.8}
              onClick={() => onSelectElement(element.id)}
              className="cursor-pointer"
            />
          );
        }

      case 'aisle':
        return (
          <g key={element.id} onClick={() => onSelectElement(element.id)}>
            <polyline
              points={element.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={isSelected ? '#4f46e5' : '#fbbf24'}
              strokeWidth={element.width || 40 / scale}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.3}
              className="cursor-pointer"
            />
            {/* Línea central del pasillo */}
            <polyline
              points={element.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={isSelected ? '#4f46e5' : '#f59e0b'}
              strokeWidth={2 / scale}
              strokeDasharray="10,10"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          </g>
        );

      case 'zone':
        const zoneConfig = ZONE_TYPES[element.subtype] || ZONE_TYPES.DJ;
        const Icon = zoneConfig.icon;

        return (
          <g key={element.id} onClick={() => onSelectElement(element.id)}>
            <rect
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              fill={zoneConfig.color}
              fillOpacity={0.2}
              stroke={isSelected ? '#4f46e5' : zoneConfig.color}
              strokeWidth={2 / scale}
              strokeDasharray="5,5"
              rx={8}
              className="cursor-pointer"
            />
            {/* Etiqueta de la zona */}
            <rect
              x={element.x}
              y={element.y}
              width={Math.min(100, element.width)}
              height={30}
              fill={zoneConfig.color}
              rx={8}
            />
            <text
              x={element.x + 10}
              y={element.y + 20}
              fill="white"
              fontSize={14 / scale}
              fontWeight="bold"
            >
              {zoneConfig.label}
            </text>
            {/* Icono central */}
            <g
              transform={`translate(${element.x + element.width / 2 - 20}, ${element.y + element.height / 2 - 20})`}
            >
              <rect x={0} y={0} width={40} height={40} fill="white" rx={20} />
              {/* Aquí normalmente renderizaríamos el icono, pero en SVG es complejo */}
              <text
                x={20}
                y={25}
                textAnchor="middle"
                fill={zoneConfig.color}
                fontSize={20}
                fontWeight="bold"
              >
                {element.subtype.charAt(0)}
              </text>
            </g>
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <g id="drawing-elements">
      {/* Renderizar elementos en orden: perímetro, pasillos, obstáculos, puertas, zonas */}
      {elements.filter((el) => el.type === 'perimeter').map(renderElement)}
      {elements.filter((el) => el.type === 'aisle').map(renderElement)}
      {elements.filter((el) => el.type === 'obstacle').map(renderElement)}
      {elements.filter((el) => el.type === 'door').map(renderElement)}
      {elements.filter((el) => el.type === 'zone').map(renderElement)}
    </g>
  );
}
