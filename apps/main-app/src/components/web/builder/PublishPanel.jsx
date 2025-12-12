import React, { useState } from 'react';
import { publishWeb } from '../../../services/webBuilder/webConfigService';

/**
 * PublishPanel - Panel para publicar la web
 */
const PublishPanel = ({ config, onPublish, isLoading = false }) => {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [error, setError] = useState(null);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);

    try {
      // Simular publicación
      const slug = generateSlug(config.meta.titulo);
      const url = `https://maloveapp.com/${slug}`;

      // En producción, llamar a publishWeb
      // const result = await publishWeb(userId, weddingId, config);

      setPublishedUrl(url);
      setPublished(true);

      if (onPublish) {
        onPublish({
          slug,
          url,
          publishedAt: new Date(),
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const generateSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  if (published) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Web Publicada!</h3>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <p className="text-gray-600 mb-3">Tu web está disponible en:</p>
          <div className="flex items-center gap-3 bg-white p-4 rounded-lg border-2 border-green-200">
            <input
              type="text"
              value={publishedUrl}
              readOnly
              className="flex-1 bg-transparent text-blue-600 font-mono text-sm focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publishedUrl);
                alert('URL copiada al portapapeles');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.open(publishedUrl, '_blank')}
            className="
              w-full px-6 py-3 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 transition-colors font-semibold
            "
          >
            👁️ Ver Web Publicada
          </button>

          <button
            onClick={() => {
              const text = `¡Mira mi web de boda! ${publishedUrl}`;
              if (navigator.share) {
                navigator.share({
                  title: 'Mi Web de Boda',
                  text: text,
                  url: publishedUrl,
                });
              } else {
                navigator.clipboard.writeText(text);
                alert('Texto copiado al portapapeles');
              }
            }}
            className="
              w-full px-6 py-3 bg-green-600 text-white rounded-lg
              hover:bg-green-700 transition-colors font-semibold
            "
          >
            📤 Compartir
          </button>

          <button
            onClick={() => setPublished(false)}
            className="
              w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg
              hover:bg-gray-50 transition-colors font-semibold
            "
          >
            ← Volver
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">📊 Estadísticas de tu web:</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-600">Visitantes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-600">Confirmaciones</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-600">Comparticiones</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">🚀 Publicar tu Web</h3>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
          ❌ Error: {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Información */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">✨ Cuando publiques:</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Tu web estará disponible en una URL pública</li>
            <li>✓ Los invitados podrán acceder desde cualquier dispositivo</li>
            <li>✓ Podrás compartir en redes sociales</li>
            <li>✓ Verás estadísticas de visitantes</li>
            <li>✓ Podrás ver confirmaciones de asistencia</li>
          </ul>
        </div>

        {/* Detalles de la web */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">📋 Detalles de tu web:</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Título:</span>
              <span className="font-semibold text-gray-900">{config.meta.titulo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tema:</span>
              <span className="font-semibold text-gray-900 capitalize">{config.meta.tema}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Secciones:</span>
              <span className="font-semibold text-gray-900">{config.secciones.length}</span>
            </div>
          </div>
        </div>

        {/* Botón de publicación */}
        <button
          onClick={handlePublish}
          disabled={publishing || isLoading}
          className={`
            w-full px-8 py-4 rounded-lg font-bold text-lg
            transition-all transform
            ${
              publishing || isLoading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-white hover:shadow-lg hover:scale-105'
            }
          `}
        >
          {publishing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Publicando...
            </span>
          ) : (
            '🚀 Publicar Ahora'
          )}
        </button>

        {/* Aviso de privacidad */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          ⚠️ Una vez publicada, tu web será pública. Cualquiera con el enlace podrá acceder.
        </div>
      </div>
    </div>
  );
};

export default PublishPanel;
