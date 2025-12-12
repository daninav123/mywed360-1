import React from 'react';

/**
 * GiftListSection - Lista de regalos
 */
const GiftListSection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { titulo, subtitulo, regalos, enlace } = datos;

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

  const handleRegaloChange = (idx, field, value) => {
    const nuevosRegalos = [...(regalos || [])];
    nuevosRegalos[idx] = {
      ...nuevosRegalos[idx],
      [field]: value,
    };
    handleContentChange('regalos', nuevosRegalos);
  };

  const regalosDefault = regalos || [
    {
      nombre: 'Viaje de luna de miel',
      descripcion: 'Ayúdanos a financiar nuestro viaje de ensueño',
      emoji: '✈️',
    },
    {
      nombre: 'Decoración del hogar',
      descripcion: 'Artículos para nuestro nuevo hogar',
      emoji: '🏠',
    },
    { nombre: 'Experiencias', descripcion: 'Cenas, spa, actividades especiales', emoji: '🎉' },
  ];

  return (
    <section className="py-16 px-4 bg-[var(--color-primary)]/10">
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        {editable ? (
          <input
            type="text"
            value={titulo}
            onChange={(e) => handleContentChange('titulo', e.target.value)}
            className="
              text-4xl font-bold text-gray-900 mb-4 text-center
              bg-transparent border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-4 py-2 rounded-lg w-full
              transition-colors
            "
            placeholder="Lista de Regalos"
          />
        ) : (
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">{titulo}</h2>
        )}

        {/* Subtítulo */}
        {editable ? (
          <textarea
            value={subtitulo}
            onChange={(e) => handleContentChange('subtitulo', e.target.value)}
            className="
              w-full text-center text-gray-600 mb-8
              bg-transparent border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-4 py-2 rounded-lg resize-none h-16
              transition-colors
            "
            placeholder="Descripción"
          />
        ) : (
          <p className="text-center text-gray-600 mb-8">{subtitulo}</p>
        )}

        {/* Regalos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {regalosDefault.map((regalo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              {editable ? (
                <>
                  <input
                    type="text"
                    value={regalo.emoji}
                    onChange={(e) => handleRegaloChange(idx, 'emoji', e.target.value)}
                    className="
                      text-4xl text-center mb-3
                      bg-transparent border-b-2 border-dashed border-gray-300
                      hover:border-gray-500 focus:border-gray-500
                      px-2 py-1 w-full
                      transition-colors
                    "
                    maxLength="2"
                  />
                  <input
                    type="text"
                    value={regalo.nombre}
                    onChange={(e) => handleRegaloChange(idx, 'nombre', e.target.value)}
                    className="
                      text-xl font-bold text-gray-900 mb-2
                      bg-transparent border-b-2 border-dashed border-gray-300
                      hover:border-gray-500 focus:border-gray-500
                      px-2 py-1 w-full
                      transition-colors
                    "
                    placeholder="Nombre del regalo"
                  />
                  <textarea
                    value={regalo.descripcion}
                    onChange={(e) => handleRegaloChange(idx, 'descripcion', e.target.value)}
                    className="
                      w-full text-gray-600 mt-2
                      bg-transparent border-2 border-dashed border-gray-300
                      hover:border-gray-500 focus:border-gray-500
                      px-2 py-1 resize-none h-16
                      transition-colors
                    "
                    placeholder="Descripción"
                  />
                </>
              ) : (
                <>
                  <p className="text-4xl text-center mb-3">{regalo.emoji}</p>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {regalo.nombre}
                  </h3>
                  <p className="text-gray-600 text-center text-sm">{regalo.descripcion}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Enlace a lista de regalos */}
        {!editable && enlace && (
          <div className="text-center">
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-block px-8 py-3
                bg-[var(--color-primary)]
                text-white font-bold rounded-lg
                hover:shadow-lg transition-all
                transform hover:scale-105
              "
            >
              🎁 Ver Lista Completa
            </a>
          </div>
        )}

        {editable && (
          <div className="mt-6 p-4 50 rounded-lg text-sm text-blue-700">
            💡 Personaliza los regalos y añade un enlace a tu lista completa
          </div>
        )}
      </div>
    </section>
  );
};

export default GiftListSection;
