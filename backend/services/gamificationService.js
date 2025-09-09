// Gamification Service - puntos, niveles y logros básicos
// Esquema: weddings/{weddingId}/gamification/{uid}

import admin from 'firebase-admin';

const userGamDoc = (weddingId, uid) => admin.firestore()
  .collection('weddings').doc(String(weddingId))
  .collection('gamification').doc(String(uid));

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

function calcLevel(points) {
  for (const l of DEFAULT_LEVELS) {
    if (points >= l.min && points <= l.max) return { level: l.level, name: l.name };
  }
  return { level: 7, name: 'Leyenda Nupcial' };
}

export async function awardPoints(weddingId, uid, eventType, meta = {}) {
  if (!weddingId || !uid) throw new Error('weddingId y uid requeridos');
  const ref = userGamDoc(weddingId, uid);
  const snap = await ref.get();
  const base = snap.exists ? snap.data() : { totalPoints: 0, achievements: [], streaks: { current: 0, longest: 0, lastActivity: null } };
  const add = POINT_SYSTEM[eventType] || 0;
  const total = (base.totalPoints || 0) + add;
  const lvl = calcLevel(total);
  await ref.set({
    totalPoints: total,
    level: lvl.level,
    levelName: lvl.name,
    lastEvent: { type: eventType, at: admin.firestore.FieldValue.serverTimestamp(), meta },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { totalPoints: total, level: lvl.level, levelName: lvl.name, added: add };
}

export async function getStats(weddingId, uid) {
  const ref = userGamDoc(weddingId, uid);
  const snap = await ref.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : { totalPoints: 0, level: 1, levelName: 'Novato' };
}

export async function getAchievements(weddingId, uid) {
  const ref = userGamDoc(weddingId, uid);
  const snap = await ref.get();
  return snap.exists ? (snap.data().achievements || []) : [];
}
