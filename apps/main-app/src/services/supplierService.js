/**
 * Supplier Service - PostgreSQL Version
 * DEPRECADO - Usar useProveedores hook en su lugar
 */

const supplierService = {
  async add() {
    console.warn('[supplierService] Deprecado - usar useProveedores hook');
    return null;
  },
  
  async getAll() {
    console.warn('[supplierService] Deprecado - usar useProveedores hook');
    return [];
  },
  
  async update() {
    console.warn('[supplierService] Deprecado - usar useProveedores hook');
  },
  
  async getByCategory() {
    console.warn('[supplierService] Deprecado - usar useProveedores hook');
    return [];
  }
};

export default supplierService;
