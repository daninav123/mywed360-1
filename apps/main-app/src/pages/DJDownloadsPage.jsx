import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Download, Music, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Button } from '../components/ui';
import {
  getAllSpecialSongsWithAudio,
  downloadAudioFile,
  calculateTotalAudioStorage,
} from '../services/audioUploadService';

/**
 * Página pública para que el DJ descargue archivos de audio de canciones especiales
 * URL: /dj-downloads/:weddingId/:token
 */
const DJDownloadsPage = () => {
  const { t } = useTranslation('pages');
  const { weddingId, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weddingData, setWeddingData] = useState(null);
  const [songsWithAudio, setSongsWithAudio] = useState([]);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    loadData();
  }, [weddingId, token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Validar token (simple validation - en producción usar sistema más robusto)
      if (!token || token.length < 10) {
        throw new Error('Token inválido');
      }

      // Cargar datos de la boda
      const weddingRef = doc(db, 'weddings', weddingId);
      const weddingSnap = await getDoc(weddingRef);

      if (!weddingSnap.exists()) {
        throw new Error('Boda no encontrada');
      }

      const data = weddingSnap.data();
      setWeddingData(data);

      // Cargar momentos especiales
      const specialMomentsRef = doc(db, 'weddings', weddingId, 'specialMoments', 'main');
      const specialSnap = await getDoc(specialMomentsRef);

      if (specialSnap.exists()) {
        const { blocks = [], moments = {} } = specialSnap.data();

        // Obtener función getSelectedSong
        const getSelectedSong = (moment) => {
          if (!moment || !moment.songCandidates) return null;
          return moment.songCandidates.find((c) => c.id === moment.selectedSongId) || null;
        };

        const songs = getAllSpecialSongsWithAudio(moments, blocks, getSelectedSong);
        setSongsWithAudio(songs);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading DJ downloads:', err);
      setError(err.message || 'Error al cargar los archivos');
      setLoading(false);
    }
  };

  const handleDownload = async (song, index) => {
    if (!song.song.audioFile?.downloadURL) return;

    setDownloading((prev) => ({ ...prev, [index]: true }));

    try {
      await downloadAudioFile(
        song.song.audioFile.downloadURL,
        `${song.blockName}-${song.song.title}.${song.song.audioFile.fileName?.split('.').pop() || 'mp3'}`
      );
    } catch (err) {
      console.error('Download error:', err);
      alert('Error al descargar el archivo');
    } finally {
      setDownloading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < songsWithAudio.length; i++) {
      await handleDownload(songsWithAudio[i], i);
      // Esperar 500ms entre descargas para evitar problemas
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="mx-auto text-purple-600 animate-spin mb-4" size={48} />
          <p className="text-gray-600">Cargando archivos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Music className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archivos de Audio - DJ</h1>
              <p className="text-gray-600">{weddingData?.weddingInfo?.coupleName || 'Boda'}</p>
            </div>
          </div>

          {weddingData?.weddingInfo?.weddingDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <strong>📅 Fecha del evento:</strong>{' '}
                {new Date(weddingData.weddingInfo.weddingDate).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{songsWithAudio.length}</div>
              <div className="text-sm text-gray-600">Canciones Especiales</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {songsWithAudio.reduce((acc, s) => acc + (s.song.audioFile?.fileSize || 0), 0) > 0
                  ? Math.round(
                      songsWithAudio.reduce(
                        (acc, s) => acc + (s.song.audioFile?.fileSize || 0),
                        0
                      ) /
                        (1024 * 1024)
                    )
                  : 0}{' '}
                MB
              </div>
              <div className="text-sm text-gray-600">Tamaño Total</div>
            </div>
          </div>

          {songsWithAudio.length > 1 && (
            <div className="mt-4">
              <Button
                onClick={handleDownloadAll}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Download size={20} className="mr-2" />
                Descargar Todas ({songsWithAudio.length})
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Canciones */}
        {songsWithAudio.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Music className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay archivos disponibles
            </h3>
            <p className="text-gray-600">
              Los novios aún no han subido archivos de audio para las canciones especiales.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {songsWithAudio.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <File className="text-white" size={24} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Título y artista */}
                    <h3 className="text-lg font-bold text-gray-900">{item.song.title}</h3>
                    <p className="text-sm text-gray-600">{item.song.artist}</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                        {item.blockName}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                        {item.song.specialType === 'remix'
                          ? 'Remix'
                          : item.song.specialType === 'edit'
                            ? 'Edit'
                            : item.song.specialType === 'mashup'
                              ? 'Mashup'
                              : item.song.specialType === 'live'
                                ? 'En vivo'
                                : 'Especial'}
                      </span>
                      {item.momentTime && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          ⏰ {item.momentTime}
                        </span>
                      )}
                    </div>

                    {/* Instrucciones DJ */}
                    {item.song.djInstructions && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Instrucciones:</p>
                        <p className="text-sm text-amber-800">{item.song.djInstructions}</p>
                      </div>
                    )}

                    {/* Info del archivo */}
                    {item.song.audioFile && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="text-green-600" size={16} />
                        <span>
                          {item.song.audioFile.fileName} •{' '}
                          {Math.round(((item.song.audioFile.fileSize || 0) / (1024 * 1024)) * 100) /
                            100}{' '}
                          MB
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => handleDownload(item, index)}
                      disabled={downloading[index]}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      {downloading[index] ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <>
                          <Download size={20} className="mr-2" />
                          Descargar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Powered by MaLoveApp 💕</p>
        </div>
      </div>
    </div>
  );
};

export default DJDownloadsPage;
