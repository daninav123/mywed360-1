/**
 * Style Step Component
 * Paso de personalización de estilos del wizard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Droplet } from 'lucide-react';
import { STYLE_TEMPLATES } from './constants';

const StyleStep = ({ selectedStyle, setSelectedStyle, customStyle, setCustomStyle }) => {
  // Fonts disponibles
  const AVAILABLE_FONTS = [
    { value: 'Inter, sans-serif', label: 'Inter (Sans-serif)', preview: 'Aa' },
    { value: 'Georgia, serif', label: 'Georgia (Serif)', preview: 'Aa' },
    { value: 'Poppins, sans-serif', label: 'Poppins (Sans-serif)', preview: 'Aa' },
    { value: 'Roboto, sans-serif', label: 'Roboto (Sans-serif)', preview: 'Aa' },
    { value: 'Playfair Display, serif', label: 'Playfair Display (Serif)', preview: 'Aa' },
    { value: 'Merriweather, serif', label: 'Merriweather (Serif)', preview: 'Aa' },
    { value: 'Montserrat, sans-serif', label: 'Montserrat (Sans-serif)', preview: 'Aa' },
    { value: 'Lato, sans-serif', label: 'Lato (Sans-serif)', preview: 'Aa' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-500" />
          Personaliza el estilo visual
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Elige un estilo predefinido o personaliza colores y fuentes
        </p>
      </div>

      {/* Plantillas de estilo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Plantillas de estilo
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(STYLE_TEMPLATES).map((style) => {
            const isSelected = selectedStyle === style.id;

            return (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedStyle(style.id);
                  setCustomStyle(style);
                }}
                className={`
                  relative p-3 rounded-lg border-2 transition-all
                  ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Preview emoji */}
                  <span className="text-2xl">{style.preview}</span>

                  {/* Color dots */}
                  <div className="flex gap-1">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: style.colors.primary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: style.colors.secondary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: style.colors.accent }}
                    />
                  </div>

                  {/* Name */}
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {style.name}
                  </span>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Personalización de colores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Droplet className="w-4 h-4" />
          Colores personalizados
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(customStyle.colors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={value}
                  onChange={(e) =>
                    setCustomStyle((prev) => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: e.target.value },
                    }))
                  }
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                  style={{ backgroundColor: value }}
                />
                <div className="absolute inset-0 rounded-lg pointer-events-none border-2 border-gray-300" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {key === 'background'
                    ? 'Fondo'
                    : key === 'primary'
                      ? 'Primario'
                      : key === 'secondary'
                        ? 'Secundario'
                        : key === 'accent'
                          ? 'Acento'
                          : key === 'text'
                            ? 'Texto'
                            : key}
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    setCustomStyle((prev) => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: e.target.value },
                    }))
                  }
                  className="block w-full text-xs text-gray-500 dark:text-gray-400 bg-transparent border-0 p-0 mt-0.5 focus:outline-none"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personalización de fuente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Type className="w-4 h-4" />
          Tipografía
        </label>

        {/* Selector de fuente */}
        <select
          value={customStyle.font}
          onChange={(e) => setCustomStyle((prev) => ({ ...prev, font: e.target.value }))}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"
          style={{ fontFamily: customStyle.font }}
        >
          {AVAILABLE_FONTS.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </option>
          ))}
        </select>

        {/* Tamaño de fuente */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Tamaño de fuente</label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {customStyle.fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="24"
            value={customStyle.fontSize}
            onChange={(e) =>
              setCustomStyle((prev) => ({ ...prev, fontSize: Number(e.target.value) }))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            style={{
              background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${((customStyle.fontSize - 10) / 14) * 100}%, #E5E7EB ${((customStyle.fontSize - 10) / 14) * 100}%, #E5E7EB 100%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">10px</span>
            <span className="text-xs text-gray-400">24px</span>
          </div>
        </div>
      </div>

      {/* Vista previa del estilo */}
      <div
        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
        style={{ backgroundColor: customStyle.colors.background }}
      >
        <h4
          className="text-lg font-bold mb-2"
          style={{
            color: customStyle.colors.primary,
            fontFamily: customStyle.font,
            fontSize: `${customStyle.fontSize + 4}px`,
          }}
        >
          Vista Previa del Estilo
        </h4>
        <p
          style={{
            color: customStyle.colors.secondary,
            fontFamily: customStyle.font,
            fontSize: `${customStyle.fontSize}px`,
          }}
        >
          Este es un texto de ejemplo para mostrar cómo se verá tu diseño con los colores y fuente
          seleccionados.
        </p>
        <div className="flex gap-2 mt-3">
          <div
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: customStyle.colors.accent,
              color: customStyle.colors.background,
              fontFamily: customStyle.font,
              fontSize: `${customStyle.fontSize - 2}px`,
            }}
          >
            Mesa 1
          </div>
          <div
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: customStyle.colors.primary,
              color: customStyle.colors.background,
              fontFamily: customStyle.font,
              fontSize: `${customStyle.fontSize - 2}px`,
            }}
          >
            Mesa 2
          </div>
        </div>
      </div>

      {/* Opciones adicionales de estilo */}
      <div className="space-y-3 pt-2 border-t dark:border-gray-700">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={customStyle.showGrid}
            onChange={(e) => setCustomStyle((prev) => ({ ...prev, showGrid: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrar cuadrícula de fondo
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={customStyle.showNumbers}
            onChange={(e) => setCustomStyle((prev) => ({ ...prev, showNumbers: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar números de mesa</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={customStyle.showNames}
            onChange={(e) => setCustomStyle((prev) => ({ ...prev, showNames: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Mostrar nombres de invitados
          </span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={customStyle.showLogo}
            onChange={(e) => setCustomStyle((prev) => ({ ...prev, showLogo: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Incluir logo</span>
        </label>
      </div>
    </div>
  );
};

export default StyleStep;
