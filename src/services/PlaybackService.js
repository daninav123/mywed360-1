// Lightweight playback adapter: tries backend API first, falls back to HTML5 Audio
// Proposed endpoints (implement server-side when ready):
//  - POST /api/playback/play { title, artist, previewUrl? } -> { url?: string }
//  - POST /api/playback/pause {}
//  - POST /api/playback/stop {}

import { post as apiPost } from './apiClient';

// Feature flag: enable remote playback endpoints only if explicitly set
const REMOTE_ENABLED = import.meta?.env?.VITE_REMOTE_PLAYBACK === 'true';
// Force remote-only playback (no HTML5 fallback)
const ALWAYS_REMOTE = false;

let html5Audio = null;
let currentId = null;
let lastVolume = 1;
const listeners = new Set();

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function getStateInternal() {
  const a = html5Audio;
  return {
    currentId,
    paused: a ? a.paused : true,
    currentTime: a ? Number(a.currentTime || 0) : 0,
    duration: a ? Number(a.duration || 0) : 0,
    volume: a ? Number(a.volume ?? 1) : 1,
  };
}

function notify() {
  const snapshot = getStateInternal();
  listeners.forEach((fn) => {
    try { fn(snapshot); } catch {}
  });
}

function stopHtml5() {
  try {
    html5Audio?.pause();
  } catch {}
  try {
    html5Audio && (html5Audio.currentTime = 0);
  } catch {}
  // Remove listeners to avoid leaks
  if (html5Audio) {
    try {
      html5Audio.removeEventListener('timeupdate', notify);
      html5Audio.removeEventListener('durationchange', notify);
      html5Audio.removeEventListener('pause', notify);
      html5Audio.removeEventListener('play', notify);
    } catch {}
  }
  html5Audio = null;
  notify();
}

export function getCurrentId() {
  return currentId;
}

export function getState() {
  return getStateInternal();
}

export function subscribe(fn) {
  if (typeof fn === 'function') {
    listeners.add(fn);
    try { fn(getStateInternal()); } catch {}
    return () => listeners.delete(fn);
  }
  return () => {};
}

export async function stop(idOverride = null) {
  if (REMOTE_ENABLED) {
    try {
      await apiPost('/api/playback/stop', {}, { auth: true });
    } catch {}
  }
  stopHtml5();
  currentId = idOverride === null ? null : idOverride;
  notify();
}

export async function pause() {
  if (REMOTE_ENABLED) {
    try {
      await apiPost('/api/playback/pause', {}, { auth: true });
    } catch {}
  }
  try {
    html5Audio?.pause();
  } catch {}
  notify();
}

export async function resume() {
  try {
    if (html5Audio) {
      await html5Audio.play().catch(() => {});
      notify();
      return true;
    }
  } catch {}
  return false;
}

export function setVolume(v) {
  const vol = clamp(Number(v), 0, 1);
  lastVolume = vol;
  try { if (html5Audio) html5Audio.volume = vol; } catch {}
  notify();
}

export function seek(seconds) {
  try {
    if (!html5Audio) return false;
    const dur = Number(html5Audio.duration || 0);
    if (!isFinite(dur) || dur <= 0) return false;
    const t = clamp(Number(seconds), 0, dur);
    html5Audio.currentTime = t;
    notify();
    return true;
  } catch {}
  return false;
}

export async function playTrack(track) {
  const { id, title, artist, previewUrl } = track || {};
  // Always try backend first
  if (REMOTE_ENABLED) {
    try {
      const res = await apiPost(
        '/api/playback/play',
        { title, artist, previewUrl },
        { auth: true }
      );
      if (res?.ok) {
        currentId = id || `${title || ''}-${artist || ''}` || 'unknown';
        return true;
      }
    } catch {}
  }

  if (ALWAYS_REMOTE) {
    return false;
  }

  // Fallback to HTML5 preview (only if allowed)
  const finalUrl = previewUrl || null;
  if (finalUrl) {
    try {
      html5Audio?.pause();
    } catch {}
    try {
      const a = new Audio();
      try { a.crossOrigin = 'anonymous'; } catch {}
      a.src = finalUrl;
      a.preload = 'auto';
      try { a.volume = lastVolume; } catch {}

      // Wire events to notify listeners once we adopt this element
      a.addEventListener('timeupdate', notify);
      a.addEventListener('durationchange', notify);
      a.addEventListener('pause', notify);
      a.addEventListener('play', notify);
      a.addEventListener('ended', () => {
        currentId = null;
        notify();
      });

      // Attempt to play; if it fails, do not set current state
      await a.play();

      // Success: replace current element
      html5Audio = a;
      currentId = id || `${title || ''}-${artist || ''}` || 'unknown';
      notify();
      return true;
    } catch {}
  }
  return false;
}

export async function toggle(track) {
  if (!track) return false;
  if (currentId && currentId === track.id) {
    await pause();
    currentId = null;
    return false;
  }
  await stop();
  const ok = await playTrack(track);
  return ok;
}
