import React, { useState } from 'react';
import { LISTA_TEMAS } from './themes';

/**
 * ThemeSelector - Selector de temas predefinidos
 */
export const ThemeSelector = ({ temaActual, onTemaChange }) => {
  const [mostrarModal, setMostrarModal] = useState(false);

  const handleSeleccionarTema = (tema) => {
    onTemaChange(tema, true); // true = mostrar toast de tema aplicado
    setMostrarModal(false);
  };

  return (
    <>
      {/* Botón para abrir selector */}
      <button
        onClick={() => setMostrarModal(true)}
        className="
          px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
          rounded-lg hover:shadow-lg transition-all font-semibold
          flex items-center gap-2
        "
      >
        🎨 Tema: {temaActual.nombre}
      </button>

      {/* Modal de selección */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🎨 Elige tu Tema</h2>
                <p className="text-sm text-gray-600 mt-1">Selecciona un tema para tu web de boda</p>
              </div>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Grid de temas */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {LISTA_TEMAS.map((tema) => (
                <div
                  key={tema.id}
                  onClick={() => handleSeleccionarTema(tema)}
                  className={`
                    border-2 rounded-xl p-6 cursor-pointer
                    transition-all hover:shadow-lg
                    ${
                      temaActual.id === tema.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
                  {/* Header del tema */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tema.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">{tema.descripcion}</p>
                    </div>
                    {temaActual.id === tema.id && <div className="text-blue-500 text-2xl">✓</div>}
                  </div>

                  {/* Preview de colores */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Colores:</p>
                    <div className="flex gap-2">
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-gray-200"
                        style={{ backgroundColor: tema.colores.primario }}
                        title="Primario"
                      />
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-gray-200"
                        style={{ backgroundColor: tema.colores.secundario }}
                        title="Secundario"
                      />
                      <div
                        className="w-12 h-12 rounded-lg shadow-md border border-gray-200"
                        style={{ backgroundColor: tema.colores.acento }}
                        title="Acento"
                      />
                    </div>
                  </div>

                  {/* Preview de fuentes */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Tipografía:</p>
                    <div className="space-y-1">
                      <p
                        className="text-lg font-bold text-gray-900"
                        style={{ fontFamily: tema.fuentes.titulo }}
                      >
                        {tema.fuentes.titulo}
                      </p>
                      <p
                        className="text-sm text-gray-600"
                        style={{ fontFamily: tema.fuentes.texto }}
                      >
                        {tema.fuentes.texto}
                      </p>
                    </div>
                  </div>

                  {/* Botón de selección */}
                  <button
                    className={`
                      w-full mt-4 px-4 py-2 rounded-lg font-semibold
                      transition-colors
                      ${
                        temaActual.id === tema.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {temaActual.id === tema.id ? '✓ Seleccionado' : 'Seleccionar'}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 text-center text-sm text-gray-600">
              💡 Puedes personalizar los colores y fuentes después de elegir un tema
            </div>
          </div>
        </div>
      )}
    </>
  );
};
