import React from 'react';
import { 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  ExternalLink,
  Plus,
  TrendingUp,
  Sparkles
} from 'lucide-react';

/**
 * Componente para mostrar resultados de búsqueda web
 * Diferencia resultados locales vs externos
 */
const WebSearchResults = ({ results, onImport, onSelect }) => {
  if (!results || results.length === 0) {
    return null;
  }

  // Separar resultados locales y externos
  const localResults = results.filter(r => !r.isExternal);
  const externalResults = results.filter(r => r.isExternal);

  return (
    <div className="space-y-4">
      {/* AI Insight */}
      {results[0]?.aiInsight && (
        <div className="bg-[var(--color-primary)] rounded-lg p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">
                💡 Sugerencia de IA
              </p>
              <p className="text-sm text-purple-700">
                {results[0].aiInsight}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resultados locales */}
      {localResults.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tu Lista ({localResults.length})
          </h3>
          <div className="space-y-2">
            {localResults.map((result, index) => (
              <LocalResultCard 
                key={result.id || index} 
                result={result} 
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resultados web */}
      {externalResults.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Proveedores en la Web ({externalResults.length})
          </h3>
          <div className="space-y-2">
            {externalResults.map((result, index) => (
              <ExternalResultCard 
                key={result.id || index} 
                result={result} 
                onImport={onImport}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Card para resultados locales (de la DB)
 */
const LocalResultCard = ({ result, onSelect }) => (
  <button
    onClick={() => onSelect?.(result)}
    className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
  >
    {result.photo && (
      <img 
        src={result.photo} 
        alt={result.title}
        className="w-12 h-12 rounded object-cover flex-shrink-0"
      />
    )}
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-900 truncate group-hover:text-purple-900">
        {result.title}
      </p>
      {result.subtitle && (
        <p className="text-sm text-gray-500 truncate">
          {result.subtitle}
        </p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {result.rating > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{result.rating}</span>
        </div>
      )}
      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
    </div>
  </button>
);

/**
 * Card para resultados externos (Google Places, etc)
 */
const ExternalResultCard = ({ result, onImport, onSelect }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all">
    <div className="flex gap-3">
      {/* Foto */}
      {result.photo && (
        <img 
          src={result.photo} 
          alt={result.name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      )}

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Nombre y rating */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 truncate">
            {result.name}
          </h4>
          {result.rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-sm">{result.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Categoría */}
        {result.category && (
          <p className="text-sm text-gray-600 mb-2">
            {result.category}
          </p>
        )}

        {/* Dirección */}
        {result.address && (
          <div className="flex items-start gap-1 text-sm text-gray-500 mb-2">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{result.address}</span>
          </div>
        )}

        {/* Reviews y precio */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          {result.reviewCount > 0 && (
            <span>{result.reviewCount} reseñas</span>
          )}
          {result.priceLevel && (
            <span className="font-medium text-gray-700">{result.priceLevel}</span>
          )}
          {result.openNow !== undefined && (
            <span className={result.openNow ? 'text-green-600' : 'text-red-600'}>
              {result.openNow ? 'Abierto' : 'Cerrado'}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onImport?.(result)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Añadir a mi lista
          </button>
          <button
            onClick={() => onSelect?.(result)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            Ver más
          </button>
        </div>
      </div>
    </div>

    {/* Badge de fuente */}
    <div className="mt-3 pt-3 border-t border-gray-100">
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
        <Globe className="h-3 w-3" />
        {getSourceName(result.source)}
      </span>
    </div>
  </div>
);

/**
 * Nombres amigables de fuentes
 */
const getSourceName = (source) => {
  const names = {
    google_places: 'Google Maps',
    pinterest: 'Pinterest',
    unsplash: 'Unsplash',
    bodas_net: 'Bodas.net',
    yelp: 'Yelp',
  };
  return names[source] || source;
};

export default WebSearchResults;
