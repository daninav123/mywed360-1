import React from 'react';

/**
 * EventInfoSection - Información del evento (ceremonia y recepción)
 */
const EventInfoSection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { ceremonia, recepcion } = datos;

  const handleEventChange = (tipo, field, value) => {
    if (onChange) {
      onChange({
        ...config,
        datos: {
          ...datos,
          [tipo]: {
            ...datos[tipo],
            [field]: value,
          },
        },
      });
    }
  };

  const EventCard = ({ tipo, evento, titulo }) => (
    <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-pink-500">
      {editable ? (
        <>
          <input
            type="text"
            value={titulo}
            onChange={(e) => handleEventChange(tipo, 'titulo', e.target.value)}
            className="
              text-2xl font-bold text-gray-900 mb-4
              bg-transparent border-b-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-2 py-1 w-full
              transition-colors
            "
            placeholder="Título del evento"
          />
          <div className="space-y-3">
            <input
              type="text"
              value={evento.hora || ''}
              onChange={(e) => handleEventChange(tipo, 'hora', e.target.value)}
              className="
                w-full p-2 text-gray-700
                border-2 border-dashed border-gray-300
                hover:border-gray-500 focus:border-gray-500
                rounded px-3 py-2
                transition-colors
              "
              placeholder="Hora (ej: 16:00)"
            />
            <input
              type="text"
              value={evento.lugar || ''}
              onChange={(e) => handleEventChange(tipo, 'lugar', e.target.value)}
              className="
                w-full p-2 text-gray-700
                border-2 border-dashed border-gray-300
                hover:border-gray-500 focus:border-gray-500
                rounded px-3 py-2
                transition-colors
              "
              placeholder="Lugar"
            />
            <textarea
              value={evento.direccion || ''}
              onChange={(e) => handleEventChange(tipo, 'direccion', e.target.value)}
              className="
                w-full p-2 text-gray-700
                border-2 border-dashed border-gray-300
                hover:border-gray-500 focus:border-gray-500
                rounded px-3 py-2 resize-none h-20
                transition-colors
              "
              placeholder="Dirección"
            />
          </div>
        </>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{titulo}</h3>
          <div className="space-y-2 text-gray-700">
            {evento.hora && (
              <p className="flex items-center gap-2">
                <span className="text-2xl">🕐</span>
                <span>{evento.hora}</span>
              </p>
            )}
            {evento.lugar && (
              <p className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span>{evento.lugar}</span>
              </p>
            )}
            {evento.direccion && (
              <p className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <span className="text-sm">{evento.direccion}</span>
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          📅 Información del Evento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <EventCard tipo="ceremonia" evento={ceremonia} titulo={ceremonia.titulo || 'Ceremonia'} />
          <EventCard tipo="recepcion" evento={recepcion} titulo={recepcion.titulo || 'Recepción'} />
        </div>

        {editable && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 Edita los detalles de la ceremonia y recepción
          </div>
        )}
      </div>
    </section>
  );
};

export default EventInfoSection;
