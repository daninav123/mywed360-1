import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Editor, Frame, Element } from '@craftjs/core';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CraftHeroSection } from '../components/web/craft/CraftHeroSection';
import { CraftStorySection } from '../components/web/craft/CraftStorySection';
import { CraftEventInfoSection } from '../components/web/craft/CraftEventInfoSection';
import { CraftPhotoGallerySection } from '../components/web/craft/CraftPhotoGallerySection';
import { CraftRSVPSection } from '../components/web/craft/CraftRSVPSection';
import { CraftLocationMapSection } from '../components/web/craft/CraftLocationMapSection';
import { CraftMenuSection } from '../components/web/craft/CraftMenuSection';
import { CraftTestimonialsSection } from '../components/web/craft/CraftTestimonialsSection';
import { CraftCountdownSection } from '../components/web/craft/CraftCountdownSection';
import { CraftDressCodeSection } from '../components/web/craft/CraftDressCodeSection';
import { CraftFAQSection } from '../components/web/craft/CraftFAQSection';
import { CraftGiftRegistrySection } from '../components/web/craft/CraftGiftRegistrySection';
import { CraftTravelInfoSection } from '../components/web/craft/CraftTravelInfoSection';
import { WeddingDataProvider } from '../context/WeddingDataContext';
import { getWebBySlug } from '../services/webBuilder/craftWebService';

/**
 * Página pública para visualizar webs publicadas
 */
const PublicWeb = () => {
  const { slug } = useParams();
  const [webData, setWebData] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPublicWeb = async () => {
      try {
        setLoading(true);
        console.log('🔍 Buscando web con slug:', slug);
        const data = await getWebBySlug(slug);

        console.log('📦 Datos de web recibidos:', data);

        if (!data) {
          console.log('❌ Web no encontrada');
          setError('Web no encontrada');
          return;
        }

        if (!data.published) {
          console.log('❌ Web no está publicada');
          setError('Esta web no está publicada');
          return;
        }

        console.log('✅ Web cargada correctamente');
        setWebData(data);

        // Cargar datos de la boda si existe weddingId
        if (data.weddingId) {
          console.log('🔍 Cargando datos de la boda:', data.weddingId);

          const weddingDoc = await getDoc(doc(db, 'weddings', data.weddingId));

          if (weddingDoc.exists()) {
            const weddingInfo = weddingDoc.data().weddingInfo || {};
            const webImages = weddingDoc.data().webImages || {};

            // Parsear nombres de la pareja
            const couple = String(weddingInfo.coupleName || '').trim();
            let brideName = '';
            let groomName = '';

            if (couple) {
              const parts = couple.split(/\s+y\s+|\s*&\s*|\s*\/\s*|\s*-\s*|,\s*/i).filter(Boolean);
              if (parts.length >= 2) {
                [brideName, groomName] = [parts[0], parts[1]];
              } else {
                brideName = couple;
              }
            }

            // Construir weddingData compatible con el contexto
            const wData = {
              pareja: {
                nombres: couple,
                nombre1: brideName,
                nombre2: groomName,
              },
              ceremonia: {
                fecha: weddingInfo.weddingDate || '',
                hora: weddingInfo.schedule?.split('/')[0]?.trim() || '',
                lugar: weddingInfo.celebrationPlace || '',
                direccion: weddingInfo.celebrationAddress || '',
              },
              recepcion: {
                hora: weddingInfo.schedule?.split('/')[1]?.trim() || '',
                lugar: weddingInfo.banquetPlace || '',
                direccion: weddingInfo.receptionAddress || '',
              },
              rsvp: {
                fechaLimite: weddingInfo.rsvpDeadline || '',
              },
              regalos: {
                cuenta: weddingInfo.giftAccount || '',
                mensajePersonalizado: weddingInfo.giftMessage || '',
              },
              viaje: {
                transporte: weddingInfo.transportation || '',
                autobuses: weddingInfo.busInfo || '',
                hoteles: weddingInfo.hotelInfo || '',
              },
              historia: {
                texto: weddingInfo.story || '',
              },
              menu: {
                descripcion: weddingInfo.menu || '',
              },
              codigoVestimenta: {
                tipo: weddingInfo.dressCode || '',
                detalles: weddingInfo.dressCodeDetails || '',
              },
              faqs: weddingInfo.faqs || '',
              estilo: {
                tema: weddingInfo.weddingStyle || 'Clásico',
                colores: weddingInfo.colorScheme || 'Blanco y dorado',
              },
              numInvitados: weddingInfo.numGuests || 0,
              adicional: weddingInfo.additionalInfo || '',
              notas: weddingInfo.importantInfo || '',
              heroImage: webImages?.heroImage || '',
              gallery: webImages?.gallery || [],
            };

            console.log('✅ Datos de la boda cargados:', {
              pareja: wData.pareja.nombres,
              fecha: wData.ceremonia.fecha,
              heroImage: !!wData.heroImage,
              galleryCount: wData.gallery.length,
            });

            setWeddingData(wData);
          } else {
            console.log('⚠️ No se encontró la boda, usando datos vacíos');
            setWeddingData({});
          }
        } else {
          console.log('⚠️ Web sin weddingId, usando datos vacíos');
          setWeddingData({});
        }
      } catch (err) {
        console.error('❌ Error cargando web:', err);
        setError('Error al cargar la web');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPublicWeb();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando web...</p>
        </div>
      </div>
    );
  }

  if (error || !webData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{error || 'Web no encontrada'}</h1>
          <p className="text-gray-600 mb-6">
            La web que buscas no existe o no está disponible públicamente.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Ir a inicio
          </a>
        </div>
      </div>
    );
  }

  const tema = webData.tema || {
    colores: {
      primario: '#9333EA',
      secundario: '#EC4899',
      acento: '#F59E0B',
      texto: '#1F2937',
      fondo: '#FFFFFF',
    },
  };

  return (
    <>
      <style>{`
        /* Ocultar contenedores de placeholders en vista pública */
        .public-web-container .text-gray-400 {
          display: none !important;
        }
      `}</style>
      <div
        className="min-h-screen public-web-container"
        style={{
          '--color-primario': tema.colores.primario,
          '--color-secundario': tema.colores.secundario,
          '--color-acento': tema.colores.acento,
          '--color-texto': tema.colores.texto,
          '--color-fondo': tema.colores.fondo,
        }}
      >
        <WeddingDataProvider weddingData={weddingData}>
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
              CraftDressCodeSection,
              CraftFAQSection,
              CraftGiftRegistrySection,
              CraftTravelInfoSection,
            }}
            enabled={false} // Modo solo lectura
          >
            <Frame data={webData.craftConfig} />
          </Editor>
        </WeddingDataProvider>

        {/* Footer discreto */}
        <footer className="bg-gray-50 border-t border-gray-200 py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-600">
              Creado con{' '}
              <a href="/" className="text-purple-600 hover:text-purple-700 font-semibold">
                MaLoveApp
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PublicWeb;
