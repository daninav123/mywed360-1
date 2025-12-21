// GamificationService.js - cliente frontend para /api/gamification
import { auth } from '../firebaseConfig';
import { getBackendBase } from '../utils/backendBase';

const base = () => `${getBackendBase()}/api/gamification`;
const FALLBACK_EMPTY = {
  points: 0,
  level: 1,
  progressToNext: 0,
  achievements: [],
  history: [],
  milestonesUnlocked: [],
  nextLevelTarget: null,
  lastEvent: null,
  counters: {},
};

const FALLBACK_SAMPLE = {
  points: 320,
  level: 3,
  progressToNext: 0.55,
  nextLevelTarget: 601,
  milestonesUnlocked: ['points_100', 'complete_task_10'],
  counters: {
    complete_task: 16,
    add_guest: 12,
    assign_seat: 5,
  },
  achievements: [
    {
      id: 'rsvp_50',
      name: '50% RSVPs confirmados',
      unlockedAt: '2025-09-14',
      description: 'Alcanzaste la mitad de confirmaciones.',
    },
    {
      id: 'tasks_weekly',
      name: 'Semana productiva',
      unlockedAt: '2025-09-10',
      description: 'Completaste 5 tareas en 7 días.',
    },
  ],
  lastEvent: {
    type: 'complete_task',
    label: '+40 pts · Checklist al día',
    createdAt: '2025-09-20T08:00:00.000Z',
  },
  history: [
    {
      id: 'evt_1',
      eventType: 'complete_task',
      pointsAwarded: 40,
      createdAt: '2025-09-20T08:00:00.000Z',
    },
    {
      id: 'evt_2',
      eventType: 'add_guest',
      pointsAwarded: 10,
      createdAt: '2025-09-14T08:00:00.000Z',
    },
    {
      id: 'evt_3',
      eventType: 'assign_seat',
      pointsAwarded: 25,
      createdAt: '2025-09-08T08:00:00.000Z',
    },
  ],
};

let remoteDisabled = false;
let remoteDisableReason = null;

try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const persisted = window.sessionStorage.getItem('maloveapp_gamification_disabled');
    if (persisted) {
      remoteDisabled = true;
      remoteDisableReason = persisted;
    }
  }
} catch (error) {
  // Ignorar errores de storage (modo incógnito, etc.)
}

function disableRemoteGamification(reason) {
  if (remoteDisabled) {
    return;
  }
  remoteDisabled = true;
  remoteDisableReason =
    typeof reason === 'string' ? reason : reason?.message || reason?.status || 'remote-disabled';
  if (typeof console !== 'undefined') {
    // console.warn('[GamificationService] Deshabilitando integración remota de gamificación:', remoteDisableReason);
  }
  if (typeof window !== 'undefined') {
    window.__GAMIFICATION_REMOTE_DISABLED__ = remoteDisableReason;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('maloveapp_gamification_disabled', remoteDisableReason);
    }
  } catch (error) {
    // Ignorar errores de almacenamiento persistente
  }
}

const shouldUseSampleData = () => {
  if (remoteDisabled) return true;
  if (typeof window !== 'undefined' && window?.__GAMIFICATION_TEST_SUMMARY__) {
    return true;
  }
  if (typeof window !== 'undefined' && window?.Cypress) return true;
  const flag = import.meta?.env?.VITE_GAMIFICATION_SAMPLE;
  if (flag === true) return true;
  if (flag === false) return false;
  if (typeof flag === 'string') {
    const normalized = flag.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }
  return false;
};

async function getAuthToken() {
  const user = auth?.currentUser;
  if (!user?.getIdToken) {
    throw new Error('GamificationService: autenticación requerida');
  }
  try {
    return await user.getIdToken(true);
  } catch (error) {
    // console.warn('[GamificationService] No se pudo refrescar el token, usando caché:', error);
    return await user.getIdToken().catch(() => {
      throw new Error('GamificationService: no se pudo obtener el token de autenticación');
    });
  }
}

async function authHeader(extra = {}) {
  const token = await getAuthToken();
  return { ...extra, Authorization: `Bearer ${token}` };
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

export async function getStats(weddingId, uid, { historyLimit } = {}) {
  if (remoteDisabled) {
    throw new Error('gamification remote disabled');
  }
  const url = new URL(`${base()}/stats`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (uid) url.searchParams.set('uid', uid);
  if (historyLimit != null) url.searchParams.set('historyLimit', String(historyLimit));
  let res;
  try {
    res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  } catch (error) {
    disableRemoteGamification(error);
    throw error;
  }
  if (!res.ok) {
    if (res.status >= 400 && res.status < 500) {
      disableRemoteGamification(`HTTP ${res.status}`);
    }
    const error = new Error('getStats failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getAchievements(weddingId, uid) {
  if (remoteDisabled) {
    throw new Error('gamification remote disabled');
  }
  const url = new URL(`${base()}/achievements`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (uid) url.searchParams.set('uid', uid);
  let res;
  try {
    res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  } catch (error) {
    disableRemoteGamification(error);
    throw error;
  }
  if (!res.ok) {
    if (res.status >= 400 && res.status < 500) {
      disableRemoteGamification(`HTTP ${res.status}`);
    }
    const error = new Error('getAchievements failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function getEvents(weddingId, uid, { limit } = {}) {
  if (remoteDisabled) {
    throw new Error('gamification remote disabled');
  }
  const url = new URL(`${base()}/events`);
  if (weddingId) url.searchParams.set('weddingId', weddingId);
  if (uid) url.searchParams.set('uid', uid);
  if (limit != null) url.searchParams.set('limit', String(limit));
  let res;
  try {
    res = await fetch(url, { headers: await authHeader(), credentials: 'include' });
  } catch (error) {
    disableRemoteGamification(error);
    throw error;
  }
  if (!res.ok) {
    if (res.status >= 400 && res.status < 500) {
      disableRemoteGamification(`HTTP ${res.status}`);
    }
    const error = new Error('getEvents failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

function clamp01(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > 1) return 1;
  return num;
}

function humanizeEventType(rawType) {
  if (!rawType) return 'Actividad';
  return String(rawType)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function buildHistoryLabel(item) {
  if (!item || typeof item !== 'object') return 'Actividad registrada';
  const eventType = item.eventType || item.type;
  const points = Number(item.pointsAwarded ?? item.points);
  const humanLabel =
    item.label ||
    item.description ||
    (eventType ? humanizeEventType(eventType) : 'Actividad registrada');
  if (Number.isFinite(points) && points !== 0) {
    const prefix = points > 0 ? `+${points} pts` : `${points} pts`;
    return `${prefix} · ${humanLabel}`;
  }
  return humanLabel;
}

function mapHistoryItem(item, idx = 0) {
  if (!item || typeof item !== 'object') {
    return {
      id: `hist-${idx}`,
      type: 'event',
      label: 'Actividad registrada',
      date: '',
    };
  }
  return {
    id: item.id || `hist-${idx}`,
    type: item.eventType || item.type || 'event',
    label: buildHistoryLabel(item),
    date: item.createdAt || item.date || '',
    points: item.pointsAwarded ?? item.points ?? null,
    meta: item.meta || {},
  };
}

function mapStatsPayload(payload) {
  const data = (payload && typeof payload === 'object' ? payload.stats || payload : {}) || {};
  const totalPoints = Number(data.totalPoints ?? data.points ?? 0) || 0;
  const level = Number(data.level ?? 1) || 1;
  const milestones = Array.isArray(data.milestonesUnlocked) ? data.milestonesUnlocked : [];
  const historyArray = Array.isArray(data.history) ? data.history : [];

  const lastEvent = data.lastEvent
    ? {
        ...data.lastEvent,
        type: data.lastEvent.type || data.lastEvent.eventType || 'event',
        label: buildHistoryLabel(data.lastEvent),
        createdAt: data.lastEvent.createdAt || data.lastEvent.date || '',
      }
    : null;

  return {
    points: totalPoints,
    level,
    progressToNext: clamp01(data.progressToNext),
    history: historyArray.map((item, idx) => mapHistoryItem(item, idx)),
    milestonesUnlocked: milestones,
    nextLevelTarget: data.nextLevelTarget ?? null,
    lastEvent,
    counters: data.counters || {},
  };
}

function mapAchievementsPayload(payload) {
  const list = Array.isArray(payload?.achievements)
    ? payload.achievements
    : Array.isArray(payload)
      ? payload
      : [];
  return list.map((ach, idx) => ({
    id: ach?.id || `ach-${idx}`,
    name: ach?.name || ach?.title || 'Logro desbloqueado',
    description: ach?.description || ach?.details || '',
    unlockedAt: ach?.unlockedAt || ach?.date || '',
    source: ach?.source || 'rule',
  }));
}

export async function getSummary({ weddingId, uid } = {}) {
  const override = (typeof window !== 'undefined' && window?.__GAMIFICATION_TEST_SUMMARY__) || null;
  if (override) {
    return { ...FALLBACK_SAMPLE, ...override };
  }

  const wantsSample = shouldUseSampleData();
  if (remoteDisabled || wantsSample) {
    return wantsSample ? { ...FALLBACK_SAMPLE } : { ...FALLBACK_EMPTY };
  }

  try {
    const [statsResult, achievementsResult] = await Promise.allSettled([
      getStats(weddingId, uid),
      getAchievements(weddingId, uid),
    ]);

    const summary = { ...FALLBACK_EMPTY };

    if (statsResult.status === 'fulfilled') {
      Object.assign(summary, mapStatsPayload(statsResult.value));
    }

    if (achievementsResult.status === 'fulfilled') {
      summary.achievements = mapAchievementsPayload(achievementsResult.value);
    }

    if (summary.history.length === 0 && wantsSample) {
      summary.history = FALLBACK_SAMPLE.history;
    }
    if (summary.achievements.length === 0 && wantsSample) {
      summary.achievements = FALLBACK_SAMPLE.achievements;
    }
    if (
      summary.points === 0 &&
      summary.level === 1 &&
      summary.progressToNext === 0 &&
      wantsSample
    ) {
      summary.points = FALLBACK_SAMPLE.points;
      summary.level = FALLBACK_SAMPLE.level;
      summary.progressToNext = FALLBACK_SAMPLE.progressToNext;
    }

    return summary;
  } catch (error) {
    disableRemoteGamification(error);
    if (wantsSample) {
      return { ...FALLBACK_SAMPLE };
    }
    return { ...FALLBACK_EMPTY };
  }
}
