/**
 * EnhancedExportModal - Modal de exportaci�n mejorado con watermark y opciones
 * FASE 3.2: Exportaci�n Mejorada
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileImage, 
  FileText, 
  FileSpreadsheet,
  X,
  CheckCircle2,
  Settings,
  Eye,
  Sparkles
} from 'lucide-react';

const EXPORT_FORMATS = [
  {
    id: 'png',
    name: 'PNG (Imagen)',
    icon: FileImage,
    description: 'Alta calidad para imprimir',
    color: 'blue',
    premium: false,
  },
  {
    id: 'pdf',
    name: 'PDF (Documento)',
    icon: FileText,
    description: 'Formato profesional',
    color: 'red',
    premium: false,
  },
  {
    id: 'svg',
    name: 'SVG (Vector)',
    icon: FileImage,
    description: 'Escalable sin p�rdida',
    color: 'purple',
    premium: true,
  },
  {
    id: 'csv',
    name: 'CSV (Excel)',
    icon: FileSpreadsheet,
    description: 'Datos de invitados',
    color: 'green',
    premium: false,
  },
];

const QUALITY_OPTIONS = [
  { id: 'low', name: 'Baja', dpi: 72, size: 'Peque�o' },
  { id: 'medium', name: 'Media', dpi: 150, size: 'Normal' },
  { id: 'high', name: 'Alta', dpi: 300, size: 'Grande' },
  { id: 'ultra', name: 'Ultra', dpi: 600, size: 'Muy Grande', premium: true },
];

export default function EnhancedExportModal({ 
  onExport, 
  onClose,
  isPremium = false,
  tableCount = 0,
  guestCount = 0,
}) {
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [quality, setQuality] = useState('medium');
  const [options, setOptions] = useState({
    includeWatermark: !isPremium,
    includeStats: true,
    includeDate: true,
    includeGuests: true,
    includeLegend: true,
    theme: 'light', // light, dark, elegant
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      await onExport?.({
        format: selectedFormat,
        quality,
        options,
      });
      
      setExportSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (error) {
      // console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat);
  const selectedQualityData = QUALITY_OPTIONS.find(q => q.id === quality);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Download className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Exportar Layout</h2>
                <p className="text-blue-100 text-sm">
                  {tableCount} mesas " {guestCount} invitados
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Formato */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Formato de Exportaci�n
            </label>
            <div className="grid grid-cols-2 gap-3">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;
                const needsPremium = format.premium && !isPremium;

                return (
                  <button
                    key={format.id}
                    onClick={() => !needsPremium && setSelectedFormat(format.id)}
                    disabled={needsPremium}
                    className={`
                      relative p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? `border-${format.color}-500 bg-${format.color}-50 dark:bg-${format.color}-900/20`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                      ${needsPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {/* Premium badge */}
                    {format.premium && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        PRO
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Icon className={`w-6 h-6 ${isSelected ? `text-${format.color}-600` : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {format.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`w-5 h-5 text-${format.color}-600`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calidad (solo para im�genes) */}
          {['png', 'svg'].includes(selectedFormat) && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Calidad de Imagen
              </label>
              <div className="flex gap-2">
                {QUALITY_OPTIONS.map((q) => {
                  const isSelected = quality === q.id;
                  const needsPremium = q.premium && !isPremium;

                  return (
                    <button
                      key={q.id}
                      onClick={() => !needsPremium && setQuality(q.id)}
                      disabled={needsPremium}
                      className={`
                        flex-1 px-4 py-3 rounded-lg border-2 transition-all relative
                        ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                        }
                        ${needsPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {q.premium && (
                        <Sparkles className="w-3 h-3 absolute top-2 right-2 text-yellow-500" />
                      )}
                      <p className="font-semibold">{q.name}</p>
                      <p className="text-xs opacity-75">{q.dpi} DPI</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opciones */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <Settings className="w-4 h-4 inline mr-2" />
              Opciones Adicionales
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeStats}
                  onChange={() => toggleOption('includeStats')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir estad�sticas (mesas, invitados, capacidad)
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeDate}
                  onChange={() => toggleOption('includeDate')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir fecha y hora de exportaci�n
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeGuests}
                  onChange={() => toggleOption('includeGuests')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir nombres de invitados en mesas
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeLegend}
                  onChange={() => toggleOption('includeLegend')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Incluir leyenda de colores
                </span>
              </label>

              {!isPremium && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <label className="flex items-center gap-3 cursor-not-allowed opacity-75">
                    <input
                      type="checkbox"
                      checked={options.includeWatermark}
                      disabled
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      Marca de agua (Actualiza a PRO para eliminar)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Tema */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Tema de Exportaci�n
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['light', 'dark', 'elegant'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setOptions(prev => ({ ...prev, theme }))}
                  className={`
                    px-4 py-2 rounded-lg border-2 transition-all capitalize
                    ${options.theme === theme
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  {theme === 'light' && ' '}
                  {theme === 'dark' && '<'}
                  {theme === 'elegant' && '('}
                  {' '}{theme}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedFormatData && (
                <span>
                  Exportando como <strong>{selectedFormatData.name}</strong>
                  {selectedQualityData && ` (${selectedQualityData.name})`}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || exportSuccess}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                  ${exportSuccess
                    ? 'bg-green-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/50'
                  }
                  disabled:opacity-50
                `}
              >
                {isExporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.div>
                    Exportando...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    �Exportado!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
