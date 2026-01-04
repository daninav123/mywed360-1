/**
 * Supplier Specs Service - PostgreSQL Version
 */

import { SUPPLIER_SPECS_TEMPLATE as DEFAULT_SPECS } from '../utils/supplierRequirementsTemplate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

export async function loadSupplierSpecs() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/system-config/supplier-specs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      const data = result.specs || result.data;
      
      return {
        ...DEFAULT_SPECS,
        ...data,
        _customized: true,
        _lastUpdated: data.updatedAt,
      };
    }
    
    return DEFAULT_SPECS;
  } catch (error) {
    console.error('Error loading specs, using defaults:', error);
    return DEFAULT_SPECS;
  }
}

export async function saveSupplierSpecs(specs, userId) {
  if (!userId) throw new Error('Usuario no autenticado');
  
  try {
    const { _customized, _lastUpdated, default: defaultTemplate, ...templates } = specs;
    
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/system-config/supplier-specs`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templates, updatedBy: userId })
    });
    
    return true;
  } catch (error) {
    console.error('Error saving specs:', error);
    throw error;
  }
}

export async function resetSupplierSpecs(userId) {
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/system-config/supplier-specs/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updatedBy: userId })
    });
    
    return true;
  } catch (error) {
    console.error('Error resetting specs:', error);
    throw error;
  }
}

export async function getSpecsHistory() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/system-config/supplier-specs/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.history || result.data || [];
  } catch {
    return [];
  }
}
