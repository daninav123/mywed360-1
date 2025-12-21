import React, { useState } from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * Sección de preguntas frecuentes (FAQ)
 */
export const CraftFAQSection = ({
  titulo = '❓ Preguntas Frecuentes',
  subtitulo = 'Todo lo que necesitas saber',
  faqsTexto = '',
}) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
  } = useNode();
  const [preguntaAbierta, setPreguntaAbierta] = useState(null);

  // Obtener FAQs de weddingData o prop
  const faqsTextoFinal = faqsTexto || weddingData?.faqs || '';

  // Usar FAQs de la boda si existen, sino usar preguntas por defecto
  const preguntasDefault = [
    {
      pregunta: '¿Cuál es el código de vestimenta?',
      respuesta:
        'El código de vestimenta es formal/elegante. Recomendamos traje para los caballeros y vestido de cóctel para las damas. Por favor evita usar blanco, está reservado para la novia.',
    },
    {
      pregunta: '¿Puedo llevar acompañante?',
      respuesta:
        'Verifica tu invitación para saber si incluye un acompañante. Si tienes dudas, no dudes en contactarnos directamente.',
    },
    {
      pregunta: '¿Habrá estacionamiento disponible?',
      respuesta:
        'Sí, el lugar cuenta con estacionamiento gratuito para todos los invitados. También hay servicio de valet parking disponible.',
    },
    {
      pregunta: '¿La celebración es para todas las edades?',
      respuesta:
        'Amamos a los niños, pero esta ocasión será solo para adultos. Esperamos que esto les dé la oportunidad de relajarse y disfrutar de la noche.',
    },
    {
      pregunta: '¿Cuándo debo confirmar mi asistencia?',
      respuesta:
        'Por favor confirma tu asistencia antes del [fecha]. Puedes hacerlo a través del formulario RSVP en esta web o contactándonos directamente.',
    },
    {
      pregunta: '¿Hay alguna restricción alimentaria que deba informar?',
      respuesta:
        'Por favor, infórmanos sobre cualquier alergia o restricción alimentaria al momento de confirmar tu asistencia en el formulario RSVP.',
    },
    {
      pregunta: '¿Dónde puedo hospedarme?',
      respuesta:
        'Tenemos bloques de habitaciones reservadas en varios hoteles cercanos. Consulta la sección de alojamiento para más detalles y códigos de descuento.',
    },
    {
      pregunta: '¿Habrá transporte desde el hotel?',
      respuesta:
        'Sí, organizaremos transporte desde los hoteles principales hacia el lugar de la ceremonia y de regreso. Los detalles se compartirán más cerca de la fecha.',
    },
  ];

  // Usar FAQs de la boda si existen, sino usar por defecto
  const preguntas =
    weddingData?.faqs && Array.isArray(weddingData.faqs) && weddingData.faqs.length > 0
      ? weddingData.faqs
      : preguntasDefault;

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className="py-16 px-4"
      style={{
        backgroundColor: 'var(--color-fondo)',
        color: 'var(--color-texto)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              color: 'var(--color-primario)',
              fontFamily: 'var(--fuente-titulo, inherit)',
            }}
          >
            {titulo}
          </h2>
          <p className="text-xl text-gray-600">{subtitulo}</p>
        </div>

        {/* FAQs personalizadas de texto */}
        {faqsTextoFinal && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{faqsTextoFinal}</p>
          </div>
        )}

        {/* Acordeón de preguntas */}
        {!faqsTextoFinal && (
          <div className="space-y-4">
            {preguntas.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
              >
                <button
                  onClick={() => setPreguntaAbierta(preguntaAbierta === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-purple-50 transition-colors"
                >
                  <span
                    className="font-semibold text-lg flex-1"
                    style={{ color: 'var(--color-secundario)' }}
                  >
                    {item.pregunta}
                  </span>
                  <span
                    className="text-2xl flex-shrink-0 transform transition-transform duration-300"
                    style={{
                      color: 'var(--color-primario)',
                      transform: preguntaAbierta === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    preguntaAbierta === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-2">
                    <p
                      className="text-gray-600 leading-relaxed"
                      style={{ fontFamily: 'var(--fuente-texto, inherit)' }}
                    >
                      {item.respuesta}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA de contacto */}
        <div className="mt-12 text-center bg-white rounded-xl shadow-md px-8 py-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">¿Tienes más preguntas?</h3>
          <p className="text-gray-600 mb-4">No dudes en contactarnos directamente</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:contacto@ejemplo.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              📧 Enviar Email
            </a>
            <a
              href="https://wa.me/1234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftFAQSection
 */
export const CraftFAQSettings = () => {
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

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          FAQs personalizadas (opcional)
        </label>
        <textarea
          value={props.faqsTexto}
          onChange={(e) => setProp((props) => (props.faqsTexto = e.target.value))}
          placeholder="Deja vacío para usar las FAQs del perfil o escribe aquí..."
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si está vacío, usará las FAQs configuradas en "Información de la Boda"
        </p>
      </div>
    </div>
  );
};

CraftFAQSection.craft = {
  displayName: 'FAQ Section',
  props: {
    titulo: '❓ Preguntas Frecuentes',
    subtitulo: 'Todo lo que necesitas saber',
    faqsTexto: '', // Vacío para usar dato de weddingData
  },
  related: {
    settings: CraftFAQSettings,
    toolbar: () => (
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">Preguntas Frecuentes</h3>
        <p className="text-xs text-gray-600">
          Sección de preguntas y respuestas comunes sobre la boda con acordeón interactivo.
        </p>
      </div>
    ),
  },
};
