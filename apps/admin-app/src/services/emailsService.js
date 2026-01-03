import { auth } from '../firebaseConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Obtener token de autenticación de Firebase
 */
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  return await user.getIdToken();
};

/**
 * Obtener emails enviados/recibidos con un proveedor específico
 * @param {string} userId - ID del usuario
 * @param {string} providerEmail - Email del proveedor
 * @param {string} category - Categoría del servicio
 * @returns {Promise<Array>} Lista de emails ordenados por fecha
 */
export const getEmailsByProvider = async (userId, providerEmail, category = null) => {
  try {
    if (!providerEmail) {
      console.log('[emailsService] No provider email provided');
      return [];
    }

    console.log('[emailsService] 🔍 Buscando emails para:', { userId, providerEmail });
    console.log('[emailsService] API_URL:', API_URL);
    
    const token = await getAuthToken();
    console.log('[emailsService] ✅ Token obtenido');
    
    const providerLower = providerEmail?.toLowerCase();

    // Obtener emails desde el backend - probar inbox y sent
    const folders = ['inbox', 'sent'];
    const allMails = [];

    for (const folder of folders) {
      try {
        const url = `${API_URL}/api/mail?folder=${folder}&limit=200`;
        console.log(`[emailsService] 📡 Fetching ${url}`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`[emailsService] Response ${folder}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`[emailsService] ❌ Error ${folder}:`, errorText);
          continue;
        }

        const data = await response.json();
        console.log(`[emailsService] Data structure:`, Object.keys(data));
        
        const mails = data.mails || data.items || [];
        console.log(`[emailsService] ✉️ ${folder}: ${mails.length} emails`);
        
        if (mails.length > 0) {
          console.log(`[emailsService] Ejemplo email:`, {
            to: mails[0].to,
            from: mails[0].from,
            subject: mails[0].subject
          });
        }
        
        allMails.push(...mails);
      } catch (err) {
        console.error(`[emailsService] 💥 Error fetch ${folder}:`, err);
      }
    }

    console.log('[emailsService] 📊 Total emails obtenidos:', allMails.length);

    // Filtrar por email del proveedor
    const filtered = allMails.filter(email => {
      const toLower = email.to?.toLowerCase() || '';
      const fromLower = email.from?.toLowerCase() || '';
      
      const isToProvider = toLower.includes(providerLower);
      const isFromProvider = fromLower.includes(providerLower);
      
      if (isToProvider || isFromProvider) {
        console.log('[emailsService] ✅ Match encontrado:', {
          to: email.to,
          from: email.from,
          subject: email.subject,
          isToProvider,
          isFromProvider
        });
      }
      
      return isToProvider || isFromProvider;
    });

    console.log('[emailsService] 🎯 Emails filtrados para proveedor:', filtered.length);

    // Mapear a formato consistente
    const emails = filtered.map(email => {
      const toLower = email.to?.toLowerCase() || '';
      const isToProvider = toLower.includes(providerLower);
      
      return {
        id: email.id,
        ...email,
        direction: isToProvider ? 'sent' : 'received',
        createdAt: email.date || email.createdAt,
      };
    });

    // Ordenar por fecha
    const sorted = emails.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    console.log('[emailsService] 📬 Retornando:', sorted.length, 'emails');
    return sorted;

  } catch (error) {
    console.error('[emailsService] 💥 Error crítico:', error);
    return [];
  }
};

/**
 * Obtener emails de una solicitud de presupuesto específica
 * @param {string} quoteRequestId - ID de la solicitud
 * @returns {Promise<Array>} Lista de emails relacionados
 */
export const getEmailsByQuoteRequest = async (quoteRequestId) => {
  try {
    const q = query(
      collection(db, 'mails'),
      where('metadata.quoteRequestId', '==', quoteRequestId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const emails = [];

    snapshot.forEach(doc => {
      emails.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return emails;
  } catch (error) {
    console.error('Error obteniendo emails por solicitud:', error);
    return [];
  }
};
