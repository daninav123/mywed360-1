/**
 * ColorPaletteSelector - Selector visual de paletas de colores
 * FASE 1.3 del WORKFLOW-USUARIO.md
 */
import React, { useState, useMemo } from 'react';
import { Check, Palette } from 'lucide-react';
import { getRecommendedPalettes, getContrastColor } from '../../data/colorPalettes';

const ColorSwatch = ({ color, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`${sizes[size]} rounded-lg shadow-sm border border-gray-200`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
};

const PaletteCard = ({ palette, selected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(palette)}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="mb-3">
        <h4 className="font-semibold text-gray-800 mb-1">{palette.name}</h4>
        <p className="text-xs text-gray-600">{palette.description}</p>
      </div>

      <div className="flex gap-2 mb-3">
        {palette.colors.map((color, idx) => (
          <ColorSwatch key={idx} color={color} size="md" />
        ))}
      </div>

      {palette.season && palette.season.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {palette.season.map((season, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded"
            >
              {season === 'all' ? 'Todo el año' : season.charAt(0).toUpperCase() + season.slice(1)}
            </span>
          ))}
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

const ColorPreview = ({ palette }) => {
  if (!palette) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Vista previa: {palette.name}
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-3">
          {palette.colors.map((color, idx) => (
            <div key={idx} className="space-y-2">
              <ColorSwatch color={color} size="lg" />
              <div className="text-center">
                <p className="text-xs font-mono text-gray-600">{color}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Color {idx + 1}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700 mb-3">
            <strong>Cómo usar esta paleta:</strong>
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <ColorSwatch color={palette.colors[0]} size="sm" />
              <span>Color principal - Decoración destacada</span>
            </li>
            <li className="flex gap-2">
              <ColorSwatch color={palette.colors[1]} size="sm" />
              <span>Color secundario - Detalles y acentos</span>
            </li>
            <li className="flex gap-2">
              <ColorSwatch color={palette.colors[2]} size="sm" />
              <span>Color terciario - Complementos</span>
            </li>
            <li className="flex gap-2">
              <ColorSwatch color={palette.colors[3]} size="sm" />
              <span>Color neutro claro - Fondos</span>
            </li>
            <li className="flex gap-2">
              <ColorSwatch color={palette.colors[4]} size="sm" />
              <span>Color neutro - Balance</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700 mb-2">
            <strong>💡 Sugerencias de aplicación:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Flores en tonos de los colores 1-3</li>
            <li>• Manteles y servilletas en color neutro claro</li>
            <li>• Detalles decorativos en color principal</li>
            <li>• Invitaciones con combinación de 2-3 colores</li>
            <li>• Vestimenta del cortejo en colores complementarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function ColorPaletteSelector({ 
  styleId, 
  season, 
  selectedPalette, 
  onSelect 
}) {
  const [filterSeason, setFilterSeason] = useState(season || null);

  const palettes = useMemo(() => {
    return getRecommendedPalettes(styleId, filterSeason);
  }, [styleId, filterSeason]);

  const handleSeasonFilter = (newSeason) => {
    setFilterSeason(newSeason === filterSeason ? null : newSeason);
  };

  if (!styleId) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Selecciona un estilo primero
        </h3>
        <p className="text-sm text-gray-500">
          Completa el quiz de estilo para ver paletas de colores recomendadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filtrar por temporada:</span>
        {['primavera', 'verano', 'otoño', 'invierno'].map((s) => (
          <button
            key={s}
            onClick={() => handleSeasonFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
              filterSeason === s
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                : 'border-gray-200 hover:border-blue-300 text-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {palettes.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">
            No hay paletas disponibles para este filtro. Intenta con otra temporada.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {palettes.map((palette) => (
          <PaletteCard
            key={palette.id}
            palette={palette}
            selected={selectedPalette?.id === palette.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      {selectedPalette && (
        <ColorPreview palette={selectedPalette} />
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Consejo:</strong> Estas son paletas sugeridas basadas en tu estilo. 
          Puedes personalizarlas o crear tu propia combinación única.
        </p>
      </div>
    </div>
  );
}
