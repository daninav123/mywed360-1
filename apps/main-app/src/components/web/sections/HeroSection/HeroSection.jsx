import React, { useState, useEffect } from 'react';

/**
 * HeroSection - Sección principal/portada de la web de boda
 *
 * @param {Object} config - Configuración de la sección
 * @param {boolean} editable - Si está en modo edición
 * @param {function} onChange - Callback cuando cambia el contenido
 */
const HeroSection = ({ config, editable = false, onChange }) => {
  const { datos, estilo } = config;
  const { titulo, subtitulo, imagen, textoBoton, mostrarCountdown } = datos;

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer
  useEffect(() => {
    if (!mostrarCountdown || !subtitulo) return;

    const calculateCountdown = () => {
      try {
        const weddingDate = new Date(subtitulo);
        if (isNaN(weddingDate.getTime())) return;

        const now = new Date();
        const diff = weddingDate - now;

        if (diff > 0) {
          setCountdown({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          });
        }
      } catch (e) {
        // Silently fail if date parsing fails
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [subtitulo, mostrarCountdown]);

  const handleContentChange = (field, value) => {
    if (onChange) {
      onChange({
        ...config,
        datos: {
          ...datos,
          [field]: value,
        },
      });
    }
  };

  return (
    <section
      className={`
        hero-section relative flex items-center justify-center
        ${estilo.altura === 'screen' ? 'h-screen' : 'h-96'}
        ${estilo.alineacion === 'center' ? 'text-center' : ''}
      `}
      style={{
        backgroundImage: imagen
          ? `url(${imagen})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      {imagen && (
        <div className="absolute inset-0 bg-black" style={{ opacity: estilo.overlay || 0.3 }} />
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Título */}
        {editable ? (
          <input
            type="text"
            value={titulo}
            onChange={(e) => handleContentChange('titulo', e.target.value)}
            className="
              text-5xl md:text-7xl font-bold text-white mb-6
              bg-transparent border-2 border-dashed border-white/50
              hover:border-white focus:border-white
              px-4 py-2 rounded-lg
              text-center w-full
              transition-colors
            "
            placeholder="Nombres de la pareja"
          />
        ) : (
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            {titulo || 'Tu Boda'}
          </h1>
        )}

        {/* Subtítulo / Fecha */}
        {editable ? (
          <input
            type="text"
            value={subtitulo}
            onChange={(e) => handleContentChange('subtitulo', e.target.value)}
            className="
              text-2xl md:text-3xl text-white/90 mb-8
              bg-transparent border-2 border-dashed border-white/50
              hover:border-white focus:border-white
              px-4 py-2 rounded-lg
              text-center w-full
              transition-colors
            "
            placeholder="Fecha de la boda"
          />
        ) : (
          <p className="text-2xl md:text-3xl text-white/90 mb-8 animate-fade-in-delay">
            {subtitulo || ''}
          </p>
        )}

        {/* Countdown */}
        {mostrarCountdown && countdown.days > 0 && !editable && (
          <div className="flex justify-center gap-6 mb-8 animate-fade-in-delay-2">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.days}</div>
              <div className="text-sm text-white/80 uppercase">Días</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.hours}</div>
              <div className="text-sm text-white/80 uppercase">Horas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.minutes}</div>
              <div className="text-sm text-white/80 uppercase">Min</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{countdown.seconds}</div>
              <div className="text-sm text-white/80 uppercase">Seg</div>
            </div>
          </div>
        )}

        {/* Botón CTA */}
        {textoBoton && !editable && (
          <button
            className="
            px-8 py-4 bg-white text-gray-900 rounded-full
            font-semibold text-lg
            hover:bg-gray-100 transition-all
            transform hover:scale-105
            shadow-xl
            animate-fade-in-delay-3
          "
          >
            {textoBoton}
          </button>
        )}

        {editable && (
          <div className="mt-6 text-white/80 text-sm">💡 Click en los textos para editar</div>
        )}
      </div>

      {/* Scroll indicator */}
      {!editable && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/80"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      )}

      <style jsx="true">{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 1s ease-out 0.3s both;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 1s ease-out 0.6s both;
        }

        .animate-fade-in-delay-3 {
          animation: fadeIn 1s ease-out 0.9s both;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
