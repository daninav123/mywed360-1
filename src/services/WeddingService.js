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
} from 'firebase/firestore';
import { collectionGroup, documentId } from 'firebase/firestore';
import { query, where, getDocs, limit } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import { db } from '../firebaseConfig';

/**
 * Crea una nueva boda y asigna al usuario como propietario principal.
 * @param {string} uid - UID del usuario creador.
 * @param {object} [extraData] - Datos opcionales de la boda (fecha, nombre...)
 * @returns {Promise<string>} weddingId creado
 */
export async function createWedding(uid, extraData = {}) {
  if (!uid) throw new Error('uid requerido');
  const weddingId = uuidv4();
  const ref = doc(db, 'weddings', weddingId);
  const base = {
    ownerIds: [uid],
    plannerIds: [],
    subscription: { tier: 'free', renewedAt: Timestamp.now() },
    createdAt: Timestamp.now(),
    ...extraData,
  };
  await setDoc(ref, base);
  // Inicializar subcolección de finanzas
  try {
    const financeRef = doc(db, 'weddings', weddingId, 'finance', 'main');
    await setDoc(financeRef, { movements: [], createdAt: Timestamp.now() }, { merge: true });
  } catch (e) {
    console.warn('No se pudo inicializar finance/main para', weddingId, e);
  }
  // Guardar enlace rápido en el perfil del usuario (crea si no existe)
  await setDoc(doc(db, 'users', uid), { weddingId }, { merge: true });

  // Registrar la boda en la subcolección users/{uid}/weddings para que WeddingContext la cargue
  try {
    const subRef = doc(db, 'users', uid, 'weddings', weddingId);
    await setDoc(
      subRef,
      {
        id: weddingId,
        name: base.name || 'Boda',
        weddingDate: base.weddingDate || '',
        location: base.location || base.banquetPlace || '',
        progress: base.progress ?? 0,
        active: base.active ?? true,
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('No se pudo registrar la boda en users/{uid}/weddings:', e);
  }

  // Seed de tareas predeterminadas (padres en Gantt, subtareas en lista)
  try {
    await seedDefaultTasksForWedding(weddingId, base);
  } catch (e) {
    console.warn('No se pudieron crear las tareas predeterminadas para', weddingId, e);
  }
  return weddingId;
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

async function seedDefaultTasksForWedding(weddingId, weddingData) {
  if (!weddingId) return;
  // Evitar doble seed
  const seedRef = doc(db, 'weddings', weddingId, 'tasks', '__seed__');
  const seedSnap = await getDoc(seedRef).catch(() => null);
  if (seedSnap && seedSnap.exists()) return;

  const startBase = toDateSafe(weddingData?.createdAt) || new Date();
  const endBase = toDateSafe(weddingData?.weddingDate) || new Date(startBase.getFullYear(), startBase.getMonth() + 12, startBase.getDate());
  const span = Math.max(1, endBase.getTime() - startBase.getTime());
  const at = (p) => new Date(startBase.getTime() + span * p);

  const blocks = [
    { key: 'A', name: 'Fundamentos', p0: 0.0, p1: 0.2, items: [
      'Difundir la noticia y organizar la planificación (perfil, invitar pareja, anillo, presupuesto inicial)',
      'Crear primera versión de la lista de invitados',
      'Investigar lugares de celebración y comenzar visitas',
      'Decidir cortejo nupcial',
    ]},
    { key: 'B', name: 'Proveedores Clave', p0: 0.1, p1: 0.8, items: [
      'Fotografía → contacto inicial pronto, cierre de contrato a mitad del proceso',
      'Videografía → decisión temprana, reuniones finales hacia el final',
      'Catering → investigación inicial, prueba de menú, cierre cercano a la boda',
      'Florista → inspiración y primeras ideas, confirmación en la fase final',
      'Música → banda/DJ reservados pronto, reunión final más tarde',
      'Repostería → búsqueda inicial, prueba de sabores meses después, pedido final cerca de la boda',
    ]},
    { key: 'C', name: 'Vestuario y Moda', p0: 0.15, p1: 0.9, items: [
      'Novia → visitas iniciales, decisión intermedia, pruebas finales en los últimos meses',
      'Novio → compra traje en mitad del proceso, ajustes finales poco antes',
      'Cortejo → definir vestidos/trajes, confirmar tallas y ajustes finales más tarde',
    ]},
    { key: 'D', name: 'Estilo y Detalles', p0: 0.2, p1: 0.95, items: [
      'Invitaciones digitales y save-the-dates (inicio medio)',
      'Invitaciones físicas y papelería (fase intermedia)',
      'Decoración y DIY (se puede trabajar meses antes y ultimar al final)',
      'Recuerdos y regalos (elección temprana, cierre antes del evento)',
    ]},
    { key: 'E', name: 'Organización y Logística', p0: 0.3, p1: 1.0, items: [
      'Transporte (se puede definir pronto, confirmar al final)',
      'Extras y básicos del día (ir acumulando, revisión final cercana a la boda)',
      'Confirmaciones con proveedores (últimas semanas)',
      'Plan B clima (al final)',
      'Ensayo general (última fase)',
    ]},
    { key: 'F', name: 'Celebraciones y Emociones', p0: 0.4, p1: 0.95, items: [
      'Eventos adicionales (preboda, brunch…)',
      'Despedidas (planificación antes, celebración final)',
      'Votos y discursos (escribir con calma, repasar justo antes)',
    ]},
    { key: 'G', name: 'Belleza y Cuidado', p0: 0.6, p1: 0.95, items: [
      'Reservas peluquería/maquillaje con antelación',
      'Pruebas intermedias',
      'Rutinas de cuidado personal (últimos meses)',
    ]},
    { key: 'H', name: 'Anillos y Luna de Miel', p0: 0.7, p1: 1.0, items: [
      'Comprar anillos (se puede hacer pronto, recoger justo antes)',
      'Planificar luna de miel (elección pronto, reservas intermedias, maletas al final)',
    ]},
    { key: 'I', name: 'Después de la Boda', p0: 1.0, p1: 1.05, items: [
      'Disfrutar inicio del matrimonio',
      'Organizar álbum y recuerdos',
    ]},
  ];

  const colRef = collection(db, 'weddings', weddingId, 'tasks');
  for (const b of blocks) {
    const parent = {
      title: b.name,
      name: b.name,
      type: 'task',
      start: at(b.p0),
      end: at(b.p1),
      progress: 0,
      isDisabled: false,
      createdAt: Timestamp.now(),
      category: 'OTROS',
    };
    const pDoc = await addDoc(colRef, parent);
    await setDoc(pDoc, { id: pDoc.id }, { merge: true });
    for (const item of b.items) {
      const s = at(b.p0 + Math.random() * (b.p1 - b.p0) * 0.6);
      const tentativeEnd = at(Math.min(b.p1, b.p0 + 0.4 + Math.random() * (b.p1 - b.p0) * 0.5));
      const e = tentativeEnd.getTime() < s.getTime() ? new Date(s.getTime() + 3 * 24 * 60 * 60 * 1000) : tentativeEnd;
      const sub = {
        title: item,
        name: item,
        parentId: pDoc.id,
        weddingId,
        start: s,
        end: e,
        progress: 0,
        isDisabled: false,
        createdAt: Timestamp.now(),
        category: 'OTROS',
      };
      const subCol = collection(db, 'weddings', weddingId, 'tasks', pDoc.id, 'subtasks');
      const sDoc = await addDoc(subCol, sub);
      await setDoc(sDoc, { id: sDoc.id }, { merge: true });
    }
  }
  await setDoc(seedRef, { seededAt: Timestamp.now(), version: 1 }, { merge: true });
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
      // Opcional: marcar en origen para evitar re-migración
      await setDoc(
        doc(db, 'weddings', weddingId, 'tasks', snap.id),
        { migratedToNested: true },
        { merge: true }
      );
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
    await updateDoc(wedRef, { plannerIds: arrayUnion(uid) });
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
      console.warn('No se pudo vincular la boda en users/{uid}/weddings:', e);
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
  await updateDoc(wedRef, { plannerIds: arrayUnion(plannerUid) });
  // Opcional: guardar referencia de bodas que gestiona el planner
  await updateDoc(doc(db, 'users', plannerUid), { plannerWeddingIds: arrayUnion(weddingId) });
  return true;
}
