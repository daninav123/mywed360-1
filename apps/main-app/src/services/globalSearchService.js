import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Servicio de Búsqueda Global
 * Indexa y busca en todas las entidades de la app
 */

/**
 * Normalizar texto para búsqueda fuzzy
 */
const normalizeText = (text) => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
};

/**
 * Calcular score de similitud (fuzzy matching simple)
 */
const fuzzyScore = (text, query) => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  // Match exacto
  if (normalizedText === normalizedQuery) return 100;
  
  // Empieza con
  if (normalizedText.startsWith(normalizedQuery)) return 90;
  
  // Contiene
  if (normalizedText.includes(normalizedQuery)) return 70;
  
  // Fuzzy match básico (cada palabra)
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

/**
 * Buscar invitados
 */
const searchGuests = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const guestsRef = collection(db, 'weddings', weddingId, 'guests');
    const snapshot = await getDocs(query(guestsRef, limit(50)));
    
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || data.firstName + ' ' + data.lastName || '';
      const score = fuzzyScore(name, queryText);
      
      if (score > 40) {
        results.push({
          id: doc.id,
          type: 'guest',
          title: name,
          subtitle: data.email || data.table || '',
          path: `/invitados?guest=${doc.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error buscando invitados:', error);
    return [];
  }
};

/**
 * Buscar proveedores
 */
const searchSuppliers = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const suppliersRef = collection(db, 'weddings', weddingId, 'suppliers');
    const snapshot = await getDocs(query(suppliersRef, limit(50)));
    
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || data.companyName || '';
      const category = data.category || data.service || '';
      const score = Math.max(
        fuzzyScore(name, queryText),
        fuzzyScore(category, queryText)
      );
      
      if (score > 40) {
        results.push({
          id: doc.id,
          type: 'supplier',
          title: name,
          subtitle: category,
          path: `/proveedores?supplier=${doc.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error buscando proveedores:', error);
    return [];
  }
};

/**
 * Buscar tareas
 */
const searchTasks = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const tasksRef = collection(db, 'weddings', weddingId, 'tasks');
    const snapshot = await getDocs(query(tasksRef, limit(50)));
    
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || data.name || '';
      const description = data.description || '';
      const score = Math.max(
        fuzzyScore(title, queryText),
        fuzzyScore(description, queryText) * 0.8
      );
      
      if (score > 40) {
        results.push({
          id: doc.id,
          type: 'task',
          title,
          subtitle: data.completed ? '✓ Completada' : 'Pendiente',
          path: `/tareas?task=${doc.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error buscando tareas:', error);
    return [];
  }
};

/**
 * Buscar en presupuesto
 */
const searchBudget = async (queryText, weddingId) => {
  if (!weddingId) return [];
  
  try {
    const budgetRef = collection(db, 'weddings', weddingId, 'budgetItems');
    const snapshot = await getDocs(query(budgetRef, limit(50)));
    
    const results = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || data.concept || '';
      const category = data.category || '';
      const score = Math.max(
        fuzzyScore(name, queryText),
        fuzzyScore(category, queryText)
      );
      
      if (score > 40) {
        results.push({
          id: doc.id,
          type: 'budget',
          title: name,
          subtitle: `€${data.amount || 0} - ${category}`,
          path: `/presupuesto?item=${doc.id}`,
          score,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error buscando en presupuesto:', error);
    return [];
  }
};

/**
 * Buscar páginas/rutas de la app
 */
const searchPages = (queryText) => {
  const pages = [
    { title: 'Dashboard', path: '/', keywords: ['inicio', 'home', 'principal'] },
    { title: 'Invitados', path: '/invitados', keywords: ['guests', 'lista', 'rsvp'] },
    { title: 'Seating Plan', path: '/seating', keywords: ['mesas', 'plano', 'distribución'] },
    { title: 'Proveedores', path: '/proveedores', keywords: ['suppliers', 'servicios', 'vendors'] },
    { title: 'Presupuesto', path: '/presupuesto', keywords: ['budget', 'gastos', 'finanzas'] },
    { title: 'Tareas', path: '/tareas', keywords: ['tasks', 'checklist', 'pendientes'] },
    { title: 'Calendario', path: '/calendario', keywords: ['calendar', 'eventos', 'fechas'] },
    { title: 'Configuración', path: '/configuracion', keywords: ['settings', 'ajustes', 'perfil'] },
    { title: 'Asistente IA', path: '/asistente', keywords: ['ai', 'chat', 'ayuda'] },
  ];
  
  const results = [];
  pages.forEach(page => {
    const titleScore = fuzzyScore(page.title, queryText);
    const keywordScores = page.keywords.map(k => fuzzyScore(k, queryText));
    const maxKeywordScore = Math.max(...keywordScores, 0);
    const score = Math.max(titleScore, maxKeywordScore);
    
    if (score > 50) {
      results.push({
        id: page.path,
        type: 'settings',
        title: page.title,
        subtitle: 'Ir a página',
        path: page.path,
        score,
      });
    }
  });
  
  return results;
};

/**
 * Función principal de búsqueda
 * Busca en todas las entidades y combina resultados
 */
export const searchAll = async (queryText, weddingId, userId) => {
  if (!queryText || queryText.length < 2) {
    return [];
  }
  
  try {
    // Ejecutar todas las búsquedas en paralelo
    const [guests, suppliers, tasks, budget, pages] = await Promise.all([
      searchGuests(queryText, weddingId),
      searchSuppliers(queryText, weddingId),
      searchTasks(queryText, weddingId),
      searchBudget(queryText, weddingId),
      Promise.resolve(searchPages(queryText)),
    ]);
    
    // Combinar y ordenar por score
    const allResults = [
      ...guests,
      ...suppliers,
      ...tasks,
      ...budget,
      ...pages,
    ].sort((a, b) => b.score - a.score);
    
    // Limitar a top 15 resultados
    return allResults.slice(0, 15);
  } catch (error) {
    console.error('Error en búsqueda global:', error);
    return [];
  }
};

/**
 * Índice para búsqueda instantánea (opcional, para performance)
 */
let searchCache = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto

export const searchAllCached = async (queryText, weddingId, userId) => {
  const cacheKey = `${weddingId}_${queryText}`;
  const now = Date.now();
  
  // Verificar cache
  if (searchCache[cacheKey] && (now - cacheTimestamp) < CACHE_TTL) {
    return searchCache[cacheKey];
  }
  
  // Buscar y cachear
  const results = await searchAll(queryText, weddingId, userId);
  searchCache[cacheKey] = results;
  cacheTimestamp = now;
  
  return results;
};

/**
 * Limpiar cache (llamar cuando se actualicen datos)
 */
export const clearSearchCache = () => {
  searchCache = {};
  cacheTimestamp = 0;
};

export default {
  searchAll,
  searchAllCached,
  clearSearchCache,
};
