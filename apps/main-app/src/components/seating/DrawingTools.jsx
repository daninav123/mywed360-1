/**
 * DrawingTools.jsx
 * Herramientas de dibujo para el Seating Plan
 * - Perímetro del salón
 * - Puertas
 * - Obstáculos (columnas, etc.)
 * - Pasillos
 * - Zonas especiales (DJ, barra, etc.)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Square,
  Circle,
  Move,
  DoorOpen,
  Layers,
  Maximize2,
  GitBranch,
  Music,
  Wine,
  Camera,
  Cake,
  X,
  Check,
  Trash2,
} from 'lucide-react';

// Tipos de herramientas de dibujo
export const DRAWING_TOOLS = {
  SELECT: 'select',
  PERIMETER: 'perimeter',
  DOOR: 'door',
  OBSTACLE: 'obstacle',
  AISLE: 'aisle',
  ZONE: 'zone',
};

// Tipos de zonas especiales
export const ZONE_TYPES = {
  DJ: { icon: Music, label: 'DJ/Música', color: '#8b5cf6' },
  BAR: { icon: Wine, label: 'Barra', color: '#3b82f6' },
  PHOTO: { icon: Camera, label: 'Photocall', color: '#ec4899' },
  CAKE: { icon: Cake, label: 'Mesa dulce', color: '#f59e0b' },
  DANCE: { icon: Square, label: 'Pista de baile', color: '#10b981' },
};

export default function DrawingTools({
  activeTool,
  onToolSelect,
  onAddElement,
  onDeleteElement,
  elements = [],
  canvasRef,
  scale = 1,
  offset = { x: 0, y: 0 },
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedZoneType, setSelectedZoneType] = useState('DJ');
  const [showZoneMenu, setShowZoneMenu] = useState(false);

  // Handler para click en canvas
  const handleCanvasClick = (e) => {
    if (activeTool === DRAWING_TOOLS.SELECT) return;

    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    switch (activeTool) {
      case DRAWING_TOOLS.DOOR:
        // Añadir puerta (rectángulo pequeño)
        onAddElement({
          type: 'door',
          x: x - 30,
          y: y - 5,
          width: 60,
          height: 10,
          angle: 0,
        });
        break;

      case DRAWING_TOOLS.OBSTACLE:
        // Añadir obstáculo (columna circular por defecto)
        onAddElement({
          type: 'obstacle',
          shape: 'circle',
          x,
          y,
          radius: 30,
        });
        break;

      case DRAWING_TOOLS.ZONE:
        // Añadir zona especial
        onAddElement({
          type: 'zone',
          subtype: selectedZoneType,
          x: x - 75,
          y: y - 75,
          width: 150,
          height: 150,
        });
        break;

      case DRAWING_TOOLS.PERIMETER:
      case DRAWING_TOOLS.AISLE:
        // Dibujar path (perímetro o pasillo)
        if (!isDrawing) {
          setIsDrawing(true);
          setCurrentPath([{ x, y }]);
        } else {
          setCurrentPath([...currentPath, { x, y }]);
        }
        break;
    }
  };

  // Finalizar dibujo de path
  const finishPath = () => {
    if (currentPath.length < 2) {
      setCurrentPath([]);
      setIsDrawing(false);
      return;
    }

    const type = activeTool === DRAWING_TOOLS.PERIMETER ? 'perimeter' : 'aisle';
    onAddElement({
      type,
      points: currentPath,
      closed: activeTool === DRAWING_TOOLS.PERIMETER,
    });

    setCurrentPath([]);
    setIsDrawing(false);
  };

  // Cancelar dibujo actual
  const cancelDrawing = () => {
    setCurrentPath([]);
    setIsDrawing(false);
  };

  // Teclas de acceso rápido
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        cancelDrawing();
        onToolSelect(DRAWING_TOOLS.SELECT);
      } else if (e.key === 'Enter' && isDrawing) {
        finishPath();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDrawing, currentPath]);

  const tools = [
    {
      id: DRAWING_TOOLS.SELECT,
      icon: Move,
      label: 'Seleccionar',
      shortcut: 'V',
    },
    {
      id: DRAWING_TOOLS.PERIMETER,
      icon: Maximize2,
      label: 'Perímetro',
      shortcut: 'P',
    },
    {
      id: DRAWING_TOOLS.DOOR,
      icon: DoorOpen,
      label: 'Puerta',
      shortcut: 'D',
    },
    {
      id: DRAWING_TOOLS.OBSTACLE,
      icon: Circle,
      label: 'Obstáculo',
      shortcut: 'O',
    },
    {
      id: DRAWING_TOOLS.AISLE,
      icon: GitBranch,
      label: 'Pasillo',
      shortcut: 'A',
    },
    {
      id: DRAWING_TOOLS.ZONE,
      icon: Layers,
      label: 'Zona especial',
      shortcut: 'Z',
    },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex gap-1">
        {/* Herramientas principales */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                onToolSelect(tool.id);
                if (tool.id === DRAWING_TOOLS.ZONE) {
                  setShowZoneMenu(true);
                }
              }}
              className={`
                relative p-2 rounded-lg transition-all
                ${
                  activeTool === tool.id
                    ? 'bg-indigo-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={20} />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-60">
                {tool.shortcut}
              </span>
            </button>
          );
        })}

        {/* Separador */}
        <div className="w-px bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Acciones de dibujo */}
        {isDrawing && (
          <>
            <button
              onClick={finishPath}
              className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
              title="Finalizar (Enter)"
            >
              <Check size={20} />
            </button>
            <button
              onClick={cancelDrawing}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              title="Cancelar (Esc)"
            >
              <X size={20} />
            </button>
          </>
        )}

        {/* Eliminar elementos seleccionados */}
        {elements.some((el) => el.selected) && (
          <button
            onClick={() => {
              elements.filter((el) => el.selected).forEach((el) => onDeleteElement(el.id));
            }}
            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            title="Eliminar seleccionados"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Menú de zonas especiales */}
      {showZoneMenu && activeTool === DRAWING_TOOLS.ZONE && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Tipo de zona:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ZONE_TYPES).map(([key, zone]) => {
              const Icon = zone.icon;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedZoneType(key);
                    setShowZoneMenu(false);
                  }}
                  className={`
                    flex flex-col items-center p-3 rounded-lg border-2 transition-all
                    ${
                      selectedZoneType === key
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={24} style={{ color: zone.color }} />
                  <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {zone.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado actual */}
      {isDrawing && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400">
          {activeTool === DRAWING_TOOLS.PERIMETER ? 'Dibujando perímetro' : 'Dibujando pasillo'}:{' '}
          {currentPath.length} puntos
        </div>
      )}
    </div>
  );
}
