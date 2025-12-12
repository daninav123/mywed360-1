import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Modal de publicación de webs
 */
export const PublishModal = ({ isOpen, onClose, onPublish, currentSlug = '', webId }) => {
  const [slug, setSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (currentSlug) {
      setSlug(currentSlug);
    }
  }, [currentSlug]);

  const handleSlugChange = (e) => {
    // Solo permitir caracteres válidos para URL
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');

    setSlug(value);
    setIsAvailable(null); // Reset availability
  };

  const checkSlugAvailability = async () => {
    if (!slug || slug.length < 3) {
      toast.error('El slug debe tener al menos 3 caracteres');
      return;
    }

    setIsChecking(true);
    try {
      // Importar dinámicamente para evitar circular deps
      const { checkSlugAvailability: checkSlug } = await import(
        '../../../services/webBuilder/craftWebService'
      );
      const available = await checkSlug(slug, webId);
      setIsAvailable(available);

      if (available) {
        toast.success('✅ Slug disponible');
      } else {
        toast.error('❌ Slug ya está en uso');
      }
    } catch (error) {
      console.error('Error verificando slug:', error);
      toast.error('Error verificando disponibilidad');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePublish = async () => {
    if (!slug) {
      toast.error('Debes ingresar un slug');
      return;
    }

    if (slug.length < 3) {
      toast.error('El slug debe tener al menos 3 caracteres');
      return;
    }

    if (isAvailable === false) {
      toast.error('Este slug no está disponible');
      return;
    }

    // Si no se ha verificado, verificar primero
    if (isAvailable === null) {
      await checkSlugAvailability();
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish(slug);
      onClose();
    } catch (error) {
      console.error('Error publicando:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/web/${slug}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">✨ Publicar Web</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Slug Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">URL de tu web</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">{baseUrl}/web/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="mi-boda-2025"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Solo letras, números y guiones. Mínimo 3 caracteres.
            </p>
          </div>

          {/* Vista previa URL */}
          {slug && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Vista previa URL:</p>
              <p className="text-purple-600 font-mono text-sm break-all">{publicUrl}</p>
            </div>
          )}

          {/* Check availability button */}
          <button
            onClick={checkSlugAvailability}
            disabled={isChecking || !slug || slug.length < 3}
            className={`
              w-full py-2 px-4 rounded-lg font-semibold transition-colors
              ${
                isChecking || !slug || slug.length < 3
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }
            `}
          >
            {isChecking ? '🔍 Verificando...' : '🔍 Verificar disponibilidad'}
          </button>

          {/* Availability status */}
          {isAvailable !== null && (
            <div
              className={`
              p-4 rounded-lg flex items-center gap-2
              ${
                isAvailable
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }
            `}
            >
              <span className="text-2xl">{isAvailable ? '✅' : '❌'}</span>
              <div>
                <p className={`font-semibold ${isAvailable ? 'text-green-800' : 'text-red-800'}`}>
                  {isAvailable ? 'Slug disponible' : 'Slug no disponible'}
                </p>
                <p className="text-sm text-gray-600">
                  {isAvailable ? 'Puedes usar este slug para tu web' : 'Por favor, elige otro slug'}
                </p>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Sobre la publicación</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tu web será accesible públicamente en la URL indicada</li>
              <li>• Podrás seguir editándola después de publicar</li>
              <li>• Los cambios se reflejarán automáticamente</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !slug || isAvailable === false}
            className={`
              px-6 py-2 rounded-lg font-bold transition-all
              ${
                isPublishing || !slug || isAvailable === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[var(--color-primary)] text-white hover:shadow-lg'
              }
            `}
          >
            {isPublishing ? '⏳ Publicando...' : '✨ Publicar Web'}
          </button>
        </div>
      </div>
    </div>
  );
};
