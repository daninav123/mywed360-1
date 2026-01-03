/**
 * Sistema de detección de canciones duplicadas entre momentos
 * Ayuda a los usuarios a evitar repetir canciones en diferentes momentos de la boda
 */

/**
 * Normalizar título de canción para comparación
 * @param {string} title - Título de la canción
 * @returns {string} Título normalizado
 */
function normalizeTitle(title) {
  if (!title) return '';
  
  return title
    .toLowerCase()
    .trim()
    // Eliminar acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Eliminar caracteres especiales excepto espacios
    .replace(/[^a-z0-9\s]/g, '')
    // Colapsar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizar nombre de artista para comparación
 * @param {string} artist - Nombre del artista
 * @returns {string} Artista normalizado
 */
function normalizeArtist(artist) {
  if (!artist) return '';
  
  return artist
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Comparar dos canciones para determinar si son la misma
 * @param {Object} song1 - Primera canción
 * @param {Object} song2 - Segunda canción
 * @returns {boolean} True si son la misma canción
 */
export function areSameSong(song1, song2) {
  if (!song1 || !song2) return false;
  
  const title1 = normalizeTitle(song1.title);
  const title2 = normalizeTitle(song2.title);
  
  // Si los títulos no coinciden, no son la misma canción
  if (title1 !== title2) return false;
  
  const artist1 = normalizeArtist(song1.artist);
  const artist2 = normalizeArtist(song2.artist);
  
  // Si ambos tienen artista y no coinciden, no son la misma
  if (artist1 && artist2 && artist1 !== artist2) return false;
  
  // Títulos iguales y (sin artista o artistas iguales) = misma canción
  return true;
}

/**
 * Buscar duplicados de una canción en todos los momentos
 * @param {Object} song - Canción a buscar
 * @param {Object} allMoments - Objeto con todos los momentos por bloque { banquete: [...], ceremonia: [...], etc }
 * @param {string} currentBlockId - ID del bloque actual (para excluir)
 * @param {number} currentMomentId - ID del momento actual (para excluir)
 * @returns {Array} Array de duplicados encontrados con info del momento
 */
export function findDuplicateSongs(song, allMoments, currentBlockId, currentMomentId) {
  if (!song || !allMoments) return [];
  
  const duplicates = [];
  
  Object.entries(allMoments).forEach(([blockId, moments]) => {
    if (!Array.isArray(moments)) return;
    
    moments.forEach(moment => {
      // Saltar el momento actual
      if (blockId === currentBlockId && moment.id === currentMomentId) return;
      
      // Verificar la canción seleccionada
      if (moment.songCandidates && moment.selectedSongId) {
        const selectedSong = moment.songCandidates.find(c => c.id === moment.selectedSongId);
        
        if (selectedSong && areSameSong(song, selectedSong)) {
          duplicates.push({
            blockId,
            momentId: moment.id,
            momentTitle: moment.title,
            momentType: moment.type,
            song: selectedSong,
            isDefinitive: moment.isDefinitive || false,
          });
        }
      }
      
      // También verificar todas las candidatas (para advertir sobre posibles conflictos)
      if (moment.songCandidates && Array.isArray(moment.songCandidates)) {
        moment.songCandidates.forEach(candidate => {
          // Saltar si ya lo encontramos como seleccionada
          if (candidate.id === moment.selectedSongId) return;
          
          if (areSameSong(song, candidate)) {
            duplicates.push({
              blockId,
              momentId: moment.id,
              momentTitle: moment.title,
              momentType: moment.type,
              song: candidate,
              isDefinitive: false,
              isCandidate: true, // Marca que es solo candidata, no seleccionada
            });
          }
        });
      }
    });
  });
  
  return duplicates;
}

/**
 * Obtener mensaje de advertencia sobre duplicados
 * @param {Array} duplicates - Array de duplicados encontrados
 * @returns {Object} Objeto con severidad y mensaje
 */
export function getDuplicateWarning(duplicates) {
  if (!duplicates || duplicates.length === 0) {
    return null;
  }
  
  // Filtrar solo las seleccionadas (no candidatas)
  const selectedDuplicates = duplicates.filter(d => !d.isCandidate);
  const definitives = selectedDuplicates.filter(d => d.isDefinitive);
  
  if (definitives.length > 0) {
    return {
      severity: 'error',
      message: `⚠️ Esta canción ya está marcada como DEFINITIVA en: ${definitives.map(d => d.momentTitle).join(', ')}`,
      duplicates: definitives,
    };
  }
  
  if (selectedDuplicates.length > 0) {
    return {
      severity: 'warning',
      message: `💡 Esta canción ya está seleccionada en: ${selectedDuplicates.map(d => d.momentTitle).join(', ')}`,
      duplicates: selectedDuplicates,
    };
  }
  
  // Solo candidatas
  return {
    severity: 'info',
    message: `ℹ️ Esta canción está guardada como opción en: ${duplicates.map(d => d.momentTitle).join(', ')}`,
    duplicates,
  };
}

/**
 * Verificar si se puede agregar una canción (no está marcada como definitiva en otro momento)
 * @param {Object} song - Canción a verificar
 * @param {Object} allMoments - Todos los momentos
 * @param {string} currentBlockId - Bloque actual
 * @param {number} currentMomentId - Momento actual
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function canAddSong(song, allMoments, currentBlockId, currentMomentId) {
  const duplicates = findDuplicateSongs(song, allMoments, currentBlockId, currentMomentId);
  const definitives = duplicates.filter(d => d.isDefinitive && !d.isCandidate);
  
  if (definitives.length > 0) {
    return {
      allowed: false,
      reason: `Esta canción ya está marcada como DEFINITIVA en "${definitives[0].momentTitle}". Desmarca esa antes de usarla aquí.`,
    };
  }
  
  return { allowed: true, reason: null };
}

export default {
  areSameSong,
  findDuplicateSongs,
  getDuplicateWarning,
  canAddSong,
};
