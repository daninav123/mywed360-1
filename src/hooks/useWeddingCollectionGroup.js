import { collectionGroup, onSnapshot } from 'firebase/firestore';
// Construimos la query con where/orderBy de forma segura (fallback sin order)
import { query as fQuery, where as fWhere, orderBy as fOrderBy } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '../firebaseConfig';

// Escucha una collectionGroup y filtra por weddingId.
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
    // Se espera que los docs incluyan weddingId
    let qy = null;
    try {
      qy = fQuery(cg, fWhere('weddingId', '==', weddingId), fOrderBy('createdAt', 'asc'));
    } catch (_) {
      // Fallback sin order si no hay índice
      try {
        qy = fQuery(cg, fWhere('weddingId', '==', weddingId));
      } catch {
        qy = cg;
      }
    }
    const unsub = onSnapshot(
      qy,
      (snap) => {
        let arr = snap.docs.map((d) => ({ id: d.id, __path: d.ref.path, ...d.data() }));
        // Orden local por start o createdAt
        try {
          arr = arr.slice().sort((a, b) => {
            const as = a?.start?.toDate ? a.start.toDate() : new Date(a?.start || 0);
            const bs = b?.start?.toDate ? b.start.toDate() : new Date(b?.start || 0);
            return (as?.getTime?.() || 0) - (bs?.getTime?.() || 0);
          });
        } catch {}
        setData(arr);
        setLoading(false);
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
