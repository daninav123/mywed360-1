import React from 'react';

/**
 * PhotoGallerySection - Galería de fotos
 */
const PhotoGallerySection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { titulo, fotos, layout } = datos;

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

  const gridClass = {
    'grid-3': 'grid-cols-1 md:grid-cols-3',
    'grid-4': 'grid-cols-2 md:grid-cols-4',
    masonry: 'grid-cols-1 md:grid-cols-3',
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        {editable ? (
          <input
            type="text"
            value={titulo}
            onChange={(e) => handleContentChange('titulo', e.target.value)}
            className="
              text-4xl font-bold text-gray-900 mb-12 text-center
              bg-transparent border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-4 py-2 rounded-lg w-full
              transition-colors
            "
            placeholder="Galería de Fotos"
          />
        ) : (
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">{titulo}</h2>
        )}

        {/* Galería */}
        <div className={`grid ${gridClass[layout] || gridClass['grid-3']} gap-4`}>
          {fotos && fotos.length > 0 ? (
            fotos.map((foto, idx) => (
              <div
                key={idx}
                className="
                  aspect-square bg-gray-200 rounded-lg overflow-hidden
                  shadow-md hover:shadow-lg transition-shadow
                  cursor-pointer group
                "
              >
                {foto ? (
                  <img
                    src={foto}
                    alt={`Foto ${idx + 1}`}
                    className="
                      w-full h-full object-cover
                      group-hover:scale-105 transition-transform duration-300
                    "
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    📷
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-400">
              <p className="text-2xl mb-2">📸</p>
              <p>Añade fotos a tu galería</p>
            </div>
          )}
        </div>

        {editable && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 Puedes cambiar el layout: grid-3, grid-4 o masonry
          </div>
        )}
      </div>
    </section>
  );
};

export default PhotoGallerySection;
