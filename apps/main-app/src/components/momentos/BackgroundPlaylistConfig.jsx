import React, { useState } from 'react';
import { Music, ExternalLink, Check, X, Plus } from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from '../ui';

/**
 * Componente para configurar playlist de ambiente por bloque
 */
const BackgroundPlaylistConfig = ({ block, onSave, onClose }) => {
  const [config, setConfig] = useState({
    enabled: block.backgroundPlaylist?.enabled || false,
    url: block.backgroundPlaylist?.url || '',
    name: block.backgroundPlaylist?.name || '',
  });

  const [error, setError] = useState('');

  const handleUrlChange = (url) => {
    setConfig(prev => ({ ...prev, url }));
    
    // Validar URL de Spotify
    if (url && !url.includes('spotify.com/playlist/')) {
      setError('Debe ser una URL válida de playlist de Spotify');
    } else {
      setError('');
    }
  };

  const handleSave = () => {
    if (config.enabled && !config.url) {
      setError('Debe ingresar una URL de playlist');
      return;
    }

    if (config.enabled && error) {
      return;
    }

    onSave({
      enabled: config.enabled,
      url: config.url,
      name: config.name || extractPlaylistName(config.url),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Music size={24} />
            Música de Ambiente - {block.name}
          </h2>
          <p className="text-sm text-green-100 mt-1">
            Configura una playlist de fondo para este bloque
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Toggle activar/desactivar */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Activar playlist de ambiente para este bloque
            </span>
          </label>

          {config.enabled && (
            <>
              {/* URL de Spotify */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Playlist de Spotify
                </label>
                <input
                  type="url"
                  value={config.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {error && (
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 Busca o crea una playlist en Spotify y pega aquí el enlace
                </p>
              </div>

              {/* Nombre personalizado (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre personalizado <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Música Cena Romántica"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>ℹ️ ¿Qué es música de ambiente?</strong>
                  <br />
                  Es una playlist que suena de fondo durante todo el bloque, separada de los momentos especiales. 
                  Por ejemplo, música suave durante la cena mientras se intercalan momentos como el Primer Baile.
                </p>
              </div>

              {/* Preview si hay URL */}
              {config.url && !error && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={16} className="text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      Playlist válida
                    </span>
                  </div>
                  <a
                    href={config.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Abrir en Spotify
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={config.enabled && (error || !config.url)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check size={16} className="mr-2" />
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Extraer nombre de playlist desde URL (fallback)
 */
function extractPlaylistName(url) {
  if (!url) return '';
  
  // Intentar extraer ID de la URL
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  if (match) {
    return `Playlist ${match[1].substring(0, 8)}`;
  }
  
  return 'Playlist de Spotify';
}

BackgroundPlaylistConfig.propTypes = {
  block: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BackgroundPlaylistConfig;
