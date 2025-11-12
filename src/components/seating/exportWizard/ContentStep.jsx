/**
 * Content Step Component
 * Paso de configuración de contenido del wizard
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Upload,
  Monitor,
  Smartphone,
  Type,
  Calendar,
  Hash,
  Grid,
  Users,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';
import { EXPORT_FORMATS, PAPER_SIZES, LOGO_POSITIONS, QUALITY_OPTIONS } from './constants';
import { toast } from 'react-toastify';

const ContentStep = ({ selectedFormat, exportOptions, setExportOptions }) => {
  const fileInputRef = useRef(null);
  const format = EXPORT_FORMATS[selectedFormat];

  // Manejar subida de logo
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El logo no debe superar 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setExportOptions((prev) => ({
          ...prev,
          logo: e.target.result,
        }));
        toast.success('Logo cargado correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover logo
  const removeLogo = () => {
    setExportOptions((prev) => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          Configura el contenido
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personaliza qué elementos incluir en la exportación
        </p>
      </div>

      {/* Configuración específica por formato */}
      {selectedFormat === 'pdf' && (
        <div className="space-y-4">
          {/* Orientación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Orientación del documento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExportOptions((prev) => ({ ...prev, orientation: 'portrait' }))}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${
                    exportOptions.orientation === 'portrait'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <Monitor className="w-6 h-6 rotate-90" />
                <span className="text-sm">Vertical</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExportOptions((prev) => ({ ...prev, orientation: 'landscape' }))}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                  ${
                    exportOptions.orientation === 'landscape'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <Monitor className="w-6 h-6" />
                <span className="text-sm">Horizontal</span>
              </motion.button>
            </div>
          </div>

          {/* Tamaño de papel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tamaño de papel
            </label>
            <select
              value={exportOptions.size}
              onChange={(e) => setExportOptions((prev) => ({ ...prev, size: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              {format.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}{' '}
                  {PAPER_SIZES[size] &&
                    `(${PAPER_SIZES[size].width}×${PAPER_SIZES[size].height}mm)`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {selectedFormat === 'png' && (
        <div className="space-y-4">
          {/* Resolución */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resolución de imagen
            </label>
            <select
              value={exportOptions.resolution}
              onChange={(e) =>
                setExportOptions((prev) => ({
                  ...prev,
                  resolution: e.target.value === 'custom' ? 'custom' : Number(e.target.value),
                }))
              }
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              {format.resolutions.map((res) => (
                <option key={res.value} value={res.value}>
                  {res.label} {res.width && res.height && `(${res.width}×${res.height}px)`}
                </option>
              ))}
            </select>
          </div>

          {/* Calidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calidad de imagen
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_OPTIONS.map((quality) => (
                <motion.button
                  key={quality.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setExportOptions((prev) => ({ ...prev, quality: quality.value }))}
                  className={`
                    p-2 rounded-lg border-2 text-sm transition-all
                    ${
                      exportOptions.quality === quality.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <div className="font-medium">{quality.label}</div>
                  <div className="text-xs text-gray-500">{quality.size}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Información del documento */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Información del documento
        </h4>

        {/* Título */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Título principal
          </label>
          <input
            type="text"
            value={exportOptions.title}
            onChange={(e) => setExportOptions((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Distribución de Invitados"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>

        {/* Subtítulo */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Subtítulo (fecha del evento)
          </label>
          <input
            type="text"
            value={exportOptions.subtitle}
            onChange={(e) => setExportOptions((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Sábado 25 de Diciembre, 2025"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>

        {/* Watermark */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Marca de agua (opcional)
          </label>
          <input
            type="text"
            value={exportOptions.watermark}
            onChange={(e) => setExportOptions((prev) => ({ ...prev, watermark: e.target.value }))}
            placeholder="© Mi Boda 2025"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo personalizado</h4>

        {!exportOptions.logo ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Upload className="w-8 h-8" />
              <span className="text-sm">Click para subir logo</span>
              <span className="text-xs">PNG, JPG o SVG (máx. 5MB)</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img src={exportOptions.logo} alt="Logo" className="w-16 h-16 object-contain rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo cargado</p>
              <button onClick={removeLogo} className="text-xs text-red-600 hover:text-red-700 mt-1">
                Eliminar logo
              </button>
            </div>
          </div>
        )}

        {exportOptions.logo && (
          <>
            {/* Posición del logo */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Posición del logo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LOGO_POSITIONS.map((pos) => (
                  <motion.button
                    key={pos.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setExportOptions((prev) => ({ ...prev, logoPosition: pos.id }))}
                    className={`
                      p-2 rounded text-xs transition-all flex items-center justify-center gap-1
                      ${
                        exportOptions.logoPosition === pos.id
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }
                    `}
                  >
                    <span>{pos.icon}</span>
                    <span className="hidden sm:inline">{pos.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tamaño del logo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Tamaño del logo</label>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {exportOptions.logoSize}px
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={exportOptions.logoSize}
                onChange={(e) =>
                  setExportOptions((prev) => ({ ...prev, logoSize: Number(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </>
        )}
      </div>

      {/* Elementos a incluir */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Elementos a incluir
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeTitle}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeTitle: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Type className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Título</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeDate}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeDate: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Fecha</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeNumbers}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeNumbers: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Números</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeNames}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeNames: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Nombres</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeGrid}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeGrid: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Grid className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Cuadrícula</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeLegend}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeLegend: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Leyenda</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeStats}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeStats: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Estadísticas</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeWatermark}
              onChange={(e) =>
                setExportOptions((prev) => ({ ...prev, includeWatermark: e.target.checked }))
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <ImageIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Watermark</span>
          </label>
        </div>
      </div>

      {/* Márgenes (para PDF) */}
      {selectedFormat === 'pdf' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Márgenes (en mm)</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(exportOptions.margins).map(([side, value]) => (
              <div key={side}>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {side === 'top'
                    ? 'Superior'
                    : side === 'right'
                      ? 'Derecha'
                      : side === 'bottom'
                        ? 'Inferior'
                        : side === 'left'
                          ? 'Izquierda'
                          : side}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      margins: { ...prev.margins, [side]: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentStep;
