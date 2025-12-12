import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de testimonios
 */
export const CraftTestimonialsSection = ({
  titulo = '💝 Palabras de Nuestros Seres Queridos',
  subtitulo = '',
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();

  // Usar datos de la boda si no se han proporcionado props
  const subtituloFinal = subtitulo || 'Lo que significan para nosotros';

  const testimonios = [
    {
      nombre: 'María González',
      relacion: 'Amiga de la infancia',
      foto: '👩',
      texto:
        'Ver a estos dos juntos es ver el amor verdadero. Desde que se conocieron, la felicidad brilla en sus ojos. ¡No puedo esperar para celebrar con ellos!',
      estrellas: 5,
    },
    {
      nombre: 'Carlos Martínez',
      relacion: 'Mejor amigo del novio',
      foto: '👨',
      texto:
        'Nunca había visto a mi mejor amigo tan feliz. Ella lo completa de una manera que solo el destino puede explicar. ¡Brindo por muchos años juntos!',
      estrellas: 5,
    },
    {
      nombre: 'Laura Sánchez',
      relacion: 'Hermana de la novia',
      foto: '👧',
      texto:
        'Mi hermana ha encontrado a su alma gemela. Ver cómo cuida de ella y la hace sonreír cada día me llena el corazón. ¡Son perfectos el uno para el otro!',
      estrellas: 5,
    },
  ];

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        backgroundColor: 'var(--color-fondo, #F9FAFB)',
        color: 'var(--color-texto, #1F2937)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--color-primario, #9333EA)' }}
          >
            {titulo}
          </h2>
          <p className="text-xl text-gray-600">{subtituloFinal}</p>
        </div>

        {/* Grid de testimonios */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonios.map((testimonio, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow relative"
            >
              {/* Comillas decorativas */}
              <div className="absolute top-4 left-4 text-6xl text-purple-100 leading-none">"</div>

              {/* Contenido */}
              <div className="relative z-10">
                {/* Foto y nombre */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-4xl">{testimonio.foto}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonio.nombre}</h4>
                    <p className="text-sm text-gray-600">{testimonio.relacion}</p>
                  </div>
                </div>

                {/* Estrellas */}
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonio.estrellas)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>

                {/* Texto */}
                <p className="text-gray-700 leading-relaxed italic">{testimonio.texto}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA para añadir testimonio */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white rounded-xl shadow-md px-8 py-6 max-w-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Quieres compartir tus palabras?
            </h3>
            <p className="text-gray-600 mb-4">Nos encantaría saber lo que significamos para ti</p>
            <button
              className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              onClick={() => alert('Función de añadir testimonio próximamente')}
            >
              💝 Compartir Mensaje
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftTestimonialsSection
 */
export const CraftTestimonialsSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props,
  }));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
        <input
          type="text"
          value={props.titulo}
          onChange={(e) => setProp((props) => (props.titulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Subtítulo</label>
        <input
          type="text"
          value={props.subtitulo}
          onChange={(e) => setProp((props) => (props.subtitulo = e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Próximamente:</strong> Podrás gestionar testimonios personalizados desde
          "Información de la Boda". Por ahora se muestran testimonios de ejemplo.
        </p>
      </div>
    </div>
  );
};

CraftTestimonialsSection.craft = {
  displayName: 'Testimonials Section',
  props: {
    titulo: '💝 Palabras de Nuestros Seres Queridos',
    subtitulo: 'Lo que significan para nosotros',
  },
  related: {
    settings: CraftTestimonialsSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Sección de Testimonios</h3>
        <p className="text-xs text-gray-600">
          Muestra mensajes y testimonios de amigos y familiares.
        </p>
      </div>
    ),
  },
};
