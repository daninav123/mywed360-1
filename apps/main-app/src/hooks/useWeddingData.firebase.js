import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from './useAuth';
import { useWedding } from '../context/WeddingContext';

/**
 * Hook para obtener todos los datos de la boda actual
 * Útil para rellenar componentes con información real
 */
export const useWeddingData = () => {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWeddingData = async () => {
      if (!currentUser?.uid || !activeWedding) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Cargar datos del usuario
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        // Cargar datos de la boda
        const weddingDoc = await getDoc(doc(db, 'weddings', activeWedding));
        const weddingInfo = weddingDoc.exists() ? weddingDoc.data()?.weddingInfo : {};
        const webImages = weddingDoc.exists() ? weddingDoc.data()?.webImages : {};

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

        // Construir objeto de datos completo
        const data = {
          // Información de la pareja
          pareja: {
            nombres: couple,
            nombre1: brideName,
            nombre2: groomName,
          },

          // Información de ceremonia
          ceremonia: {
            fecha: weddingInfo.weddingDate || '',
            hora: weddingInfo.schedule?.split('/')[0]?.trim() || weddingInfo.ceremonyTime || '',
            lugar: weddingInfo.celebrationPlace || '',
            direccion: weddingInfo.celebrationAddress || '',
          },

          // Información de recepción
          recepcion: {
            hora: weddingInfo.schedule?.split('/')[1]?.trim() || weddingInfo.receptionTime || '',
            lugar: weddingInfo.banquetPlace || '',
            direccion: weddingInfo.receptionAddress || '',
          },

          // Contacto
          contacto: {
            email: userData?.account?.email || userData?.email || '',
            telefono: userData?.account?.whatsNumber || userData?.phone || '',
            whatsapp: userData?.account?.whatsNumber || userData?.phone || '',
          },

          // RSVP
          rsvp: {
            fechaLimite: weddingInfo.rsvpDeadline || '',
          },

          // Regalos
          regalos: {
            cuenta: weddingInfo.giftAccount || '',
            mensajePersonalizado: weddingInfo.giftMessage || '',
          },

          // Transporte y alojamiento
          viaje: {
            transporte: weddingInfo.transportation || '',
            alojamiento: weddingInfo.lodging || '',
            autobuses: weddingInfo.busInfo || '',
            hoteles: weddingInfo.hotelInfo || '',
          },

          // Historia
          historia: {
            texto: weddingInfo.story || '',
          },

          // Menú
          menu: {
            descripcion: weddingInfo.menu || '',
          },

          // Código de vestimenta
          codigoVestimenta: {
            tipo: weddingInfo.dressCode || '',
            detalles: weddingInfo.dressCodeDetails || '',
          },

          // FAQs
          faqs: weddingInfo.faqs || '',

          // Estilo
          estilo: {
            tema: weddingInfo.weddingStyle || 'Clásico',
            colores: weddingInfo.colorScheme || 'Blanco y dorado',
          },

          // Números
          numInvitados: weddingInfo.numGuests || 0,

          // Información adicional
          adicional: weddingInfo.additionalInfo || '',
          notas: weddingInfo.importantInfo || '',

          // Imágenes
          heroImage: webImages?.heroImage || '',
          gallery: webImages?.gallery || [],
        };

        setWeddingData(data);
        setError(null);
      } catch (err) {
        console.error('Error cargando datos de la boda:', err);
        setError(err.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    loadWeddingData();
  }, [currentUser, activeWedding]);

  return {
    weddingData,
    loading,
    error,
    hasData: !!weddingData,
  };
};
