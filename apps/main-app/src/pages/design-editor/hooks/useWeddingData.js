import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useWedding } from '../../../context/WeddingContext';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Hook para obtener datos reales de la boda para templates
 */
export const useWeddingData = () => {
  const { activeWedding } = useWedding();
  const { userProfile } = useAuth();
  const [weddingData, setWeddingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const weddingId = activeWedding || userProfile?.weddingId;

  useEffect(() => {
    const loadWeddingData = async () => {
      if (!weddingId) {
        console.log('❌ useWeddingData: No weddingId disponible');
        setWeddingData(getDefaultWeddingData());
        setLoading(false);
        return;
      }

      try {
        console.log('📡 useWeddingData: Cargando datos de boda:', weddingId);
        const wedSnap = await getDoc(doc(db, 'weddings', weddingId));
        if (wedSnap.exists()) {
          const data = wedSnap.data();
          const wi = data.weddingInfo || {};
          
          console.log('📋 useWeddingData: Datos crudos de Firebase:', {
            coupleName: wi.coupleName,
            weddingDate: wi.weddingDate,
            schedule: wi.schedule,
            celebrationPlace: wi.celebrationPlace,
            celebrationAddress: wi.celebrationAddress,
          });
          
          // Extraer nombres de forma robusta
          let bride = '[Novia]';
          let groom = '[Novio]';
          
          if (wi.coupleName) {
            // Intentar dividir por diferentes separadores
            let parts = [];
            if (wi.coupleName.includes('&')) {
              parts = wi.coupleName.split('&');
            } else if (wi.coupleName.includes(' y ')) {
              parts = wi.coupleName.split(' y ');
            } else if (wi.coupleName.includes(' Y ')) {
              parts = wi.coupleName.split(' Y ');
            }
            
            if (parts.length >= 2) {
              bride = parts[0].trim();
              groom = parts[1].trim();
              console.log('👰 Nombres extraídos:', {bride, groom, original: wi.coupleName});
            } else {
              // Si no hay separador, usar el nombre completo para ambos
              bride = wi.coupleName.trim();
              groom = wi.coupleName.trim();
              console.log('⚠️ No se encontró separador en coupleName:', wi.coupleName);
            }
          }
          
          const processedData = {
            // Nombres
            coupleName: wi.coupleName || '[Tus Nombres]',
            bride: bride,
            groom: groom,
            
            // Fecha y hora
            weddingDate: wi.weddingDate || '',
            formattedDate: formatDate(wi.weddingDate),
            schedule: wi.schedule || '[Hora]',
            year: wi.weddingDate ? new Date(wi.weddingDate).getFullYear() : new Date().getFullYear(),
            
            // Lugares
            ceremonyPlace: wi.celebrationPlace || '[Lugar de Ceremonia]',
            ceremonyAddress: wi.celebrationAddress || '[Dirección]',
            banquetPlace: wi.banquetPlace || wi.celebrationPlace || '[Lugar de Banquete]',
            banquetAddress: wi.receptionAddress || wi.celebrationAddress || '[Dirección]',
            
            // Estilo
            weddingStyle: wi.weddingStyle || 'Elegante',
            colorScheme: wi.colorScheme || 'Blanco y dorado',
            
            // Detalles
            dressCode: wi.dressCode || 'Formal',
            hashtag: wi.weddingHashtag || '#TuHashtag',
            instagram: wi.instagramHandle || '',
            
            // Info adicional
            story: wi.howWeMet || wi.story || '',
            rsvpDeadline: wi.rsvpDeadline || '',
            transportation: wi.transportation || '',
            
            // Coordenadas
            ceremonyGPS: wi.ceremonyGPS || '',
            banquetGPS: wi.banquetGPS || '',
            
            // Invitados
            numGuests: wi.numGuests || '',
          };
          
          console.log('✅ useWeddingData: Datos procesados:', processedData);
          setWeddingData(processedData);
        } else {
          console.log('⚠️ useWeddingData: Documento de boda no existe');
          setWeddingData(getDefaultWeddingData());
        }
      } catch (error) {
        console.error('❌ useWeddingData: Error cargando datos:', error);
        setWeddingData(getDefaultWeddingData());
      } finally {
        setLoading(false);
      }
    };

    loadWeddingData();
  }, [weddingId]);

  return { weddingData, loading };
};

// Formatear fecha a texto legible
const formatDate = (dateString) => {
  if (!dateString) return '15 de Junio 2024';
  
  try {
    // Si viene en formato DD/MM/YYYY, convertir a formato ISO
    let dateToUse = dateString;
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      dateToUse = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const date = new Date(dateToUse);
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.error('❌ formatDate: Fecha inválida:', dateString);
      return '15 de Junio 2024';
    }
    
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    console.log('📅 formatDate:', {input: dateString, output: `${day} de ${month} ${year}`});
    return `${day} de ${month} ${year}`;
  } catch (error) {
    console.error('❌ formatDate error:', error);
    return '15 de Junio 2024';
  }
};

// Datos por defecto si no hay datos de la boda
const getDefaultWeddingData = () => ({
  coupleName: '[Tus Nombres]',
  bride: '[Novia]',
  groom: '[Novio]',
  weddingDate: '',
  formattedDate: '[Fecha de la Boda]',
  schedule: '[Hora]',
  year: new Date().getFullYear(),
  ceremonyPlace: '[Lugar de Ceremonia]',
  ceremonyAddress: '[Dirección]',
  banquetPlace: '[Lugar de Banquete]',
  banquetAddress: '[Dirección]',
  weddingStyle: 'Elegante',
  colorScheme: 'Blanco y dorado',
  dressCode: 'Formal',
  hashtag: '#TuHashtag',
  instagram: '',
  story: '',
  rsvpDeadline: '',
  transportation: '',
  ceremonyGPS: '',
  banquetGPS: '',
  numGuests: '',
});
