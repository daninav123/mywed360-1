import React, { useState } from 'react';
import { Upload, File, X, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui';
import {
  uploadAudioFile,
  deleteAudioFile,
  getAudioFileInfo,
  downloadAudioFile,
} from '../../services/audioUploadService';

/**
 * Componente para subir archivos de audio para canciones especiales
 */
const AudioUploader = ({ audioFile, onUploadComplete, onDelete, weddingId, momentId, songId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const audioInfo = audioFile ? getAudioFileInfo(audioFile) : null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadAudioFile({
        file,
        weddingId,
        momentId,
        songId,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      onUploadComplete(result);
      setUploadProgress(100);
    } catch (err) {
      setError(err.message || 'Error al subir el archivo');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!audioFile?.storagePath) return;

    if (!window.confirm('¿Estás seguro de eliminar este archivo?')) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteAudioFile(audioFile.storagePath);
      onDelete();
    } catch (err) {
      setError(err.message || 'Error al eliminar el archivo');
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!audioInfo?.downloadURL) return;

    try {
      await downloadAudioFile(audioInfo.downloadURL, audioInfo.name);
    } catch (err) {
      setError('Error al descargar el archivo');
      console.error('Download error:', err);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        📁 Archivo de Audio (opcional)
      </label>

      {!audioFile ? (
        // Estado: Sin archivo
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="text-purple-600 animate-spin" size={40} />
                <div className="w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Subiendo... {uploadProgress}%</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="text-gray-400" size={40} />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Click para subir archivo de audio
                  </p>
                  <p className="text-xs text-gray-500 mt-1">MP3, WAV, OGG, AAC, FLAC (máx. 50MB)</p>
                </div>
              </>
            )}
          </label>
        </div>
      ) : (
        // Estado: Con archivo
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <File className="text-green-600 flex-shrink-0" size={16} />
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {audioInfo?.name || 'Archivo de audio'}
                </p>
              </div>

              <p className="text-xs text-gray-600 mt-1">
                {audioInfo?.size} • Subido{' '}
                {audioInfo?.uploadedAt ? new Date(audioInfo.uploadedAt).toLocaleDateString() : ''}
              </p>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download size={14} className="mr-1" />
                  Descargar
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                >
                  {deleting ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <X size={14} className="mr-1" />
                  )}
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <strong>💡 Consejo:</strong> Sube aquí el archivo de audio si tienes la canción especial.
          El DJ podrá descargarla directamente desde el documento que generes.
        </p>
      </div>
    </div>
  );
};

export default AudioUploader;
