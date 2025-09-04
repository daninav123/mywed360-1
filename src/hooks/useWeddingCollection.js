import { useEffect, useState, useCallback } from 'react';
import { auth, db, firebaseReady } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

// Helpers para localStorage (caché offline por boda)
const localKey = (wid, name) => `lovenda_${wid}_${name}`;
const lsGet = (wid, name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(wid, name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (wid, name, data) => {
  localStorage.setItem(localKey(wid, name), JSON.stringify(data));
  window.dispatchEvent(new Event(`lovenda-${wid}-${name}`));
};

/**
 * Hook para suscribirse a subcolecciones dentro de una boda:
 * weddings/{weddingId}/{subName}
 * Soporta modo offline usando localStorage.
 */
export const useWeddingCollection = (subName, weddingId, fallback = []) => {
  const [data, setData] = useState(() => {
    try {
      return lsGet(weddingId, subName, fallback);
    } catch (error) {
      console.error('Error inicializando datos desde localStorage:', error);
      return fallback;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Asegurar inicialización completa de Firebase antes de lanzar cualquier lógica
    let isMounted = true;
    // Intento de migración automática de invitados antiguos
    async function migrateGuests() {
      // Esperar inicialización completa de Firebase
      await firebaseReady;
      if (subName !== 'guests' || !weddingId) return;
      
      // Verificar auth de forma segura - usar auth de Firebase, no el contexto local
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser?.uid) {
        console.log('Usuario no autenticado en Firebase, omitiendo migración de invitados');
        return;
      }
      
      try {
        const {
          getDocs,
          collection: col,
          writeBatch,
          doc: fDoc,
          getDoc,
        } = await import('firebase/firestore');

        const destCol = col(db, 'weddings', weddingId, 'guests');
        const destSnap = await getDocs(destCol);
        const existingIds = new Set(destSnap.docs.map((d) => d.id));

        // 1) Invitados en sub-colección antigua users/{uid}/guests
        const oldSnap = await getDocs(col(db, 'users', firebaseUser.uid, 'guests'));

        const batch = writeBatch(db);
        let writes = 0;

        oldSnap.forEach((docSnap) => {
          if (!existingIds.has(docSnap.id)) {
            batch.set(fDoc(destCol, docSnap.id), docSnap.data(), { merge: true });
            writes++; // contar escritura
          }
        });

        // 2) Invitados en documento único users/{uid}/userGuests
        const legacyDocRef = fDoc(db, 'users', firebaseUser.uid, 'userGuests');
        const legacyDocSnap = await getDoc(legacyDocRef);
        if (legacyDocSnap.exists()) {
          const legacyData = legacyDocSnap.data();
          const guestsArray = Array.isArray(legacyData?.guests) ? legacyData.guests : [];
          guestsArray.forEach((g) => {
            batch.set(fDoc(destCol), g, { merge: true }); // id aleatorio
            writes++; // contar escritura
          });
        }

        // Si hay operaciones en cola, confirmamos
        if (writes > 0) {
          await batch.commit();
          console.log(`[migración] Invitados fusionados en weddings/${weddingId}/guests`);
        }
      } catch (err) {
        console.warn('Error migrando invitados antiguos:', err);
      }
    }
    migrateGuests();
    // Intento de migración automática de proveedores antiguos
    async function migrateSuppliers() {
      // Esperar inicialización completa de Firebase
      await firebaseReady;
      if (subName !== 'suppliers' || !weddingId) return;
            // Verificar auth de forma segura - usar auth de Firebase, no el contexto local
        const firebaseUser = auth?.currentUser;
        if (!firebaseUser?.uid) {
          console.log('Usuario no autenticado en Firebase, omitiendo migración de proveedores');
          return;
        }
      
      try {
        const {
          getDocs,
          collection: col,
          writeBatch,
          doc: fDoc,
        } = await import('firebase/firestore');

        const destCol = col(db, 'weddings', weddingId, 'suppliers');
        const destSnap = await getDocs(destCol);
        const existingIds = new Set(destSnap.docs.map((d) => d.id));

        // Origen 1: usuarios/{uid}/proveedores (estructura antigua en español)
        const oldCol1 = col(db, 'usuarios', auth.currentUser.uid, 'proveedores');
        const oldSnap1 = await getDocs(oldCol1);

        // Origen 2: users/{uid}/suppliers (estructura antigua en inglés)
        const oldCol2 = col(db, 'users', auth.currentUser.uid, 'suppliers');
        const oldSnap2 = await getDocs(oldCol2);

        const batch = writeBatch(db);
        let writes = 0;
        [...oldSnap1.docs, ...oldSnap2.docs].forEach((docSnap) => {
          if (!existingIds.has(docSnap.id)) {
            batch.set(fDoc(destCol, docSnap.id), { ...docSnap.data(), migratedAt: serverTimestamp() }, { merge: true });
          writes++; // contar escritura
          }
        });

        if (writes > 0) {
          await batch.commit();
          console.log(`[migración] Proveedores fusionados en weddings/${weddingId}/suppliers`);
        }
      } catch (err) {
        console.warn('Error migrando proveedores antiguos:', err);
      }
    }
    migrateSuppliers();
    if (!weddingId) {
      // Sin boda activa: usamos fallback (puede ser datos de ejemplo)
      setData(fallback);
      setLoading(false);
      return;
    }

    // Hay boda activa: limpiamos cualquier dato antiguo de ejemplo antes de escuchar Firestore
    setData([]);

    let unsub = null;
    const listen = () => {
      // Intentamos ordenar por createdAt; si el campo no existe en algún documento, Firestore
      // igualmente los devuelve, pero algunos proyectos tienen reglas que lo impiden. Para
      // máxima compatibilidad hacemos la consulta base sin orderBy y ordenamos luego en cliente.
      const colRef = collection(db, 'weddings', weddingId, ...subName.split('/'));
      const q = colRef;
      console.log(`[useWeddingCollection] Iniciando listener para weddings/${weddingId}/${subName}`);
      unsub = onSnapshot(q, (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log(`[useWeddingCollection] Datos recibidos:`, { sub: subName, wedding: weddingId, size: arr.length, data: arr });
        setData(arr);
        lsSet(weddingId, subName, arr);
        setLoading(false);
      }, async (err) => {
        console.error(`Snapshot error ${subName}:`, err);
        // Intento automático: si es permiso denegado, añadirse como planner y reintentar
        if (err?.code === 'permission-denied' && auth.currentUser?.uid) {
          try {
            console.warn(`[auto-fix] Intentando añadirme como planner en ${weddingId}… (uid: ${auth.currentUser.uid})`);
            const { doc: fDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
            const wedRef = fDoc(db, 'weddings', weddingId);
            await updateDoc(wedRef, { plannerIds: arrayUnion(auth.currentUser.uid) });
            console.log(`[auto-fix] Añadido ${auth.currentUser.uid} a plannerIds en ${weddingId}`);
            // Cerrar listener anterior si existe
            if (typeof unsub === 'function') try { unsub(); } catch(_) {}
            // Dar más tiempo al backend para propagar reglas y reintentar
            if (import.meta.env.DEV) console.debug('[useWeddingCollection] reintento de listener tras auto-fix en 3000ms', { sub: subName, wedding: weddingId });
            setTimeout(() => listen(), 3000);
            return;
          } catch (permErr) {
            console.warn('[auto-fix] Error añadiendo plannerIds:', permErr);
          }
        }
        if (import.meta.env.DEV) console.debug('[useWeddingCollection] usando caché local por error en snapshot', { sub: subName, wedding: weddingId, code: err?.code });
        setData(lsGet(weddingId, subName, fallback));
        setLoading(false);
      });
    };

    // Si aún no hay weddingId, usa solo caché local
    if (!weddingId) {
      setData(fallback);
      setLoading(false);
      return;
    }

    // Verificar que db esté disponible
    if (!db) {
      console.warn('Firebase db no está disponible, usando datos de fallback');
      setData(fallback);
      setLoading(false);
      return;
    }

    // Verificar autenticación Firebase - si no hay usuario, intentar de todas formas
    // ya que las reglas pueden permitir acceso público o el usuario puede autenticarse después
    if (!auth?.currentUser) {
      console.warn(`[useWeddingCollection] Sin usuario Firebase autenticado, intentando acceso a Firestore de todas formas para ${subName}`);
    }

    // Esperamos a que Firebase esté listo antes de iniciar el listener
    firebaseReady
      .then(() => listen())
      .catch(err => {
        console.error('[useWeddingCollection] Error en firebaseReady:', err);
        setData(lsGet(weddingId, subName, fallback));
        setLoading(false);
      });
    return () => unsub && unsub();
  }, [subName, weddingId]);

  const addItem = useCallback(
    async (item) => {
      // 1) Cuando hay boda activa intentamos guardar en Firestore
      if (weddingId) {
        try {
          const colRef = collection(db, 'weddings', weddingId, ...subName.split('/'));
          // Clonamos sin incluir el campo id para evitar redundancia
          const { id: _tmpId, ...dataWithoutId } = item;
          const docRef = await addDoc(colRef, {
            ...dataWithoutId,
            createdAt: serverTimestamp(),
          });

          const saved = { ...item, id: docRef.id };
          // Actualizamos estado local inmediatamente para feedback optimista
          setData(prev => [...prev, saved]);
          lsSet(weddingId, subName, [...data, saved]);

          return saved;
        } catch (err) {
          console.warn('addItem Firestore failed, usando localStorage:', err);
          // Si falla, continuamos al modo offline
        }
      }

      // 2) Modo offline o fallo de permisos: persistimos en localStorage
      if (!weddingId) {
        console.warn('addItem: sin weddingId activo; se guarda solo en localStorage');
      }

      const offlineItem = { ...item, id: item.id || Date.now() };
      const next = [...data, offlineItem];
      setData(next);
      lsSet(weddingId, subName, next);
      return offlineItem;
    },
    [subName, weddingId, data]
  );

  const updateItem = useCallback(async (id, changes) => {
    if (weddingId) {
      try {
        await updateDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id), changes);
        return;
      } catch (err) {
        console.warn('updateItem Firestore failed, usando localStorage:', err);
      }
    }
    if (!weddingId) console.warn('updateItem: sin weddingId activo; se guarda solo en localStorage');
    const next = data.map((d) => (d.id === id ? { ...d, ...changes } : d));
    setData(next);
    lsSet(weddingId, subName, next);
  }, [subName, weddingId, data]);

  const deleteItem = useCallback(async (id) => {
    if (weddingId) {
      try {
        await deleteDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id));
        return;
      } catch (err) {
        console.warn('deleteItem Firestore failed, usando localStorage:', err);
      }
    }
    if (!weddingId) console.warn('deleteItem: sin weddingId activo; se guarda solo en localStorage');
    const next = data.filter((d) => d.id !== id);
    setData(next);
    lsSet(weddingId, subName, next);
  }, [subName, weddingId, data]);

  return { data, loading, addItem, updateItem, deleteItem };
};

export default useWeddingCollection;
