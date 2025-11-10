import React, { useState } from 'react';
import { Grid, Circle, Columns, Move, Shuffle, ChevronRight } from 'lucide-react';
import { LAYOUT_OPTIONS } from '../../utils/seatingLayoutGenerator';

const iconMap = {
  grid: Grid,
  circle: Circle,
  columns: Columns,
  u: Move,
  chevron: ChevronRight,
  shuffle: Shuffle,
};

export default function AutoLayoutModal({ isOpen, onClose, onGenerate, analysis }) {
  const [selectedLayout, setSelectedLayout] = useState('columns');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(selectedLayout);
      onClose();
    } catch (error) {
      console.error('Error generando layout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Generar Layout Automático</h2>
          <p className="mt-1 text-sm text-gray-600">
            Selecciona el tipo de distribución para tus mesas
          </p>
        </div>

        {/* Info Section */}
        {analysis && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Grid className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Datos detectados</h3>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">{analysis.totalTables}</span>
                    <span className="text-blue-800 ml-1">mesas detectadas</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">{analysis.totalAssigned}</span>
                    <span className="text-blue-800 ml-1">invitados asignados</span>
                  </div>
                  {analysis.unassignedGuests.length > 0 && (
                    <div>
                      <span className="text-orange-600 font-medium">
                        {analysis.unassignedGuests.length}
                      </span>
                      <span className="text-blue-800 ml-1">sin mesa</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Options */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona una distribución</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAYOUT_OPTIONS.map((option) => {
              const Icon = iconMap[option.icon] || Grid;
              const isSelected = selectedLayout === option.id;

              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedLayout(option.id)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      w-12 h-12 rounded-lg flex items-center justify-center mb-3
                      ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}
                    `}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                  </div>

                  {/* Text */}
                  <h4
                    className={`
                      text-left font-semibold mb-1
                      ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                    `}
                  >
                    {option.name}
                  </h4>
                  <p
                    className={`
                      text-left text-sm
                      ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                    `}
                  >
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning for unassigned guests */}
        {analysis && analysis.unassignedGuests.length > 0 && (
          <div className="px-6 py-4 bg-orange-50 border-t border-orange-100">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-orange-900">
                  Invitados sin mesa asignada
                </h4>
                <p className="text-sm text-orange-800 mt-1">
                  Hay {analysis.unassignedGuests.length} invitado(s) sin mesa asignada. Podrás
                  asignarlos manualmente después de generar el layout.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedLayout}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <Grid className="w-4 h-4" />
                Generar Layout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
