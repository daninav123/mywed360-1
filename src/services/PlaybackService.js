// Lightweight playback adapter: tries backend API first, falls back to HTML5 Audio
// Proposed endpoints (implement server-side when ready):
//  - POST /api/playback/play { title, artist, previewUrl? } -> { url?: string }
//  - POST /api/playback/pause {}
//  - POST /api/playback/stop {}

import { post as apiPost } from './apiClient';

// Force remote-only playback (no HTML5 fallback)
const ALWAYS_REMOTE = true;

let html5Audio = null;
let currentId = null;

function stopHtml5() {
  try { html5Audio?.pause(); } catch {}
  try { html5Audio && (html5Audio.currentTime = 0); } catch {}
  html5Audio = null;
}

export function getCurrentId() {
  return currentId;
}

export async function stop(idOverride = null) {
  try {
    await apiPost('/api/playback/stop', {}, { auth: true });
  } catch {}
  stopHtml5();
  currentId = idOverride === null ? null : idOverride;
}

export async function pause() {
  try {
    await apiPost('/api/playback/pause', {}, { auth: true });
  } catch {}
  try { html5Audio?.pause(); } catch {}
}

export async function playTrack(track) {
  const { id, title, artist, previewUrl } = track || {};
  // Always try backend first
  try {
    const res = await apiPost('/api/playback/play', { title, artist, previewUrl }, { auth: true });
    if (res?.ok) {
      currentId = id || `${title || ''}-${artist || ''}` || 'unknown';
      return true;
    }
  } catch {}

  if (ALWAYS_REMOTE) {
    return false;
  }

  // Fallback to HTML5 preview (only if allowed)
  const finalUrl = previewUrl || null;
  if (finalUrl) {
    try { html5Audio?.pause(); } catch {}
    try {
      html5Audio = new Audio(finalUrl);
      await html5Audio.play().catch(() => {});
      html5Audio.onended = () => { currentId = null; };
      currentId = id || `${title || ''}-${artist || ''}` || 'unknown';
      return true;
    } catch {}
  }
  return false;
}

export async function toggle(track) {
  if (!track) return false;
  if (currentId && (currentId === track.id)) {
    await pause();
    currentId = null;
    return false;
  }
  await stop();
  const ok = await playTrack(track);
  return ok;
}
