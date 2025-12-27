import React, { useState } from 'react';
import { Music, FileText, Download, Loader2, AlertCircle, CheckCircle, Link2, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui';
import { exportToSpotifyPlaylist, getAllSongsForExport } from '../../services/spotifyExportService';
import { generateDJDocument, generateSimpleList } from '../../services/djDocumentService';
import { exportMultiplePlaylistsByBlock, createSpotifyPlaylists } from '../../services/multiPlaylistExportService';
import { getAllSpecialSongsWithAudio } from '../../services/audioUploadService';
import { useWedding } from '../../context/WeddingContext';

/**
 * Barra de acciones para exportar música
 * Muestra estadísticas y botones de exportación
 */
const ExportActionsBar = ({
  blocks,
  moments,
  getSelectedSong,
  getExportStats,
  weddingInfo = {},
}) => {
  const { activeWedding } = useWedding();
  const [isExporting, setIsExporting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [djDownloadLink, setDjDownloadLink] = useState('');

  const stats = getExportStats();

  const handleExportToSpotify = async () => {
    if (stats.spotifySongs === 0) {
      toast.warning('No hay canciones de Spotify para exportar');
      return;
    }

    setIsExporting(true);

    try {
      // Exportar múltiples playlists organizadas por bloque
      const result = await exportMultiplePlaylistsByBlock({
        blocks,
        moments,
        getSelectedSong,
        weddingName: `Boda ${weddingInfo.coupleName || ''}`.trim(),
      });

      if (result.success && result.playlists.length > 0) {
        // Crear las playlists en Spotify
        const createdPlaylists = await createSpotifyPlaylists(result.playlists);
        
        const momentPlaylists = createdPlaylists.filter(p => p.type === 'moments');
        const backgroundPlaylists = createdPlaylists.filter(p => p.type === 'background');
        
        toast.success(
          `✅ ${result.playlists.length} playlist${result.playlists.length > 1 ? 's' : ''} generada${result.playlists.length > 1 ? 's' : ''}: ${momentPlaylists.length} de momentos + ${backgroundPlaylists.length} de ambiente`,
          { autoClose: 5000 }
        );
        
        if (result.summary.specialSongs > 0) {
          setTimeout(() => {
            toast.info(
              `⚠️ Recuerda generar el PDF para DJ: tienes ${result.summary.specialSongs} canción${result.summary.specialSongs > 1 ? 'es' : ''} especial${result.summary.specialSongs > 1 ? 'es' : ''}`,
              { autoClose: 8000 }
            );
          }, 2000);
        }

        // Abrir primera playlist como ejemplo
        if (createdPlaylists[0]?.url) {
          window.open(createdPlaylists[0].url, '_blank');
        }
      } else {
        toast.error('No se pudieron generar las playlists');
      }
    } catch (error) {
      console.error('Error exportando a Spotify:', error);
      toast.error('Error al exportar. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateDJDocument = async () => {
    if (stats.totalSongs === 0) {
      toast.warning('No hay canciones para generar el documento');
      return;
    }

    setIsExporting(true);

    try {
      await generateDJDocument({
        blocks,
        moments,
        getSelectedSong,
        weddingInfo,
      });

      toast.success('📄 Documento para DJ generado correctamente', {
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generando documento DJ:', error);
      toast.error('Error al generar el documento');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateSimpleList = () => {
    if (stats.totalSongs === 0) {
      toast.warning('No hay canciones para exportar');
      return;
    }

    try {
      generateSimpleList(blocks, moments, getSelectedSong);
      toast.success('Lista simple descargada');
    } catch (error) {
      console.error('Error generando lista:', error);
      toast.error('Error al generar la lista');
    }
  };

  const handleGenerateDJLink = () => {
    if (!activeWedding) {
      toast.error('No hay boda activa');
      return;
    }

    const songsWithAudio = getAllSpecialSongsWithAudio(moments, blocks, getSelectedSong);
    
    if (songsWithAudio.length === 0) {
      toast.warning('No hay archivos de audio subidos para compartir');
      return;
    }

    const token = btoa(`${activeWedding}-${Date.now()}`).substring(0, 20);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/dj-downloads/${activeWedding}/${token}`;
    
    setDjDownloadLink(link);
    navigator.clipboard.writeText(link);
    
    toast.success(
      `🔗 Enlace copiado al portapapeles (${songsWithAudio.length} archivo${songsWithAudio.length > 1 ? 's' : ''})`,
      { autoClose: 5000 }
    );
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
      {/* Estadísticas */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Exportar Música</h3>
          <p className="text-sm text-gray-600">
            Comparte tu selección musical con el DJ o crea tu playlist de Spotify
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {showDetails ? 'Ocultar' : 'Ver'} detalles
        </button>
      </div>

      {/* Estadísticas detalladas */}
      {showDetails && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalSongs}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.spotifySongs}</div>
            <div className="text-xs text-gray-600">En Spotify</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.specialSongs}</div>
            <div className="text-xs text-gray-600">Especiales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.definitiveCount}</div>
            <div className="text-xs text-gray-600">Definitivas</div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {stats.specialSongs > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">
              Tienes {stats.specialSongs} canción{stats.specialSongs > 1 ? 'es' : ''} especial{stats.specialSongs > 1 ? 'es' : ''}
            </p>
            <p className="mt-1">
              Estas canciones NO se exportarán a Spotify. Genera el PDF para DJ con todas las
              instrucciones.
            </p>
          </div>
        </div>
      )}

      {stats.totalSongs === 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-900">
            <p>No has seleccionado ninguna canción todavía.</p>
            <p className="mt-1">Empieza eligiendo música para cada momento de tu boda.</p>
          </div>
        </div>
      )}

      {stats.totalSongs > 0 && stats.definitiveCount === stats.totalSongs && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <div className="text-sm text-green-900">
            <p className="font-semibold">¡Todas las canciones están marcadas como definitivas!</p>
            <p className="mt-1">Tu playlist está lista para compartir con el DJ.</p>
          </div>
        </div>
      )}

      {/* Enlace generado para DJ */}
      {djDownloadLink && (
        <div className="mb-4 bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900 mb-2">
                ✅ Enlace de descarga generado
              </p>
              <div className="bg-white border border-green-300 rounded px-3 py-2 mb-2">
                <p className="text-xs text-gray-700 font-mono break-all">{djDownloadLink}</p>
              </div>
              <p className="text-xs text-green-800">
                Comparte este enlace con tu DJ para que descargue los archivos de audio
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(djDownloadLink);
                toast.success('Enlace copiado');
              }}
              className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Exportar a Spotify */}
        <Button
          onClick={handleExportToSpotify}
          disabled={isExporting || !stats.canExportToSpotify}
          className={`flex items-center justify-center gap-2 ${
            stats.canExportToSpotify
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExporting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Music size={18} />
          )}
          Exportar a Spotify
          {stats.spotifySongs > 0 && (
            <span className="bg-white text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {stats.spotifySongs}
            </span>
          )}
        </Button>

        {/* Generar PDF para DJ */}
        <Button
          onClick={handleGenerateDJDocument}
          disabled={isExporting || !stats.needsDJDocument}
          className={`flex items-center justify-center gap-2 ${
            stats.needsDJDocument
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExporting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <FileText size={18} />
          )}
          PDF para DJ (Completo)
          {stats.specialSongs > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              ⚠️ {stats.specialSongs}
            </span>
          )}
        </Button>

        {/* Lista simple */}
        <Button
          onClick={handleGenerateSimpleList}
          disabled={stats.totalSongs === 0}
          className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
        >
          <Download size={18} />
          Lista Simple (.txt)
        </Button>

        {/* Enlace para DJ con archivos */}
        <Button
          onClick={handleGenerateDJLink}
          disabled={!activeWedding}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
        >
          <Link2 size={18} />
          🔥 Enlace para DJ
        </Button>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        💡 El PDF incluye TODAS las canciones (Spotify + Especiales) con instrucciones detalladas
      </p>
    </div>
  );
};

export default ExportActionsBar;
