/**
 * Onboarding Telemetry Service - PostgreSQL Version
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

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

export const trackOnboardingEvent = async (userId, weddingId, eventName, metadata = {}) => {
  if (!userId || !eventName) return;

  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/onboarding-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        weddingId,
        event: eventName,
        metadata
      })
    });
  } catch (error) {
    console.error('Error tracking onboarding event:', error);
  }
};

export const getOnboardingProgress = async (userId, weddingId) => {
  if (!userId || !weddingId) return null;

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/onboarding-progress/${weddingId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return null;
    const result = await response.json();
    return result.progress || result.data;
  } catch {
    return null;
  }
};

export const markTutorialCompleted = async (userId, weddingId) => {
  return trackOnboardingEvent(userId, weddingId, OnboardingEvents.TUTORIAL_COMPLETED);
};

export const markTutorialSkipped = async (userId, weddingId) => {
  return trackOnboardingEvent(userId, weddingId, OnboardingEvents.TUTORIAL_SKIPPED);
};
