import React, { useState, useEffect } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import { getCurrentLanguage, getMissingTranslationLog, exportMissingKeys } from '../../i18n';

/**
 * Panel de depuración para i18n
 * Solo visible cuando el idioma actual es el modo debug (en-x-i18n)
 */
const I18nDebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [missingKeys, setMissingKeys] = useState([]);
  const [currentLang, setCurrentLang] = useState('');

  useEffect(() => {
    const checkLanguage = () => {
      const lang = getCurrentLanguage();
      setCurrentLang(lang);
      setIsVisible(lang === 'en-x-i18n');
    };

    checkLanguage();
    const interval = setInterval(checkLanguage, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateMissingKeys = () => {
      setMissingKeys(getMissingTranslationLog());
    };

    updateMissingKeys();
    const interval = setInterval(updateMissingKeys, 2000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDownload = () => {
    if (typeof window !== 'undefined' && window.__I18N_DOWNLOAD_MISSING__) {
      window.__I18N_DOWNLOAD_MISSING__();
    }
  };

  const handleReset = () => {
    if (typeof window !== 'undefined' && window.__I18N_RESET_MISSING__) {
      window.__I18N_RESET_MISSING__();
      setMissingKeys([]);
    }
  };

  if (!isVisible) return null;

  const organized = exportMissingKeys();
  const totalMissing = missingKeys.length;
  const languages = Object.keys(organized);

  return (
    <div className="fixed bottom-20 right-4 z-[9999] bg-yellow-50 border-2 border-yellow-500 rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
      <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h3 className="font-bold">Modo Debug i18n</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1 hover:bg-yellow-600 rounded transition-colors"
            title="Limpiar log"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1 hover:bg-yellow-600 rounded transition-colors"
            title="Descargar claves faltantes"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="mb-3">
          <p className="text-sm font-semibold text-yellow-800">
            Total de claves faltantes: {totalMissing}
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Las claves se muestran en formato: <code>namespace:key</code>
          </p>
        </div>

        {languages.length === 0 ? (
          <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
            ✅ No hay claves faltantes detectadas
          </div>
        ) : (
          <div className="space-y-3">
            {languages.map((lang) => {
              const namespaces = organized[lang];
              const keyCount = Object.values(namespaces).reduce(
                (sum, keys) => sum + keys.length,
                0
              );

              return (
                <div key={lang} className="bg-white rounded-md border border-yellow-300 p-2">
                  <h4 className="font-semibold text-yellow-900 text-sm mb-2">
                    {lang} ({keyCount} claves)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(namespaces).map(([ns, keys]) => (
                      <div key={ns} className="text-xs">
                        <span className="font-medium text-yellow-800">{ns}:</span>
                        <ul className="ml-4 mt-1 space-y-0.5">
                          {keys.slice(0, 5).map((key, idx) => (
                            <li key={idx} className="text-yellow-700 font-mono">
                              {key}
                            </li>
                          ))}
                          {keys.length > 5 && (
                            <li className="text-yellow-600 italic">... y {keys.length - 5} más</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-yellow-100 px-4 py-2 text-xs text-yellow-800 border-t border-yellow-300">
        <p>
          💡 <strong>Tip:</strong> Las traducciones se muestran como claves (ej: "navigation.home")
          para identificar qué falta traducir.
        </p>
        <p className="mt-1">
          📥 Haz clic en el icono de descarga para exportar las claves faltantes en JSON.
        </p>
      </div>
    </div>
  );
};

export default I18nDebugPanel;
