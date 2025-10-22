import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useState, useCallback, useRef } from 'react';

import { auth, db, firebaseReady } from '../firebaseConfig';
import { post as apiPost } from '../services/apiClient';

// Helpers para localStorage (caché offline por boda)
const localKey = (wid, name) => `mywed360_${wid}_${name}`;
const lsGet = (wid, name, fallback) => {
  try {
    const stored = localStorage.getItem(localKey(wid, name));
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return fallback;
};
const lsSet = (wid, name, data) => {
  localStorage.setItem(localKey(wid, name), JSON.stringify(data));
  window.dispatchEvent(new Event(`mywed360-${wid}-${name}`));
};

/**
 * Hook para suscribirse a subcolecciones dentro de una boda:
 * weddings/{weddingId}/{subName}
 * Soporta modo offline usando localStorage.
 */
// options: { orderBy?: { field: string, direction?: 'asc'|'desc' }, limit?: number }
/**
 * Suscribe y gestiona una subcolección de una boda: weddings/{weddingId}/{subName}
 * options: {
 *  orderBy?: { field: string, direction?: 'asc'|'desc' },
 *  limit?: number,
 *  where?: Array<{ field: string, op: any, value: any }>
 * }
 */
export const useWeddingCollection = (subName, weddingId, fallback = [], options = {}) => {
  const [data, setData] = useState(() => {
    try {
      return lsGet(weddingId, subName, fallback);
    } catch (error) {
      console.error('Error inicializando datos desde localStorage:', error);
      return fallback;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const lastLocalWriteRef = useRef(0);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  const firebaseUid = auth?.currentUser?.uid || null;

  useEffect(() => {
    // Si no hay weddingId, solo usar fallback y no intentar Firestore
    if (!weddingId) {
      setData(fallback);
      setLoading(false);
      return;
    }
    
    // Asegurar inicialización completa de Firebase antes de lanzar cualquier lógica
    const ENABLE_LEGACY_FALLBACKS = String((import.meta.env && import.meta.env.VITE_ENABLE_LEGACY_FALLBACKS) ?? 'true').toLowerCase() === 'true';
    // Intento de migración automática de invitados antiguos
    async function migrateGuests() {
      if (!ENABLE_LEGACY_FALLBACKS) return; // desactivado por flag
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
          getDoc,
          collection: col,
          writeBatch,
          doc: fDoc,
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

        // 2) Invitados en colección legacy users/{uid}/userGuests (cada documento es un invitado)
        const legacyCol = col(db, 'users', firebaseUser.uid, 'userGuests');
        const legacySnap = await getDocs(legacyCol);
        legacySnap.forEach((docSnap) => {
          batch.set(
            fDoc(destCol, docSnap.id),
            { ...docSnap.data(), migratedAt: serverTimestamp() },
            { merge: true }
          );
          writes++; // contar escritura
        });

        // 3) Invitados embebidos en weddings/{id} (array legacy 'guests')
        try {
          const wedRef = fDoc(db, 'weddings', weddingId);
          const wedSnap = await getDoc(wedRef);
          if (wedSnap.exists()) {
            const data = wedSnap.data() || {};
            const legacyArray = Array.isArray(data.guests) ? data.guests : [];
            legacyArray.forEach((g, idx) => {
              try {
                const gid = String(g?.id || `legacy-${idx}`);
                if (!existingIds.has(gid)) {
                  const payload = {
                    name: g?.name || g?.fullName || 'Invitado',
                    phone: g?.phone || '',
                    address: g?.address || '',
                    companion: Number(g?.companion ?? g?.companions ?? 0) || 0,
                    table: g?.table || g?.group || '',
                    response: g?.response || '',
                    status: g?.status || 'pending',
                    createdAt: serverTimestamp(),
                  };
                  batch.set(fDoc(destCol, gid), payload, { merge: true });
                  writes++;
                }
              } catch {}
            });
          }
        } catch {}

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
      if (!ENABLE_LEGACY_FALLBACKS) return; // desactivado por flag
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
            batch.set(
              fDoc(destCol, docSnap.id),
              { ...docSnap.data(), migratedAt: serverTimestamp() },
              { merge: true }
            );
            writes++; // contar escritura
          }
        });

        // 3) Proveedores embebidos en weddings/{id} (array legacy 'suppliers')
        try {
          const wedRef = fDoc(db, 'weddings', weddingId);
          const wedSnap = await getDoc(wedRef);
          if (wedSnap.exists()) {
            const data = wedSnap.data() || {};
            const legacyArray = Array.isArray(data.suppliers) ? data.suppliers : [];
            legacyArray.forEach((s, idx) => {
              try {
                const sid = String(s?.id || `legacy-${idx}`);
                if (!existingIds.has(sid)) {
                  const payload = {
                    name: s?.name || s?.provider || 'Proveedor',
                    category: s?.category || s?.type || '',
                    email: s?.email || '',
                    phone: s?.phone || '',
                    createdAt: serverTimestamp(),
                  };
                  batch.set(fDoc(destCol, sid), payload, { merge: true });
                  writes++;
                }
              } catch {}
            });
          }
        } catch {}

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
    const listen = async () => {
      // Intentamos ordenar por createdAt; si el campo no existe en algún documento, Firestore
      // igualmente los devuelve, pero algunos proyectos tienen reglas que lo impiden. Para
      // máxima compatibilidad hacemos la consulta base sin orderBy y ordenamos luego en cliente.
      const colRef = collection(db, 'weddings', weddingId, ...subName.split('/'));
      let q = colRef;
      try {
        const {
          query: fQuery,
          orderBy: fOrderBy,
          limit: fLimit,
          where: fWhere,
        } = await import('firebase/firestore');
        const constraints = [];
        const ob = options?.orderBy;
        if (ob && ob.field && typeof fOrderBy === 'function') {
          constraints.push(fOrderBy(ob.field, ob.direction === 'desc' ? 'desc' : 'asc'));
        }
        const lim = options?.limit;
        if (Number.isFinite(lim) && lim > 0 && typeof fLimit === 'function') {
          constraints.push(fLimit(lim));
        }
        const wh = Array.isArray(options?.where) ? options.where : [];
        if (wh.length && typeof fWhere === 'function') {
          for (const w of wh) {
            if (w && w.field && w.op !== undefined)
              constraints.push(fWhere(w.field, w.op, w.value));
          }
        }
        if (constraints.length && typeof fQuery === 'function') {
          q = fQuery(colRef, ...constraints);
        }
      } catch {}
      if (import.meta.env.DEV)
        console.log(
          `[useWeddingCollection] Iniciando listener para weddings/${weddingId}/${subName}`
        );
      unsub = onSnapshot(
        q,
        (snap) => {
          // Asegurar que el id del documento prevalezca sobre cualquier campo id dentro de los datos
          let arr = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
          // Ordenar en cliente si se solicitó y no se aplicó en servidor
          const ob2 = options?.orderBy;
          if (ob2 && ob2.field) {
            const dirMul = ob2.direction === 'desc' ? -1 : 1;
            const f = ob2.field;
            try {
              arr = arr.slice().sort((a, b) => {
                const av = a?.[f];
                const bv = b?.[f];
                if (av == null && bv == null) return 0;
                if (av == null) return -1 * dirMul;
                if (bv == null) return 1 * dirMul;
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dirMul;
                const as = String(av);
                const bs = String(bv);
                return as.localeCompare(bs) * dirMul;
              });
            } catch {}
          }
          lastLocalWriteRef.current = Date.now();
          lsSet(weddingId, subName, arr);
          setData(arr);
          setLoading(false);
        },
        (err) => {
          // Silenciar errores de permisos si estamos usando admin local
          const isPermissionDenied = err.code === 'permission-denied';
          if (isPermissionDenied) {
            // Intentar auto-fix de permisos
            (async () => {
              try {
                const resp = await apiPost(
                  `/api/weddings/${weddingId}/permissions/autofix`,
                  {},
                  { auth: true }
                );
                if (resp?.ok) {
                  try {
                    if (typeof unsub === 'function') unsub();
                  } catch {}
                  if (import.meta.env.DEV)
                    console.debug(
                      '[useWeddingCollection] reintento de listener tras autofix en 3000ms',
                      { sub: subName, wedding: weddingId }
                    );
                  setTimeout(() => listen(), 3000);
                  return;
                } else {
                  const text = await resp.text().catch(() => '');
                  console.warn('[auto-fix] Backend rechazó autofix', resp?.status, text);
                }
              } catch (permErr) {
                console.warn('[auto-fix] Error llamando autofix backend:', permErr);
              }
            })();
            
            // Usar fallback mientras tanto
            setData(fallback);
            setLoading(false);
            return;
          }
          
          if (import.meta.env.DEV)
            console.debug('[useWeddingCollection] usando caché local por error en snapshot', {
              sub: subName,
              wedding: weddingId,
              code: err?.code,
            });
          setData(lsGet(weddingId, subName, fallback));
          setLoading(false);
          try {
            setError(err);
          } catch {}
        }
      );
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

    if (!firebaseUid) {
      if (import.meta.env.DEV) {
        console.info(
          `[useWeddingCollection] Sin auth Firebase; usando solo caché local para ${subName}`
        );
      }
      const cached = lsGet(weddingId, subName, fallback);
      setData(Array.isArray(cached) ? cached : fallback);
      setLoading(false);
      setError((prev) => prev || new Error('auth-required'));
      return;
    }

    // Esperamos a que Firebase esté listo antes de iniciar el listener
    firebaseReady
      .then(() => listen())
      .catch((err) => {
        console.error('[useWeddingCollection] Error en firebaseReady:', err);
        setData(lsGet(weddingId, subName, fallback));
        setLoading(false);
        setError(err);
      });
    return () => unsub && unsub();
  }, [subName, weddingId, reloadTick, firebaseUid]);

  // Sincronización intra‑pestaña (evento custom) y entre pestañas (evento storage)
  useEffect(() => {
    if (!weddingId) return;
    const evtName = `mywed360-${weddingId}-${subName}`;
    const onLocal = () => {
      try {
        // Evitar eco inmediato de nuestra propia escritura
        const now = Date.now();
        if (now - lastLocalWriteRef.current < 100) return;
        const next = lsGet(weddingId, subName, data);
        setData(Array.isArray(next) ? next : data);
      } catch {}
    };
    const onStorage = (e) => {
      try {
        if (e.key !== localKey(weddingId, subName)) return;
        const next = lsGet(weddingId, subName, data);
        setData(Array.isArray(next) ? next : data);
      } catch {}
    };
    window.addEventListener(evtName, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(evtName, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, [weddingId, subName, data]);

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
          setData((prev) => {
            const next = [...prev, saved];
            lastLocalWriteRef.current = Date.now();
            lsSet(weddingId, subName, next);
            return next;
          });

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
      setData((prev) => {
        const next = [...prev, offlineItem];
        lastLocalWriteRef.current = Date.now();
        lsSet(weddingId, subName, next);
        return next;
      });
      return offlineItem;
    },
    [subName, weddingId]
  );

  const updateItem = useCallback(
    async (id, changes) => {
      if (weddingId) {
        try {
          await updateDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id), changes);
          // Optimistic local update
          setData((prev) => {
            const next = prev.map((d) => (d.id === id ? { ...d, ...changes } : d));
            lastLocalWriteRef.current = Date.now();
            lsSet(weddingId, subName, next);
            return next;
          });
          return;
        } catch (err) {
          console.warn('updateItem Firestore failed, usando localStorage:', err);
        }
      }
      if (!weddingId)
        console.warn('updateItem: sin weddingId activo; se guarda solo en localStorage');
      setData((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, ...changes } : d));
        lastLocalWriteRef.current = Date.now();
        lsSet(weddingId, subName, next);
        return next;
      });
    },
    [subName, weddingId]
  );

  const deleteItem = useCallback(
    async (id) => {
      if (weddingId) {
        try {
          await deleteDoc(doc(db, 'weddings', weddingId, ...subName.split('/'), id));
          // Optimistic local removal
          setData((prev) => {
            const next = prev.filter((d) => d.id !== id);
            lastLocalWriteRef.current = Date.now();
            lsSet(weddingId, subName, next);
            return next;
          });
          return;
        } catch (err) {
          console.warn('deleteItem Firestore failed, usando localStorage:', err);
        }
      }
      if (!weddingId)
        console.warn('deleteItem: sin weddingId activo; se guarda solo en localStorage');
      setData((prev) => {
        const next = prev.filter((d) => d.id !== id);
        lastLocalWriteRef.current = Date.now();
        lsSet(weddingId, subName, next);
        return next;
      });
    },
    [subName, weddingId]
  );

  return { data, loading, error, reload, addItem, updateItem, deleteItem };
};

export default useWeddingCollection;
