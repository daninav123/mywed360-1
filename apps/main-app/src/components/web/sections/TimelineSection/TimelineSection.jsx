import React from 'react';

/**
 * TimelineSection - Timeline del día de la boda
 */
const TimelineSection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { titulo, eventos } = datos;

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

  const handleEventChange = (idx, field, value) => {
    const nuevosEventos = [...(eventos || [])];
    nuevosEventos[idx] = {
      ...nuevosEventos[idx],
      [field]: value,
    };
    handleContentChange('eventos', nuevosEventos);
  };

  const eventosDefault = eventos || [
    { hora: '16:00', titulo: 'Ceremonia', descripcion: '' },
    { hora: '17:30', titulo: 'Cóctel', descripcion: '' },
    { hora: '19:00', titulo: 'Cena', descripcion: '' },
    { hora: '22:00', titulo: 'Baile', descripcion: '' },
  ];

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
              text-4xl font-bold text-gray-900 mb-12 text-center
              bg-transparent border-2 border-dashed border-gray-300
              hover:border-gray-500 focus:border-gray-500
              px-4 py-2 rounded-lg w-full
              transition-colors
            "
            placeholder="Timeline del Día"
          />
        ) : (
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">{titulo}</h2>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Línea vertical */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-pink-300 to-purple-300" />

          {/* Eventos */}
          <div className="space-y-8">
            {eventosDefault.map((evento, idx) => (
              <div
                key={idx}
                className={`flex ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Contenido */}
                <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                  <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    {editable ? (
                      <>
                        <input
                          type="time"
                          value={evento.hora}
                          onChange={(e) => handleEventChange(idx, 'hora', e.target.value)}
                          className="
                            text-lg font-bold text-pink-600 mb-2
                            bg-transparent border-b-2 border-dashed border-gray-300
                            hover:border-gray-500 focus:border-gray-500
                            px-2 py-1
                            transition-colors
                          "
                        />
                        <input
                          type="text"
                          value={evento.titulo}
                          onChange={(e) => handleEventChange(idx, 'titulo', e.target.value)}
                          className="
                            text-xl font-bold text-gray-900 mb-2
                            bg-transparent border-b-2 border-dashed border-gray-300
                            hover:border-gray-500 focus:border-gray-500
                            px-2 py-1 w-full
                            transition-colors
                          "
                          placeholder="Título del evento"
                        />
                        <textarea
                          value={evento.descripcion || ''}
                          onChange={(e) => handleEventChange(idx, 'descripcion', e.target.value)}
                          className="
                            w-full text-gray-600 mt-2
                            bg-transparent border-2 border-dashed border-gray-300
                            hover:border-gray-500 focus:border-gray-500
                            px-2 py-1 resize-none h-16
                            transition-colors
                          "
                          placeholder="Descripción (opcional)"
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-pink-600 mb-1">{evento.hora}</p>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{evento.titulo}</h3>
                        {evento.descripcion && (
                          <p className="text-gray-600">{evento.descripcion}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Punto en la línea */}
                <div className="hidden md:flex w-0 justify-center">
                  <div className="w-4 h-4 bg-pink-500 rounded-full border-4 border-white shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {editable && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            💡 Edita los horarios y eventos del día
          </div>
        )}
      </div>
    </section>
  );
};

export default TimelineSection;
