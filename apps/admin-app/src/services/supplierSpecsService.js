/**
 * Servicio para gestionar especificaciones de proveedores dinámicamente
 * Permite editar specs desde el panel admin sin modificar código
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SPECS_COLLECTION = 'systemConfig';
const SPECS_DOC = 'supplierSpecs';

// Default specs hardcoded como fallback
const DEFAULT_SPECS = {
  fotografia: { specs: { drone: false, engagement: false, album: false, hours: 8 } },
  video: { specs: { drone: false, highlights: false, hours: 8 } },
  musica: { specs: { type: 'banda', hours: 4 } },
  dj: { specs: { lights: false, hours: 5 } },
  catering: { specs: { style: 'plated', courses: 3 } },
  default: { specs: {} }
};

export async function loadSupplierSpecs() {
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    const specsSnap = await getDoc(specsRef);
    
    if (specsSnap.exists()) {
      const data = specsSnap.data();
      return {
        ...DEFAULT_SPECS,
        ...data.templates,
        _customized: true,
        _lastUpdated: data.updatedAt,
      };
    }
    
    return DEFAULT_SPECS;
  } catch (error) {
    console.error('Error cargando specs:', error);
    return DEFAULT_SPECS;
  }
}

export async function saveSupplierSpecs(specs, userId) {
  if (!userId) throw new Error('Usuario no autenticado');
  
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    const { _customized, _lastUpdated, default: defaultTemplate, ...templates } = specs;
    
    await setDoc(specsRef, {
      templates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
    
    return true;
  } catch (error) {
    console.error('Error guardando specs:', error);
    throw error;
  }
}

export async function resetSupplierSpecs(userId) {
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    await setDoc(specsRef, {
      templates: DEFAULT_SPECS,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      resetToDefaults: true,
    });
    return true;
  } catch (error) {
    console.error('Error restaurando specs:', error);
    throw error;
  }
}
