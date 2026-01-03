import React from 'react';
import { FlipHorizontal } from 'lucide-react';
import { getDimensionsForType, supportsDoubleSided } from '../../utils/designTypeDimensions';

export default function DoubleSidedToggle({
  currentSide,
  onSideChange,
  canvasSize,
  onSizeChange,
  isDoubleSided,
  onToggleDoubleSided,
  designType = 'invitation',
}) {
  const dimensionsConfig = getDimensionsForType(designType);
  const availableSizes = dimensionsConfig.sizes;
  const showDoubleSided = supportsDoubleSided(designType);

  return (
    <div className="flex flex-col gap-3">
      {/* Selector de tamaño */}
      <div className="space-y-2">
        <label className="text-xs font-medium " className="text-body">Tamaño</label>
        <select
          value={availableSizes.find(s => s.width === canvasSize.width && s.height === canvasSize.height)?.id || 'custom'}
          onChange={(e) => {
            const size = availableSizes.find(s => s.id === e.target.value);
            if (size && size.width) {
              onSizeChange({ width: size.width, height: size.height });
            }
          }}
          className="w-full px-3 py-2 text-xs border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent " className="border-default" className="bg-surface"
        >
          {availableSizes.map(size => (
            <option key={size.id} value={size.id}>
              {size.label}
            </option>
          ))}
        </select>
        <p className="text-xs " className="text-muted">
          {canvasSize.width} × {canvasSize.height} px
        </p>
      </div>

      {/* Toggle doble cara - Solo para tipos compatibles */}
      {showDoubleSided && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDoubleSided}
              onChange={(e) => onToggleDoubleSided(e.target.checked)}
              className="w-4 h-4   rounded focus:ring-blue-500" className="text-primary" className="border-default"
            />
            <span className="text-xs font-medium " className="text-body">Doble cara</span>
          </label>
        </div>
      )}

      {/* Selector anverso/reverso - solo si es doble cara */}
      {isDoubleSided && (
        <>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex gap-1.5  p-1 rounded-md" className="bg-page">
            <button
              onClick={() => onSideChange('front')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentSide === 'front'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>📄</span>
              Anverso
            </button>
            <button
              onClick={() => onSideChange('back')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentSide === 'back'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Reverso
            </button>
          </div>
        </>
      )}

      {/* Indicador visual */}
      {isDoubleSided && (
        <div className="ml-auto flex items-center gap-1 text-xs " className="text-muted">
          <div className={`w-2 h-2 rounded-full ${currentSide === 'front' ? 'bg-blue-600' : 'bg-gray-400'}`} />
          <span>Editando {currentSide === 'front' ? 'anverso' : 'reverso'}</span>
        </div>
      )}
    </div>
  );
}
