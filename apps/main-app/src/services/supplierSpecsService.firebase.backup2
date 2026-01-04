/**
 * Servicio para gestionar especificaciones de proveedores dinámicamente
 * Permite editar specs desde el panel admin sin modificar código
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SUPPLIER_SPECS_TEMPLATE as DEFAULT_SPECS } from '../utils/supplierRequirementsTemplate';

const SPECS_COLLECTION = 'systemConfig';
const SPECS_DOC = 'supplierSpecs';

/**
 * Carga las especificaciones desde Firestore
 * Si no existen, devuelve las especificaciones por defecto del código
 */
export async function loadSupplierSpecs() {
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    const specsSnap = await getDoc(specsRef);
    
    if (specsSnap.exists()) {
      const data = specsSnap.data();
      console.log('✅ Specs cargadas desde Firestore');
      
      // Merge con defaults para garantizar que todas las categorías existen
      return {
        ...DEFAULT_SPECS,
        ...data.templates,
        _customized: true,
        _lastUpdated: data.updatedAt,
      };
    }
    
    console.log('ℹ️ Usando specs por defecto del código');
    return DEFAULT_SPECS;
  } catch (error) {
    console.error('❌ Error cargando specs, usando defaults:', error);
    return DEFAULT_SPECS;
  }
}

/**
 * Guarda las especificaciones en Firestore
 * Solo admins pueden hacer esto
 */
export async function saveSupplierSpecs(specs, userId) {
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    
    // Remover campos internos antes de guardar
    const { _customized, _lastUpdated, default: defaultTemplate, ...templates } = specs;
    
    await setDoc(specsRef, {
      templates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });
    
    console.log('✅ Specs guardadas en Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error guardando specs:', error);
    throw error;
  }
}

/**
 * Restaura las especificaciones a los valores por defecto del código
 */
export async function resetSupplierSpecs(userId) {
  try {
    const specsRef = doc(db, SPECS_COLLECTION, SPECS_DOC);
    
    await setDoc(specsRef, {
      templates: DEFAULT_SPECS,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      resetToDefaults: true,
    });
    
    console.log('✅ Specs restauradas a valores por defecto');
    return true;
  } catch (error) {
    console.error('❌ Error restaurando specs:', error);
    throw error;
  }
}

/**
 * Añade un nuevo campo a una categoría específica
 */
export async function addFieldToCategory(categoryId, fieldName, fieldConfig, userId) {
  try {
    const currentSpecs = await loadSupplierSpecs();
    
    if (!currentSpecs[categoryId]) {
      throw new Error(`Categoría ${categoryId} no existe`);
    }
    
    // Añadir campo a specs
    currentSpecs[categoryId].specs[fieldName] = fieldConfig.defaultValue;
    
    await saveSupplierSpecs(currentSpecs, userId);
    
    console.log(`✅ Campo ${fieldName} añadido a ${categoryId}`);
    return true;
  } catch (error) {
    console.error('❌ Error añadiendo campo:', error);
    throw error;
  }
}

/**
 * Elimina un campo de una categoría específica
 */
export async function removeFieldFromCategory(categoryId, fieldName, userId) {
  try {
    const currentSpecs = await loadSupplierSpecs();
    
    if (!currentSpecs[categoryId]) {
      throw new Error(`Categoría ${categoryId} no existe`);
    }
    
    delete currentSpecs[categoryId].specs[fieldName];
    
    await saveSupplierSpecs(currentSpecs, userId);
    
    console.log(`✅ Campo ${fieldName} eliminado de ${categoryId}`);
    return true;
  } catch (error) {
    console.error('❌ Error eliminando campo:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de cambios
 */
export async function getSpecsHistory() {
  try {
    const historyRef = collection(db, SPECS_COLLECTION, SPECS_DOC, 'history');
    const historySnap = await getDocs(historyRef);
    
    return historySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('❌ Error cargando historial:', error);
    return [];
  }
}

export default {
  loadSupplierSpecs,
  saveSupplierSpecs,
  resetSupplierSpecs,
  addFieldToCategory,
  removeFieldFromCategory,
  getSpecsHistory,
};
