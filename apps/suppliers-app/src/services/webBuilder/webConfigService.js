import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

/**
 * Servicio para gestionar configuraciones de webs en Firebase
 */

/**
 * Guardar configuración de web (borrador)
 */
export const saveWebConfig = async (userId, weddingId, config) => {
  try {
    const webDocId = `${userId}_${weddingId}`;
    const webRef = doc(db, 'webs', webDocId);

    await setDoc(
      webRef,
      {
        userId,
        weddingId,
        config,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        version: 1,
      },
      { merge: true }
    );

    console.log('✅ Web guardada:', webDocId);
    return webDocId;
  } catch (error) {
    console.error('❌ Error guardando web:', error);
    throw error;
  }
};

/**
 * Obtener configuración de web
 */
export const getWebConfig = async (userId, weddingId) => {
  try {
    const webDocId = `${userId}_${weddingId}`;
    const webRef = doc(db, 'webs', webDocId);
    const webSnap = await getDoc(webRef);

    if (webSnap.exists()) {
      console.log('✅ Web obtenida:', webDocId);
      return webSnap.data();
    } else {
      console.log('⚠️ Web no encontrada:', webDocId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo web:', error);
    throw error;
  }
};

/**
 * Actualizar configuración de web
 */
export const updateWebConfig = async (userId, weddingId, config) => {
  try {
    const webDocId = `${userId}_${weddingId}`;
    const webRef = doc(db, 'webs', webDocId);

    await updateDoc(webRef, {
      config,
      updatedAt: serverTimestamp(),
      version: (await getDoc(webRef)).data()?.version + 1 || 1,
    });

    console.log('✅ Web actualizada:', webDocId);
    return webDocId;
  } catch (error) {
    console.error('❌ Error actualizando web:', error);
    throw error;
  }
};

/**
 * Publicar web (cambiar estado a published)
 */
export const publishWeb = async (userId, weddingId, config) => {
  try {
    const slug = generateSlug(config.meta.titulo);
    const webDocId = `${userId}_${weddingId}`;

    // Guardar en colección de webs publicadas
    const publishedRef = doc(db, 'published-webs', slug);
    await setDoc(publishedRef, {
      userId,
      weddingId,
      config,
      slug,
      url: `https://maloveapp.com/${slug}`,
      status: 'published',
      publishedAt: serverTimestamp(),
      views: 0,
      shares: 0,
    });

    // Actualizar estado en webs
    const webRef = doc(db, 'webs', webDocId);
    await updateDoc(webRef, {
      status: 'published',
      publishedSlug: slug,
      publishedAt: serverTimestamp(),
    });

    console.log('✅ Web publicada:', slug);
    return {
      slug,
      url: `https://maloveapp.com/${slug}`,
    };
  } catch (error) {
    console.error('❌ Error publicando web:', error);
    throw error;
  }
};

/**
 * Obtener web publicada
 */
export const getPublishedWeb = async (slug) => {
  try {
    const publishedRef = doc(db, 'published-webs', slug);
    const publishedSnap = await getDoc(publishedRef);

    if (publishedSnap.exists()) {
      console.log('✅ Web publicada obtenida:', slug);
      return publishedSnap.data();
    } else {
      console.log('⚠️ Web publicada no encontrada:', slug);
      return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo web publicada:', error);
    throw error;
  }
};

/**
 * Listar todas las webs del usuario
 */
export const listUserWebs = async (userId) => {
  try {
    const websRef = collection(db, 'webs');
    const q = query(websRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const webs = [];
    querySnapshot.forEach((doc) => {
      webs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log('✅ Webs del usuario listadas:', webs.length);
    return webs;
  } catch (error) {
    console.error('❌ Error listando webs:', error);
    throw error;
  }
};

/**
 * Eliminar web
 */
export const deleteWeb = async (userId, weddingId) => {
  try {
    const webDocId = `${userId}_${weddingId}`;
    const webRef = doc(db, 'webs', webDocId);
    await deleteDoc(webRef);

    console.log('✅ Web eliminada:', webDocId);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando web:', error);
    throw error;
  }
};

/**
 * Registrar vista de web publicada
 */
export const trackWebView = async (slug) => {
  try {
    const publishedRef = doc(db, 'published-webs', slug);
    const publishedSnap = await getDoc(publishedRef);

    if (publishedSnap.exists()) {
      const currentViews = publishedSnap.data().views || 0;
      await updateDoc(publishedRef, {
        views: currentViews + 1,
        lastViewedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('❌ Error registrando vista:', error);
  }
};

/**
 * Registrar compartición de web
 */
export const trackWebShare = async (slug, platform) => {
  try {
    const publishedRef = doc(db, 'published-webs', slug);
    const publishedSnap = await getDoc(publishedRef);

    if (publishedSnap.exists()) {
      const currentShares = publishedSnap.data().shares || 0;
      await updateDoc(publishedRef, {
        shares: currentShares + 1,
        lastSharedAt: serverTimestamp(),
        [`shares_${platform}`]: (publishedSnap.data()[`shares_${platform}`] || 0) + 1,
      });
    }
  } catch (error) {
    console.error('❌ Error registrando compartición:', error);
  }
};

/**
 * Generar slug SEO-friendly
 */
const generateSlug = (texto) => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};

/**
 * Obtener historial de cambios
 */
export const getWebHistory = async (userId, weddingId) => {
  try {
    const historyRef = collection(db, `webs/${userId}_${weddingId}/history`);
    const querySnapshot = await getDocs(historyRef);

    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    throw error;
  }
};

/**
 * Guardar cambio en historial
 */
export const saveWebChange = async (userId, weddingId, change) => {
  try {
    const historyRef = collection(db, `webs/${userId}_${weddingId}/history`);
    await setDoc(doc(historyRef), {
      ...change,
      timestamp: serverTimestamp(),
    });

    console.log('✅ Cambio guardado en historial');
  } catch (error) {
    console.error('❌ Error guardando cambio:', error);
  }
};
