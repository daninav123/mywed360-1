import React from 'react';
import useTranslations from '../../hooks/useTranslations';

const WebGenerator = ({
  prompt,
  onPromptChange,
  onGenerate,
  loading,
  selectedTemplate,
  templates,
  error,
  onOpenPromptLibrary,
}) => {
  const { t } = useTranslations();

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">
        {t('websiteGenerator.prompt.title', 'Personaliza tu web')}
      </h2>
      <p className="text-gray-600 mb-4">
        {t(
          'common.websiteGenerator.prompt.description',
          'Describe cómo quieres que sea tu página web, colores, estilos o cualquier requisito específico.'
        )}
        {selectedTemplate !== 'personalizada' && templates?.[selectedTemplate] && (
          <span className="block mt-2 text-blue-600">
            {t('websiteGenerator.prompt.selectedTemplate.prefix', 'Usando plantilla: ')}
            <strong>{templates[selectedTemplate].name}</strong>
            {t(
              'common.websiteGenerator.prompt.selectedTemplate.suffix',
              '. Puedes modificar el texto sugerido o añadir más detalles.'
            )}
          </span>
        )}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-blue-700">
        <button
          type="button"
          onClick={onOpenPromptLibrary}
          className="inline-flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-full hover:bg-blue-50 transition-colors"
        >
          {t('websiteGenerator.prompt.exploreLibrary', 'Explorar biblioteca de prompts')}
        </button>
        <span className="text-gray-400">
          {t(
            'common.websiteGenerator.prompt.variablesHint',
            'Usa variables como {nombres}, {fecha}, {ubicacion}',
            {
              nombres: '{nombres}',
              fecha: '{fecha}',
              ubicacion: '{ubicacion}',
            }
          )}
        </span>
      </div>

      <textarea
        className="w-full h-40 border rounded-lg p-4"
        placeholder={t(
          'common.websiteGenerator.prompt.placeholder',
          'Describe cómo quieres que sea tu web (estilo, colores, secciones, logística, etc.)'
        )}
        value={prompt}
        onChange={(event) => onPromptChange?.(event.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{t('websiteGenerator.actions.generating', 'Generando...')}</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L11 10.586 9.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t('websiteGenerator.actions.generate', 'Generar Página Web')}</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebGenerator;
