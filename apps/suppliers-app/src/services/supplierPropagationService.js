/**
 * 🔄 Servicio de Propagación de Datos de Proveedores a InfoBoda
 * Actualiza automáticamente InfoBoda cuando se acepta un proveedor
 */

import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Mapeo de categorías de proveedores a campos de InfoBoda
 */
const CATEGORY_FIELD_MAP = {
  // LUGARES Y VENUES
  'lugares': (supplierData) => ({
    celebrationPlace: supplierData.name || supplierData.venueName,
    celebrationAddress: supplierData.address || supplierData.venueAddress,
    celebrationCity: supplierData.city,
    ceremonyGPS: supplierData.gps || supplierData.venueGPS,
    venueManagerName: supplierData.contactName || supplierData.managerName,
    venueManagerPhone: supplierData.contactPhone || supplierData.phone,
    _celebrationPlaceSource: 'supplier-confirmed',
    _celebrationPlaceSupplierId: supplierData.supplierId,
  }),
  
  // RESTAURANTES
  'restaurantes': (supplierData) => ({
    celebrationPlace: supplierData.name,
    celebrationAddress: supplierData.address,
    celebrationCity: supplierData.city,
    banquetPlace: supplierData.name,
    receptionAddress: supplierData.address,
    venueManagerName: supplierData.contactName,
    venueManagerPhone: supplierData.contactPhone || supplierData.phone,
    _banquetPlaceSource: 'supplier-confirmed',
  }),
  
  // CATERING
  'catering': (supplierData) => ({
    cateringContact: supplierData.contactPhone || supplierData.phone,
    menu: supplierData.menuDescription || supplierData.menu || '',
    _cateringSource: 'supplier-confirmed',
    _cateringSupplierId: supplierData.supplierId,
  }),
  
  // FOTOGRAFÍA
  'fotografia': (supplierData) => ({
    photographerContact: supplierData.contactPhone || supplierData.phone,
    _photographerSource: 'supplier-confirmed',
    _photographerSupplierId: supplierData.supplierId,
  }),
  
  // MÚSICA CEREMONIA
  'musica-ceremonia': (supplierData) => ({
    musicContact: supplierData.contactPhone || supplierData.phone,
    _musicCeremonySource: 'supplier-confirmed',
  }),
  
  // MÚSICA CÓCTEL
  'musica-cocktail': (supplierData) => ({
    musicContact: supplierData.contactPhone || supplierData.phone,
    _musicCocktailSource: 'supplier-confirmed',
  }),
  
  // MÚSICA FIESTA
  'musica-fiesta': (supplierData) => ({
    musicContact: supplierData.contactPhone || supplierData.phone,
    _musicPartySource: 'supplier-confirmed',
  }),
  
  // DJ
  'dj': (supplierData) => ({
    musicContact: supplierData.contactPhone || supplierData.phone,
    _djSource: 'supplier-confirmed',
    _djSupplierId: supplierData.supplierId,
  }),
  
  // COORDINACIÓN/ORGANIZACIÓN
  'organizacion': (supplierData) => ({
    coordinatorName: supplierData.contactName || supplierData.name,
    coordinatorPhone: supplierData.contactPhone || supplierData.phone,
    _coordinatorSource: 'supplier-confirmed',
    _coordinatorSupplierId: supplierData.supplierId,
  }),
};

/**
 * Propaga datos de proveedor aceptado a InfoBoda
 */
export const propagateSupplierToWedding = async (weddingId, acceptedQuote) => {
  try {
    if (!weddingId || !acceptedQuote) {
      console.warn('[propagateSupplierToWedding] Missing weddingId or acceptedQuote');
      return;
    }

    const { categoryKey, supplierData } = acceptedQuote;
    
    // Verificar si existe mapeo para esta categoría
    const fieldMapper = CATEGORY_FIELD_MAP[categoryKey];
    if (!fieldMapper) {
      console.info(`[propagateSupplierToWedding] No field mapping for category: ${categoryKey}`);
      return;
    }

    // Obtener campos a actualizar
    const fieldsToUpdate = fieldMapper(supplierData);
    
    // Añadir metadata de actualización
    const updateData = {
      ...fieldsToUpdate,
      lastUpdated: serverTimestamp(),
      _lastUpdateSource: 'supplier-acceptance',
      _lastUpdateCategory: categoryKey,
      _lastUpdateSupplierName: supplierData.name,
      _lastUpdateTimestamp: Date.now(),
    };

    // Actualizar InfoBoda en Firestore
    const weddingRef = doc(db, 'weddings', weddingId);
    await updateDoc(weddingRef, updateData);

    console.log(`[propagateSupplierToWedding] ✅ Updated InfoBoda for ${categoryKey}:`, Object.keys(fieldsToUpdate));

    return {
      success: true,
      updatedFields: Object.keys(fieldsToUpdate),
      categoryKey,
      supplierName: supplierData.name,
    };

  } catch (error) {
    console.error('[propagateSupplierToWedding] Error:', error);
    throw error;
  }
};

/**
 * Verifica si un campo de InfoBoda proviene de un proveedor confirmado
 */
export const isFieldFromSupplier = async (weddingId, fieldName) => {
  try {
    const weddingRef = doc(db, 'weddings', weddingId);
    const weddingSnap = await getDoc(weddingRef);
    
    if (!weddingSnap.exists()) return false;
    
    const data = weddingSnap.data();
    const sourceField = `_${fieldName}Source`;
    
    return data[sourceField] === 'supplier-confirmed';
  } catch (error) {
    console.error('[isFieldFromSupplier] Error:', error);
    return false;
  }
};

/**
 * Obtiene el historial de actualizaciones de proveedores
 */
export const getSupplierUpdateHistory = async (weddingId) => {
  try {
    const weddingRef = doc(db, 'weddings', weddingId);
    const weddingSnap = await getDoc(weddingRef);
    
    if (!weddingSnap.exists()) return [];
    
    const data = weddingSnap.data();
    
    return {
      lastUpdate: {
        source: data._lastUpdateSource,
        category: data._lastUpdateCategory,
        supplierName: data._lastUpdateSupplierName,
        timestamp: data._lastUpdateTimestamp,
      }
    };
  } catch (error) {
    console.error('[getSupplierUpdateHistory] Error:', error);
    return [];
  }
};

export default {
  propagateSupplierToWedding,
  isFieldFromSupplier,
  getSupplierUpdateHistory,
};
