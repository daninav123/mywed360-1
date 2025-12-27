/**
 * Servicio de exportación múltiple de playlists
 * Genera playlists separadas por bloque con distinción momentos/ambiente
 */

import { extractSpotifyTrackId } from './spotifyExportService';

/**
 * Exportar canciones organizadas por bloques
 * Genera múltiples playlists según configuración
 */
export async function exportMultiplePlaylistsByBlock({
  blocks,
  moments,
  getSelectedSong,
  weddingName = 'Boda',
}) {
  const playlists = [];
  const summary = {
    totalBlocks: blocks.length,
    totalPlaylists: 0,
    totalSongs: 0,
    specialSongs: 0,
  };

  for (const block of blocks) {
    const blockMoments = moments[block.id] || [];
    
    // Playlist de momentos especiales
    const momentPlaylist = buildMomentPlaylist({
      block,
      moments: blockMoments,
      getSelectedSong,
      weddingName,
    });

    if (momentPlaylist.songs.length > 0) {
      playlists.push(momentPlaylist);
      summary.totalPlaylists++;
      summary.totalSongs += momentPlaylist.songs.length;
      summary.specialSongs += momentPlaylist.specialSongs.length;
    }

    // Playlist de ambiente (si está configurada)
    if (block.backgroundPlaylist && block.backgroundPlaylist.enabled) {
      const ambientPlaylist = {
        type: 'background',
        blockId: block.id,
        blockName: block.name,
        name: `${weddingName} - ${block.name} (Ambiente)`,
        description: `Música de ambiente para ${block.name}`,
        externalUrl: block.backgroundPlaylist.url,
        externalName: block.backgroundPlaylist.name,
        isExternal: true,
      };
      playlists.push(ambientPlaylist);
      summary.totalPlaylists++;
    }
  }

  return {
    success: true,
    playlists,
    summary,
  };
}

/**
 * Construir playlist de momentos especiales para un bloque
 */
function buildMomentPlaylist({ block, moments, getSelectedSong, weddingName }) {
  const spotifySongs = [];
  const specialSongs = [];
  const missingSongs = [];

  moments.forEach((moment) => {
    const song = getSelectedSong(moment);
    
    if (!song) {
      missingSongs.push({ 
        moment: moment.title, 
        reason: 'Sin canción asignada',
        time: moment.time,
      });
      return;
    }

    if (song.isSpecial) {
      specialSongs.push({
        moment: moment.title,
        song: `${song.title} - ${song.artist}`,
        type: song.specialType,
        instructions: song.djInstructions,
        time: moment.time,
        audioFile: song.audioFile,
      });
      return;
    }

    if (song.trackUrl && song.trackUrl.includes('spotify.com')) {
      const trackId = extractSpotifyTrackId(song.trackUrl);
      if (trackId) {
        spotifySongs.push({
          trackId,
          title: song.title,
          artist: song.artist,
          moment: moment.title,
          time: moment.time,
          order: moment.order,
        });
      }
    } else {
      missingSongs.push({
        moment: moment.title,
        song: `${song.title} - ${song.artist}`,
        reason: 'No disponible en Spotify',
        time: moment.time,
      });
    }
  });

  return {
    type: 'moments',
    blockId: block.id,
    blockName: block.name,
    name: `${weddingName} - ${block.name} (Momentos)`,
    description: `Momentos especiales para ${block.name}`,
    songs: spotifySongs,
    specialSongs,
    missingSongs,
    stats: {
      total: moments.length,
      spotify: spotifySongs.length,
      special: specialSongs.length,
      missing: missingSongs.length,
    },
  };
}

/**
 * Generar URLs de playlists (integración con Spotify API)
 */
export async function createSpotifyPlaylists(playlists) {
  const results = [];

  for (const playlist of playlists) {
    if (playlist.isExternal) {
      // Ya es una playlist externa, solo referenciarla
      results.push({
        ...playlist,
        url: playlist.externalUrl,
        created: false,
      });
    } else {
      // Crear nueva playlist en Spotify
      try {
        const url = await createSpotifyPlaylistAPI({
          name: playlist.name,
          description: playlist.description,
          tracks: playlist.songs.map(s => s.trackId),
        });
        
        results.push({
          ...playlist,
          url,
          created: true,
        });
      } catch (error) {
        console.error(`Error creating playlist ${playlist.name}:`, error);
        results.push({
          ...playlist,
          error: error.message,
          created: false,
        });
      }
    }
  }

  return results;
}

/**
 * Placeholder para integración real con Spotify Web API
 */
async function createSpotifyPlaylistAPI({ name, description, tracks }) {
  // TODO: Integrar con Spotify Web API
  // 1. Autenticar usuario
  // 2. Crear playlist
  // 3. Añadir tracks
  // 4. Devolver URL
  
  console.log('Creating Spotify playlist:', { name, description, trackCount: tracks.length });
  
  // Por ahora, devolver URL de ejemplo
  return `https://open.spotify.com/playlist/example-${Date.now()}`;
}

/**
 * Generar resumen de todas las playlists
 */
export function generatePlaylistsSummary(playlists) {
  const summary = {
    total: playlists.length,
    byType: {
      moments: playlists.filter(p => p.type === 'moments').length,
      background: playlists.filter(p => p.type === 'background').length,
    },
    byBlock: {},
    totalSongs: 0,
    totalSpecialSongs: 0,
  };

  playlists.forEach(playlist => {
    if (!summary.byBlock[playlist.blockName]) {
      summary.byBlock[playlist.blockName] = {
        moments: 0,
        background: 0,
      };
    }
    
    summary.byBlock[playlist.blockName][playlist.type]++;
    
    if (playlist.songs) {
      summary.totalSongs += playlist.songs.length;
    }
    
    if (playlist.specialSongs) {
      summary.totalSpecialSongs += playlist.specialSongs.length;
    }
  });

  return summary;
}
