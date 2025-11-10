import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

/**
 * Servicio de comentarios internos por correo.
 * Sincroniza contra Firestore cuando está disponible y mantiene un fallback local.
 */

const COMMENTS_KEY_PREFIX = 'maloveapp_email_comments_';

const getStorageKey = (userId) => `${COMMENTS_KEY_PREFIX}${userId}`;

const safeLocalStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {}
  return null;
};

const loadAllComments = (userId) => {
  const store = safeLocalStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Error leyendo comentarios de localStorage', error);
    return {};
  }
};

const saveAllComments = (userId, mapping) => {
  const store = safeLocalStorage();
  if (!store) return;
  try {
    store.setItem(getStorageKey(userId), JSON.stringify(mapping));
  } catch (error) {
    console.error('Error guardando comentarios de localStorage', error);
  }
};

const generateId = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const hasFirestore = () => Boolean(db);

const mapCloudComment = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    authorId: data.authorId || '',
    authorName: data.authorName || 'Usuario',
    body: data.body || '',
    date: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || new Date().toISOString(),
  };
};

export async function getComments(userId, emailId) {
  if (!userId || !emailId) return [];

  const local = loadAllComments(userId)[emailId] || [];
  if (!hasFirestore()) return local;

  try {
    const ref = collection(db, 'users', userId, 'emailComments', emailId, 'comments');
    const snap = await getDocs(query(ref, orderBy('createdAt', 'asc')));
    const comments = snap.docs.map(mapCloudComment);
    if (comments.length) {
      const mapping = loadAllComments(userId);
      mapping[emailId] = comments;
      saveAllComments(userId, mapping);
    }
    return comments.length ? comments : local;
  } catch (error) {
    console.warn('getComments fallback to local', error?.message || error);
    return local;
  }
}

export async function addComment(userId, emailId, comment) {
  if (!userId || !emailId) return [];
  const payload = {
    id: generateId(),
    ...comment,
    date: new Date().toISOString(),
  };

  if (hasFirestore()) {
    try {
      const ref = collection(db, 'users', userId, 'emailComments', emailId, 'comments');
      await addDoc(ref, {
        authorId: payload.authorId || '',
        authorName: payload.authorName || 'Usuario',
        body: payload.body || '',
        createdAt: serverTimestamp(),
      });
      return getComments(userId, emailId);
    } catch (error) {
      console.warn('addComment Firestore failed, using local fallback', error?.message || error);
    }
  }

  const mapping = loadAllComments(userId);
  if (!mapping[emailId]) mapping[emailId] = [];
  mapping[emailId].push(payload);
  saveAllComments(userId, mapping);
  return mapping[emailId];
}

export async function deleteComment(userId, emailId, commentId) {
  if (!userId || !emailId || !commentId) return [];

  if (hasFirestore()) {
    try {
      const ref = doc(db, 'users', userId, 'emailComments', emailId, 'comments', commentId);
      await deleteDoc(ref);
      return getComments(userId, emailId);
    } catch (error) {
      console.warn('deleteComment Firestore failed, using local fallback', error?.message || error);
    }
  }

  const mapping = loadAllComments(userId);
  if (!mapping[emailId]) return [];
  mapping[emailId] = mapping[emailId].filter((c) => c.id !== commentId);
  saveAllComments(userId, mapping);
  return mapping[emailId];
}

