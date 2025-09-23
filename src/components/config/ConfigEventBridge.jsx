import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';

import { useWedding } from '../../context/WeddingContext';
import { db, auth } from '../../firebaseConfig';

// Listens to 'lovenda-profile' changes and persists wedding/user config to Firestore
export default function ConfigEventBridge() {
  const { activeWedding } = useWedding();

  useEffect(() => {
    const handler = async () => {
      try {
        const uid = auth?.currentUser?.uid || null;
        // Leer perfil local
        const raw = localStorage.getItem('lovendaProfile');
        if (!raw) return;
        const profile = JSON.parse(raw);
        const weddingInfo = profile?.weddingInfo || {};

        // Persistir en wedding doc
        if (activeWedding && db) {
          const wref = doc(db, 'weddings', activeWedding);
          // mapear campos comunes al nivel raíz
          const top = {};
          if (weddingInfo.name) top.name = weddingInfo.name;
          if (weddingInfo.date || weddingInfo.weddingDate) top.weddingDate = weddingInfo.weddingDate || weddingInfo.date;
          if (weddingInfo.location || weddingInfo.banquetPlace) top.location = weddingInfo.location || weddingInfo.banquetPlace;
          if (weddingInfo.coupleName) top.coupleName = weddingInfo.coupleName;
          if (weddingInfo.bride) top.bride = weddingInfo.bride;
          if (weddingInfo.groom) top.groom = weddingInfo.groom;

          const patch = { ...(Object.keys(top).length ? top : {}), weddingInfo };
          if (Object.keys(patch).length) await updateDoc(wref, patch).catch(() => setDoc(wref, patch, { merge: true }));
        }

        // Persistir en user doc (cualquier raíz añadida al perfil)
        if (uid && db) {
          const uref = doc(db, 'users', uid);
          const root = { ...profile };
          delete root.weddingInfo;
          if (Object.keys(root).length) await setDoc(uref, root, { merge: true });
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[ConfigEventBridge] persist error', e);
      }
    };

    window.addEventListener('lovenda-profile', handler);
    return () => window.removeEventListener('lovenda-profile', handler);
  }, [activeWedding]);

  return null;
}

