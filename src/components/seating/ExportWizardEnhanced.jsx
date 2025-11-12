/**
 * ExportWizardEnhanced - Wizard avanzado de exportación con preview
 * FASE 3: Experiencia Premium
 *
 * Integra todos los pasos modulares del wizard de exportación
 */
import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Loader,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

// Importar componentes modulares
import {
  EXPORT_FORMATS,
  STYLE_TEMPLATES,
  WIZARD_STEPS,
  DEFAULT_EXPORT_OPTIONS,
  PAPER_SIZES,
} from './exportWizard/constants';
import StyleStep from './exportWizard/StyleStep';
import ContentStep from './exportWizard/ContentStep';

// Función para aplicar estilos personalizados al canvas
const applyCustomStyles = (element, customStyle, exportOptions) => {
  if (!element) return;

  // Aplicar colores
  element.style.backgroundColor = customStyle.colors.background;
  element.style.fontFamily = customStyle.font;
  element.style.fontSize = `${customStyle.fontSize}px`;

  // Aplicar colores a elementos específicos
  const tables = element.querySelectorAll('.table-element, .seating-table');
  tables.forEach((table) => {
    table.style.fill = customStyle.colors.primary;
    table.style.stroke = customStyle.colors.accent;
  });

  const texts = element.querySelectorAll('text, .guest-name, .table-name');
  texts.forEach((text) => {
    text.style.fill = customStyle.colors.text || customStyle.colors.primary;
    text.style.fontSize = `${customStyle.fontSize}px`;
  });

  // Mostrar/ocultar elementos según opciones
  if (!exportOptions.includeNames) {
    const names = element.querySelectorAll('.guest-name');
    names.forEach((name) => (name.style.display = 'none'));
  }

  if (!exportOptions.includeNumbers) {
    const numbers = element.querySelectorAll('.table-number');
    numbers.forEach((num) => (num.style.display = 'none'));
  }

  if (!exportOptions.includeGrid) {
    const grid = element.querySelector('.grid-background');
    if (grid) grid.style.display = 'none';
  }
};

export default function ExportWizardEnhanced({
  isOpen,
  onClose,
  onExport,
  canvasRef,
  guests = [],
  tables = [],
  hallSize = { width: 1800, height: 1200 },
  weddingInfo = {},
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedStyle, setSelectedStyle] = useState('elegant');
  const [customStyle, setCustomStyle] = useState(STYLE_TEMPLATES.elegant);
  const [exportOptions, setExportOptions] = useState({
    ...DEFAULT_EXPORT_OPTIONS,
    title: weddingInfo.coupleName || 'Distribución de Invitados',
    subtitle: weddingInfo.date || new Date().toLocaleDateString(),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const previewRef = useRef(null);

  // Limpiar preview URL al cerrar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generar preview cuando lleguemos al paso de preview
  useEffect(() => {
    if (currentStep === 3 && canvasRef?.current) {
      generatePreview();
    }
  }, [currentStep, customStyle, exportOptions]);

  // Generar preview del canvas
  const generatePreview = async () => {
    if (!canvasRef?.current) return;

    try {
      const canvas = canvasRef.current;
      const clonedCanvas = canvas.cloneNode(true);
      applyCustomStyles(clonedCanvas, customStyle, exportOptions);

      const previewCanvas = await html2canvas(clonedCanvas, {
        backgroundColor: customStyle.colors.background,
        scale: 2,
        logging: false,
      });

      const blob = await new Promise((resolve) => previewCanvas.toBlob(resolve, 'image/png'));

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Error generando vista previa');
    }
  };

  // Navegar entre pasos
  const goToStep = (step) => {
    if (step >= 0 && step < WIZARD_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => goToStep(currentStep + 1);
  const prevStep = () => goToStep(currentStep - 1);

  // Ejecutar exportación
  const handleExport = async () => {
    setIsGenerating(true);

    try {
      // Callback para el componente padre
      if (onExport) {
        await onExport(selectedFormat, {
          style: customStyle,
          options: exportOptions,
        });
      }

      toast.success(`Exportado como ${EXPORT_FORMATS[selectedFormat].name} correctamente`);

      // Cerrar wizard después de exportar
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error al exportar');
    } finally {
      setIsGenerating(false);
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
                <h2 className="text-2xl font-bold text-white">Asistente de Exportación Premium</h2>
                <p className="text-indigo-100 text-sm mt-1">{WIZARD_STEPS[currentStep].label}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Progress Stepper */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                {WIZARD_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <button
                        onClick={() => index < currentStep && goToStep(index)}
                        disabled={index > currentStep}
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full
                          transition-all ${
                            isActive
                              ? 'bg-white text-indigo-600 scale-110'
                              : isCompleted
                                ? 'bg-white/30 text-white'
                                : 'bg-white/10 text-white/50'
                          }
                          ${index < currentStep ? 'cursor-pointer hover:bg-white/40' : ''}
                        `}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </button>
                      {index < WIZARD_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 transition-colors ${
                            index < currentStep ? 'bg-white/30' : 'bg-white/10'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                {WIZARD_STEPS.map((step, index) => (
                  <span
                    key={step.id}
                    className={`text-xs flex-1 text-center ${
                      index === currentStep ? 'text-white font-medium' : 'text-white/70'
                    }`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <AnimatePresence mode="wait">
              {/* Step 0: Format Selection */}
              {currentStep === 0 && (
                <motion.div
                  key="format"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Selecciona el formato de exportación
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Elige el formato que mejor se adapte a tus necesidades
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.values(EXPORT_FORMATS).map((format) => {
                      const Icon = format.icon;
                      const isSelected = selectedFormat === format.id;

                      return (
                        <motion.button
                          key={format.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedFormat(format.id)}
                          className={`
                            relative p-4 rounded-xl border-2 text-left transition-all
                            ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}

                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${format.color}20` }}
                            >
                              <Icon className="w-6 h-6" style={{ color: format.color }} />
                            </div>

                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {format.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {format.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {format.features.map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Style */}
              {currentStep === 1 && (
                <motion.div
                  key="style"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <StyleStep
                    selectedStyle={selectedStyle}
                    setSelectedStyle={setSelectedStyle}
                    customStyle={customStyle}
                    setCustomStyle={setCustomStyle}
                  />
                </motion.div>
              )}

              {/* Step 2: Content */}
              {currentStep === 2 && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ContentStep
                    selectedFormat={selectedFormat}
                    exportOptions={exportOptions}
                    setExportOptions={setExportOptions}
                  />
                </motion.div>
              )}

              {/* Step 3: Preview */}
              {currentStep === 3 && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-500" />
                      Vista Previa
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Así se verá tu exportación con la configuración actual
                    </p>
                  </div>

                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                    {previewUrl ? (
                      <img
                        ref={previewRef}
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-96 text-gray-400">
                        <Loader className="w-8 h-8 animate-spin" />
                        <span className="ml-3">Generando vista previa...</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Formato</h4>
                      <p className="text-gray-900 dark:text-white">
                        {EXPORT_FORMATS[selectedFormat].name}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Estilo</h4>
                      <p className="text-gray-900 dark:text-white">
                        {STYLE_TEMPLATES[selectedStyle].name}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Export */}
              {currentStep === 4 && (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  {isGenerating ? (
                    <div>
                      <Loader className="w-16 h-16 mx-auto text-indigo-500 animate-spin" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                        Generando exportación...
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Esto puede tomar unos segundos
                      </p>
                    </div>
                  ) : (
                    <div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-10 h-10 text-green-500" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">
                        ¡Exportación lista!
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Tu archivo se ha generado correctamente
                      </p>
                      <div className="flex gap-3 justify-center mt-6">
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Imprimir
                        </button>
                        <button
                          onClick={handleExport}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Descargar de nuevo
                        </button>
                        <button
                          onClick={() => {
                            navigator.share &&
                              navigator.share({
                                title: exportOptions.title,
                                text: 'Distribución de invitados',
                              });
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Compartir
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between">
            <div className="flex gap-3">
              {currentStep > 0 && currentStep < 4 && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {currentStep < 3 && (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  onClick={handleExport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Exportar
                    </>
                  )}
                </button>
              )}

              {currentStep === 4 && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
