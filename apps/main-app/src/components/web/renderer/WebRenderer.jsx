import React from 'react';
import HeroSection from '../sections/HeroSection/HeroSection';
import StorySection from '../sections/StorySection/StorySection';
import EventInfoSection from '../sections/EventInfoSection/EventInfoSection';
import PhotoGallerySection from '../sections/PhotoGallerySection/PhotoGallerySection';
import RSVPFormSection from '../sections/RSVPFormSection/RSVPFormSection';
import MapSection from '../sections/MapSection/MapSection';
import TimelineSection from '../sections/TimelineSection/TimelineSection';
import GiftListSection from '../sections/GiftListSection/GiftListSection';

/**
 * WebRenderer - Renderiza una web completa basándose en su configuración JSON
 *
 * @param {Object} config - Configuración completa de la web
 * @param {boolean} editable - Si está en modo edición
 * @param {function} onSectionChange - Callback cuando cambia una sección
 */
const WebRenderer = ({ config, editable = false, onSectionChange }) => {
  console.log('🎨 WebRenderer renderizando con estilos:', {
    colores: config?.estilos?.colores,
    fuentes: config?.estilos?.fuentes,
    tema: config?.estilos?.tema,
  });

  if (!config || !config.secciones) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sin configuración</h2>
          <p className="text-gray-600">No hay una configuración válida para renderizar</p>
        </div>
      </div>
    );
  }

  // Mapeo de tipos de sección a componentes
  const sectionComponents = {
    hero: HeroSection,
    story: StorySection,
    eventInfo: EventInfoSection,
    photoGallery: PhotoGallerySection,
    rsvp: RSVPFormSection,
    map: MapSection,
    timeline: TimelineSection,
    giftList: GiftListSection,
  };

  // Ordenar secciones por orden
  const seccionesOrdenadas = [...config.secciones].sort((a, b) => a.orden - b.orden);

  const handleSectionChange = (seccionId, nuevaConfig) => {
    if (onSectionChange) {
      const nuevasSecciones = config.secciones.map((seccion) =>
        seccion.id === seccionId ? nuevaConfig : seccion
      );

      onSectionChange({
        ...config,
        secciones: nuevasSecciones,
        meta: {
          ...config.meta,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  };

  return (
    <div
      className="web-renderer"
      style={{
        fontFamily: config.estilos?.fuentes?.cuerpo || 'sans-serif',
        color: config.estilos?.colores?.texto || '#333',
        backgroundColor: config.estilos?.colores?.fondo || '#fff',
      }}
    >
      {seccionesOrdenadas.map((seccion) => {
        // Si la sección no es visible, no renderizarla
        if (!seccion.visible && !editable) return null;

        // Obtener el componente correspondiente
        const SectionComponent = sectionComponents[seccion.tipo];

        // Si no existe el componente, mostrar placeholder
        if (!SectionComponent) {
          return (
            <div
              key={seccion.id}
              className="bg-gray-100 border-2 border-dashed border-gray-300 p-8 text-center"
            >
              <div className="text-gray-500">
                <div className="text-4xl mb-2">🚧</div>
                <h3 className="text-lg font-semibold mb-1">
                  Sección "{seccion.tipo}" en desarrollo
                </h3>
                <p className="text-sm">Este componente estará disponible pronto</p>
                {editable && <div className="mt-4 text-xs text-gray-400">ID: {seccion.id}</div>}
              </div>
            </div>
          );
        }

        // Renderizar el componente
        return (
          <div
            key={seccion.id}
            className={`section-wrapper relative ${!seccion.visible ? 'opacity-30' : ''}`}
          >
            {/* Banner grande cuando está oculta */}
            {editable && !seccion.visible && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-20 border-4 border-red-500 border-dashed flex items-center justify-center z-40 pointer-events-none">
                <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-xl">
                  🚫 SECCIÓN OCULTA
                </div>
              </div>
            )}

            {editable && (
              <div
                className={`edit-indicator text-white text-xs py-1 px-3 inline-block ${!seccion.visible ? 'bg-red-600' : 'bg-blue-500'}`}
              >
                {seccion.tipo} #{seccion.orden}
                {!seccion.visible && ' (OCULTA)'}
              </div>
            )}

            <SectionComponent
              config={seccion}
              editable={editable && seccion.editable}
              onChange={(nuevaConfig) => handleSectionChange(seccion.id, nuevaConfig)}
              tema={config.estilos}
            />
          </div>
        );
      })}

      {/* Footer básico */}
      {!editable && (
        <footer className="bg-gray-900 text-white py-8 text-center">
          <p className="text-sm opacity-75">Creado con ❤️ por MaLoveApp</p>
        </footer>
      )}

      {/* Estilos globales del tema */}
      <style jsx="true" global="true">{`
        :root {
          --color-primario: ${config.estilos?.colores?.primario || '#FFE4E9'};
          --color-secundario: ${config.estilos?.colores?.secundario || '#FF9AB8'};
          --color-acento: ${config.estilos?.colores?.acento || '#FFD700'};
          --color-texto: ${config.estilos?.colores?.texto || '#333333'};
          --color-fondo: ${config.estilos?.colores?.fondo || '#FFFFFF'};

          --fuente-titulo: ${config.estilos?.fuentes?.titulo || 'serif'};
          --fuente-subtitulo: ${config.estilos?.fuentes?.subtitulo || 'sans-serif'};
          --fuente-cuerpo: ${config.estilos?.fuentes?.cuerpo || 'sans-serif'};
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: var(--fuente-titulo);
        }

        .section-wrapper {
          scroll-margin-top: 2rem;
        }

        .edit-indicator {
          position: sticky;
          top: 0;
          z-index: 50;
        }
      `}</style>
    </div>
  );
};

export default WebRenderer;
