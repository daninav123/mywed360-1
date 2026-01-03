import React, { useState } from 'react';

/**
 * StorySection - Sección de historia de la pareja
 */
const StorySection = ({ config, editable = false, onChange }) => {
  const { datos, estilo } = config;
  const { titulo, texto, fotos, layout } = datos;

  const handleContentChange = (field, value) => {
    if (onChange) {
      onChange({
        ...config,
        datos: {
          ...datos,
          [field]: value,
        },
      });
    }
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        {editable ? (
          <input
            type="text"
            value={titulo}
            onChange={(e) => handleContentChange('titulo', e.target.value)}
            className="
              text-4xl font-bold text-gray-900 mb-8 text-center
              bg-transparent border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-4 py-2 rounded-lg w-full
              transition-colors
            "
            placeholder="Título de la sección"
          />
        ) : (
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">{titulo}</h2>
        )}

        {/* Contenido */}
        <div
          className={`grid grid-cols-1 ${layout === 'dos-columnas' ? 'md:grid-cols-2' : ''} gap-8 items-center`}
        >
          {/* Texto */}
          <div>
            {editable ? (
              <textarea
                value={texto}
                onChange={(e) => handleContentChange('texto', e.target.value)}
                className="
                  w-full h-48 p-4 text-gray-700 leading-relaxed
                  border-2 border-dashed border-gray-300
                  hover:border-gray-500 focus:border-gray-500
                  rounded-lg resize-none
                  transition-colors
                "
                placeholder="Cuéntanos vuestra historia..."
              />
            ) : (
              <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{texto}</p>
            )}
          </div>

          {/* Fotos */}
          {fotos && fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {fotos.map((foto, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {foto ? (
                    <img
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      📷
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {editable && (
          <div className="mt-4 text-sm text-gray-500">
            💡 Edita el texto y las fotos se mostrarán automáticamente
          </div>
        )}
      </div>
    </section>
  );
};

export default StorySection;
