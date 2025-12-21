// Enhancements for EmailTracking: provider tagging helper
import { addTagToEmail, SYSTEM_TAGS } from './tagService';

export function tagProviderEmail(emailId, providerId) {
  try {
    const userRaw =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('maloveapp_user')
        : null;
    const userId = userRaw ? JSON.parse(userRaw)?.uid || 'local' : 'local';
    const providerTagId = (SYSTEM_TAGS.find((t) => t.id === 'provider') || { id: 'provider' }).id;
    addTagToEmail(userId, emailId, providerTagId);
    return true;
  } catch (e) {
    // console.warn('[EmailTrackingEnhancements] tagProviderEmail failed:', e?.message || e);
    return false;
  }
}

