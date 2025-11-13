/**
 * ExportWizardEnhanced - Wizard avanzado de exportación con preview
 * FASE 3: Experiencia Premium
 */
import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Table,
  Settings,
  Eye,
  Palette,
  Type,
  Layout,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    name: 'PDF Alta Calidad',
    description: 'Ideal para imprimir',
    icon: FileText,
    color: 'from-red-500 to-rose-600',
    options: ['orientation', 'includeNames', 'colors', 'logo'],
  },
  {
    id: 'png',
    name: 'Imagen PNG',
    description: 'Para compartir digital',
    icon: ImageIcon,
    color: 'from-blue-500 to-indigo-600',
    options: ['resolution', 'includeNames', 'colors'],
  },
  {
    id: 'svg',
    name: 'SVG Editable',
    description: 'Para diseñadores',
    icon: Layout,
    color: 'from-purple-500 to-violet-600',
    options: ['includeNames'],
  },
  {
    id: 'excel',
    name: 'Excel con Lista',
    description: 'Tabla de asignaciones',
    icon: Table,
    color: 'from-green-500 to-emerald-600',
    options: ['includeEmails', 'includePhones'],
  },
];

const TEMPLATES = [
  { id: 'minimal', name: 'Minimalista', preview: '⚫️⚫️⚫️' },
  { id: 'elegant', name: 'Elegante', preview: '✨⚫️✨' },
  { id: 'colorful', name: 'Colorido', preview: '🔴🟢🔵' },
];

const RESOLUTIONS = [
  { id: '1x', name: 'Standard (1x)', width: 1920 },
  { id: '2x', name: 'Retina (2x)', width: 3840 },
  { id: '4x', name: 'Ultra (4x)', width: 7680 },
];

export default function ExportWizardEnhanced({ isOpen, onClose, onExport, canvasRef }) {
  const [step, setStep] = useState(1); // 1: Format, 2: Options, 3: Preview
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [options, setOptions] = useState({
    orientation: 'landscape',
    includeNames: true,
    colors: 'default',
    logo: false,
    resolution: '2x',
    fontSize: 12,
    includeEmails: false,
    includePhones: false,
    template: 'elegant',
  });

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    setStep(2);
  };

  const handleOptionToggle = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    try {
      await onExport(selectedFormat.id, options);
      onClose();
    } catch (error) {
      // console.error('Export error:', error);
    }
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Asistente de Exportación</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  Paso {step} de 3:{' '}
                  {step === 1 ? 'Formato' : step === 2 ? 'Opciones' : 'Vista Previa'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Format Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Selecciona el formato de exportación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EXPORT_FORMATS.map((format) => {
                    const Icon = format.icon;
                    return (
                      <button
                        key={format.id}
                        onClick={() => handleFormatSelect(format)}
                        className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-400 transition-all duration-300 text-left"
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${format.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`}
                        />
                        <div className="relative">
                          <div
                            className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${format.color} mb-4`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">{format.name}</h4>
                          <p className="text-sm text-gray-600">{format.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Options */}
            {step === 2 && selectedFormat && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Personaliza tu exportación
                </h3>

                <div className="space-y-6">
                  {/* Orientación (si aplica) */}
                  {selectedFormat.options.includes('orientation') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Layout className="w-4 h-4 inline mr-2" />
                        Orientación
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['landscape', 'portrait'].map((orient) => (
                          <button
                            key={orient}
                            onClick={() => setOptions((prev) => ({ ...prev, orientation: orient }))}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              options.orientation === orient
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div
                              className={`mb-2 ${orient === 'landscape' ? 'w-16 h-10' : 'w-10 h-16'} bg-gray-300 rounded mx-auto`}
                            />
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {orient}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolución (PNG) */}
                  {selectedFormat.options.includes('resolution') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Settings className="w-4 h-4 inline mr-2" />
                        Resolución
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {RESOLUTIONS.map((res) => (
                          <button
                            key={res.id}
                            onClick={() => setOptions((prev) => ({ ...prev, resolution: res.id }))}
                            className={`p-3 border-2 rounded-lg transition-all ${
                              options.resolution === res.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-bold text-gray-900">{res.name}</div>
                            <div className="text-xs text-gray-600 mt-1">{res.width}px</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template de colores */}
                  {selectedFormat.options.includes('colors') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Estilo Visual
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            onClick={() => setOptions((prev) => ({ ...prev, template: tmpl.id }))}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              options.template === tmpl.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-2">{tmpl.preview}</div>
                            <div className="text-sm font-medium text-gray-900">{tmpl.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opciones de texto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Type className="w-4 h-4 inline mr-2" />
                      Contenido
                    </label>
                    <div className="space-y-3">
                      {selectedFormat.options.includes('includeNames') && (
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={options.includeNames}
                            onChange={() => handleOptionToggle('includeNames')}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              Incluir nombres de invitados
                            </div>
                            <div className="text-sm text-gray-600">
                              Mostrar quién está en cada mesa
                            </div>
                          </div>
                        </label>
                      )}
                      {selectedFormat.options.includes('includeEmails') && (
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={options.includeEmails}
                            onChange={() => handleOptionToggle('includeEmails')}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Incluir emails</div>
                            <div className="text-sm text-gray-600">Útil para envíos masivos</div>
                          </div>
                        </label>
                      )}
                      {selectedFormat.options.includes('logo') && (
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={options.logo}
                            onChange={() => handleOptionToggle('logo')}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Incluir tu logo</div>
                            <div className="text-sm text-gray-600">Personalizar con tu marca</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preview */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </h3>
                <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium mb-2">Vista previa del seating plan</p>
                    <p className="text-sm">Formato: {selectedFormat?.name}</p>
                    <p className="text-sm">Orientación: {options.orientation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </button>
            <button
              onClick={() => (step < 3 ? setStep(step + 1) : handleExport())}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {step === 3 ? (
                <>
                  <Download className="w-4 h-4" />
                  Exportar
                </>
              ) : (
                'Siguiente'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
