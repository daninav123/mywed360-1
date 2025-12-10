import React from 'react';

/**
 * FontSelectorPanel - Panel de selección de fuentes
 */
const FontSelectorPanel = ({ config, onChange }) => {
  const { estilos } = config;
  const { fuentes } = estilos;

  const fontFamilies = [
    { name: 'Playfair Display', category: 'Serif elegante', preview: 'Playfair Display' },
    { name: 'Montserrat', category: 'Sans-serif moderno', preview: 'Montserrat' },
    { name: 'Lato', category: 'Sans-serif limpio', preview: 'Lato' },
    { name: 'Georgia', category: 'Serif clásico', preview: 'Georgia' },
    { name: 'Raleway', category: 'Sans-serif refinado', preview: 'Raleway' },
    { name: 'Merriweather', category: 'Serif vintage', preview: 'Merriweather' },
    { name: 'Open Sans', category: 'Sans-serif versátil', preview: 'Open Sans' },
    { name: 'Cormorant Garamond', category: 'Serif elegante', preview: 'Cormorant Garamond' },
    { name: 'Pacifico', category: 'Display playero', preview: 'Pacifico' },
    { name: 'Roboto', category: 'Sans-serif moderno', preview: 'Roboto' },
  ];

  const handleFontChange = (type, fontName) => {
    console.log('✍️ Cambiando fuente:', { type, fontName });

    const nuevaConfig = {
      ...config,
      estilos: {
        ...estilos,
        fuentes: {
          ...fuentes,
          [type]: fontName,
        },
      },
      meta: {
        ...config.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    console.log('📤 Enviando config con nueva fuente:', {
      type,
      fontName,
      todasLasFuentes: nuevaConfig.estilos.fuentes,
    });

    onChange(nuevaConfig);
  };

  const FontTypeSelector = ({ type, label, currentFont }) => (
    <div className="bg-gray-50 rounded-lg p-6 mb-6">
      <h4 className="font-semibold text-gray-900 mb-4">{label}</h4>

      <div className="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200">
        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: currentFont }}>
          Ejemplo de {label}
        </p>
        <p className="text-sm text-gray-600 mt-2">Fuente actual: {currentFont}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fontFamilies.map((font) => (
          <button
            key={`${type}-${font.name}`}
            onClick={() => handleFontChange(type, font.name)}
            className={`
              p-4 rounded-lg border-2 transition-all transform hover:scale-105
              ${
                currentFont === font.name
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-300 bg-white hover:border-gray-500'
              }
            `}
          >
            <p className="font-bold text-lg mb-1" style={{ fontFamily: font.name }}>
              {font.preview}
            </p>
            <p className="text-xs text-gray-600">{font.category}</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">✍️ Personalizar Fuentes</h3>

      <FontTypeSelector type="titulo" label="Fuente de Títulos" currentFont={fuentes.titulo} />

      <FontTypeSelector
        type="subtitulo"
        label="Fuente de Subtítulos"
        currentFont={fuentes.subtitulo}
      />

      <FontTypeSelector type="cuerpo" label="Fuente de Cuerpo" currentFont={fuentes.cuerpo} />

      {/* Presets */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="font-semibold text-gray-900 mb-4">📋 Combinaciones Predefinidas</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              name: 'Clásico',
              fonts: { titulo: 'Playfair Display', subtitulo: 'Georgia', cuerpo: 'Georgia' },
            },
            {
              name: 'Moderno',
              fonts: { titulo: 'Montserrat', subtitulo: 'Roboto', cuerpo: 'Roboto' },
            },
            {
              name: 'Elegante',
              fonts: { titulo: 'Cormorant Garamond', subtitulo: 'Raleway', cuerpo: 'Raleway' },
            },
            {
              name: 'Playero',
              fonts: { titulo: 'Pacifico', subtitulo: 'Open Sans', cuerpo: 'Open Sans' },
            },
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                onChange({
                  ...config,
                  estilos: {
                    ...estilos,
                    fuentes: preset.fonts,
                  },
                })
              }
              className="
                p-4 rounded-lg border-2 border-gray-300 hover:border-gray-500
                transition-all text-left
              "
            >
              <p className="font-semibold text-gray-900">{preset.name}</p>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: preset.fonts.titulo }}>
                {preset.fonts.titulo} / {preset.fonts.cuerpo}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FontSelectorPanel;
