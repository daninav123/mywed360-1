/**
 * LayoutTemplates - Galería de templates de layouts predefinidos
 * FASE 3.1: Templates Visuales
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  Circle, 
  Square, 
  Hexagon, 
  Sparkles,
  Check,
  X,
  Info
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'classic-grid',
    name: 'Clásico en Cuadrícula',
    icon: Grid,
    description: 'Mesas redondas en cuadrícula uniforme',
    preview: '⬤ ⬤ ⬤\n⬤ ⬤ ⬤\n⬤ ⬤ ⬤',
    guestCount: [50, 150],
    tableCount: [8, 20],
    config: {
      shape: 'circle',
      spacing: 200,
      pattern: 'grid',
    }
  },
  {
    id: 'elegant-diagonal',
    name: 'Diagonal Elegante',
    icon: Sparkles,
    description: 'Mesas en diagonal con espacio central',
    preview: '⬤   ⬤\n  ⬤   ⬤\n⬤   ⬤',
    guestCount: [40, 120],
    tableCount: [6, 15],
    config: {
      shape: 'circle',
      spacing: 220,
      pattern: 'diagonal',
    }
  },
  {
    id: 'imperial-horseshoe',
    name: 'Herradura Imperial',
    icon: Circle,
    description: 'Mesas en forma de U, mesa presidencial al frente',
    preview: '⬤⬤⬤⬤⬤\n⬤     ⬤\n⬤     ⬤',
    guestCount: [60, 200],
    tableCount: [10, 25],
    config: {
      shape: 'circle',
      spacing: 180,
      pattern: 'horseshoe',
    }
  },
  {
    id: 'modern-clusters',
    name: 'Clusters Modernos',
    icon: Hexagon,
    description: 'Grupos de mesas hexagonales',
    preview: '⬢⬢  ⬢⬢\n  ⬢⬢',
    guestCount: [30, 100],
    tableCount: [5, 12],
    config: {
      shape: 'hexagon',
      spacing: 160,
      pattern: 'clusters',
    }
  },
  {
    id: 'intimate-small',
    name: 'Íntimo Pequeño',
    icon: Circle,
    description: 'Pocas mesas grandes, ambiente cercano',
    preview: '  ⬤\n⬤   ⬤\n  ⬤',
    guestCount: [20, 60],
    tableCount: [3, 8],
    config: {
      shape: 'circle',
      spacing: 250,
      pattern: 'scattered',
      tableSize: 'large',
    }
  },
  {
    id: 'banquet-rows',
    name: 'Filas de Banquete',
    icon: Square,
    description: 'Mesas rectangulares en filas paralelas',
    preview: '▭▭▭\n▭▭▭\n▭▭▭',
    guestCount: [80, 250],
    tableCount: [12, 30],
    config: {
      shape: 'rectangle',
      spacing: 150,
      pattern: 'rows',
    }
  },
];

export default function LayoutTemplates({ onApply, onClose, currentGuestCount = 0 }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleApply = () => {
    if (selectedTemplate && onApply) {
      onApply(selectedTemplate);
      onClose?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[var(--color-primary)] text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Templates de Layout</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Selecciona un diseño predefinido para tu evento
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Info bar */}
        {currentGuestCount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4" />
              <span>
                Tienes <strong>{currentGuestCount} invitados</strong>. Los templates recomendados están resaltados.
              </span>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => {
              const isRecommended = currentGuestCount >= template.guestCount[0] && 
                                   currentGuestCount <= template.guestCount[1];
              const isSelected = selectedTemplate?.id === template.id;
              const Icon = template.icon;

              return (
                <motion.button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }
                    ${isRecommended ? 'ring-2 ring-green-500/50' : ''}
                  `}
                >
                  {/* Badge recomendado */}
                  {isRecommended && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Recomendado
                    </div>
                  )}

                  {/* Check icon si seleccionado */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Icono */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                  </div>

                  {/* Preview ASCII */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3 font-mono text-center text-lg leading-relaxed text-gray-600 dark:text-gray-400 whitespace-pre">
                    {template.preview}
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{template.guestCount[0]}-{template.guestCount[1]} invitados</span>
                    <span>{template.tableCount[0]}-{template.tableCount[1]} mesas</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTemplate ? (
                <span>
                  <strong>{selectedTemplate.name}</strong> seleccionado
                </span>
              ) : (
                <span>Selecciona un template para continuar</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedTemplate}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200
                  ${selectedTemplate
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/50'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Aplicar Template
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
