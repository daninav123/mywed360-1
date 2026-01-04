// Servicio para gestionar bodas y vincular cuentas (novios y planners)
// Cada documento en la colección "weddings" representa una boda.
// Estructura mínima de un doc:
// {
//   ownerIds: [uid1, uid2],   // novios con acceso total
//   plannerIds: [uid3, ...],  // planners que gestionan varias bodas
//   subscription: {
//     tier: 'free' | 'premium',
//     renewedAt: Timestamp
//   },
//   createdAt: Timestamp
// }

import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
  collection,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { collectionGroup, documentId } from 'firebase/firestore';
import { query, where, getDocs, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../firebaseConfig';
import { performanceMonitor } from './PerformanceMonitor';
import { seedWeddingTasksFromTemplate } from './taskTemplateSeeder';
import { syncWeddingWithCRM } from './crmSyncService';
import { personalizeTaskTemplate, buildWeddingContext } from './taskPersonalizationService';

const DEFAULT_EVENT_TYPE = 'boda';

// Determina el límite de bodas permitidas por tier de planner
function plannerLimitForTier(tier) {
  const t = String(tier || '').toLowerCase();
  if (!t) return 5;
  if (t.includes('unlimit') || t.includes('ilimit')) return Number.POSITIVE_INFINITY;
  if (t.includes('teams')) return 40; // Teams Wedding Planner
  if (t.includes('2')) return 10; // Wedding Planner 2
  if (t.includes('1') || t.includes('planner')) return 5; // Wedding Planner 1 (por defecto)
  return 5;
}

const normalizeEventType = (raw) => {
  if (typeof raw === 'string') {
    const trimmed = raw.trim().toLowerCase();
    return trimmed || DEFAULT_EVENT_TYPE;
  }
  return DEFAULT_EVENT_TYPE;
};

const sanitizeRelatedEvents = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
};

const sanitizeEventProfile = (rawProfile, eventType) => {
  const profile = rawProfile && typeof rawProfile === 'object' ? { ...rawProfile } : {};
  return {
    guestCountRange: profile.guestCountRange || null,
    formalityLevel: profile.formalityLevel || null,
    ceremonyType: eventType === 'boda' ? profile.ceremonyType || null : null,
    relatedEvents: sanitizeRelatedEvents(profile.relatedEvents),
    notes: typeof profile.notes === 'string' ? profile.notes.trim() : '',
  };
};

const sanitizePreferences = (rawPreferences) => {
  if (!rawPreferences || typeof rawPreferences !== 'object') return {};
  const { style, ...rest } = rawPreferences;
  return {
    ...rest,
    style: typeof style === 'string' ? style.trim() : style || null,
  };
};

const buildEventProfileSummary = (eventType, eventProfile, preferences) => ({
  eventType,
  guestCountRange: eventProfile?.guestCountRange || null,
  formalityLevel: eventProfile?.formalityLevel || null,
  ceremonyType: eventType === 'boda' ? eventProfile?.ceremonyType || null : null,
  style: preferences?.style || null,
});

/**
 * Crea una nueva boda y asigna al usuario como propietario principal.
 * MIGRADO A POSTGRESQL
 * @param {string} uid - UID del usuario creador.
 * @param {object} [extraData] - Datos opcionales de la boda (fecha, nombre...)
 * @returns {Promise<string>} weddingId creado
 */
export async function createWedding(uid, extraData = {}) {
  if (!uid) throw new Error('uid requerido');
  
  console.log('[WeddingService] Creando boda en PostgreSQL para user:', uid);
  
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    const response = await fetch(`${API_URL}/api/weddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coupleName: extraData.name || 'Mi Boda',
        weddingDate: extraData.weddingDate || extraData.date || null,
        celebrationPlace: extraData.location || extraData.banquetPlace || null,
        status: 'planning',
        numGuests: extraData.numGuests || null,
        eventType: extraData.eventType || 'boda',
        ...extraData
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando boda');
    }
    
    const result = await response.json();
    const weddingId = result.data.id;
    
    console.log('[WeddingService] Boda creada en PostgreSQL:', weddingId);
    
    // Telemetría
    try {
      performanceMonitor?.logEvent?.('wedding_created_postgresql', {
        weddingId,
        userId: uid,
        source: 'WeddingService'
      });
    } catch {}
    
    return weddingId;
  } catch (error) {
    console.error('[WeddingService] Error creando boda:', error);
    throw error;
  }
}

export async function updateWeddingModulePermissions(weddingId, modulePermissions = {}) {
  if (!weddingId) throw new Error('weddingId requerido');
  await updateDoc(doc(db, 'weddings', weddingId), {
    modulePermissions,
    updatedAt: Timestamp.now(),
  });
  return true;
}

// Helpers internos
function toDateSafe(raw) {
  try {
    if (!raw) return null;
    if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
    if (typeof raw?.toDate === 'function') {
      const d = raw.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === 'object' && typeof raw.seconds === 'number') {
      const d = new Date(raw.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === 'number') {
      const d = new Date(raw < 1e12 ? raw * 1000 : raw);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof raw === 'string') {
      const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ymd) {
        const y = parseInt(ymd[1], 10);
        const mo = parseInt(ymd[2], 10) - 1;
        const da = parseInt(ymd[3], 10);
        const local = new Date(y, mo, da, 0, 0, 0, 0);
        return isNaN(local.getTime()) ? null : local;
      }
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function addMonths(base, delta) {
  try {
    const d = base instanceof Date ? new Date(base.getTime()) : new Date(base);
    if (isNaN(d)) return new Date();
    const targetMonthIndex = d.getMonth() + delta;
    const targetYear = d.getFullYear() + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    const day = Math.min(d.getDate(), lastDay);
    return new Date(targetYear, targetMonth, day, d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  } catch {
    return base;
  }
}

export async function seedDefaultTasksForWedding(weddingId, weddingData) {
  if (!weddingId || !db) return;
  let projectEnd = null;
  if (weddingData?.eventDate instanceof Timestamp) {
    projectEnd = weddingData.eventDate.toDate();
  } else if (weddingData?.eventDate instanceof Date) {
    projectEnd = weddingData.eventDate;
  } else if (weddingData?.weddingDate instanceof Timestamp) {
    projectEnd = weddingData.weddingDate.toDate();
  } else if (weddingData?.weddingDate instanceof Date) {
    projectEnd = weddingData.weddingDate;
  }

  // 🤖 NUEVO: Intentar personalización con IA primero
  let personalizedTemplate = null;
  try {
    const weddingContext = buildWeddingContext(weddingData);
    console.log('🤖 [WeddingService] Personalizando tareas con IA...', weddingContext);
    
    const result = await personalizeTaskTemplate(weddingContext);
    
    if (result.success && result.template) {
      personalizedTemplate = result.template;
      console.log('✅ [WeddingService] Plantilla personalizada con IA:', {
        personalized: result.personalized,
        usedAI: result.usedAI,
        blocks: result.template.blocks?.length || 0,
      });
      
      // Registrar telemetría
      try {
        performanceMonitor?.logEvent?.('task_template_personalized', {
          weddingId,
          usedAI: result.usedAI,
          personalized: result.personalized,
          blocksCount: result.template.blocks?.length || 0,
          ceremonyType: weddingContext.ceremonyType,
          leadTimeMonths: weddingContext.leadTimeMonths,
        });
      } catch {}
    } else {
      console.warn('⚠️ [WeddingService] Personalización IA falló, usando plantilla genérica');
    }
  } catch (error) {
    console.warn('⚠️ [WeddingService] Error en personalización IA:', error);
  }

  try {
    await seedWeddingTasksFromTemplate({
      db,
      weddingId,
      projectEnd,
      skipIfSeeded: true,
      customTemplate: personalizedTemplate, // ✨ Usar plantilla personalizada si existe
    });
  } catch (error) {
    // console.warn('[WeddingService] seed default tasks failed', error);
  }
}

/**
 * Migra subtareas planas (weddings/{id}/tasks con type === 'subtask')
 * al modelo anidado weddings/{id}/tasks/{parentId}/subtasks/{id}.
 * No elimina las subtareas planas; marca migratedAt.
 */
export async function migrateFlatSubtasksToNested(weddingId) {
  if (!weddingId || !db) return { moved: 0 };
  const all = await getDocs(collection(db, 'weddings', weddingId, 'tasks')).catch(() => null);
  if (!all) return { moved: 0 };
  let moved = 0;
  for (const snap of all.docs) {
    try {
      const data = snap.data() || {};
      if (String(data?.type || '') !== 'subtask') continue;
      const parentId = String(data?.parentId || '');
      if (!parentId) continue;
      const subCol = collection(db, 'weddings', weddingId, 'tasks', parentId, 'subtasks');
      const subRef = doc(subCol, snap.id);
      await setDoc(
        subRef,
        {
          ...data,
          id: snap.id,
          weddingId,
          migratedAt: Timestamp.now(),
        },
        { merge: true }
      );
      moved++;
      // Eliminar la subtarea plana original tras migrar (limpieza)
      try {
        await deleteDoc(doc(db, 'weddings', weddingId, 'tasks', snap.id));
      } catch (_) {
        // Si no se puede borrar, al menos marcar como migrada
        await setDoc(
          doc(db, 'weddings', weddingId, 'tasks', snap.id),
          { migratedToNested: true },
          { merge: true }
        );
      }
    } catch (_) {}
  }
  return { moved };
}

/**
 * Crea una invitación para otro novio/a.
 * @param {string} weddingId
 * @param {string} email
 * @returns {Promise<string>} invitationCode
 */
export async function invitePartner(weddingId, email) {
  return createInvitation(weddingId, email, 'partner');
}

/**
 * Crea una invitación para un wedding planner.
 * @param {string} weddingId
 * @param {string} email
 * @returns {Promise<string>} invitationCode
 */
export async function invitePlanner(weddingId, email) {
  return createInvitation(weddingId, email, 'planner');
}

async function createInvitation(weddingId, email, role) {
  if (!weddingId || !email) throw new Error('parámetros requeridos');
  const code = uuidv4();
  const invRef = doc(db, 'weddings', weddingId, 'weddingInvitations', code);
  await setDoc(invRef, {
    code,
    weddingId,
    email: email.toLowerCase(),
    role, // 'partner' | 'planner'
    createdAt: Timestamp.now(),
  });
  return code;
}

/**
 * Acepta una invitación (partner o planner) y agrega el uid al array correspondiente.
 * @param {string} code - invitation code
 * @param {string} uid  - usuario que acepta
 */
export async function acceptInvitation(code, uid) {
  if (!code || !uid) throw new Error('parámetros requeridos');
  // Buscar código en cualquier boda usando collectionGroup
  const q = query(
    collectionGroup(db, 'weddingInvitations'),
    where(documentId(), '==', code)
  );
  const res = await getDocs(q);
  if (res.empty) throw new Error('Invitación no encontrada');
  const snap = res.docs[0];
  const { weddingId, role } = snap.data();
  const invRef = snap.ref;
  const wedRef = doc(db, 'weddings', weddingId);
  if (role === 'partner') {
    await updateDoc(wedRef, { ownerIds: arrayUnion(uid) });
  } else if (role === 'planner') {
    // Validación de límites por tier del planner antes de añadirlo
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      const u = userSnap.exists() ? (userSnap.data() || {}) : {};
      const tier = u?.subscription?.tier || 'wedding_planner_1';
      const limit = plannerLimitForTier(tier);
      let current = Array.isArray(u?.plannerWeddingIds) ? u.plannerWeddingIds.length : 0;
      try {
        const q2 = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', uid));
        const snap2 = await getDocs(q2);
        current = snap2.size;
      } catch {}
      if (current >= limit) {
        const err = new Error('planner_limit_exceeded');
        err.code = 'planner_limit_exceeded';
        throw err;
      }
    } catch (e) {
      if ((e && (e.code === 'planner_limit_exceeded' || String(e.message) === 'planner_limit_exceeded'))) throw e;
    }

    await updateDoc(wedRef, { plannerIds: arrayUnion(uid) });
    // Registrar referencia en el perfil del planner
    try {
      await updateDoc(doc(db, 'users', uid), { plannerWeddingIds: arrayUnion(weddingId) });
    } catch {}
  }
  // Guardar weddingId en perfil de usuario si es partner
  if (role === 'partner') {
    await setDoc(doc(db, 'users', uid), { weddingId }, { merge: true });
    // Vincular en subcolección del usuario
    try {
      const wedSnap = await getDoc(wedRef);
      const wdata = wedSnap.exists() ? wedSnap.data() : {};
      await setDoc(
        doc(db, 'users', uid, 'weddings', weddingId),
        {
          id: weddingId,
          name: wdata.name || 'Boda',
          weddingDate: wdata.weddingDate || '',
          location: wdata.location || wdata.banquetPlace || '',
          progress: wdata.progress ?? 0,
          active: wdata.active ?? true,
          createdAt: Timestamp.now(),
        },
        { merge: true }
      );
    } catch (e) {
      // console.warn('No se pudo vincular la boda en users/{uid}/weddings:', e);
    }
  }
  // eliminar invitación o marcar como aceptada
  await setDoc(invRef, { acceptedAt: Timestamp.now() }, { merge: true });
  return weddingId;
}

/**
 * Conecta directamente la cuenta de un Wedding Planner con la boda indicada (sin invitación).
 * Solo debe ser usada por el propietario de la boda o un administrador.
 * @param {string} weddingId
 * @param {string} plannerUid
 */
/**
 * Devuelve el primer weddingId donde el usuario es owner.
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
export async function getWeddingIdForOwner(uid) {
  const q = query(collection(db, 'weddings'), where('ownerIds', 'array-contains', uid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * Devuelve todas las bodas donde el plannerUid figura en plannerIds.
 * @param {string} plannerUid
 * @returns {Promise<Array<{id:string,name:string,weddingDate?:string,location?:string,progress?:number}>>}
 */
export async function getWeddingsForPlanner(plannerUid) {
  if (!plannerUid) return [];
  const q = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', plannerUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addPlannerToWedding(weddingId, plannerUid) {
  if (!weddingId || !plannerUid) throw new Error('parámetros requeridos');
  const wedRef = doc(db, 'weddings', weddingId);
  // Validación de límites por tier del planner
  try {
    const userSnap = await getDoc(doc(db, 'users', plannerUid));
    const u = userSnap.exists() ? (userSnap.data() || {}) : {};
    const tier = u?.subscription?.tier || 'wedding_planner_1';
    const limit = plannerLimitForTier(tier);
    let current = Array.isArray(u?.plannerWeddingIds) ? u.plannerWeddingIds.length : 0;
    try {
      const q = query(collection(db, 'weddings'), where('plannerIds', 'array-contains', plannerUid));
      const snap = await getDocs(q);
      current = snap.size;
    } catch {}
    if (current >= limit) {
      const err = new Error('planner_limit_exceeded');
      err.code = 'planner_limit_exceeded';
      throw err;
    }
  } catch (e) {
    if ((e && (e.code === 'planner_limit_exceeded' || String(e.message) === 'planner_limit_exceeded'))) throw e;
  }

  await updateDoc(wedRef, { plannerIds: arrayUnion(plannerUid) });
  // Guardar referencia de bodas que gestiona el planner
  try { await updateDoc(doc(db, 'users', plannerUid), { plannerWeddingIds: arrayUnion(weddingId) }); } catch {}
  return true;
}

/**
 * Ajusta las fechas de las tareas padre (bloques) según porcentajes fijos
 * en el intervalo [weddingDate - 12 meses, weddingDate].
 * No crea ni elimina tareas; solo actualiza start/end si existen.
 */
export async function fixParentBlockDates(weddingId, ganttStart = null, ganttEnd = null) {
  if (!weddingId) return { updated: 0 };
  // Utilidades de fechas basadas en días completos para evitar desfases DST
  const toLocalMidday = (d) => {
    try {
      const x = d instanceof Date ? d : new Date(d);
      return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 12, 0, 0, 0);
    } catch {
      return null;
    }
  };
  const diffDays = (a, b) => {
    const am = toLocalMidday(a);
    const bm = toLocalMidday(b);
    if (!am || !bm) return 0;
    const MS = 24 * 60 * 60 * 1000;
    return Math.round((bm.getTime() - am.getTime()) / MS);
  };
  const addDays = (base, days) => {
    const bm = toLocalMidday(base);
    if (!bm) return null;
    const out = new Date(bm);
    out.setDate(out.getDate() + days);
    return out;
  };

  // Determinar intervalo base: preferir proyecto (Gantt) si llega desde UI; si no, usar [weddingDate-12m, weddingDate]
  let startBase = null;
  let endBase = null;
  if (ganttStart instanceof Date && !isNaN(ganttStart)) startBase = ganttStart;
  if (ganttEnd instanceof Date && !isNaN(ganttEnd)) endBase = ganttEnd;

  if (!startBase || !endBase) {
    // Fallback: obtener weddingDate y asumir 12 meses antes
    let wDate = null;
    try {
      const snap = await getDoc(doc(db, 'weddings', weddingId));
      if (snap.exists()) {
        const data = snap.data() || {};
        const raw = data?.weddingDate || data?.weddingdate || data?.date || null;
        if (raw) wDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
      }
    } catch (_) {}
    if (!wDate) {
      try {
        const info = await getDoc(doc(db, 'weddings', weddingId, 'info', 'weddingInfo'));
        if (info.exists()) {
          const data = info.data() || {};
          const raw = data?.weddingDate || data?.weddingdate || null;
          if (raw) wDate = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
        }
      } catch (_) {}
    }
    if (!wDate || isNaN(wDate)) throw new Error('weddingDate no disponible para ' + weddingId);
    startBase = addMonths(wDate, -12);
    endBase = wDate;
  }

  const totalDays = Math.max(1, diffDays(startBase, endBase));
  const at = (p) => {
    const offset = Math.round(totalDays * p);
    return addDays(startBase, offset);
  };

  const blocks = [
    { name: 'Fundamentos', p0: 0.0, p1: 0.2 },
    { name: 'Proveedores Clave', p0: 0.1, p1: 0.8 },
    { name: 'Vestuario y Moda', p0: 0.15, p1: 0.9 },
    { name: 'Estilo y Detalles', p0: 0.2, p1: 0.95 },
    { name: 'Organización y Logística', p0: 0.3, p1: 1.0 },
    { name: 'Celebraciones y Emociones', p0: 0.4, p1: 0.95 },
    { name: 'Belleza y Cuidado', p0: 0.6, p1: 0.95 },
    { name: 'Anillos y Luna de Miel', p0: 0.7, p1: 1.0 },
    { name: 'Después de la Boda', p0: 1.0, p1: 1.05 },
  ];

  const byName = new Map(blocks.map((b) => [b.name.toLowerCase(), b]));
  const colRef = collection(db, 'weddings', weddingId, 'tasks');
  let updated = 0;
  try {
    const all = await getDocs(colRef);
    for (const d of all.docs) {
      const t = d.data() || {};
      if (String(t?.type || 'task') !== 'task') continue;
      const nm = String(t?.name || t?.title || '').trim().toLowerCase();
      const def = byName.get(nm);
      if (!def) continue;
      const s = at(def.p0);
      const eTent = at(def.p1);
      const e = eTent.getTime() < s.getTime() ? new Date(s.getTime() + 3 * 24 * 60 * 60 * 1000) : eTent;
      await updateDoc(d.ref, { start: s, end: e });
      updated++;
    }
    try {
      await setDoc(
        doc(db, 'weddings', weddingId, 'tasks', '_seed_meta'),
        { lastAlignedAt: Timestamp.now(), lastAlignedRangeStart: toLocalMidday(startBase), lastAlignedRangeEnd: toLocalMidday(endBase) },
        { merge: true }
      );
    } catch (_) {}
  } catch (e) {
    // console.warn('fixParentBlockDates error:', e);
  }
  return { updated };
}

