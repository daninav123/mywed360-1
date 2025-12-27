/**
 * Servicio de gestión de preferencias musicales del usuario
 * Analiza gustos, canciones seleccionadas y genera sugerencias personalizadas
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Modelo de perfil musical del usuario
 */
export const DEFAULT_MUSIC_PREFERENCES = {
  // Géneros favoritos (ponderados)
  favoriteGenres: {
    pop: 0,
    rock: 0,
    indie: 0,
    electronic: 0,
    latin: 0,
    jazz: 0,
    classical: 0,
    country: 0,
    hiphop: 0,
    reggaeton: 0,
    soul: 0,
    disco: 0,
    alternative: 0,
    folk: 0,
  },

  // Artistas favoritos (texto libre)
  favoriteArtists: [],

  // Décadas preferidas
  favoriteDecades: {
    '60s': false,
    '70s': false,
    '80s': false,
    '90s': false,
    '00s': false,
    '10s': false,
    '20s': false,
  },

  // Mood/ambiente preferido
  preferredMoods: {
    romantic: false,
    energetic: false,
    calm: false,
    nostalgic: false,
    modern: false,
    classic: false,
    emotional: false,
    fun: false,
  },

  // Idiomas preferidos
  languages: {
    spanish: false,
    english: false,
    italian: false,
    french: false,
    other: false,
  },

  // Preferencias específicas
  avoidExplicit: true,
  preferLive: false,
  preferRemixes: false,

  // Metadata
  setupCompleted: false,
  lastUpdated: null,
};

/**
 * Obtener preferencias musicales del usuario
 */
export async function getMusicPreferences(weddingId) {
  if (!weddingId) {
    return DEFAULT_MUSIC_PREFERENCES;
  }

  try {
    const docRef = doc(db, 'weddings', weddingId, 'musicPreferences', 'main');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        ...DEFAULT_MUSIC_PREFERENCES,
        ...docSnap.data(),
      };
    }

    return DEFAULT_MUSIC_PREFERENCES;
  } catch (error) {
    console.error('Error loading music preferences:', error);
    return DEFAULT_MUSIC_PREFERENCES;
  }
}

/**
 * Guardar preferencias musicales del usuario
 */
export async function saveMusicPreferences(weddingId, preferences) {
  if (!weddingId) {
    throw new Error('Wedding ID required');
  }

  try {
    const docRef = doc(db, 'weddings', weddingId, 'musicPreferences', 'main');
    
    await setDoc(docRef, {
      ...preferences,
      lastUpdated: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving music preferences:', error);
    throw new Error('Error al guardar preferencias');
  }
}

/**
 * Analizar canciones seleccionadas y extraer patrones
 */
export function analyzeSelectedSongs(moments, blocks, getSelectedSong) {
  const selectedSongs = [];
  
  blocks.forEach((block) => {
    const blockMoments = moments[block.id] || [];
    blockMoments.forEach((moment) => {
      const song = getSelectedSong(moment);
      if (song) {
        selectedSongs.push({
          title: song.title,
          artist: song.artist,
          blockType: block.id,
          momentType: moment.type,
          isDefinitive: moment.isDefinitive,
        });
      }
    });
  });

  // Extraer patrones
  const patterns = {
    totalSongs: selectedSongs.length,
    definitiveCount: selectedSongs.filter(s => s.isDefinitive).length,
    
    // Artistas más frecuentes
    topArtists: extractTopItems(selectedSongs.map(s => s.artist)),
    
    // Tipos de momentos con canciones
    momentTypes: [...new Set(selectedSongs.map(s => s.momentType))],
    
    // Bloques con más canciones
    blockDistribution: selectedSongs.reduce((acc, song) => {
      acc[song.blockType] = (acc[song.blockType] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    songs: selectedSongs,
    patterns,
  };
}

/**
 * Extraer items más frecuentes
 */
function extractTopItems(items, limit = 5) {
  const counts = items.reduce((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item);
}

/**
 * Generar perfil textual del usuario para OpenAI
 */
export function generateUserMusicProfile(preferences, selectedSongsAnalysis) {
  const parts = [];

  // Géneros favoritos (solo los seleccionados)
  const topGenres = Object.entries(preferences.favoriteGenres)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
  
  if (topGenres.length > 0) {
    parts.push(`Géneros favoritos: ${topGenres.join(', ')}`);
  }

  // Artistas favoritos
  if (preferences.favoriteArtists && preferences.favoriteArtists.length > 0) {
    parts.push(`Artistas favoritos: ${preferences.favoriteArtists.slice(0, 10).join(', ')}`);
  }

  // Décadas
  const selectedDecades = Object.entries(preferences.favoriteDecades)
    .filter(([_, selected]) => selected)
    .map(([decade]) => decade);
  
  if (selectedDecades.length > 0) {
    parts.push(`Décadas preferidas: ${selectedDecadas.join(', ')}`);
  }

  // Moods
  const selectedMoods = Object.entries(preferences.preferredMoods)
    .filter(([_, selected]) => selected)
    .map(([mood]) => mood);
  
  if (selectedMoods.length > 0) {
    parts.push(`Ambiente preferido: ${selectedMoods.join(', ')}`);
  }

  // Idiomas
  const selectedLanguages = Object.entries(preferences.languages)
    .filter(([_, selected]) => selected)
    .map(([lang]) => lang);
  
  if (selectedLanguages.length > 0) {
    parts.push(`Idiomas: ${selectedLanguages.join(', ')}`);
  }

  // Canciones ya seleccionadas
  if (selectedSongsAnalysis && selectedSongsAnalysis.patterns.topArtists.length > 0) {
    parts.push(`Han elegido canciones de: ${selectedSongsAnalysis.patterns.topArtists.join(', ')}`);
  }

  // Preferencias especiales
  if (preferences.avoidExplicit) {
    parts.push('Evitar contenido explícito');
  }

  return parts.join('. ');
}

/**
 * Calcular score de relevancia de una canción
 */
export function calculateSongRelevance(song, preferences, momentType) {
  let score = 0;

  // Basado en géneros favoritos (si tenemos esa info)
  // Esto requeriría enriquecer las canciones con metadata de Spotify
  
  // Basado en artistas favoritos
  if (preferences.favoriteArtists && preferences.favoriteArtists.length > 0) {
    const artistLower = song.artist?.toLowerCase() || '';
    const matchesArtist = preferences.favoriteArtists.some(
      fav => artistLower.includes(fav.toLowerCase())
    );
    if (matchesArtist) score += 50;
  }

  // Bonus por popularidad
  if (song.popularity) {
    score += song.popularity * 0.3; // Máximo +30 puntos
  }

  return score;
}

/**
 * Determinar si necesita configurar preferencias
 */
export function needsPreferencesSetup(preferences) {
  if (!preferences || !preferences.setupCompleted) {
    return true;
  }

  // Verificar si tiene al menos algo configurado
  const hasGenres = Object.values(preferences.favoriteGenres || {}).some(v => v > 0);
  const hasArtists = preferences.favoriteArtists && preferences.favoriteArtists.length > 0;
  const hasDecades = Object.values(preferences.favoriteDecades || {}).some(v => v);
  const hasMoods = Object.values(preferences.preferredMoods || {}).some(v => v);

  return !(hasGenres || hasArtists || hasDecades || hasMoods);
}
