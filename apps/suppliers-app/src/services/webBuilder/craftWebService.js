import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Servicio para gestionar webs creadas con Craft.js en Firebase
 */

const COLLECTION_NAME = 'craft-webs';

/**
 * Guardar o actualizar una web
 */
export const saveWeb = async (userId, webId, data, weddingId = null) => {
  try {
    console.log('💾 saveWeb - Iniciando guardado');
    console.log('📋 userId:', userId);
    console.log('📋 webId:', webId);
    console.log('📋 weddingId:', weddingId);
    console.log('📋 data recibida:', {
      slug: data.slug,
      published: data.published,
      tema: data.tema ? 'presente' : 'ausente',
      craftConfig: data.craftConfig ? 'presente' : 'ausente',
    });

    const webRef = doc(db, COLLECTION_NAME, webId);

    const webData = {
      userId,
      weddingId: weddingId || null, // ID de la boda para conectar con invitados
      craftConfig: data.craftConfig, // Configuración serializada de Craft.js
      tema: data.tema, // Tema aplicado
      nombre: data.nombre || 'Mi Web de Boda',
      slug: data.slug || null, // Slug para URL pública (null si no está publicada)
      published: data.published || false,
      updatedAt: serverTimestamp(),
      ...(data.createdAt ? {} : { createdAt: serverTimestamp() }),
    };

    console.log('📦 Datos finales a guardar:', {
      userId: webData.userId,
      nombre: webData.nombre,
      slug: webData.slug,
      published: webData.published,
      tieneCraftConfig: !!webData.craftConfig,
      tieneTema: !!webData.tema,
    });

    await setDoc(webRef, webData, { merge: true });

    console.log('✅ Web guardada en Firebase:', webId);
    console.log('✅ Con slug:', webData.slug);
    console.log('✅ Con published:', webData.published);

    return { success: true, webId };
  } catch (error) {
    console.error('❌ Error guardando web:', error);
    console.error('📋 Error details:', error.message);
    throw error;
  }
};

/**
 * Cargar una web por ID
 */
export const loadWeb = async (webId) => {
  try {
    const webRef = doc(db, COLLECTION_NAME, webId);
    const webSnap = await getDoc(webRef);

    if (webSnap.exists()) {
      const data = webSnap.data();
      console.log('✅ Web cargada desde Firebase:', webId);
      return {
        id: webSnap.id,
        ...data,
      };
    } else {
      console.log('ℹ️ Web no existe aún (será creada al guardar):', webId);
      return null;
    }
  } catch (error) {
    // Si el error es de permisos y el documento no existe, devolver null
    if (error.code === 'permission-denied') {
      console.log('ℹ️ Documento no existe o sin permisos, se creará uno nuevo');
      return null;
    }
    console.error('❌ Error cargando web:', error);
    throw error;
  }
};

/**
 * Obtener todas las webs de un usuario
 */
export const getUserWebs = async (userId) => {
  try {
    const websRef = collection(db, COLLECTION_NAME);
    const q = query(websRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const webs = [];

    querySnapshot.forEach((doc) => {
      webs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`✅ ${webs.length} webs encontradas para el usuario`);
    return webs;
  } catch (error) {
    console.error('❌ Error obteniendo webs del usuario:', error);
    throw error;
  }
};

/**
 * Eliminar una web
 */
export const deleteWeb = async (webId) => {
  try {
    const webRef = doc(db, COLLECTION_NAME, webId);
    await deleteDoc(webRef);
    console.log('✅ Web eliminada:', webId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando web:', error);
    throw error;
  }
};

/**
 * Actualizar metadatos de una web (sin tocar craftConfig)
 */
export const updateWebMetadata = async (webId, metadata) => {
  try {
    const webRef = doc(db, COLLECTION_NAME, webId);
    await updateDoc(webRef, {
      ...metadata,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Metadatos actualizados:', webId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error actualizando metadatos:', error);
    throw error;
  }
};

/**
 * Publicar una web (marcarla como publicada)
 */
export const publishWeb = async (webId, publishData) => {
  try {
    const webRef = doc(db, COLLECTION_NAME, webId);
    await updateDoc(webRef, {
      published: true,
      publishedAt: serverTimestamp(),
      publishedUrl: publishData.url || null,
      ...publishData,
    });
    console.log('✅ Web publicada:', webId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error publicando web:', error);
    throw error;
  }
};

/**
 * Obtener una web por su slug (para páginas públicas)
 */
export const getWebBySlug = async (slug) => {
  try {
    console.log('🔍 getWebBySlug - Buscando slug:', slug);
    const websRef = collection(db, COLLECTION_NAME);
    const q = query(websRef, where('slug', '==', slug), where('published', '==', true));

    console.log('📋 Ejecutando query en colección:', COLLECTION_NAME);
    const snapshot = await getDocs(q);

    console.log('📊 Resultados encontrados:', snapshot.size);

    if (snapshot.empty) {
      console.log('⚠️ Web no encontrada con slug:', slug);
      console.log('💡 Verificando todas las webs en la colección...');

      // Debug: Listar todas las webs para ver qué hay
      const allWebs = await getDocs(collection(db, COLLECTION_NAME));
      console.log('📚 Total de webs en la colección:', allWebs.size);
      allWebs.docs.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Web:', {
          id: doc.id,
          slug: data.slug,
          published: data.published,
          userId: data.userId,
        });
      });

      return null;
    }

    const webDoc = snapshot.docs[0];
    const webData = webDoc.data();
    console.log('✅ Web pública cargada:', {
      id: webDoc.id,
      slug: webData.slug,
      published: webData.published,
    });

    return {
      id: webDoc.id,
      ...webData,
    };
  } catch (error) {
    console.error('❌ Error obteniendo web por slug:', error);
    console.error('📋 Error details:', error.message);
    throw error;
  }
};

/**
 * Despublicar una web
 */
export const unpublishWeb = async (webId) => {
  try {
    const webRef = doc(db, COLLECTION_NAME, webId);
    await updateDoc(webRef, {
      published: false,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Web despublicada:', webId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error despublicando web:', error);
    throw error;
  }
};

/**
 * Verificar si un slug está disponible
 */
export const checkSlugAvailability = async (slug, currentWebId = null) => {
  try {
    const websRef = collection(db, COLLECTION_NAME);
    const q = query(websRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    // Si está vacío, está disponible
    if (snapshot.empty) {
      return true;
    }

    // Si hay resultados, verificar si es la web actual (permitir mantener el mismo slug)
    if (currentWebId) {
      const existingWeb = snapshot.docs[0];
      if (existingWeb.id === currentWebId) {
        return true; // Es la misma web, puede mantener el slug
      }
    }

    return false; // Slug ya en uso por otra web
  } catch (error) {
    console.error('❌ Error verificando slug:', error);
    throw error;
  }
};

/**
 * Generar ID único para nueva web
 */
export const generateWebId = (userId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `web-${userId.substring(0, 8)}-${timestamp}-${random}`;
};
