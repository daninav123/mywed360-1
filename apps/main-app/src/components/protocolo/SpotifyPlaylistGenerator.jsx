import React, { useState, useMemo } from 'react';
import { Music, ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui';

/**
 * SpotifyPlaylistGenerator - Genera una lista de canciones definitivas
 * para que el DJ o los novios puedan usar en Spotify
 */
const SpotifyPlaylistGenerator = ({ moments, blocks }) => {
  const [copied, setCopied] = useState(false);
  const [showList, setShowList] = useState(false);

  // Recopilar todas las canciones definitivas y playlists
  const definitiveSongs = useMemo(() => {
    const songs = [];
    blocks.forEach((block) => {
      const blockMoments = (moments[block.id] || []).sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );
      blockMoments.forEach((moment) => {
        const musicType = moment.musicType || 'song';

        // Playlists
        if (musicType === 'playlist' && moment.playlistUrl) {
          songs.push({
            title: '📋 Playlist de Ambiente',
            artist: 'Múltiples artistas',
            momentTitle: moment.title,
            momentTime: moment.time,
            blockName: block.name,
            spotifyUrl: moment.playlistUrl,
            isPlaylist: true,
          });
        }

        // Canciones definitivas
        if (
          musicType === 'song' &&
          moment.isDefinitive &&
          moment.songCandidates &&
          moment.songCandidates.length > 0
        ) {
          const selectedSong = moment.songCandidates.find((c) => c.id === moment.selectedSongId);
          if (selectedSong) {
            songs.push({
              title: selectedSong.title,
              artist: selectedSong.artist,
              momentTitle: moment.title,
              momentTime: moment.time,
              blockName: block.name,
              spotifyUrl: selectedSong.trackUrl,
              isPlaylist: false,
            });
          }
        }
      });
    });
    return songs;
  }, [moments, blocks]);

  const copyToClipboard = () => {
    const text = definitiveSongs
      .map((song) => {
        const prefix = song.isPlaylist ? '📋 ' : '🎵 ';
        return `${prefix}${song.title} - ${song.artist} (${song.momentTitle})`;
      })
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const generateSpotifySearchLinks = () => {
    return definitiveSongs.map((song) => {
      const query = encodeURIComponent(`${song.title} ${song.artist}`);
      return {
        ...song,
        searchUrl: `https://open.spotify.com/search/${query}`,
      };
    });
  };

  if (definitiveSongs.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
        <Music size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-600 mb-2 font-medium">No hay música configurada aún</p>
        <p className="text-sm text-gray-500">
          Marca canciones como definitivas o configura playlists de ambiente en Momentos Especiales
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--color-success)] text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Music size={20} />
              Música de tu Boda
            </h3>
            <p className="text-sm text-green-100 mt-1">
              {definitiveSongs.length}{' '}
              {definitiveSongs.length === 1 ? 'elemento configurado' : 'elementos configurados'}{' '}
              (canciones y playlists)
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowList(!showList)}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            {showList ? 'Ocultar' : 'Ver Lista'}
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {showList && (
        <div className="p-4 space-y-4">
          {/* Acciones */}
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1" variant="outline">
              {copied ? (
                <>
                  <CheckCircle size={16} className="mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy size={16} className="mr-2" />
                  Copiar Lista
                </>
              )}
            </Button>
          </div>

          {/* Lista de canciones */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {definitiveSongs.map((song, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-success)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-gray-900 truncate">{song.title}</div>
                      {song.isPlaylist && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded flex-shrink-0">
                          📋 Playlist
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">{song.artist}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {song.blockName}
                      </span>
                      <span className="text-xs text-gray-500">{song.momentTitle}</span>
                      {song.momentTime && (
                        <span className="text-xs text-gray-500">· {song.momentTime}</span>
                      )}
                    </div>
                  </div>
                  {song.spotifyUrl && (
                    <a
                      href={song.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
                      title="Abrir en Spotify"
                    >
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info para el DJ */}
          <div className="bg-[var(--color-primary)] p-3">
            <p className="text-xs text-blue-900 font-medium mb-2">
              💡 Comparte esta lista con tu DJ
            </p>
            <p className="text-xs text-blue-700">
              Usa el botón "Copiar Lista" y pégala en un email o documento para tu DJ. Cada canción
              incluye el momento exacto en que debe sonar.
            </p>
          </div>

          {/* Instrucciones para crear playlist manual */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-900 font-medium mb-2">
              🎵 ¿Quieres crear una playlist en Spotify?
            </p>
            <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
              <li>Abre Spotify y crea una nueva playlist</li>
              <li>Click en cada enlace de Spotify aquí para abrir la canción</li>
              <li>Añade cada canción a tu playlist</li>
              <li>¡Listo! Comparte la playlist con tu DJ</li>
            </ol>
          </div>
        </div>
      )}

      {/* Preview colapsado */}
      {!showList && (
        <div className="p-4 bg-gray-50">
          <div className="text-sm text-gray-600 text-center">
            Click "Ver Lista" para ver y copiar todas tus canciones definitivas
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlaylistGenerator;
