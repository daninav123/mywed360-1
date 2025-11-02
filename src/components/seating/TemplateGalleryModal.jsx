/**
 * TemplateGalleryModal - Galería visual de plantillas predefinidas
 * FASE 3: Experiencia Premium
 */
import React, { useState } from 'react';
import { X, Check, Users, Circle, Grid3x3, Square, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TEMPLATES = [
  {
    id: 'classic-120',
    name: 'Boda Clásica',
    description: '120 invitados, 12 mesas redondas',
    guests: 120,
    tables: 12,
    layout: 'grid',
    tableShape: 'circle',
    capacity: 10,
    icon: Circle,
    color: 'from-blue-500 to-indigo-600',
    preview: '⚪⚪⚪⚪\n⚪⚪⚪⚪\n⚪⚪⚪⚪',
  },
  {
    id: 'intimate-40',
    name: 'Boda Íntima',
    description: '40 invitados, 5 mesas redondas',
    guests: 40,
    tables: 5,
    layout: 'circular',
    tableShape: 'circle',
    capacity: 8,
    icon: Users,
    color: 'from-pink-500 to-rose-600',
    preview: '  ⚪⚪\n⚪    ⚪\n  ⚪⚪',
  },
  {
    id: 'imperial-200',
    name: 'Formato Imperial',
    description: '200 invitados, 20 mesas imperiales',
    guests: 200,
    tables: 20,
    layout: 'columns',
    tableShape: 'rectangle',
    capacity: 10,
    icon: Square,
    color: 'from-purple-500 to-violet-600',
    preview: '▭▭▭▭▭\n▭▭▭▭▭\n▭▭▭▭▭\n▭▭▭▭▭',
  },
  {
    id: 'circular-150',
    name: 'Circular Elegante',
    description: '150 invitados en círculo perfecto',
    guests: 150,
    tables: 15,
    layout: 'circular',
    tableShape: 'circle',
    capacity: 10,
    icon: Circle,
    color: 'from-emerald-500 to-teal-600',
    preview: '   ⚪⚪⚪\n ⚪     ⚪\n⚪       ⚪\n ⚪     ⚪\n   ⚪⚪⚪',
  },
  {
    id: 'u-shape-80',
    name: 'En Forma de U',
    description: '80 invitados, ideal para ceremonias',
    guests: 80,
    tables: 10,
    layout: 'u-shape',
    tableShape: 'rectangle',
    capacity: 8,
    icon: Square,
    color: 'from-amber-500 to-orange-600',
    preview: '▭▭▭▭▭\n▭     ▭\n▭     ▭\n▭▭▭▭▭',
  },
  {
    id: 'chevron-100',
    name: 'Espiga Moderna',
    description: '100 invitados en patrón dinámico',
    guests: 100,
    tables: 12,
    layout: 'chevron',
    tableShape: 'circle',
    capacity: 8,
    icon: Grid3x3,
    color: 'from-cyan-500 to-blue-600',
    preview: '  ⚪⚪⚪\n⚪⚪⚪⚪\n  ⚪⚪⚪',
  },
];

export default function TemplateGalleryModal({ isOpen, onClose, onSelectTemplate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const handleSelect = (template) => {
    setSelectedId(template.id);
    // Esperar animación y cerrar
    setTimeout(() => {
      onSelectTemplate(template);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Galería de Plantillas</h2>
                  <p className="text-indigo-100 text-sm mt-0.5">
                    Elige una distribución predefinida para empezar rápido
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((template, index) => {
                const Icon = template.icon;
                const isSelected = selectedId === template.id;
                const isHovered = hoveredId === template.id;

                return (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleSelect(template)}
                    className={`
                      group relative overflow-hidden rounded-xl border-2 transition-all duration-300
                      ${isSelected 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-200 scale-105' 
                        : isHovered
                          ? 'border-indigo-300 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                    {/* Content */}
                    <div className="relative p-6">
                      {/* Icon & Title */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${template.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 bg-indigo-500 rounded-full"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {template.description}
                      </p>

                      {/* Preview Visual */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-center text-gray-400 text-lg leading-relaxed whitespace-pre">
                        {template.preview}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-2xl font-bold text-indigo-600">{template.tables}</div>
                          <div className="text-xs text-gray-600 mt-1">Mesas</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-2xl font-bold text-purple-600">{template.guests}</div>
                          <div className="text-xs text-gray-600 mt-1">Invitados</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-2xl font-bold text-pink-600">{template.capacity}</div>
                          <div className="text-xs text-gray-600 mt-1">Por mesa</div>
                        </div>
                      </div>

                      {/* Hover Effect */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">💡 Tip Pro</h4>
                  <p className="text-sm text-blue-800">
                    Todas las plantillas se ajustan automáticamente al tamaño de tu salón.
                    Después puedes personalizar cada mesa manualmente con drag & drop.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {TEMPLATES.length} plantillas disponibles
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
