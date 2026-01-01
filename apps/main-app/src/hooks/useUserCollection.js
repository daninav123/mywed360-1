/**
 * @deprecated Este hook usa Firebase Firestore.
 * Este hook se eliminará en futuras versiones.
 */
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';

import { auth, db } from '../firebaseConfig';
import {
  addItem as addItemFS,
  updateItem as updateItemFS,
  deleteItem as deleteItemFS,
} from '../utils/firestoreCollection';

const localKey = (name) => `mywed360User_${name}`;
const lsGet = (name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (name, data) => {
  localStorage.setItem(localKey(name), JSON.stringify(data));
  window.dispatchEvent(new Event(`mywed360-user-${name}`));
};

// Hook de colección bajo users/{uid}/{collectionName}
export function useUserCollection(collectionName, fallback = []) {
  const [data, setData] = useState(() => lsGet(collectionName, fallback));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFS = null;
    const init = (uid) => {
      const q = query(collection(db, 'users', uid, collectionName), orderBy('createdAt', 'asc'));
      unsubFS = onSnapshot(
        q,
        (snap) => {
          const arr = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          setData(arr);
          lsSet(collectionName, arr);
          setLoading(false);
        },
        () => {
          setData(lsGet(collectionName, fallback));
          setLoading(false);
        }
      );
    };

    const uid = auth?.currentUser?.uid;
    if (uid) {
      init(uid);
      return () => {
        if (typeof unsubFS === 'function') unsubFS();
      };
    }

    // Si no hay auth disponible, usar fallback
    if (!auth) {
      setData(lsGet(collectionName, fallback));
      setLoading(false);
      return;
    }

    const handler = () => setData(lsGet(collectionName, fallback));
    window.addEventListener(`mywed360-user-${collectionName}`, handler);
    setLoading(false);
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        init(user.uid);
        if (Array.isArray(data) && data.length) {
          data.forEach((item) => addItemFS(collectionName, item).catch(() => {}));
        }
      }
    });
    return () => {
      window.removeEventListener(`mywed360-user-${collectionName}`, handler);
      unsubAuth();
      if (typeof unsubFS === 'function') unsubFS();
    };
  }, [collectionName, fallback]);

  const addItem = useCallback(
    async (item) => {
      if (auth.currentUser?.uid) {
        await addItemFS(collectionName, item);
      } else {
        const next = [...data, { ...item, id: Date.now() }];
        setData(next);
        lsSet(collectionName, next);
      }
    },
    [collectionName, data]
  );

  const updateItem = useCallback(
    async (id, changes) => {
      if (auth.currentUser?.uid) {
        await updateItemFS(collectionName, id, changes);
        const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
        setData(next);
        lsSet(collectionName, next);
      } else {
        const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
        setData(next);
        lsSet(collectionName, next);
      }
    },
    [collectionName, data]
  );

  const deleteItem = useCallback(
    async (id) => {
      if (auth.currentUser?.uid) {
        await deleteItemFS(collectionName, id);
        const next = data.filter((d) => d.id !== id);
        setData(next);
        lsSet(collectionName, next);
      } else {
        const next = data.filter((d) => d.id !== id);
        setData(next);
        lsSet(collectionName, next);
      }
    },
    [collectionName, data]
  );

  return { data, loading, addItem, updateItem, deleteItem };
}
