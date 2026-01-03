import React from 'react';

/**
 * MapSection - Sección con mapa de ubicación
 */
const MapSection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { titulo, direccion, coordenadas } = datos;

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

  const mapUrl = direccion
    ? `https://maps.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`
    : null;

  return (
    <section className="py-16 px-4 bg-gray-50">
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
            placeholder="Ubicación"
          />
        ) : (
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">{titulo}</h2>
        )}

        {/* Dirección */}
        {editable ? (
          <textarea
            value={direccion}
            onChange={(e) => handleContentChange('direccion', e.target.value)}
            className="
              w-full p-4 text-gray-700
              border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              rounded-lg resize-none h-20 mb-6
              transition-colors
            "
            placeholder="Dirección completa"
          />
        ) : (
          <p className="text-center text-gray-600 mb-8 text-lg">{direccion}</p>
        )}

        {/* Mapa */}
        {mapUrl && !editable ? (
          <div className="rounded-lg overflow-hidden shadow-lg">
            <iframe
              title="Ubicación"
              src={mapUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div
            className="
            w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center
            border-2 border-dashed border-gray-300
          "
          >
            {editable ? (
              <div className="text-center text-gray-500">
                <p className="text-4xl mb-2">🗺️</p>
                <p>El mapa se mostrará cuando publiques</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-4xl mb-2">📍</p>
                <p>Añade una dirección para ver el mapa</p>
              </div>
            )}
          </div>
        )}

        {editable && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 Añade la dirección completa y el mapa se generará automáticamente
          </div>
        )}
      </div>
    </section>
  );
};

export default MapSection;
