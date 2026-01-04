/**
 * Supplier Propagation Service - PostgreSQL Version
 * Propaga datos de proveedores aceptados a InfoBoda
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const CATEGORY_FIELD_MAP = {
  'lugares': (supplierData) => ({
    celebrationPlace: supplierData.name || supplierData.venueName,
    celebrationAddress: supplierData.address || supplierData.venueAddress,
    celebrationCity: supplierData.city,
    ceremonyGPS: supplierData.gps || supplierData.venueGPS,
    venueManagerName: supplierData.contactName || supplierData.managerName,
    venueManagerPhone: supplierData.contactPhone || supplierData.phone,
  }),
  'restaurantes': (supplierData) => ({
    celebrationPlace: supplierData.name,
    celebrationAddress: supplierData.address,
    celebrationCity: supplierData.city,
    banquetPlace: supplierData.name,
    receptionAddress: supplierData.address,
    venueManagerName: supplierData.contactName,
    venueManagerPhone: supplierData.contactPhone || supplierData.phone,
  }),
  'catering': (supplierData) => ({
    cateringContact: supplierData.contactPhone || supplierData.phone,
    menu: supplierData.menuDescription || supplierData.menu || '',
  }),
  'fotografia': (supplierData) => ({
    photographerContact: supplierData.contactPhone || supplierData.phone,
  }),
};

export async function propagateSupplierToWeddingInfo(weddingId, supplierId, supplierData) {
  if (!weddingId || !supplierData) return false;

  try {
    const category = supplierData.category || supplierData.serviceCategory;
    const mapper = CATEGORY_FIELD_MAP[category];
    
    if (!mapper) return false;

    const fieldsToUpdate = mapper(supplierData);
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/weddings/${weddingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fieldsToUpdate)
    });

    return response.ok;
  } catch (error) {
    console.error('Error propagating supplier data:', error);
    return false;
  }
}

export async function clearSupplierPropagation(weddingId, category) {
  if (!weddingId || !category) return false;

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/weddings/${weddingId}/clear-supplier-data`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error clearing supplier propagation:', error);
    return false;
  }
}

export default {
  propagateSupplierToWeddingInfo,
  clearSupplierPropagation,
};
