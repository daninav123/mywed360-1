// GamificationService.js - cliente frontend para /api/gamification
import { auth } from '../firebaseConfig';
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/gamification`;

async function getAuthToken() {
  try {
    const user = auth?.currentUser;
    if (user?.getIdToken) {
      return await user.getIdToken();
    }
    // Fallback: mock si existe email en localStorage perfil
    const profile = JSON.parse(localStorage.getItem('mywed360Profile') || '{}');
    if (profile?.email || profile?.account?.email) {
      const uid = profile?.uid || 'local';
      const email = profile?.email || profile?.account?.email;
      return `mock-${uid}-${email}`;
    }
  } catch (_) {}
  return null;
}

async function authHeader(extra = {}) {
  const token = await getAuthToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function awardPoints(weddingId, eventType, meta = {}, uid) {
  const res = await fetch(`${base()}/award`, {
    method: 'POST',
    headers: await authHeader({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ weddingId, uid, eventType, meta }),
  });
  if (!res.ok) throw new Error('awardPoints failed');
  return res.json();
}

export async function getStats(weddingId, uid) {
  const url = new URL(`${base()}/stats`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (uid) url.searchParams.set('uid', uid);
  const res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  if (!res.ok) throw new Error('getStats failed');
  return res.json();
}

export async function getAchievements(weddingId, uid) {
  const url = new URL(`${base()}/achievements`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (uid) url.searchParams.set('uid', uid);
  const res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  if (!res.ok) throw new Error('getAchievements failed');
  return res.json();
}

