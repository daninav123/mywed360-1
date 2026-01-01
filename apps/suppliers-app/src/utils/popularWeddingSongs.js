/**
 * Catálogo de canciones populares para bodas por tipo de momento
 * Usado para sugerencias rápidas en Momentos Especiales
 */

export const POPULAR_WEDDING_SONGS = {
  // Entrada de novio/novia
  entrada: [
    { title: 'Canon in D', artist: 'Johann Pachelbel', popularity: 95 },
    { title: 'Bridal Chorus (Here Comes The Bride)', artist: 'Richard Wagner', popularity: 90 },
    { title: 'A Thousand Years', artist: 'Christina Perri', popularity: 88 },
    { title: 'Marry You', artist: 'Bruno Mars', popularity: 85 },
    { title: 'Ave Maria', artist: 'Franz Schubert', popularity: 82 },
    { title: 'Wedding March', artist: 'Felix Mendelssohn', popularity: 80 },
    { title: 'All of Me', artist: 'John Legend', popularity: 78 },
    { title: 'Thinking Out Loud', artist: 'Ed Sheeran', popularity: 75 },
    { title: 'Perfect', artist: 'Ed Sheeran', popularity: 73 },
    { title: 'Make You Feel My Love', artist: 'Adele', popularity: 70 },
  ],

  // Primer baile
  baile: [
    { title: 'At Last', artist: 'Etta James', popularity: 95 },
    { title: 'All of Me', artist: 'John Legend', popularity: 93 },
    { title: 'Thinking Out Loud', artist: 'Ed Sheeran', popularity: 91 },
    { title: 'Perfect', artist: 'Ed Sheeran', popularity: 89 },
    { title: 'A Thousand Years', artist: 'Christina Perri', popularity: 87 },
    { title: 'Can\'t Help Falling in Love', artist: 'Elvis Presley', popularity: 85 },
    { title: 'Bésame Mucho', artist: 'Consuelo Velázquez', popularity: 83 },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong', popularity: 81 },
    { title: 'You Are The Best Thing', artist: 'Ray LaMontagne', popularity: 79 },
    { title: 'La vie en rose', artist: 'Édith Piaf', popularity: 77 },
  ],

  // Lecturas y ceremonias
  lectura: [
    { title: 'Hallelujah', artist: 'Leonard Cohen', popularity: 90 },
    { title: 'Ave Maria', artist: 'Franz Schubert', popularity: 88 },
    { title: 'A Thousand Years', artist: 'Christina Perri', popularity: 85 },
    { title: 'The Prayer', artist: 'Andrea Bocelli & Celine Dion', popularity: 83 },
    { title: 'How Long Will I Love You', artist: 'Ellie Goulding', popularity: 80 },
    { title: 'Make You Feel My Love', artist: 'Adele', popularity: 78 },
  ],

  // Intercambio de anillos
  anillos: [
    { title: 'A Thousand Years', artist: 'Christina Perri', popularity: 92 },
    { title: 'Marry Me', artist: 'Train', popularity: 88 },
    { title: 'All of Me', artist: 'John Legend', popularity: 85 },
    { title: 'This I Promise You', artist: 'NSYNC', popularity: 82 },
    { title: 'Forever', artist: 'Ben Harper', popularity: 80 },
  ],

  // Salida de ceremonia
  salida: [
    { title: 'Signed, Sealed, Delivered', artist: 'Stevie Wonder', popularity: 93 },
    { title: 'Marry You', artist: 'Bruno Mars', popularity: 91 },
    { title: 'All You Need Is Love', artist: 'The Beatles', popularity: 89 },
    { title: 'Happy Together', artist: 'The Turtles', popularity: 85 },
    { title: 'Sugar', artist: 'Maroon 5', popularity: 83 },
    { title: 'Celebration', artist: 'Kool & The Gang', popularity: 81 },
  ],

  // Corte de pastel
  corte_pastel: [
    { title: 'Sugar', artist: 'Maroon 5', popularity: 94 },
    { title: 'Cake By The Ocean', artist: 'DNCE', popularity: 90 },
    { title: 'How Sweet It Is', artist: 'James Taylor', popularity: 85 },
    { title: 'I Want Candy', artist: 'Bow Wow Wow', popularity: 80 },
  ],

  // Discursos
  discurso: [
    { title: 'Stand By Me', artist: 'Ben E. King', popularity: 88 },
    { title: 'You\'ve Got a Friend', artist: 'James Taylor', popularity: 85 },
    { title: 'Lean On Me', artist: 'Bill Withers', popularity: 83 },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong', popularity: 80 },
  ],

  // Música de ambiente / otros
  otro: [
    { title: 'Lovely Day', artist: 'Bill Withers', popularity: 85 },
    { title: 'Three Little Birds', artist: 'Bob Marley', popularity: 83 },
    { title: 'I\'m Yours', artist: 'Jason Mraz', popularity: 81 },
    { title: 'Better Together', artist: 'Jack Johnson', popularity: 79 },
    { title: 'Home', artist: 'Edward Sharpe & The Magnetic Zeros', popularity: 77 },
  ],
};

/**
 * Obtener sugerencias de canciones según el tipo de momento
 * @param {string} momentType - Tipo de momento (entrada, baile, lectura, etc.)
 * @param {number} limit - Número máximo de sugerencias (default: 5)
 * @returns {Array} Array de canciones sugeridas
 */
export function getSongSuggestions(momentType, limit = 5) {
  const suggestions = POPULAR_WEDDING_SONGS[momentType] || POPULAR_WEDDING_SONGS.otro;
  return suggestions.slice(0, limit);
}

/**
 * Buscar canciones similares en todo el catálogo
 * @param {string} query - Término de búsqueda
 * @returns {Array} Array de canciones coincidentes
 */
export function searchPopularSongs(query) {
  if (!query || query.trim().length < 2) return [];
  
  const normalized = query.toLowerCase().trim();
  const results = [];
  
  Object.entries(POPULAR_WEDDING_SONGS).forEach(([type, songs]) => {
    songs.forEach(song => {
      const titleMatch = song.title.toLowerCase().includes(normalized);
      const artistMatch = song.artist.toLowerCase().includes(normalized);
      
      if (titleMatch || artistMatch) {
        results.push({ ...song, type });
      }
    });
  });
  
  // Ordenar por popularidad
  return results.sort((a, b) => b.popularity - a.popularity);
}

/**
 * Verificar si una canción es popular para bodas
 * @param {string} title - Título de la canción
 * @param {string} artist - Artista
 * @returns {Object|null} Info de la canción si es popular, null si no
 */
export function isPopularWeddingSong(title, artist) {
  if (!title) return null;
  
  const normalizedTitle = title.toLowerCase().trim();
  const normalizedArtist = artist ? artist.toLowerCase().trim() : '';
  
  for (const songs of Object.values(POPULAR_WEDDING_SONGS)) {
    const match = songs.find(song => {
      const titleMatches = song.title.toLowerCase() === normalizedTitle;
      const artistMatches = !normalizedArtist || song.artist.toLowerCase().includes(normalizedArtist);
      return titleMatches && artistMatches;
    });
    
    if (match) return match;
  }
  
  return null;
}

export default POPULAR_WEDDING_SONGS;
