import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Servicio de Telemetría de Onboarding
 * Rastrea el progreso del usuario en el proceso de configuración inicial
 */

/**
 * Eventos que podemos trackear
 */
export const OnboardingEvents = {
  TUTORIAL_STARTED: 'tutorial_started',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  TUTORIAL_SKIPPED: 'tutorial_skipped',
  STEP_COMPLETED: 'step_completed',
  CHECKLIST_VIEWED: 'checklist_viewed',
  CHECKLIST_DISMISSED: 'checklist_dismissed',
  TOOLTIP_VIEWED: 'tooltip_viewed',
  TOOLTIP_DISMISSED: 'tooltip_dismissed',
  FIRST_GUEST_ADDED: 'first_guest_added',
  FIRST_SUPPLIER_ADDED: 'first_supplier_added',
  BUDGET_SET: 'budget_set',
  SEATING_CREATED: 'seating_created',
  AI_FIRST_USE: 'ai_first_use',
};

/**
 * Trackear evento de onboarding
 */
export const trackOnboardingEvent = async (userId, weddingId, eventName, metadata = {}) => {
  if (!userId || !eventName) return;

  try {
    const eventRef = doc(db, 'users', userId, 'onboardingEvents', `${Date.now()}_${eventName}`);
    
    await setDoc(eventRef, {
      event: eventName,
      weddingId: weddingId || null,
      metadata,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });

    // También actualizar el perfil del usuario con progreso
    if (weddingId) {
      const progressRef = doc(db, 'weddings', weddingId);
      const updates = {};

      // Actualizar campos específicos según el evento
      switch (eventName) {
        case OnboardingEvents.TUTORIAL_COMPLETED:
          updates.onboardingTutorialCompleted = true;
          updates.onboardingCompletedAt = serverTimestamp();
          break;
        case OnboardingEvents.FIRST_GUEST_ADDED:
          updates.hasAddedGuests = true;
          break;
        case OnboardingEvents.BUDGET_SET:
          updates.hasBudget = true;
          break;
        case OnboardingEvents.SEATING_CREATED:
          updates.hasSeating = true;
          break;
        case OnboardingEvents.AI_FIRST_USE:
          updates.hasUsedAI = true;
          updates.aiInteractions = 1;
          break;
      }

      if (Object.keys(updates).length > 0) {
        await setDoc(progressRef, updates, { merge: true });
      }
    }

    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      // console.log('📊 Onboarding Event:', eventName, metadata);
    }
  } catch (error) {
    // console.error('Error tracking onboarding event:', error);
  }
};

/**
 * Obtener progreso de onboarding del usuario
 */
export const getOnboardingProgress = async (userId, weddingId) => {
  if (!userId || !weddingId) return null;

  try {
    const weddingRef = doc(db, 'weddings', weddingId);
    const weddingDoc = await getDoc(weddingRef);
    
    if (!weddingDoc.exists()) return null;

    const data = weddingDoc.data();
    
    return {
      tutorialCompleted: data.onboardingTutorialCompleted || false,
      hasAddedGuests: data.hasAddedGuests || false,
      hasBudget: data.hasBudget || false,
      hasSeating: data.hasSeating || false,
      hasUsedAI: data.hasUsedAI || false,
      completedAt: data.onboardingCompletedAt || null,
      progress: calculateProgress(data),
    };
  } catch (error) {
    // console.error('Error getting onboarding progress:', error);
    return null;
  }
};

/**
 * Calcular porcentaje de progreso
 */
const calculateProgress = (weddingData) => {
  const checks = [
    !!(weddingData?.weddingInfo?.brideAndGroom),
    !!(weddingData?.weddingInfo?.weddingDate),
    !!(weddingData?.guestCount > 0),
    !!(weddingData?.budget?.total > 0),
    !!(weddingData?.hasSeating),
    !!(weddingData?.hasUsedAI),
    !!(weddingData?.onboardingTutorialCompleted),
  ];

  const completed = checks.filter(Boolean).length;
  const total = checks.length;

  return Math.round((completed / total) * 100);
};

/**
 * Marcar checklist como vista
 */
export const trackChecklistView = async (userId, weddingId) => {
  await trackOnboardingEvent(userId, weddingId, OnboardingEvents.CHECKLIST_VIEWED);
};

/**
 * Marcar tooltip como visto
 */
export const trackTooltipView = async (userId, weddingId, tooltipId) => {
  await trackOnboardingEvent(userId, weddingId, OnboardingEvents.TOOLTIP_VIEWED, { tooltipId });
};

/**
 * Helper para detectar si es la primera vez que el usuario hace algo
 */
export const isFirstTime = (key) => {
  if (typeof window === 'undefined') return false;
  const firstTimeKey = `first_time_${key}`;
  const hasSeenBefore = localStorage.getItem(firstTimeKey);
  
  if (!hasSeenBefore) {
    localStorage.setItem(firstTimeKey, 'true');
    return true;
  }
  
  return false;
};

/**
 * Reset de progreso (solo para testing)
 */
export const resetOnboardingProgress = async (userId, weddingId) => {
  if (process.env.NODE_ENV !== 'development') {
    // console.warn('Reset only available in development');
    return;
  }

  try {
    if (weddingId) {
      const weddingRef = doc(db, 'weddings', weddingId);
      await setDoc(weddingRef, {
        onboardingTutorialCompleted: false,
        hasAddedGuests: false,
        hasBudget: false,
        hasSeating: false,
        hasUsedAI: false,
        onboardingCompletedAt: null,
      }, { merge: true });
    }

    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith('tooltip_seen_') || key.startsWith('first_time_'))
        .forEach(key => localStorage.removeItem(key));
    }

    // console.log('✅ Onboarding progress reset');
  } catch (error) {
    // console.error('Error resetting onboarding:', error);
  }
};

export default {
  trackOnboardingEvent,
  getOnboardingProgress,
  trackChecklistView,
  trackTooltipView,
  isFirstTime,
  resetOnboardingProgress,
  OnboardingEvents,
};
