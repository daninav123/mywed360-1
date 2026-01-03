import React, { useState } from 'react';

/**
 * RSVPFormSection - Formulario de confirmación de asistencia
 */
const RSVPFormSection = ({ config, editable = false, onChange }) => {
  const { datos } = config;
  const { titulo, subtitulo, email } = datos;
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asistencia: 'si',
    acompanantes: 0,
    mensaje: '',
  });

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

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editable) {
      console.log('RSVP Enviado:', formData);
      alert('¡Gracias por confirmar tu asistencia!');
      setFormData({
        nombre: '',
        email: '',
        asistencia: 'si',
        acompanantes: 0,
        mensaje: '',
      });
    }
  };

  return (
    <section className="py-16 px-4 bg-[var(--color-primary-10)]">
      <div className="max-w-2xl mx-auto">
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
            placeholder="Confirma tu asistencia"
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleFormChange('nombre', e.target.value)}
                disabled={editable}
                className="
                  w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                  focus:border-pink-500 focus:outline-none
                  disabled:bg-gray-100
                "
                placeholder="Tu nombre"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                disabled={editable}
                className="
                  w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                  focus:border-pink-500 focus:outline-none
                  disabled:bg-gray-100
                "
                placeholder="tu@email.com"
                required
              />
            </div>

            {/* Asistencia */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">¿Asistirás?</label>
              <select
                value={formData.asistencia}
                onChange={(e) => handleFormChange('asistencia', e.target.value)}
                disabled={editable}
                className="
                  w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                  focus:border-pink-500 focus:outline-none
                  disabled:bg-gray-100
                "
              >
                <option value="si">Sí, asistiré</option>
                <option value="no">No podré asistir</option>
                <option value="quizas">Aún no sé</option>
              </select>
            </div>

            {/* Acompañantes */}
            {formData.asistencia === 'si' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Cuántos acompañantes?
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.acompanantes}
                  onChange={(e) => handleFormChange('acompanantes', parseInt(e.target.value))}
                  disabled={editable}
                  className="
                    w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                    focus:border-pink-500 focus:outline-none
                    disabled:bg-gray-100
                  "
                />
              </div>
            )}

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje (opcional)
              </label>
              <textarea
                value={formData.mensaje}
                onChange={(e) => handleFormChange('mensaje', e.target.value)}
                disabled={editable}
                className="
                  w-full px-4 py-2 border-2 border-gray-300 rounded-lg
                  focus:border-pink-500 focus:outline-none
                  disabled:bg-gray-100 resize-none h-24
                "
                placeholder="Cuéntanos algo..."
              />
            </div>

            {/* Botón */}
            {!editable && (
              <button
                type="submit"
                className="
                  w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-lg
                  hover:shadow-lg transition-all
                  transform hover:scale-105
                "
              >
                ✨ Confirmar Asistencia
              </button>
            )}
          </div>
        </form>

        {editable && (
          <div className="mt-6 p-4 50 rounded-lg text-sm text-blue-700">
            💡 Este es un preview del formulario. Los usuarios podrán rellenarlo en la web
            publicada.
          </div>
        )}
      </div>
    </section>
  );
};

export default RSVPFormSection;
