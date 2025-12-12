import React, { useState } from 'react';
import { Check, Star, Sparkles, Heart, Zap } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

// Metadata de plantillas con categorías, ratings e iconos
const templateMetadata = {
  personalizada: {
    category: 'flexible',
    rating: 5,
    icon: '🎨',
    color: 'bg-[var(--color-primary)]',
    tags: ['Personalizable', 'Única'],
    popular: true,
  },
  romantica: {
    category: 'formal',
    rating: 5,
    icon: '💕',
    color: 'from-pink-400 to-rose-500',
    tags: ['Elegante', 'Clásica'],
    popular: true,
  },
  moderna: {
    category: 'modern',
    rating: 4,
    icon: '✨',
    color: 'from-blue-500 to-cyan-500',
    tags: ['Minimalista', 'Limpia'],
    popular: true,
  },
  vintage: {
    category: 'classic',
    rating: 4,
    icon: '🌸',
    color: 'from-amber-400 to-orange-500',
    tags: ['Retro', 'Nostálgica'],
  },
  playa: {
    category: 'themed',
    rating: 5,
    icon: '🏖️',
    color: 'from-cyan-400 to-blue-500',
    tags: ['Tropical', 'Relajada'],
    popular: true,
  },
  jardin: {
    category: 'themed',
    rating: 4,
    icon: '🌿',
    color: 'from-green-400 to-emerald-500',
    tags: ['Natural', 'Fresca'],
  },
};

const categories = [
  { id: 'all', label: 'Todas', icon: Sparkles },
  { id: 'popular', label: 'Populares', icon: Star },
  { id: 'formal', label: 'Formales', icon: Heart },
  { id: 'modern', label: 'Modernas', icon: Zap },
];

const WebTemplateGallery = ({ templates, selectedTemplate, onSelect }) => {
  const { t } = useTranslations();
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  if (!templates || !Object.keys(templates).length) return null;

  const filteredTemplates = Object.entries(templates).filter(([key]) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'popular') return templateMetadata[key]?.popular;
    return templateMetadata[key]?.category === activeCategory;
  });

  const getMetadata = (key) =>
    templateMetadata[key] || {
      category: 'flexible',
      rating: 4,
      icon: '🎨',
      color: 'from-gray-400 to-gray-500',
      tags: ['Personalizable'],
    };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">🎨</span>
          {t('websiteGenerator.gallery.title', 'Elige el estilo de tu web')}
        </h2>
        <p className="text-gray-600 mt-2">Selecciona la plantilla que mejor se adapte a tu boda</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-all
                ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <Icon size={16} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(([key, template]) => {
          const metadata = getMetadata(key);
          const isSelected = selectedTemplate === key;
          const isHovered = hoveredTemplate === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect?.(key)}
              onMouseEnter={() => setHoveredTemplate(key)}
              onMouseLeave={() => setHoveredTemplate(null)}
              className={`
                group relative text-left border-2 rounded-xl overflow-hidden
                transition-all duration-300 transform
                ${
                  isSelected
                    ? 'border-blue-500 shadow-2xl scale-105 ring-4 ring-blue-100'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:scale-102'
                }
              `}
            >
              {/* Image/Preview Area */}
              <div
                className={`
                relative h-48 bg-gradient-to-br ${metadata.color}
                flex items-center justify-center overflow-hidden
              `}
              >
                {/* Pattern Background */}
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                </div>

                {/* Icon */}
                <div
                  className={`
                  text-8xl transition-transform duration-300
                  ${isHovered ? 'scale-110' : 'scale-100'}
                `}
                >
                  {metadata.icon}
                </div>

                {/* Popular Badge */}
                {metadata.popular && (
                  <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star size={12} fill="currentColor" />
                    Popular
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={12} />
                    Seleccionada
                  </div>
                )}

                {/* Hover Overlay */}
                <div
                  className={`
                  absolute inset-0 bg-black transition-opacity duration-300
                  ${isHovered ? 'opacity-20' : 'opacity-0'}
                `}
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{template.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.desc}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < metadata.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({metadata.rating}/5)</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div
                className={`
                absolute bottom-4 right-4 transition-all duration-300
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
              >
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  {isSelected ? 'En uso' : 'Usar esta'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500">No hay plantillas en esta categoría</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 flex items-center gap-2">
          <Sparkles size={16} />
          <strong>💡 Consejo:</strong> Puedes personalizar cualquier plantilla con tu propio texto y
          colores
        </p>
      </div>
    </div>
  );
};

export default WebTemplateGallery;
