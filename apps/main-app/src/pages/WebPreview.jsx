import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Editor, Frame, Element } from '@craftjs/core';
import { loadWeb } from '../services/webBuilder/craftWebService';
import { useAuth } from '../context/AuthContext';
import { TEMA_DEFAULT } from '../components/web/craft/themes';

// Importar todos los componentes Craft
import { CraftHeroSection } from '../components/web/craft/CraftHeroSection';
import { CraftStorySection } from '../components/web/craft/CraftStorySection';
import { CraftEventInfoSection } from '../components/web/craft/CraftEventInfoSection';
import { CraftPhotoGallerySection } from '../components/web/craft/CraftPhotoGallerySection';
import { CraftRSVPSection } from '../components/web/craft/CraftRSVPSection';
import { CraftLocationMapSection } from '../components/web/craft/CraftLocationMapSection';
import { CraftMenuSection } from '../components/web/craft/CraftMenuSection';
import { CraftTestimonialsSection } from '../components/web/craft/CraftTestimonialsSection';
import { CraftCountdownSection } from '../components/web/craft/CraftCountdownSection';
import { CraftFAQSection } from '../components/web/craft/CraftFAQSection';
import { CraftDressCodeSection } from '../components/web/craft/CraftDressCodeSection';
import { CraftGiftRegistrySection } from '../components/web/craft/CraftGiftRegistrySection';
import { CraftTravelInfoSection } from '../components/web/craft/CraftTravelInfoSection';

/**
 * Vista Previa de la Web - Muestra la web con todos los estilos aplicados
 */
export const WebPreview = () => {
  const [searchParams] = useSearchParams();
  const webId = searchParams.get('webId');
  const { currentUser } = useAuth();
  const [tema, setTema] = useState(TEMA_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarWeb = async () => {
      if (!webId || !currentUser) return;

      try {
        const webData = await loadWeb(currentUser.uid, webId);
        if (webData?.tema) {
          setTema(webData.tema);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error cargando web:', error);
        setLoading(false);
      }
    };

    cargarWeb();
  }, [webId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center " style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-lg font-semibold " style={{ color: 'var(--color-text)' }}>Cargando vista previa...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        // Aplicar el fondo aquí
        backgroundColor:
          tema?.fondo?.tipo === 'color' || !tema?.fondo?.tipo
            ? tema?.colores?.fondo || '#FFFFFF'
            : '#FFFFFF',
        backgroundImage:
          tema?.fondo?.tipo === 'imagen' && tema?.fondo?.imagen
            ? `url(${tema.fondo.imagen})`
            : tema?.fondo?.tipo === 'gradiente' && tema?.fondo?.gradiente
              ? tema.fondo.gradiente
              : tema?.fondo?.tipo === 'patron' && tema?.fondo?.patron
                ? `url("${tema.fondo.patron}")`
                : 'none',
        backgroundSize:
          tema?.fondo?.tipo === 'imagen'
            ? tema?.fondo?.ajuste || 'cover'
            : tema?.fondo?.tipo === 'patron'
              ? 'auto'
              : 'cover',
        backgroundRepeat:
          tema?.fondo?.tipo === 'imagen'
            ? tema?.fondo?.repeticion || 'no-repeat'
            : tema?.fondo?.tipo === 'patron'
              ? 'repeat'
              : 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        // CSS Variables para los componentes
        '--color-primario': tema?.colores?.primario || '#000000',
        '--color-secundario': tema?.colores?.secundario || '#333333',
        '--color-acento': tema?.colores?.acento || '#666666',
        '--color-fondo': tema?.colores?.fondo || '#FFFFFF',
        '--color-texto': tema?.colores?.texto || '#000000',
        '--color-texto-claro': tema?.colores?.textoClaro || '#FFFFFF',
        '--fuente-titulo': tema?.fuentes?.titulo || 'Arial',
        '--fuente-texto': tema?.fuentes?.texto || 'Arial',
      }}
    >
      {/* Barra superior con botón cerrar */}
      <div className="bg-black/80 backdrop-blur-sm text-white px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="font-semibold">👁️ Vista Previa</h1>
          <p className="text-xs text-gray-300">Así se verá tu web publicada</p>
        </div>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 /10 hover:bg-white/20 rounded-lg transition-colors" style={{ backgroundColor: 'var(--color-surface)' }}
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Contenido de la web */}
      <div className="container mx-auto py-8">
        <Editor
          resolver={{
            CraftHeroSection,
            CraftStorySection,
            CraftEventInfoSection,
            CraftPhotoGallerySection,
            CraftRSVPSection,
            CraftLocationMapSection,
            CraftMenuSection,
            CraftTestimonialsSection,
            CraftCountdownSection,
            CraftFAQSection,
            CraftDressCodeSection,
            CraftGiftRegistrySection,
            CraftTravelInfoSection,
          }}
          enabled={false}
        >
          <Frame>
            <Element canvas is="div" className="space-y-8">
              {/* El contenido se cargará desde Firebase */}
            </Element>
          </Frame>
        </Editor>
      </div>
    </div>
  );
};
