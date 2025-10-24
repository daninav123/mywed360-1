import { Search, RefreshCcw, MapPin } from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import Spinner from './Spinner';
import { useAISearch } from '../hooks/useAISearch';
import { saveData } from '../services/SyncService';
import useTranslations from '../hooks/useTranslations';

export default function ProviderSearchModal({ onClose, onSelectProvider }) {
  const { t, tVars } = useTranslations();
  const tEmail = useCallback((key, options) => t(key, { ns: 'email', ...options }), [t]);
  const tEmailVars = useCallback(
    (key, variables) => tVars(key, { ns: 'email', ...variables }),
    [tVars]
  );

  const [query, setQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [toast, setToast] = useState(null);

  const { results, loading, error, usedFallback, searchProviders, clearResults } = useAISearch();

  const modalRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const commonServices = useMemo(() => {
    const services = tEmail('providerSearch.services', { returnObjects: true });
    if (Array.isArray(services)) {
      return services.map((service) =>
        typeof service === 'string' ? { value: service, label: service } : service
      );
    }
    return [];
  }, [tEmail]);

  const handleSearch = useCallback(
    async (event) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!query.trim()) {
        setToast({ message: tEmail('providerSearch.messages.missingQuery'), type: 'info' });
        return;
      }

      try {
        setToast(null);

        await searchProviders(query, {
          service: serviceFilter,
          allowFallback: true,
        });

        if (results.length > 0) {
          saveData('mywed360Suppliers', results, {
            firestore: false,
            showNotification: false,
          });
          window.dispatchEvent(new Event('maloveapp-suppliers'));
        }
      } catch (searchError) {
        console.error('[ProviderSearchModal] Search error:', searchError);
        setToast({
          message: tEmail('providerSearch.messages.errorRetry'),
          type: 'error',
        });
      }
    },
    [query, serviceFilter, searchProviders, results, tEmail]
  );

  useEffect(() => {
    if (error) {
      setToast({
        message: error.message || tEmail('providerSearch.messages.error'),
        type: 'error',
      });
    }
  }, [error, tEmail]);

  const handleClose = useCallback(() => {
    clearResults();
    setToast(null);
    onClose();
  }, [clearResults, onClose]);

  const selectProvider = useCallback(
    (item) => {
      onSelectProvider?.(item);
      onClose();
    },
    [onSelectProvider, onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[999]"
      onMouseDownCapture={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="bg-white rounded shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col p-4 m-4 overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">{tEmail('providerSearch.title')}</h3>

        <form onSubmit={handleSearch} className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full border rounded p-3"
                placeholder={tEmail('providerSearch.form.placeholder')}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-full p-3 flex items-center justify-center"
              disabled={loading}
              aria-label={tEmail('providerSearch.form.searchAria')}
            >
              {loading ? <RefreshCcw className="animate-spin" /> : <Search />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="w-full border rounded p-3"
              >
                <option value="">{tEmail('providerSearch.form.servicesAll')}</option>
                {commonServices.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Spinner text={tEmail('providerSearch.messages.loading')} />
          </div>
        )}

        {!loading && (
          <div className="flex-1 overflow-y-auto">
            {usedFallback && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                {tEmail('providerSearch.messages.fallback')}
              </div>
            )}

            <h4 className="font-medium mb-2">
              {tEmailVars('providerSearch.results.title', { count: results.length })}
            </h4>

            {results.length === 0 ? (
              <p className="text-gray-500">{tEmail('providerSearch.messages.noResults')}</p>
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
                            {item.location || tEmail('providerSearch.messages.noLocation')}
                          </span>
                          {item.priceRange && (
                            <span className="flex items-center">{item.priceRange}</span>
                          )}
                          {item.service && (
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{item.service}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                      {item.snippet || tEmail('providerSearch.messages.noDescription')}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        onClick={(event) => event.stopPropagation()}
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

        {toast && (
          <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
          >
            {toast.message}
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
          <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded">
            {tEmail('providerSearch.buttons.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
