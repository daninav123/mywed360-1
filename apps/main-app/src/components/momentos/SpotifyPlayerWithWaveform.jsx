import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * SpotifyPlayerWithWaveform - Player de Spotify con visualizador de ondas
 * Muestra el player embebido de Spotify + visualización de audio en tiempo real
 */
const SpotifyPlayerWithWaveform = ({ trackId, trackUrl }) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!trackId) return;

    // Inicializar visualizador de ondas
    const initializeVisualizer = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Crear AudioContext si no existe
        if (!audioContextRef.current) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          audioContextRef.current = audioContext;

          // Crear analizador
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;
        }

        // Dibujar ondas
        const draw = () => {
          if (!analyserRef.current) return;

          const analyser = analyserRef.current;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');

          // Limpiar canvas
          ctx.fillStyle = 'rgb(15, 23, 42)'; // Fondo oscuro
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Dibujar barras de frecuencia
          const barWidth = (canvas.width / dataArray.length) * 2.5;
          let barHeight;
          let x = 0;

          for (let i = 0; i < dataArray.length; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height;

            // Gradiente de color
            const hue = (i / dataArray.length) * 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }

          animationIdRef.current = requestAnimationFrame(draw);
        };

        draw();
      } catch (error) {
        console.error('[SpotifyPlayerWithWaveform] Error initializing visualizer:', error);
      }
    };

    initializeVisualizer();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [trackId]);

  // Detectar cuando el usuario presiona play en el player de Spotify
  useEffect(() => {
    const handleSpotifyPlay = () => {
      setIsPlaying(true);
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    const handleSpotifyPause = () => {
      setIsPlaying(false);
    };

    // Escuchar eventos del documento
    document.addEventListener('play', handleSpotifyPlay, true);
    document.addEventListener('pause', handleSpotifyPause, true);

    return () => {
      document.removeEventListener('play', handleSpotifyPlay, true);
      document.removeEventListener('pause', handleSpotifyPause, true);
    };
  }, []);

  if (!trackId) {
    return (
      <div className="text-center py-4 text-gray-500">
        Selecciona una canción para ver el visualizador
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visualizador de ondas */}
      <div className="bg-slate-900 rounded-lg overflow-hidden shadow-lg">
        <canvas ref={canvasRef} width={400} height={120} className="w-full h-32 bg-slate-900" />
      </div>

      {/* Player de Spotify embebido */}
      <div className="rounded-lg overflow-hidden shadow-md">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
        />
      </div>

      {/* Indicador de reproducción */}
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-50 rounded-lg p-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Reproduciendo en Spotify</span>
        </div>
      )}
    </div>
  );
};

SpotifyPlayerWithWaveform.propTypes = {
  trackId: PropTypes.string,
  trackUrl: PropTypes.string,
};

SpotifyPlayerWithWaveform.defaultProps = {
  trackId: null,
  trackUrl: null,
};

export default SpotifyPlayerWithWaveform;
