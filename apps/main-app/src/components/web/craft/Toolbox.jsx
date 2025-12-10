import React from 'react';
import { Element, useEditor } from '@craftjs/core';
import { CraftHeroSection } from './CraftHeroSection';
import { CraftStorySection } from './CraftStorySection';
import { CraftEventInfoSection } from './CraftEventInfoSection';
import { CraftPhotoGallerySection } from './CraftPhotoGallerySection';
import { CraftRSVPSection } from './CraftRSVPSection';
import { CraftLocationMapSection } from './CraftLocationMapSection';
import { CraftMenuSection } from './CraftMenuSection';
import { CraftTestimonialsSection } from './CraftTestimonialsSection';
import { CraftCountdownSection } from './CraftCountdownSection';
import { CraftFAQSection } from './CraftFAQSection';
import { CraftDressCodeSection } from './CraftDressCodeSection';
import { CraftGiftRegistrySection } from './CraftGiftRegistrySection';
import { CraftTravelInfoSection } from './CraftTravelInfoSection';

/**
 * Toolbox - Panel de componentes disponibles para arrastrar
 */
export const Toolbox = () => {
  const { connectors } = useEditor();

  const components = [
    {
      name: 'Hero Section',
      icon: '🎯',
      component: CraftHeroSection,
      description: 'Portada con título y countdown',
    },
    {
      name: 'Historia',
      icon: '📖',
      component: CraftStorySection,
      description: 'Cuenta vuestra historia',
    },
    {
      name: 'Información Evento',
      icon: '📅',
      component: CraftEventInfoSection,
      description: 'Ceremonia y recepción',
    },
    {
      name: 'Galería Fotos',
      icon: '📸',
      component: CraftPhotoGallerySection,
      description: 'Muestra tus fotos',
    },
    {
      name: 'Confirmación RSVP',
      icon: '📨',
      component: CraftRSVPSection,
      description: 'Invitados confirman asistencia',
    },
    {
      name: 'Ubicación y Mapa',
      icon: '📍',
      component: CraftLocationMapSection,
      description: 'Ubicación con Google Maps',
    },
    {
      name: 'Menú del Evento',
      icon: '🍽️',
      component: CraftMenuSection,
      description: 'Menú completo del banquete',
    },
    {
      name: 'Testimonios',
      icon: '💝',
      component: CraftTestimonialsSection,
      description: 'Mensajes de seres queridos',
    },
    {
      name: 'Cuenta Regresiva',
      icon: '⏰',
      component: CraftCountdownSection,
      description: 'Contador hasta el gran día',
    },
    {
      name: 'Preguntas Frecuentes',
      icon: '❓',
      component: CraftFAQSection,
      description: 'FAQ con acordeón',
    },
    {
      name: 'Código de Vestimenta',
      icon: '👔',
      component: CraftDressCodeSection,
      description: 'Dress code y sugerencias',
    },
    {
      name: 'Lista de Regalos',
      icon: '🎁',
      component: CraftGiftRegistrySection,
      description: 'Tiendas y regalos',
    },
    {
      name: 'Viaje y Alojamiento',
      icon: '✈️',
      component: CraftTravelInfoSection,
      description: 'Hoteles y transporte',
    },
  ];

  return (
    <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-bold text-gray-900 text-lg">📦 Componentes</h2>
        <p className="text-xs text-gray-600 mt-1">Arrastra para añadir</p>
      </div>

      <div className="p-3 space-y-2">
        {components.map((comp, idx) => (
          <div
            key={idx}
            ref={(ref) => connectors.create(ref, <Element canvas is={comp.component} />)}
            className="
              bg-gradient-to-r from-blue-50 to-purple-50
              border-2 border-gray-200 rounded-lg p-3
              cursor-move hover:border-blue-400 hover:shadow-md
              transition-all transform hover:scale-105
            "
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{comp.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{comp.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{comp.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-blue-50 text-xs text-blue-700">
        💡 <strong>Tip:</strong> Arrastra un componente al canvas para añadirlo
      </div>
    </div>
  );
};
