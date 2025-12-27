import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Music2, Link2 } from 'lucide-react';
import { Button } from '../ui';
import AudioUploader from './AudioUploader';
import { useWedding } from '../../context/WeddingContext';

/**
 * Modal para marcar una canción como especial (remix, edit, custom)
 * y añadir instrucciones para el DJ
 */
const SpecialSongModal = ({ isOpen, onClose, song, onSave, momentId }) => {
  const { activeWedding } = useWedding();
  const [formData, setFormData] = useState({
    isSpecial: false,
    specialType: '',
    djInstructions: '',
    referenceUrl: '',
    duration: '',
    audioFile: null,
  });

  useEffect(() => {
    if (song) {
      setFormData({
        isSpecial: song.isSpecial || false,
        specialType: song.specialType || '',
        djInstructions: song.djInstructions || '',
        referenceUrl: song.referenceUrl || '',
        duration: song.duration ? Math.floor(song.duration / 60) : '',
        audioFile: song.audioFile || null,
      });
    }
  }, [song]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSave({
      ...formData,
      duration: formData.duration ? parseInt(formData.duration) * 60 : null,
    });
    
    onClose();
  };

  const handleToggleSpecial = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isSpecial: checked,
      specialType: checked ? prev.specialType || 'custom' : '',
      djInstructions: checked ? prev.djInstructions : '',
      referenceUrl: checked ? prev.referenceUrl : '',
      audioFile: checked ? prev.audioFile : null,
    }));
  };

  const handleAudioUpload = (audioData) => {
    setFormData((prev) => ({
      ...prev,
      audioFile: audioData,
    }));
  };

  const handleAudioDelete = () => {
    setFormData((prev) => ({
      ...prev,
      audioFile: null,
    }));
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Music2 className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Configurar Canción</h2>
              <p className="text-sm text-gray-600">
                {song.title} - {song.artist}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Toggle Canción Especial */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="isSpecial"
                checked={formData.isSpecial}
                onChange={(e) => handleToggleSpecial(e.target.checked)}
                className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <label htmlFor="isSpecial" className="font-semibold text-gray-900 cursor-pointer">
                  Esta es una canción especial (no está en Spotify)
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Marca esto si es un remix, edit, mashup o versión especial que el DJ debe
                  buscar por su cuenta
                </p>
              </div>
            </div>
          </div>

          {formData.isSpecial && (
            <>
              {/* Tipo de Canción Especial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de canción especial *
                </label>
                <select
                  value={formData.specialType}
                  onChange={(e) => setFormData({ ...formData, specialType: e.target.value })}
                  required={formData.isSpecial}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Selecciona un tipo...</option>
                  <option value="remix">Remix</option>
                  <option value="edit">Edit</option>
                  <option value="mashup">Mashup</option>
                  <option value="live">Versión en vivo</option>
                  <option value="version_especial">Versión especial</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Instrucciones para DJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instrucciones para el DJ *
                </label>
                <textarea
                  value={formData.djInstructions}
                  onChange={(e) => setFormData({ ...formData, djInstructions: e.target.value })}
                  required={formData.isSpecial}
                  placeholder="Ej: Buscar el remix oficial de David Guetta de 2021, versión extendida de 5 minutos. Importante: debe ser la versión con intro larga, no la radio edit."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sé muy específico: versión, año, duración, características distintivas
                </p>
              </div>

              {/* URL de Referencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Link2 size={16} className="inline mr-1" />
                  URL de referencia (YouTube, SoundCloud, etc.)
                </label>
                <input
                  type="url"
                  value={formData.referenceUrl}
                  onChange={(e) => setFormData({ ...formData, referenceUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enlace donde el DJ pueda escuchar la versión exacta que quieres
                </p>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración aproximada (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="Ej: 5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Audio Uploader */}
              <AudioUploader
                audioFile={formData.audioFile}
                onUploadComplete={handleAudioUpload}
                onDelete={handleAudioDelete}
                weddingId={activeWedding}
                momentId={momentId}
                songId={song?.id}
              />

              {/* Warning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Esta canción NO se exportará a Spotify</p>
                  <p>
                    Aparecerá en el PDF para DJ con todas las instrucciones que has proporcionado.
                    {formData.audioFile && ' El DJ podrá descargar el archivo de audio directamente.'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              Guardar Configuración
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpecialSongModal;
