import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

/**
 * Servicio de Analytics para webs de boda
 */

/**
 * Registrar vista de web
 */
export const trackPageView = async (slug, userAgent) => {
  try {
    const analyticsRef = collection(db, `published-webs/${slug}/analytics`);

    await setDoc(doc(analyticsRef), {
      type: 'pageView',
      timestamp: serverTimestamp(),
      userAgent,
      referrer: document.referrer,
      language: navigator.language,
    });

    // Actualizar contador en web publicada
    const webRef = doc(db, 'published-webs', slug);
    await updateDoc(webRef, {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
    });

    console.log('✅ Vista registrada:', slug);
  } catch (error) {
    console.error('❌ Error registrando vista:', error);
  }
};

/**
 * Registrar compartición
 */
export const trackShare = async (slug, platform) => {
  try {
    const analyticsRef = collection(db, `published-webs/${slug}/analytics`);

    await setDoc(doc(analyticsRef), {
      type: 'share',
      platform,
      timestamp: serverTimestamp(),
    });

    // Actualizar contador en web publicada
    const webRef = doc(db, 'published-webs', slug);
    await updateDoc(webRef, {
      shares: increment(1),
      lastSharedAt: serverTimestamp(),
      [`shares_${platform}`]: increment(1),
    });

    console.log('✅ Compartición registrada:', platform);
  } catch (error) {
    console.error('❌ Error registrando compartición:', error);
  }
};

/**
 * Registrar confirmación RSVP
 */
export const trackRSVP = async (slug, response) => {
  try {
    const analyticsRef = collection(db, `published-webs/${slug}/analytics`);

    await setDoc(doc(analyticsRef), {
      type: 'rsvp',
      response, // 'si', 'no', 'quizas'
      timestamp: serverTimestamp(),
    });

    // Actualizar contador en web publicada
    const webRef = doc(db, 'published-webs', slug);
    await updateDoc(webRef, {
      [`rsvp_${response}`]: increment(1),
      lastRSVPAt: serverTimestamp(),
    });

    console.log('✅ RSVP registrado:', response);
  } catch (error) {
    console.error('❌ Error registrando RSVP:', error);
  }
};

/**
 * Registrar clic en sección
 */
export const trackSectionClick = async (slug, section) => {
  try {
    const analyticsRef = collection(db, `published-webs/${slug}/analytics`);

    await setDoc(doc(analyticsRef), {
      type: 'sectionClick',
      section,
      timestamp: serverTimestamp(),
    });

    console.log('✅ Clic en sección registrado:', section);
  } catch (error) {
    console.error('❌ Error registrando clic:', error);
  }
};

/**
 * Obtener estadísticas de web
 */
export const getWebAnalytics = async (slug) => {
  try {
    const analyticsRef = collection(db, `published-webs/${slug}/analytics`);
    const querySnapshot = await getDocs(analyticsRef);

    const analytics = {
      totalViews: 0,
      totalShares: 0,
      totalRSVPs: 0,
      rsvpBreakdown: { si: 0, no: 0, quizas: 0 },
      sharesByPlatform: {},
      sectionClicks: {},
      timeline: [],
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.type === 'pageView') {
        analytics.totalViews++;
      } else if (data.type === 'share') {
        analytics.totalShares++;
        analytics.sharesByPlatform[data.platform] =
          (analytics.sharesByPlatform[data.platform] || 0) + 1;
      } else if (data.type === 'rsvp') {
        analytics.totalRSVPs++;
        analytics.rsvpBreakdown[data.response]++;
      } else if (data.type === 'sectionClick') {
        analytics.sectionClicks[data.section] = (analytics.sectionClicks[data.section] || 0) + 1;
      }

      analytics.timeline.push({
        type: data.type,
        timestamp: data.timestamp,
        ...data,
      });
    });

    console.log('✅ Estadísticas obtenidas:', analytics);
    return analytics;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};

/**
 * Obtener resumen de estadísticas
 */
export const getWebSummary = async (slug) => {
  try {
    const webRef = doc(db, 'published-webs', slug);
    const webSnap = await getDoc(webRef);

    if (webSnap.exists()) {
      const data = webSnap.data();
      return {
        views: data.views || 0,
        shares: data.shares || 0,
        rsvpSi: data.rsvp_si || 0,
        rsvpNo: data.rsvp_no || 0,
        rsvpQuizas: data.rsvp_quizas || 0,
        sharesByPlatform: {
          whatsapp: data.shares_whatsapp || 0,
          facebook: data.shares_facebook || 0,
          twitter: data.shares_twitter || 0,
          instagram: data.shares_instagram || 0,
          linkedin: data.shares_linkedin || 0,
          telegram: data.shares_telegram || 0,
        },
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    throw error;
  }
};

/**
 * Obtener tasa de conversión
 */
export const getConversionRate = async (slug) => {
  try {
    const summary = await getWebSummary(slug);

    if (!summary || summary.views === 0) {
      return 0;
    }

    const totalRSVPs = summary.rsvpSi + summary.rsvpNo + summary.rsvpQuizas;
    return (totalRSVPs / summary.views) * 100;
  } catch (error) {
    console.error('❌ Error calculando tasa de conversión:', error);
    throw error;
  }
};
