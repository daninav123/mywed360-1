import React from 'react';
import PropTypes from 'prop-types';
import { ExternalLink } from 'lucide-react';

/**
 * MusicPlayerWithAuth - Player de Spotify simplificado
 * Muestra el player embebido de Spotify que funciona si el usuario está logueado en Spotify.com
 */
const MusicPlayerWithAuth = ({ trackId, trackUrl }) => {
  if (!trackId) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Player de Spotify - Grande para mejor experiencia */}
      <div className="rounded-lg overflow-hidden shadow-md bg-black">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
          width="100%"
          height="352"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
          className="rounded-lg"
        />
      </div>

      {/* Instrucción simple */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 text-center">
          💡 Si solo ves 30 segundos, haz login en{' '}
          <a
            href="https://accounts.spotify.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-blue-900"
          >
            Spotify.com
          </a>{' '}
          en otra pestaña y recarga esta página
        </p>
      </div>

      {/* Botón para abrir en Spotify App */}
      <a
        href={trackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg py-2 px-4 text-center text-sm font-medium transition-colors border border-gray-300"
      >
        <ExternalLink size={14} className="inline mr-2" />
        Abrir en Spotify App
      </a>
    </div>
  );
};

MusicPlayerWithAuth.propTypes = {
  trackId: PropTypes.string.isRequired,
  trackUrl: PropTypes.string.isRequired,
};

export default MusicPlayerWithAuth;
