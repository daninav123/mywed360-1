/**
 * Global Search Service - PostgreSQL Version
 * Búsqueda unificada usando API backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const normalizeText = (text) => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const fuzzyScore = (text, query) => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  if (normalizedText === normalizedQuery) return 100;
  if (normalizedText.startsWith(normalizedQuery)) return 90;
  if (normalizedText.includes(normalizedQuery)) return 70;
  
  const queryWords = normalizedQuery.split(' ');
  const textWords = normalizedText.split(' ');
  
  let matches = 0;
  queryWords.forEach(qWord => {
    textWords.forEach(tWord => {
      if (tWord.includes(qWord) || qWord.includes(tWord)) {
        matches++;
      }
    });
  });
  
  if (matches > 0) {
    return 50 + (matches / queryWords.length) * 20;
  }
  
  return 0;
};

const searchGuests = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/guests?weddingId=${weddingId}&limit=50`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const guests = result.guests || result.data || [];
    
    const results = [];
    guests.forEach(guest => {
      const name = guest.name || `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
      const score = fuzzyScore(name, queryText);
      
      if (score > 40) {
        results.push({
          id: guest.id,
          type: 'guest',
          title: name,
          subtitle: guest.email || guest.table || '',
          path: `/invitados?guest=${guest.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch {
    return [];
  }
};

const searchSuppliers = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/wedding-suppliers/${weddingId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const suppliers = result.suppliers || result.data || [];
    
    const results = [];
    suppliers.forEach(supplier => {
      const name = supplier.name || supplier.businessName || '';
      const score = fuzzyScore(name, queryText);
      
      if (score > 40) {
        results.push({
          id: supplier.id,
          type: 'supplier',
          title: name,
          subtitle: supplier.category || supplier.service || '',
          path: `/proveedores?supplier=${supplier.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch {
    return [];
  }
};

const searchTasks = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_URL}/api/tasks?weddingId=${weddingId}&limit=50`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const tasks = result.tasks || result.data || [];
    
    const results = [];
    tasks.forEach(task => {
      const title = task.title || task.name || '';
      const score = fuzzyScore(title, queryText);
      
      if (score > 40) {
        results.push({
          id: task.id,
          type: 'task',
          title,
          subtitle: task.category || task.status || '',
          path: `/checklist?task=${task.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch {
    return [];
  }
};

export const globalSearch = async (queryText, weddingId, options = {}) => {
  if (!queryText || queryText.length < 2) {
    return {
      results: [],
      count: 0,
      query: queryText,
    };
  }

  const {
    types = ['guest', 'supplier', 'task'],
    limit = 20,
  } = options;

  try {
    const searches = [];
    
    if (types.includes('guest')) {
      searches.push(searchGuests(queryText, weddingId));
    }
    if (types.includes('supplier')) {
      searches.push(searchSuppliers(queryText, weddingId));
    }
    if (types.includes('task')) {
      searches.push(searchTasks(queryText, weddingId));
    }

    const allResults = await Promise.all(searches);
    const combined = allResults.flat();
    
    combined.sort((a, b) => b.score - a.score);
    
    return {
      results: combined.slice(0, limit),
      count: combined.length,
      query: queryText,
    };
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return {
      results: [],
      count: 0,
      query: queryText,
      error: error.message,
    };
  }
};

export default { globalSearch };
