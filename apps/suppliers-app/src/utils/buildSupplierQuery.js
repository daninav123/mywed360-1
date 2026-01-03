import { SPEC_LABELS } from './supplierRequirementsTemplate';

/**
 * Construye un query inteligente para búsqueda de proveedores
 * basado en los requisitos del usuario en Info Boda
 * 
 * @param {string} category - ID de la categoría (ej: 'decoracion', 'fotografia')
 * @param {Object} requirements - Requisitos del usuario para esta categoría
 * @param {Object} weddingDesign - Diseño y visión de la boda (opcional)
 * @returns {string} Query optimizado para búsqueda
 */
export function buildSupplierQuery(category, requirements = {}, weddingDesign = null) {
  const parts = [];
  
  // 1. Añadir nombre de categoría como base
  parts.push(category);
  
  // 2. Añadir notas del usuario (máxima prioridad - texto libre)
  if (requirements?.notes?.trim()) {
    parts.push(requirements.notes.trim());
  }
  
  // 3. Añadir opciones personalizadas
  if (Array.isArray(requirements?.customOptions) && requirements.customOptions.length > 0) {
    parts.push(...requirements.customOptions);
  }
  
  // 4. Añadir specs importantes (solo los marcados como true)
  if (requirements?.specs && typeof requirements.specs === 'object') {
    const categoryLabels = SPEC_LABELS[category] || {};
    
    Object.entries(requirements.specs).forEach(([key, value]) => {
      // Solo incluir valores true (checkboxes marcados)
      if (value === true) {
        // Usar label legible si existe, sino usar la key
        const readable = categoryLabels[key] || key;
        parts.push(readable);
      }
    });
  }
  
  // 5. Para categoría "lugares", añadir preferencias de estilo/atmósfera
  if (category === 'lugares' && weddingDesign) {
    // Añadir atmósfera deseada
    if (weddingDesign.vision?.mood?.atmosphere) {
      parts.push(weddingDesign.vision.mood.atmosphere);
    }
    
    // Añadir estilo principal
    if (weddingDesign.vision?.overallStyle?.primary) {
      parts.push(weddingDesign.vision.overallStyle.primary);
    }
  }
  
  // 6. Para categoría "fotografia" o "video", añadir preferencias de estilo
  if ((category === 'fotografia' || category === 'video') && weddingDesign) {
    if (weddingDesign.vision?.overallStyle?.primary) {
      parts.push(`estilo ${weddingDesign.vision.overallStyle.primary}`);
    }
  }
  
  // 7. Limpiar y unir
  const query = parts
    .filter(Boolean) // Eliminar valores vacíos
    .map(p => String(p).trim()) // Convertir a string y limpiar
    .filter(p => p.length > 0) // Eliminar strings vacíos
    .join(' ') // Unir con espacios
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples
    .trim();
  
  return query;
}

/**
 * Construye queries para todas las categorías activas
 * 
 * @param {Object} supplierRequirements - Todos los requisitos por categoría
 * @param {Array} activeCategories - Lista de categorías activas
 * @param {Object} weddingDesign - Diseño y visión de la boda
 * @returns {Object} Mapa de categoría -> query
 */
export function buildAllSupplierQueries(supplierRequirements, activeCategories, weddingDesign = null) {
  const queries = {};
  
  activeCategories.forEach(categoryId => {
    const requirements = supplierRequirements[categoryId];
    if (requirements) {
      queries[categoryId] = buildSupplierQuery(categoryId, requirements, weddingDesign);
    }
  });
  
  return queries;
}

export default buildSupplierQuery;
