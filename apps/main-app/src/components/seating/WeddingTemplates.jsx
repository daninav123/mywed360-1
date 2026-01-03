/**
 * WeddingTemplates.jsx
 * Plantillas predefinidas profesionales para bodas
 */

import React, { useState } from 'react';
import { Grid3x3, Circle, Square, Hexagon, Star, Heart, Crown, Sparkles } from 'lucide-react';

// Plantillas profesionales para bodas
export const WEDDING_TEMPLATES = {
  // CLÁSICAS
  imperial: {
    name: 'Imperial Clásico',
    icon: Crown,
    description: 'Mesa presidencial + mesas redondas',
    capacity: [50, 200],
    generate: (config) => ({
      layout: 'imperial',
      presidentialTable: {
        type: 'rectangular',
        capacity: 12,
        position: 'top-center',
        decorated: true,
      },
      guestTables: {
        shape: 'circle',
        capacity: 8,
        arrangement: 'symmetric',
      },
    }),
  },

  banquetHall: {
    name: 'Salón de Banquetes',
    icon: Grid3x3,
    description: 'Distribución tradicional en grid',
    capacity: [80, 300],
    generate: (config) => ({
      layout: 'grid',
      spacing: 'comfortable',
      aisles: true,
      centerAisle: true,
    }),
  },

  // ROMÁNTICAS
  garden: {
    name: 'Jardín Romántico',
    icon: Heart,
    description: 'Mesas dispersas estilo jardín',
    capacity: [30, 150],
    generate: (config) => ({
      layout: 'organic',
      tableShapes: ['circle', 'oval'],
      spacing: 'relaxed',
      decorativeElements: ['flowers', 'lights'],
    }),
  },

  vintage: {
    name: 'Vintage Elegante',
    icon: Star,
    description: 'Mesas largas estilo familia',
    capacity: [40, 120],
    generate: (config) => ({
      layout: 'family-style',
      longTables: true,
      tableCapacity: 20,
      rusticDecor: true,
    }),
  },

  // MODERNAS
  cocktail: {
    name: 'Cóctel Moderno',
    icon: Sparkles,
    description: 'Mix de mesas altas y bajas',
    capacity: [50, 250],
    generate: (config) => ({
      layout: 'mixed',
      highTables: '30%',
      loungAreas: true,
      barPositions: ['corners'],
    }),
  },

  minimalist: {
    name: 'Minimalista Chic',
    icon: Square,
    description: 'Líneas limpias y espaciado amplio',
    capacity: [40, 150],
    generate: (config) => ({
      layout: 'geometric',
      tableShape: 'square',
      spacing: 'generous',
      centerpiece: 'minimal',
    }),
  },

  // TEMÁTICAS
  beach: {
    name: 'Boda en Playa',
    icon: Circle,
    description: 'Semicírculo mirando al mar',
    capacity: [20, 100],
    generate: (config) => ({
      layout: 'amphitheater',
      orientation: 'view-focused',
      casualSeating: true,
    }),
  },

  rustic: {
    name: 'Rústico Campestre',
    icon: Hexagon,
    description: 'Mesas de madera estilo granja',
    capacity: [50, 200],
    generate: (config) => ({
      layout: 'barn-style',
      mixedSizes: true,
      hayBales: true,
      outdoorElements: true,
    }),
  },
};

// Generador avanzado de plantillas
export function generateFromTemplate(templateId, config = {}) {
  const template = WEDDING_TEMPLATES[templateId];
  if (!template) return null;

  const {
    guestCount = 100,
    currentTableCount = 0,
    hallWidth = 2000,
    hallHeight = 1600,
    includePresidential = true,
    includeDanceFloor = true,
    includeBar = true,
    includeDJ = true,
  } = config;

  const tables = [];
  const zones = [];

  // Usar número de mesas actual o calcular necesarias
  const avgCapacity = 8;
  const calculatedTables = Math.ceil(guestCount / avgCapacity);
  const tableCount = currentTableCount > 0 ? currentTableCount : calculatedTables;

  switch (templateId) {
    case 'imperial': {
      // Mesa presidencial
      if (includePresidential) {
        tables.push({
          id: 'presidential',
          name: 'Mesa Presidencial',
          shape: 'rectangle',
          x: hallWidth / 2,
          y: 150,
          width: 300,
          height: 80,
          capacity: 12,
          vip: true,
          locked: true,
        });
      }

      // Mesas de invitados en semicírculo
      const radius = Math.min(hallWidth, hallHeight) * 0.35;
      const angleStep = Math.PI / (tableCount + 1);

      for (let i = 0; i < tableCount; i++) {
        const angle = angleStep * (i + 1);
        tables.push({
          id: i + 1, // ID numérico
          name: `Mesa ${i + 1}`,
          shape: 'circle',
          x: hallWidth / 2 + radius * Math.cos(angle),
          y: hallHeight * 0.7 - radius * Math.sin(angle) * 0.7,
          diameter: 120,
          capacity: avgCapacity,
        });
      }

      // Pista de baile central
      if (includeDanceFloor) {
        zones.push({
          type: 'zone',
          subtype: 'DANCE',
          x: hallWidth / 2 - 150,
          y: hallHeight / 2,
          width: 300,
          height: 300,
        });
      }
      break;
    }

    case 'garden': {
      // Distribución orgánica/aleatoria con agrupaciones
      const clusters = Math.ceil(tableCount / 4);

      for (let c = 0; c < clusters; c++) {
        const clusterX = 200 + ((hallWidth - 400) * (c % 3)) / 2;
        const clusterY = 200 + ((hallHeight - 400) * Math.floor(c / 3)) / 2;

        for (let t = 0; t < 4 && tables.length < tableCount; t++) {
          const angle = (Math.PI * 2 * t) / 4;
          const radius = 150;

          tables.push({
            id: tables.length + 1,
            name: `Mesa ${tables.length + 1}`,
            shape: Math.random() > 0.5 ? 'circle' : 'oval',
            x: clusterX + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
            y: clusterY + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
            diameter: 100 + Math.random() * 40,
            capacity: 6 + Math.floor(Math.random() * 4),
          });
        }
      }

      // Zona de ceremonia
      zones.push({
        type: 'zone',
        subtype: 'CEREMONY',
        x: hallWidth / 2 - 200,
        y: 50,
        width: 400,
        height: 200,
      });
      break;
    }

    case 'vintage': {
      // Mesas largas estilo familiar
      const longTableCount = Math.ceil(tableCount / 3);
      const tableLength = Math.min(400, (hallHeight - 400) / longTableCount);

      for (let i = 0; i < longTableCount; i++) {
        tables.push({
          id: i + 1,
          name: `Mesa Larga ${i + 1}`,
          shape: 'rectangle',
          x: 300 + (i * (hallWidth - 600)) / (longTableCount - 1),
          y: hallHeight / 2,
          width: 80,
          height: tableLength,
          capacity: 20,
          angle: 0,
        });
      }
      break;
    }

    case 'banquetHall': {
      // Grid tradicional con pasillos
      const cols = Math.ceil(Math.sqrt(tableCount));
      const rows = Math.ceil(tableCount / cols);
      const spacingX = (hallWidth - 400) / cols;
      const spacingY = (hallHeight - 400) / rows;

      for (let i = 0; i < tableCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        tables.push({
          id: i + 1,
          name: `Mesa ${i + 1}`,
          shape: 'circle',
          x: 200 + col * spacingX + spacingX / 2,
          y: 200 + row * spacingY + spacingY / 2,
          diameter: 120,
          capacity: avgCapacity,
        });
      }
      break;
    }

    case 'minimalist': {
      // Grid limpio con mucho espacio
      const cols = Math.min(4, Math.ceil(Math.sqrt(tableCount)));
      const rows = Math.ceil(tableCount / cols);
      const spacingX = (hallWidth - 200) / (cols + 1);
      const spacingY = (hallHeight - 200) / (rows + 1);

      for (let i = 0; i < tableCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        tables.push({
          id: i + 1,
          name: `Mesa ${i + 1}`,
          shape: 'square',
          x: 100 + (col + 1) * spacingX,
          y: 100 + (row + 1) * spacingY,
          width: 100,
          height: 100,
          capacity: avgCapacity,
        });
      }
      break;
    }

    case 'beach': {
      // Semicírculo mirando al "frente"
      const radius = Math.min(hallWidth, hallHeight) * 0.4;
      const angleSpan = Math.PI; // 180 grados
      const angleStep = angleSpan / (tableCount + 1);
      const centerX = hallWidth / 2;
      const centerY = hallHeight * 0.7;

      for (let i = 0; i < tableCount; i++) {
        const angle = angleStep * (i + 1);
        tables.push({
          id: i + 1,
          name: `Mesa ${i + 1}`,
          shape: 'circle',
          x: centerX + radius * Math.cos(Math.PI - angle),
          y: centerY - radius * Math.sin(Math.PI - angle) * 0.6,
          diameter: 100,
          capacity: avgCapacity,
        });
      }

      // Zona para la vista (mar/ceremonia)
      zones.push({
        type: 'zone',
        subtype: 'VIEW',
        x: hallWidth / 2 - 300,
        y: 50,
        width: 600,
        height: 150,
      });
      break;
    }

    case 'rustic': {
      // Mesas mixtas estilo granja
      const longTables = Math.floor(tableCount / 3);
      const roundTables = tableCount - longTables;

      // Mesas largas en el centro
      for (let i = 0; i < longTables; i++) {
        tables.push({
          id: i + 1,
          name: `Mesa Larga ${i + 1}`,
          shape: 'rectangle',
          x: hallWidth / 2,
          y: 200 + i * 180,
          width: 400,
          height: 80,
          capacity: 12,
        });
      }

      // Mesas redondas alrededor
      const radius = 300;
      const angleStep = (Math.PI * 2) / roundTables;

      for (let i = 0; i < roundTables; i++) {
        const angle = angleStep * i;
        tables.push({
          id: longTables + i + 1,
          name: `Mesa ${longTables + i + 1}`,
          shape: 'circle',
          x: hallWidth / 2 + radius * Math.cos(angle),
          y: hallHeight / 2 + radius * Math.sin(angle),
          diameter: 120,
          capacity: avgCapacity,
        });
      }
      break;
    }

    case 'cocktail': {
      // Mix de mesas altas y bajas
      const highTableCount = Math.floor(tableCount * 0.3);
      const lowTableCount = tableCount - highTableCount;

      // Mesas altas en los bordes
      for (let i = 0; i < highTableCount; i++) {
        const side = i % 4;
        let x, y;

        switch (side) {
          case 0:
            x = 100;
            y = 200 + i * 150;
            break;
          case 1:
            x = hallWidth - 100;
            y = 200 + i * 150;
            break;
          case 2:
            x = 200 + i * 150;
            y = 100;
            break;
          case 3:
            x = 200 + i * 150;
            y = hallHeight - 100;
            break;
        }

        tables.push({
          id: i + 1,
          name: `Mesa Alta ${i + 1}`,
          shape: 'circle',
          x,
          y,
          diameter: 70,
          capacity: 4,
          tableType: 'cocktail',
        });
      }

      // Mesas bajas en el centro
      const cols = Math.ceil(Math.sqrt(lowTableCount));
      const rows = Math.ceil(lowTableCount / cols);

      for (let i = 0; i < lowTableCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        tables.push({
          id: highTableCount + i + 1,
          name: `Mesa ${highTableCount + i + 1}`,
          shape: 'circle',
          x: 400 + col * 200,
          y: 300 + row * 200,
          diameter: 120,
          capacity: 8,
        });
      }

      // Áreas lounge
      zones.push({
        type: 'zone',
        subtype: 'LOUNGE',
        x: hallWidth / 2 - 200,
        y: hallHeight - 250,
        width: 400,
        height: 150,
      });
      break;
    }

    default: {
      // Distribución grid por defecto
      const cols = Math.ceil(Math.sqrt(tableCount));
      const rows = Math.ceil(tableCount / cols);
      const spacingX = (hallWidth - 400) / cols;
      const spacingY = (hallHeight - 400) / rows;

      for (let i = 0; i < tableCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);

        tables.push({
          id: i + 1,
          name: `Mesa ${i + 1}`,
          shape: 'circle',
          x: 200 + col * spacingX + spacingX / 2,
          y: 200 + row * spacingY + spacingY / 2,
          diameter: 120,
          capacity: avgCapacity,
        });
      }
      break;
    }
  }

  // Añadir zonas comunes
  if (includeBar && !zones.some((z) => z.subtype === 'BAR')) {
    zones.push({
      type: 'zone',
      subtype: 'BAR',
      x: 50,
      y: hallHeight / 2 - 75,
      width: 100,
      height: 150,
    });
  }

  if (includeDJ && !zones.some((z) => z.subtype === 'DJ')) {
    zones.push({
      type: 'zone',
      subtype: 'DJ',
      x: hallWidth - 150,
      y: 50,
      width: 100,
      height: 100,
    });
  }

  return {
    tables,
    zones,
    template: templateId,
    config,
  };
}

// Componente selector de plantillas
export default function TemplateSelector({
  onSelectTemplate,
  guestCount = 100,
  guests = [],
  hallSize = {},
  isOpen,
  onClose,
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customConfig, setCustomConfig] = useState({
    includePresidential: true,
    includeDanceFloor: true,
    includeBar: true,
    includeDJ: true,
  });

  if (!isOpen) return null;

  // Calcular mesas reales desde los invitados asignados
  const assignedGuests = guests.filter((g) => g.table || g.tableId);
  const uniqueTables = new Set(assignedGuests.map((g) => g.table || g.tableId).filter(Boolean));
  const realTableCount = uniqueTables.size;

  const handleApplyTemplate = () => {
    console.log('[TemplateSelector] 🎯 Aplicando plantilla:', selectedTemplate);
    console.log('[TemplateSelector] 📐 Hall dimensions:', hallSize);

    if (!selectedTemplate) {
      console.warn('[TemplateSelector] ❌ No hay plantilla seleccionada');
      return;
    }

    const result = generateFromTemplate(selectedTemplate, {
      guestCount,
      currentTableCount: realTableCount,
      hallWidth: hallSize?.width || 1800,
      hallHeight: hallSize?.height || 1200,
      ...customConfig,
    });

    console.log('[TemplateSelector] ✅ Resultado generado:', result);
    console.log('[TemplateSelector] 📊 Mesas generadas:', result?.tables?.length || 0);
    console.log('[TemplateSelector] 🎨 Zonas generadas:', result?.zones?.length || 0);

    onSelectTemplate(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plantillas de Distribución para Bodas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecciona una plantilla profesional para {guestCount} invitados
          </p>
        </div>

        {/* Grid de plantillas */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(WEDDING_TEMPLATES).map(([id, template]) => {
              const Icon = template.icon;
              const [minCap, maxCap] = template.capacity;
              const isRecommended = guestCount >= minCap && guestCount <= maxCap;

              // Usar mesas reales desde asignaciones o calcular estimación
              const avgCapacity = 8;
              const calculatedTables = Math.ceil(guestCount / avgCapacity);
              const displayTables = realTableCount > 0 ? realTableCount : calculatedTables;
              const tableLabel = realTableCount > 0 ? 'mesas asignadas' : 'mesas estimadas';
              const assignedGuestsCount = assignedGuests.length;
              const unassignedCount = guestCount - assignedGuestsCount;

              return (
                <button
                  key={id}
                  onClick={() => setSelectedTemplate(id)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all text-left
                    ${
                      selectedTemplate === id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {isRecommended && (
                    <span className="absolute -top-2 -right-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                      Recomendada
                    </span>
                  )}

                  <Icon size={32} className="mb-3 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-2">
                    {displayTables} {tableLabel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {assignedGuestsCount} asignados de {guestCount}
                  </p>
                  {unassignedCount > 0 && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                      ⚠️ {unassignedCount} sin asignar
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Ideal: {minCap}-{maxCap} invitados
                  </p>
                </button>
              );
            })}
          </div>

          {/* Opciones adicionales */}
          {selectedTemplate && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <h3 className="font-semibold mb-3">Opciones adicionales:</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(customConfig).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setCustomConfig({
                          ...customConfig,
                          [key]: e.target.checked,
                        })
                      }
                      className="rounded text-indigo-500"
                    />
                    <span className="text-sm">
                      {key.replace('include', '').replace(/([A-Z])/g, ' $1')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar Plantilla
          </button>
        </div>
      </div>
    </div>
  );
}
