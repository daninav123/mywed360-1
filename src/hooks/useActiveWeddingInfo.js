import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useWedding } from '../context/WeddingContext';

export default function useActiveWeddingInfo() {
  const { activeWedding } = useWedding();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeWedding) { setInfo(null); return; }
      setLoading(true);
      try {
        const ref = doc(db, 'weddings', activeWedding);
        const snap = await getDoc(ref);
        if (!cancelled) setInfo(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeWedding]);

  return { info, loading, error };
}

