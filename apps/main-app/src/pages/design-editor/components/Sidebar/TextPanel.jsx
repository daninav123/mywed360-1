import React, { useState } from 'react';
import { Type, Heading1, Heading2, AlignLeft, Sparkles } from 'lucide-react';

// Fuentes organizadas por categoría
const FONT_CATEGORIES = {
  script: {
    label: 'Caligráficas',
    fonts: [
      'Great Vibes',
      'Dancing Script',
      'Allura',
      'Alex Brush',
      'Sacramento',
      'Parisienne',
      'Tangerine',
      'Italianno',
      'Pinyon Script',
      'Satisfy',
    ]
  },
  serif: {
    label: 'Elegantes (Serif)',
    fonts: [
      'Playfair Display',
      'Cormorant',
      'Libre Baskerville',
      'Crimson Text',
      'EB Garamond',
      'Lora',
    ]
  },
  sansSerif: {
    label: 'Modernas (Sans-serif)',
    fonts: [
      'Lato',
      'Montserrat',
      'Raleway',
      'Open Sans',
      'Poppins',
      'Nunito',
    ]
  }
};

const textStyles = [
  {
    id: 'names',
    label: 'Nombres (Script)',
    icon: Sparkles,
    props: { fontSize: 72, fontFamily: 'Great Vibes', text: 'Ana & Carlos' },
  },
  {
    id: 'heading',
    label: 'Título Elegante',
    icon: Heading1,
    props: { fontSize: 48, fontFamily: 'Playfair Display', text: 'Nuestra Boda' },
  },
  {
    id: 'subheading',
    label: 'Subtítulo',
    icon: Heading2,
    props: { fontSize: 32, fontFamily: 'Cormorant', text: '15 de Junio, 2025' },
  },
  {
    id: 'body',
    label: 'Texto de cuerpo',
    icon: AlignLeft,
    props: { fontSize: 18, fontFamily: 'Lato', text: 'Celebra con nosotros' },
  },
  {
    id: 'custom',
    label: 'Texto personalizado',
    icon: Type,
    props: { fontSize: 24, fontFamily: 'Lato', text: 'Escribe aquí' },
  },
];

export default function TextPanel({ onAdd }) {
  const [selectedCategory, setSelectedCategory] = useState('script');
  
  return (
    <div className="p-4 space-y-4" data-testid="text-panel">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold " style={{ color: 'var(--color-text)' }}>Añadir Texto</h3>
        <p className="text-xs " style={{ color: 'var(--color-text-secondary)' }}>
          Haz clic en un estilo para añadirlo al canvas
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onAdd({ type: 'text', text: 'Nuevo texto', fontSize: 32, fontFamily: 'Lato' })}
          className="w-full px-4 py-3  text-white rounded-lg hover:bg-blue-700 font-medium" style={{ backgroundColor: 'var(--color-primary)' }}
          data-testid="add-text-button"
        >
          + Añadir Texto
        </button>
        
        <div className="text-sm font-medium  mt-4 mb-2" style={{ color: 'var(--color-text)' }}>Estilos de boda:</div>
        {textStyles.map((style) => {
          const Icon = style.icon;
          return (
            <button
              key={style.id}
              onClick={() => onAdd({ type: 'text', ...style.props })}
              className="w-full flex items-center gap-3 p-3 text-left  rounded-lg hover: transition-colors group" style={{ backgroundColor: 'var(--color-bg)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              data-testid={`text-style-button-${style.id}`}
            >
              <div className="flex-shrink-0 w-10 h-10  rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover: transition-colors" style={{ color: 'var(--color-primary)' }} style={{ backgroundColor: 'var(--color-surface)' }}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium " style={{ color: 'var(--color-text)' }}>{style.label}</div>
                <div className="text-xs  truncate" style={{ color: 'var(--color-muted)' }} style={{ fontFamily: style.props.fontFamily }}>
                  {style.props.fontFamily}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Categorías de fuentes */}
      <div className="pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-xs font-semibold  mb-3" style={{ color: 'var(--color-text)' }}>Todas las fuentes</div>
        
        {/* Tabs de categorías */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
          {Object.entries(FONT_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        
        {/* Grid de fuentes */}
        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {FONT_CATEGORIES[selectedCategory].fonts.map((font) => (
            <button
              key={font}
              onClick={() => onAdd({ type: 'text', fontSize: 48, fontFamily: font, text: 'Aa' })}
              className="p-3  rounded-lg hover: transition-colors text-center" style={{ backgroundColor: 'var(--color-bg)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              title={font}
            >
              <div className="text-2xl mb-1" style={{ fontFamily: font }}>
                Aa
              </div>
              <div className="text-[10px]  truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {font}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
