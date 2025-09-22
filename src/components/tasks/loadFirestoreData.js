import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { loadData } from '../../services/SyncService';

// Carga datos de Firestore con rutas conocidas y fallbacks locales
export async function loadFirestoreData(path) {
  try {
    let data = null;

    if (path.endsWith('/weddingInfo')) {
      // 1) weddingInfo como campo del documento de la boda (weddings/{id})
      try {
        const parentPath = path.replace(/\/weddingInfo$/, '');
        const segments = parentPath.split('/').filter(Boolean);
        if (segments.length >= 2) {
          const ref = doc(db, ...segments);
          const snap = await getDoc(ref);
          const d = snap.exists() ? (snap.data()?.weddingInfo || {}) : {};
          if (d && Object.keys(d).length > 0) data = d;
        }
      } catch {}

      // 2) Compatibilidad como subdocumento directo
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        try {
          const direct = await loadData('weddingInfo', { docPath: path });
          if (direct && typeof direct === 'object') data = direct;
        } catch {}
      }

      // 3) Fallback a perfil de usuario
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        const profile = await loadData('lovendaProfile', { collection: 'userProfiles' });
        data = (profile && profile.weddingInfo) ? profile.weddingInfo : (profile || {});
      }
    } else if (path.endsWith('/tasksCompleted')) {
      data = await loadData('tasksCompleted', { docPath: path });
    } else {
      data = await loadData(path);
    }

    return data || {};
  } catch (error) {
    console.error('Error cargando datos de Firestore:', error);
    return {};
  }
}

