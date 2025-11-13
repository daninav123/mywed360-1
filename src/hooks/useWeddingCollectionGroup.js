import { collectionGroup, onSnapshot, query as fQuery } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '../firebaseConfig';

// Escucha una collectionGroup y filtra por weddingId (por campo o por ruta)
// Devuelve { data, loading, error }
export function useWeddingCollectionGroup(groupName, weddingId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!weddingId || !db) {
      setData([]);
      setLoading(false);
      return;
    }

    const cg = collectionGroup(db, groupName);
    const qy = fQuery(cg);
    const unsub = onSnapshot(
      qy,
      (snap) => {
        try {
          let arr = snap.docs.map((d) => ({ ...d.data(), id: d.id, __path: d.ref.path }));
          try {
            // console.log(`[CG:${groupName}] raw=${arr.length}`, arr.slice(0, 3).map((x) => x.__path || x.id));
          } catch {}
          // Filtrar por boda: por campo weddingId si existe o por ruta
          arr = arr.filter((doc) => {
            try {
              if (String(doc?.weddingId || '') === String(weddingId)) return true;
              const p = String(doc?.__path || '');
              return p.includes(`/weddings/${weddingId}/`);
            } catch {
              return false;
            }
          });
          try {
            // console.log(`[CG:${groupName}] wedding=${weddingId} afterFilter=${arr.length}`, arr.slice(0, 3).map((x) => x.__path || x.id));
            window.mywed = window.mywed || {};
            window.mywed._cg = window.mywed._cg || {};
            window.mywed._cg[groupName] = { total: arr.length, sample: arr.slice(0, 10) };
          } catch {}
          // Orden local por start o createdAt
          arr = arr.slice().sort((a, b) => {
            const as = a?.start?.toDate ? a.start.toDate() : new Date(a?.start || a?.createdAt?.toDate?.() || 0);
            const bs = b?.start?.toDate ? b.start.toDate() : new Date(b?.start || b?.createdAt?.toDate?.() || 0);
            return (as?.getTime?.() || 0) - (bs?.getTime?.() || 0);
          });
          setData(arr);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
      },
      (e) => {
        setError(e);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [groupName, weddingId]);

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}
