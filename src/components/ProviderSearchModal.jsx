import { Search, RefreshCcw, MapPin } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import Spinner from './Spinner';
import { useAISearch } from '../hooks/useAISearch';
import { saveData } from '../services/SyncService';

export default function ProviderSearchModal({ onClose, onSelectProvider }) {
  const [query, setQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Hook de búsqueda IA (con reporte de fallbacks integrado)
  const { results, loading, error, usedFallback, searchProviders, clearResults } = useAISearch();

  const modalRef = useRef(null);

  // Cerrar al hacer clic fuera usando referencia (por si overlay pierde eventos)
  useEffect(() => {
    const handleOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Servicios comunes para bodas
  const commonServices = useMemo(
    () => [
      'Catering',
      'Fotografía',
      'Música',
      'Flores',
      'Vestidos',
      'Decoración',
      'Lugar',
      'Transporte',
      'Invitaciones',
      'Pasteles',
      'Joyería',
      'Detalles',
    ],
    []
  );

  // Manejar búsqueda
  const handleSearch = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (!query.trim()) {
        setToast({ message: 'Por favor, ingresa un término de búsqueda', type: 'info' });
        return;
      }

      try {
        // Limpiar toast previo
        setToast(null);
        
        // Usar hook de búsqueda (incluye reporte de fallbacks automático)
        await searchProviders(query, {
          service: serviceFilter,
          allowFallback: true, // Permitir fallback a resultados demo
        });
        
        // Guardar resultados para uso posterior (compatibilidad)
        if (results.length > 0) {
          saveData('mywed360Suppliers', results, {
            firestore: false,
            showNotification: false,
          });
          window.dispatchEvent(new Event('maloveapp-suppliers'));
        }
      } catch (err) {
        console.error('[ProviderSearchModal] Error en búsqueda:', err);
        setToast({
          message: 'Error al buscar proveedores. Inténtalo de nuevo.',
          type: 'error',
        });
      }
    },
    [query, serviceFilter, searchProviders, results]
  );

  // Mostrar mensaje de error si hay
  useEffect(() => {
    if (error) {
      setToast({
        message: error.message || 'Error al buscar proveedores',
        type: 'error',
      });
    }
  }, [error]);

  // Limpiar resultados al cerrar
  const handleClose = useCallback(() => {
    clearResults();
    setToast(null);
    onClose();
  }, [clearResults, onClose]);

  const selectProvider = useCallback(
    (item) => {
      if (onSelectProvider) {
        onSelectProvider(item);
      }
      onClose();
    },
    [onSelectProvider, onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[999]"
      onMouseDownCapture={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="bg-white rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col p-4 m-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Buscar proveedor</h3>

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border rounded p-3"
                placeholder="¿Qué buscas? Ej: Fotógrafo con experiencia en bodas al aire libre"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-full p-3 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? <RefreshCcw className="animate-spin" /> : <Search />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">Todos los servicios</option>
                {commonServices.map((service, idx) => (
                  <option key={idx} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Indicador de carga */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner text="Buscando proveedores..." />
          </div>
        )}

        {/* Resultados de búsqueda */}
        {!loading && results.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            {usedFallback && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                ℹ️ Mostramos resultados de referencia porque el servicio en vivo no está disponible
              </div>
            )}
            <h4 className="font-medium mb-2">Resultados ({results.length})</h4>
            {results.length === 0 ? (
              <p className="text-gray-500">
                No se encontraron proveedores que coincidan con tu búsqueda.
              </p>
            ) : (
              <div className="space-y-4">
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectProvider(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-blue-600">{item.title || item.name}</p>
                        <div className="flex items-center text-xs text-gray-600 mt-1 space-x-2">
                          <span className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {item.location || 'No especificada'}
                          </span>
                          {item.priceRange && (
                            <span className="flex items-center">
                              <span className="mr-1">💰</span>
                              {item.priceRange}
                            </span>
                          )}
                          {item.service && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{item.service}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                      {item.snippet || 'Sin descripcin disponible'}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {new URL(item.link).hostname.replace('www.', '')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toast para mensajes */}
        {toast && (
          <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
          >
            {toast.message}
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}


