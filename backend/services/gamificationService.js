import admin from 'firebase-admin';
import { db, USE_FIREBASE } from '../db.js';

// Verificar si Firebase está disponible
const FIREBASE_AVAILABLE = USE_FIREBASE && db !== null;

const DEFAULT_LEVELS = [
  { level: 1, min: 0, max: 100, name: 'Novato' },
  { level: 2, min: 101, max: 300, name: 'Planificador' },
  { level: 3, min: 301, max: 600, name: 'Organizador' },
  { level: 4, min: 601, max: 1000, name: 'Coordinador' },
  { level: 5, min: 1001, max: 1500, name: 'Maestro de Bodas' },
  { level: 6, min: 1501, max: 2500, name: 'Experto Wedding' },
  { level: 7, min: 2501, max: Infinity, name: 'Leyenda Nupcial' },
];

const POINT_SYSTEM = {
  complete_task: 10,
  add_guest: 5,
  update_budget: 15,
  assign_seat: 8,
  contact_provider: 20,
  upload_photo: 5,
  create_timeline: 60,
  generate_website: 40,
};

const ACHIEVEMENT_RULES = [
  {
    id: 'points_100',
    name: 'Impulso inicial',
    description: 'Acumula 100 puntos totales.',
    predicate: (ctx) => ctx.totalPoints >= 100,
  },
  {
    id: 'points_500',
    name: 'En racha',
    description: 'Alcanza 500 puntos en tu planificación.',
    predicate: (ctx) => ctx.totalPoints >= 500,
  },
  {
    id: 'complete_task_10',
    name: 'Checklist ninja',
    description: 'Completa 10 tareas dentro de la plataforma.',
    predicate: (ctx) => safeCount(ctx, 'complete_task') >= 10,
  },
  {
    id: 'add_guest_20',
    name: 'Embajador de invitados',
    description: 'Añade 20 invitados al evento.',
    predicate: (ctx) => safeCount(ctx, 'add_guest') >= 20,
  },
  {
    id: 'update_budget_3',
    name: 'Guardian del presupuesto',
    description: 'Registra o actualiza el presupuesto en 3 ocasiones.',
    predicate: (ctx) => safeCount(ctx, 'update_budget') >= 3,
  },
  {
    id: 'contact_provider_1',
    name: 'Primer contacto',
    description: 'Contacta con un proveedor desde la plataforma.',
    predicate: (ctx) => safeCount(ctx, 'contact_provider') >= 1,
  },
  {
    id: 'assign_seat_1',
    name: 'Diseñador de mesas',
    description: 'Asigna al menos un invitado en el seating plan.',
    predicate: (ctx) => safeCount(ctx, 'assign_seat') >= 1,
  },
  {
    id: 'create_timeline_1',
    name: 'Timeline maestro',
    description: 'Genera el timeline del gran día.',
    predicate: (ctx) => safeCount(ctx, 'create_timeline') >= 1,
  },
  {
    id: 'generate_website_1',
    name: 'Web publicada',
    description: 'Publica la web del evento para invitados.',
    predicate: (ctx) => safeCount(ctx, 'generate_website') >= 1,
  },
];

const DEFAULT_STATE = {
  totalPoints: 0,
  level: 1,
  levelName: 'Novato',
  progressToNext: 0,
  milestonesUnlocked: [],
  counters: {},
  nextLevelTarget: DEFAULT_LEVELS[1]?.min ?? null,
};

const weddingsCollection = FIREBASE_AVAILABLE ? db.collection('weddings') : null;

const userGamDoc = (weddingId, uid) =>
  FIREBASE_AVAILABLE ? weddingsCollection.doc(String(weddingId)).collection('gamification').doc(String(uid)) : null;

const userAchievementsDoc = (weddingId, uid) =>
  FIREBASE_AVAILABLE ? weddingsCollection.doc(String(weddingId)).collection('achievements').doc(String(uid)) : null;

const weddingEventsCollection = (weddingId) =>
  weddingsCollection.doc(String(weddingId)).collection('gamificationEvents');

function safeCount(ctx, key) {
  const value = ctx?.counters?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function calcLevel(points) {
  const level = DEFAULT_LEVELS.find((lvl) => points >= lvl.min && points <= lvl.max);
  if (level) return { ...level };
  return { ...DEFAULT_LEVELS[DEFAULT_LEVELS.length - 1] };
}

function calcProgressToNext(points, levelDef) {
  if (!levelDef) return 0;
  if (!Number.isFinite(points)) return 0;
  if (levelDef.max === Infinity) return 1;
  const span = levelDef.max - levelDef.min;
  if (span <= 0) return 1;
  const ratio = (points - levelDef.min) / span;
  if (!Number.isFinite(ratio)) return 0;
  return Math.max(0, Math.min(1, ratio));
}

function getNextLevelTarget(levelDef) {
  if (!levelDef) return null;
  const idx = DEFAULT_LEVELS.findIndex((lvl) => lvl.level === levelDef.level);
  if (idx === -1) return null;
  const next = DEFAULT_LEVELS[idx + 1];
  return next ? next.min : null;
}

function evaluateAchievements(context, prevUnlockedSet) {
  return ACHIEVEMENT_RULES.filter((rule) => {
    if (prevUnlockedSet.has(rule.id)) return false;
    try {
      return !!rule.predicate(context);
    } catch (error) {
      console.warn(`[Gamification] Error evaluating achievement ${rule.id}`, error);
      return false;
    }
  });
}

function serializeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return ts;
}

function mapAchievementRecord(id, record = {}) {
  const fallback = ACHIEVEMENT_RULES.find((rule) => rule.id === id);
  return {
    id,
    name: record.name || fallback?.name || 'Logro desbloqueado',
    description: record.description || fallback?.description || '',
    unlockedAt: serializeTimestamp(record.unlockedAt || record.lastUnlockedAt),
    source: record.source || 'rule',
  };
}

function mapEventRecord(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    uid: data.uid,
    eventType: data.eventType,
    pointsAwarded: data.pointsAwarded || 0,
    totalPointsAfter: data.totalPointsAfter || 0,
    levelAfter: data.levelAfter || 1,
    meta: data.meta || {},
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export async function awardPoints(weddingId, uid, eventType, meta = {}) {
  if (!FIREBASE_AVAILABLE) return { success: false, disabled: true };
  if (!weddingId) throw new Error('weddingId requerido');
  if (!uid) throw new Error('uid requerido');
  if (!eventType || typeof eventType !== 'string') throw new Error('eventType requerido');

  const normalizedEventType = eventType.trim();
  const userRef = userGamDoc(weddingId, uid);
  const achievementsRef = userAchievementsDoc(weddingId, uid);
  const eventsRef = weddingEventsCollection(weddingId).doc();
  const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

  const result = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(userRef);
    const base = snapshot.exists ? snapshot.data() : { ...DEFAULT_STATE };

    const counters = { ...(base.counters || {}) };
    counters[normalizedEventType] = (counters[normalizedEventType] || 0) + 1;

    const addPoints = POINT_SYSTEM[normalizedEventType] ?? 0;
    const totalPoints = (base.totalPoints || 0) + addPoints;
    const levelDef = calcLevel(totalPoints);
    const progressToNext = calcProgressToNext(totalPoints, levelDef);

    const prevUnlockedSet = new Set(
      Array.isArray(base.milestonesUnlocked) ? base.milestonesUnlocked : []
    );
    const evaluationContext = {
      totalPoints,
      counters,
      lastEventType: normalizedEventType,
      lastEventMeta: meta,
    };

    const newlyUnlocked = evaluateAchievements(evaluationContext, prevUnlockedSet);
    const unlockedSet = new Set(prevUnlockedSet);
    newlyUnlocked.forEach((def) => unlockedSet.add(def.id));
    const milestonesUnlocked = Array.from(unlockedSet);

    const userPayload = {
      totalPoints,
      level: levelDef.level,
      levelName: levelDef.name,
      progressToNext,
      counters,
      milestonesUnlocked,
      nextLevelTarget: getNextLevelTarget(levelDef),
      lastEvent: {
        type: normalizedEventType,
        meta,
        pointsAwarded: addPoints,
        createdAt: serverTimestamp,
      },
      updatedAt: serverTimestamp,
    };

    tx.set(userRef, userPayload, { merge: true });

    if (newlyUnlocked.length > 0) {
      const achievementsSnap = await tx.get(achievementsRef);
      const existingItems = achievementsSnap.exists ? achievementsSnap.data()?.items || {} : {};
      const updatedItems = { ...existingItems };

      newlyUnlocked.forEach((def) => {
        if (existingItems && existingItems[def.id]) {
          updatedItems[def.id] = {
            ...existingItems[def.id],
            name: def.name,
            description: def.description,
            lastUnlockedAt: serverTimestamp,
            source: def.source || 'rule',
          };
        } else {
          updatedItems[def.id] = {
            id: def.id,
            name: def.name,
            description: def.description,
            unlockedAt: serverTimestamp,
            source: def.source || 'rule',
          };
        }
      });

      tx.set(
        achievementsRef,
        {
          items: updatedItems,
          lastUpdated: serverTimestamp,
        },
        { merge: true }
      );
    }

    tx.set(eventsRef, {
      uid: String(uid),
      eventType: normalizedEventType,
      pointsAwarded: addPoints,
      totalPointsAfter: totalPoints,
      levelAfter: levelDef.level,
      meta,
      createdAt: serverTimestamp,
    });

    return {
      totalPoints,
      level: levelDef.level,
      levelName: levelDef.name,
      added: addPoints,
      progressToNext,
      milestonesUnlocked,
      newlyUnlocked: newlyUnlocked.map((def) => def.id),
      nextLevelTarget: getNextLevelTarget(levelDef),
    };
  });

  return result;
}

export async function getStats(weddingId, uid, { historyLimit = 10 } = {}) {
  if (!FIREBASE_AVAILABLE) return null;
  if (!weddingId) throw new Error('weddingId requerido');
  if (!uid) throw new Error('uid requerido');

  try {
    const snapshot = await userGamDoc(weddingId, uid).get();
    const base = snapshot.exists ? snapshot.data() : null;
    const totalPoints = base?.totalPoints || 0;
    const levelDef = calcLevel(totalPoints);
    const progressToNext =
      typeof base?.progressToNext === 'number'
        ? base.progressToNext
        : calcProgressToNext(totalPoints, levelDef);

    const stats = {
      totalPoints,
      level: base?.level || levelDef.level,
      levelName: base?.levelName || levelDef.name,
      progressToNext,
      milestonesUnlocked: Array.isArray(base?.milestonesUnlocked) ? base.milestonesUnlocked : [],
      counters: base?.counters || {},
      nextLevelTarget: base?.nextLevelTarget || getNextLevelTarget(levelDef),
      lastEvent: base?.lastEvent
        ? {
            ...base.lastEvent,
            createdAt: serializeTimestamp(base.lastEvent.createdAt),
          }
        : null,
      updatedAt: serializeTimestamp(base?.updatedAt),
      history: [],
    };

    // Intentar obtener historial, pero no fallar si hay error
    if (historyLimit > 0) {
      try {
        stats.history = await getEvents(weddingId, uid, historyLimit);
      } catch (historyError) {
        console.warn(
          '[getStats] Error obteniendo historial (usando fallback):',
          historyError.message
        );
        stats.history = [];
      }
    }

    return stats;
  } catch (error) {
    console.error('[getStats] Error obteniendo stats:', error);
    // Si no existe el documento, retornar estado por defecto en lugar de error
    if (error.code === 'not-found' || error.message?.includes('not found')) {
      console.info('[getStats] Documento no existe, retornando estado por defecto');
      return DEFAULT_STATE;
    }
    throw error;
  }
}

export async function getAchievements(weddingId, uid) {
  if (!FIREBASE_AVAILABLE) return [];
  if (!weddingId) throw new Error('weddingId requerido');
  if (!uid) throw new Error('uid requerido');

  const snapshot = await userAchievementsDoc(weddingId, uid).get();
  if (!snapshot.exists) return [];

  const items = snapshot.data()?.items || {};
  return Object.keys(items)
    .map((key) => mapAchievementRecord(key, items[key]))
    .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''));
}

export async function getEvents(weddingId, uid, limit = 20) {
  if (!FIREBASE_AVAILABLE) return [];
  if (!weddingId) throw new Error('weddingId requerido');

  const sanitizedLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
  let query = weddingEventsCollection(weddingId);

  if (uid) {
    query = query.where('uid', '==', String(uid));
  }

  query = query.orderBy('createdAt', 'desc').limit(sanitizedLimit);

  try {
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => mapEventRecord(doc));
  } catch (error) {
    // Si falla por índice faltante, intentar sin orderBy
    if (
      error.code === 9 ||
      error.message?.includes('index') ||
      error.message?.includes('FAILED_PRECONDITION')
    ) {
      console.warn('[getEvents] Índice faltante, intentando query simple:', error.message);
      try {
        // Query simple sin orderBy
        let fallbackQuery = weddingEventsCollection(weddingId);
        if (uid) {
          fallbackQuery = fallbackQuery.where('uid', '==', String(uid));
        }
        fallbackQuery = fallbackQuery.limit(sanitizedLimit);

        const fallbackSnapshot = await fallbackQuery.get();
        const events = fallbackSnapshot.docs.map((doc) => mapEventRecord(doc));
        // Ordenar en memoria
        return events.sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      } catch (fallbackError) {
        console.error('[getEvents] Error en query fallback:', fallbackError);
        return [];
      }
    }
    console.error('[getEvents] Error obteniendo eventos:', error);
    return [];
  }
}
