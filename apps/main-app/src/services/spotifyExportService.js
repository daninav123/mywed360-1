/**
 * Servicio de exportación a Spotify
 * Maneja la creación de playlists solo con canciones disponibles en Spotify
 */

/**
 * Exportar canciones a Spotify Playlist
 * Solo exporta canciones con trackUrl válido (ignora canciones especiales/custom)
 * 
 * @param {Object} params
 * @param {string} params.playlistName - Nombre de la playlist
 * @param {Array} params.moments - Array de momentos con canciones
 * @param {Function} params.getSelectedSong - Función para obtener canción seleccionada
 * @param {string} params.blockName - Nombre del bloque (Ceremonia, Banquete, etc.)
 * @returns {Promise<Object>} - Resultado con URL de la playlist y estadísticas
 */
export async function exportToSpotifyPlaylist({
  playlistName,
  moments,
  getSelectedSong,
  blockName,
}) {
  // Filtrar solo canciones con trackUrl de Spotify
  const spotifySongs = [];
  const specialSongs = [];
  const missingSongs = [];

  moments.forEach((moment) => {
    const song = getSelectedSong(moment);
    
    if (!song) {
      missingSongs.push({ moment: moment.title, reason: 'Sin canción asignada' });
      return;
    }

    if (song.isSpecial) {
      specialSongs.push({
        moment: moment.title,
        song: `${song.title} - ${song.artist}`,
        type: song.specialType,
        instructions: song.djInstructions,
      });
      return;
    }

    if (song.trackUrl && song.trackUrl.includes('spotify.com')) {
      // Extraer track ID de la URL de Spotify
      const trackId = extractSpotifyTrackId(song.trackUrl);
      if (trackId) {
        spotifySongs.push({
          trackId,
          title: song.title,
          artist: song.artist,
          moment: moment.title,
        });
      }
    } else {
      missingSongs.push({
        moment: moment.title,
        song: `${song.title} - ${song.artist}`,
        reason: 'No disponible en Spotify',
      });
    }
  });

  // Si no hay canciones de Spotify para exportar
  if (spotifySongs.length === 0) {
    return {
      success: false,
      error: 'No hay canciones de Spotify para exportar',
      stats: {
        total: moments.length,
        spotify: 0,
        special: specialSongs.length,
        missing: missingSongs.length,
      },
      specialSongs,
      missingSongs,
    };
  }

  // Aquí se integraría con Spotify Web API
  // Por ahora, devolvemos la estructura preparada
  const playlistData = {
    name: playlistName || `Boda - ${blockName}`,
    description: `Playlist para ${blockName} - Creada desde MaLoveApp`,
    tracks: spotifySongs.map((s) => s.trackId),
  };

  return {
    success: true,
    playlistUrl: await createSpotifyPlaylistAPI(playlistData),
    stats: {
      total: moments.length,
      spotify: spotifySongs.length,
      special: specialSongs.length,
      missing: missingSongs.length,
    },
    spotifySongs,
    specialSongs,
    missingSongs,
    message: buildExportMessage(spotifySongs.length, specialSongs.length, missingSongs.length),
  };
}

/**
 * Crear playlist en Spotify usando Web API
 * Requiere autenticación OAuth previa
 */
async function createSpotifyPlaylistAPI(playlistData) {
  // IMPLEMENTACIÓN FUTURA con Spotify Web API
  // 1. Verificar token de acceso
  // 2. Crear playlist: POST https://api.spotify.com/v1/users/{user_id}/playlists
  // 3. Añadir tracks: POST https://api.spotify.com/v1/playlists/{playlist_id}/tracks
  
  // Por ahora, generar URL manual para que el usuario lo haga
  const trackIds = playlistData.tracks.join(',');
  
  // URL para abrir Spotify con búsqueda de tracks
  // Nota: Spotify no permite crear playlists directamente desde URL
  // Se necesita OAuth flow completo
  
  return `https://open.spotify.com/search/${encodeURIComponent(playlistData.name)}`;
}

/**
 * Extraer track ID de URL de Spotify
 */
export function extractSpotifyTrackId(url) {
  if (!url) return null;
  
  // Formatos soportados:
  // https://open.spotify.com/track/TRACK_ID
  // spotify:track:TRACK_ID
  
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Construir mensaje informativo sobre la exportación
 */
function buildExportMessage(spotifyCount, specialCount, missingCount) {
  const parts = [];
  
  if (spotifyCount > 0) {
    parts.push(`${spotifyCount} canción${spotifyCount !== 1 ? 'es' : ''} exportada${spotifyCount !== 1 ? 's' : ''} a Spotify`);
  }
  
  if (specialCount > 0) {
    parts.push(`${specialCount} canción${specialCount !== 1 ? 'es' : ''} especial${specialCount !== 1 ? 'es' : ''} (requiere documento para DJ)`);
  }
  
  if (missingCount > 0) {
    parts.push(`${missingCount} sin canción asignada`);
  }
  
  return parts.join(' • ');
}

/**
 * Verificar si el usuario tiene autenticación de Spotify
 */
export function hasSpotifyAuth() {
  // Verificar si hay token de acceso guardado
  const token = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');
  
  if (!token || !expiry) return false;
  
  // Verificar si el token no ha expirado
  return new Date(expiry) > new Date();
}

/**
 * Iniciar flujo de autenticación OAuth con Spotify
 */
export function initiateSpotifyAuth() {
  // Parámetros para OAuth
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  const redirectUri = `${window.location.origin}/spotify-callback`;
  const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-private',
  ].join(' ');
  
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}`;
  
  // Abrir en nueva ventana
  window.open(authUrl, 'spotify-auth', 'width=600,height=800');
}

/**
 * Obtener todas las canciones de todos los bloques para exportación completa
 */
export function getAllSongsForExport(moments, blocks, getSelectedSong) {
  const allSongs = [];
  
  blocks.forEach((block) => {
    const blockMoments = moments[block.id] || [];
    
    blockMoments.forEach((moment) => {
      const song = getSelectedSong(moment);
      
      if (song) {
        allSongs.push({
          blockName: block.name,
          momentTitle: moment.title,
          momentTime: moment.time || '',
          song: {
            title: song.title,
            artist: song.artist,
            trackUrl: song.trackUrl,
            isSpecial: song.isSpecial,
            specialType: song.specialType,
            djInstructions: song.djInstructions,
            referenceUrl: song.referenceUrl,
            duration: song.duration,
          },
          isDefinitive: moment.isDefinitive || false,
        });
      }
    });
  });
  
  return allSongs;
}
