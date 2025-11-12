/**
 * 🎨 Seating Template Gallery
 *
 * Galería visual de plantillas predefinidas para seating plan
 * con previews interactivos y aplicación con un click
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Users,
  Clock,
  Sparkles,
  Layout,
  Circle,
  Square,
  Hexagon,
  Diamond,
  Star,
  Heart,
  ChevronRight,
  Zap,
} from 'lucide-react';

// Templates predefinidos con configuración completa
export const SEATING_TEMPLATES = {
  classic: {
    id: 'classic',
    name: 'Boda Clásica',
    description: 'Distribución tradicional para 100-150 invitados',
    icon: Layout,
    color: '#6366F1',
    guests: 120,
    tables: 12,
    tableCapacity: 10,
    tableShape: 'circle',
    layoutType: 'columns',
    features: ['Mesa presidencial', 'Distribución simétrica', 'Pasillo central'],
    preview: {
      tables: [
        { x: 100, y: 100 },
        { x: 250, y: 100 },
        { x: 400, y: 100 },
        { x: 100, y: 250 },
        { x: 250, y: 250 },
        { x: 400, y: 250 },
        { x: 100, y: 400 },
        { x: 250, y: 400 },
        { x: 400, y: 400 },
        { x: 100, y: 550 },
        { x: 250, y: 550 },
        { x: 400, y: 550 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 650 },
      spacing: 150,
      marginX: 100,
      marginY: 100,
      includePresidentialTable: true,
      presidentialPosition: 'top',
    },
  },

  intimate: {
    id: 'intimate',
    name: 'Boda Íntima',
    description: 'Perfecta para celebraciones pequeñas de 30-50 invitados',
    icon: Heart,
    color: '#EC4899',
    guests: 40,
    tables: 5,
    tableCapacity: 8,
    tableShape: 'circle',
    layoutType: 'circular',
    features: ['Ambiente cercano', 'Distribución circular', 'Centro libre'],
    preview: {
      tables: [
        { x: 250, y: 150 },
        { x: 400, y: 250 },
        { x: 350, y: 400 },
        { x: 150, y: 400 },
        { x: 100, y: 250 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 500 },
      radius: 150,
      centerX: 250,
      centerY: 250,
    },
  },

  imperial: {
    id: 'imperial',
    name: 'Formato Imperial',
    description: 'Una mesa larga continua para 60-80 invitados',
    icon: Diamond,
    color: '#F59E0B',
    guests: 70,
    tables: 1,
    tableCapacity: 70,
    tableShape: 'rectangular',
    layoutType: 'imperial',
    features: ['Mesa única', 'Estilo banquete', 'Conversación fluida'],
    preview: {
      tables: [{ x: 50, y: 250, width: 400, height: 100 }],
    },
    config: {
      hallSize: { width: 500, height: 500 },
      tableLength: 400,
      tableWidth: 100,
      position: 'center',
    },
  },

  uShape: {
    id: 'uShape',
    name: 'Forma de U',
    description: 'Ideal para 80-100 invitados con espacio central',
    icon: Hexagon,
    color: '#10B981',
    guests: 90,
    tables: 9,
    tableCapacity: 10,
    tableShape: 'circle',
    layoutType: 'u_shape',
    features: ['Vista central', 'Ideal para show', 'Comunicación visual'],
    preview: {
      tables: [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 300, y: 100 },
        { x: 400, y: 100 },
        { x: 100, y: 200 },
        { x: 400, y: 200 },
        { x: 100, y: 300 },
        { x: 200, y: 300 },
        { x: 300, y: 300 },
        { x: 400, y: 300 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 400 },
      openSide: 'bottom',
      spacing: 100,
    },
  },

  chevron: {
    id: 'chevron',
    name: 'Espiga / Chevron',
    description: 'Patrón en zigzag moderno para 100-120 invitados',
    icon: Zap,
    color: '#8B5CF6',
    guests: 110,
    tables: 11,
    tableCapacity: 10,
    tableShape: 'circle',
    layoutType: 'chevron',
    features: ['Diseño dinámico', 'Visual moderno', 'Flujo natural'],
    preview: {
      tables: [
        { x: 150, y: 100 },
        { x: 250, y: 100 },
        { x: 350, y: 100 },
        { x: 100, y: 200 },
        { x: 200, y: 200 },
        { x: 300, y: 200 },
        { x: 400, y: 200 },
        { x: 150, y: 300 },
        { x: 250, y: 300 },
        { x: 350, y: 300 },
        { x: 200, y: 400 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 500 },
      offset: 60,
      spacing: 100,
    },
  },

  garden: {
    id: 'garden',
    name: 'Jardín / Exterior',
    description: 'Distribución orgánica para bodas al aire libre',
    icon: Star,
    color: '#14B8A6',
    guests: 150,
    tables: 15,
    tableCapacity: 10,
    tableShape: 'mixed',
    layoutType: 'random',
    features: ['Distribución orgánica', 'Múltiples ambientes', 'Espacios abiertos'],
    preview: {
      tables: [
        { x: 120, y: 80 },
        { x: 380, y: 120 },
        { x: 250, y: 150 },
        { x: 80, y: 200 },
        { x: 420, y: 220 },
        { x: 300, y: 250 },
        { x: 150, y: 280 },
        { x: 350, y: 320 },
        { x: 200, y: 350 },
        { x: 100, y: 400 },
        { x: 400, y: 380 },
        { x: 250, y: 420 },
        { x: 180, y: 450 },
        { x: 320, y: 480 },
        { x: 250, y: 500 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 550 },
      randomSeed: 42,
      minDistance: 80,
      maxDistance: 150,
    },
  },

  cocktail: {
    id: 'cocktail',
    name: 'Cocktail / Mezclado',
    description: 'Mix de mesas altas y bajas para 80-100 invitados',
    icon: Circle,
    color: '#F43F5E',
    guests: 90,
    tables: 12,
    tableCapacity: 'mixed',
    tableShape: 'mixed',
    layoutType: 'mixed',
    features: ['Mesas altas y bajas', 'Ambiente informal', 'Networking'],
    preview: {
      tables: [
        { x: 100, y: 100, type: 'high', size: 'small' },
        { x: 250, y: 120, type: 'low', size: 'medium' },
        { x: 400, y: 100, type: 'high', size: 'small' },
        { x: 150, y: 250, type: 'low', size: 'large' },
        { x: 350, y: 250, type: 'low', size: 'large' },
        { x: 100, y: 400, type: 'high', size: 'small' },
        { x: 250, y: 380, type: 'low', size: 'medium' },
        { x: 400, y: 400, type: 'high', size: 'small' },
      ],
    },
    config: {
      hallSize: { width: 500, height: 500 },
      highTables: 4,
      lowTables: 8,
      mixRatio: 0.33,
    },
  },

  theater: {
    id: 'theater',
    name: 'Teatro / Auditorio',
    description: 'Orientación frontal para ceremonias de 100-200 invitados',
    icon: Square,
    color: '#0EA5E9',
    guests: 150,
    tables: 0,
    seats: 150,
    layoutType: 'theater',
    features: ['Vista al escenario', 'Filas escalonadas', 'Pasillo central'],
    preview: {
      rows: [
        { y: 100, seats: 15 },
        { y: 150, seats: 15 },
        { y: 200, seats: 15 },
        { y: 250, seats: 15 },
        { y: 300, seats: 15 },
        { y: 350, seats: 15 },
        { y: 400, seats: 15 },
        { y: 450, seats: 15 },
        { y: 500, seats: 15 },
        { y: 550, seats: 15 },
      ],
    },
    config: {
      hallSize: { width: 500, height: 650 },
      rowSpacing: 50,
      seatSpacing: 30,
      aisleWidth: 100,
      vipRows: 2,
    },
  },
};

const SeatingTemplateGallery = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentGuests = 0,
  currentTables = 0,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [filter, setFilter] = useState('all'); // all, small, medium, large

  // Filtrar templates según el número de invitados
  const getFilteredTemplates = () => {
    const templates = Object.values(SEATING_TEMPLATES);

    if (filter === 'all') return templates;
    if (filter === 'small') return templates.filter((t) => t.guests <= 50);
    if (filter === 'medium') return templates.filter((t) => t.guests > 50 && t.guests <= 100);
    if (filter === 'large') return templates.filter((t) => t.guests > 100);

    return templates;
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  // Renderizar preview SVG de cada template
  const renderTemplatePreview = (template) => {
    return (
      <svg viewBox="0 0 500 650" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid de fondo */}
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1" />
        </pattern>
        <rect width="500" height="650" fill="url(#grid)" />

        {/* Renderizar mesas o asientos según el tipo */}
        {template.layoutType === 'theater'
          ? // Renderizar filas de asientos para teatro
            template.preview.rows?.map((row, idx) => (
              <g key={idx}>
                {[...Array(row.seats)].map((_, seatIdx) => (
                  <rect
                    key={seatIdx}
                    x={20 + seatIdx * 30}
                    y={row.y}
                    width={25}
                    height={25}
                    rx={3}
                    fill={template.color}
                    opacity={0.7}
                  />
                ))}
              </g>
            ))
          : // Renderizar mesas para otros layouts
            template.preview.tables?.map((table, idx) => (
              <motion.g key={idx}>
                {table.width ? (
                  // Mesa rectangular
                  <rect
                    x={table.x}
                    y={table.y}
                    width={table.width}
                    height={table.height || 100}
                    rx={10}
                    fill={template.color}
                    opacity={0.7}
                  />
                ) : (
                  // Mesa circular
                  <circle
                    cx={table.x}
                    cy={table.y}
                    r={table.size === 'small' ? 20 : table.size === 'large' ? 40 : 30}
                    fill={template.color}
                    opacity={table.type === 'high' ? 0.5 : 0.7}
                    stroke={table.type === 'high' ? template.color : 'none'}
                    strokeWidth={table.type === 'high' ? 2 : 0}
                    strokeDasharray={table.type === 'high' ? '5,5' : 'none'}
                  />
                )}
                <text
                  x={table.x || table.x + (table.width || 0) / 2}
                  y={table.y || table.y + (table.height || 0) / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {idx + 1}
                </text>
              </motion.g>
            ))}
      </svg>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  Selecciona una Plantilla
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Elige una distribución predefinida y personalízala según tus necesidades
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros */}
            <div className="px-6 py-3 border-b dark:border-gray-800 flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filtrar por tamaño:</span>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Todos', icon: Layout },
                  { id: 'small', label: '< 50 invitados', icon: Users },
                  { id: 'medium', label: '50-100 invitados', icon: Users },
                  { id: 'large', label: '> 100 invitados', icon: Users },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      flex items-center gap-1.5
                      ${
                        filter === id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {currentGuests > 0 && (
                <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>Tienes {currentGuests} invitados</span>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {getFilteredTemplates().map((template) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  const isHovered = hoveredTemplate === template.id;
                  const Icon = template.icon;

                  return (
                    <motion.div
                      key={template.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredTemplate(template.id)}
                      onHoverEnd={() => setHoveredTemplate(null)}
                      onClick={() => setSelectedTemplate(template)}
                      className={`
                        relative cursor-pointer rounded-xl overflow-hidden
                        border-2 transition-all duration-200
                        ${
                          isSelected
                            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      {/* Preview */}
                      <div className="aspect-[4/5] bg-gray-50 dark:bg-gray-800 relative">
                        {renderTemplatePreview(template)}

                        {/* Overlay on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4"
                            >
                              <div className="text-white">
                                <p className="text-sm font-medium mb-2">Características:</p>
                                <ul className="text-xs space-y-1">
                                  {template.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Selected indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${template.color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: template.color }} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {template.name}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {template.guests || template.seats} personas
                                </span>
                                {template.tables > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Layout className="w-3 h-3" />
                                    {template.tables} {template.tables === 1 ? 'mesa' : 'mesas'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTemplate ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Seleccionado: <strong>{selectedTemplate.name}</strong>
                  </span>
                ) : (
                  <span>Selecciona una plantilla para continuar</span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplate}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                    ${
                      selectedTemplate
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                    }
                  `}
                >
                  <Sparkles className="w-4 h-4" />
                  Aplicar Plantilla
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeatingTemplateGallery;
