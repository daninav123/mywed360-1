import React from 'react';
import { useNode } from '@craftjs/core';
import { useWeddingDataContext } from '../../../context/WeddingDataContext';

/**
 * CraftStorySection - Story Section adaptado para Craft.js
 */
export const CraftStorySection = ({ titulo, texto, foto1, foto2, foto3, foto4 }) => {
  const weddingData = useWeddingDataContext();
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((node) => ({
    selected: node.events.selected,
  }));

  // Usar datos de la boda si no se han proporcionado props
  const tituloFinal = titulo || '📖 Nuestra Historia';
  const textoFinal =
    texto || weddingData?.historia?.texto || 'Cuéntanos vuestra historia de amor...';

  const fotos = [foto1, foto2, foto3, foto4].filter(Boolean);

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      className={`
        py-16 px-4
        ${selected ? 'ring-4 ring-blue-500' : ''}
      `}
      style={{ backgroundColor: 'var(--color-fondo)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Título */}
        <h2
          className="text-4xl font-bold mb-8 text-center"
          style={{
            fontFamily: 'var(--fuente-titulo)',
            color: 'var(--color-primario)',
          }}
        >
          {tituloFinal}
        </h2>

        {/* Contenido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Texto */}
          <div>
            <p
              className="text-lg leading-relaxed whitespace-pre-wrap"
              style={{
                fontFamily: 'var(--fuente-texto)',
                color: 'var(--color-texto)',
              }}
            >
              {textoFinal}
            </p>
          </div>

          {/* Fotos */}
          {fotos.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {fotos.map((foto, idx) => (
                <div key={idx} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Settings para CraftStorySection
 */
export const CraftStorySettings = () => {
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">Historia</label>
        <textarea
          value={props.texto}
          onChange={(e) => setProp((props) => (props.texto = e.target.value))}
          rows={6}
          placeholder="Cuéntanos vuestra historia..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-gray-900 mb-3">Fotos</h4>

        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Foto {num}</label>
            <input
              type="url"
              value={props[`foto${num}`] || ''}
              onChange={(e) => setProp((props) => (props[`foto${num}`] = e.target.value))}
              placeholder="https://ejemplo.com/foto.jpg"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Configuración de Craft.js
CraftStorySection.craft = {
  props: {
    titulo: '📖 Nuestra Historia',
    texto: '', // Vacío para usar dato de weddingData
    foto1: null,
    foto2: null,
    foto3: null,
    foto4: null,
  },
  related: {
    settings: CraftStorySettings,
  },
  displayName: 'Story Section',
};
