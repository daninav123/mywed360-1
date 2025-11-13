import { Check, Plus, ArrowRight, Loader2, Mail, Phone, Instagram, Search, X, AlertTriangle } from 'lucide-react';
import React from 'react';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import useTranslations from '../../../hooks/useTranslations';

/**
 * @typedef {import('../../../hooks/useAISearch').AISearchResult} AISearchResult
 */

// Im�genes por tipo de servicio
const SERVICE_IMAGES = {
  fotografia: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=60',
  fotografo: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=60',
  video: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=60',
  videografia: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=60',
  catering: 'https://images.unsplash.com/photo-1530023367847-a683933f4177?auto=format&fit=crop&w=800&q=60',
  flores: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=60',
  florista: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=60',
  decoracion: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=60',
  musica: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=60',
  dj: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=60',
  vestido: 'https://images.unsplash.com/photo-1595751949310-d6e4b2961b28?auto=format&fit=crop&w=800&q=60',
  peluqueria: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=60',
  maquillaje: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=60',
  pastel: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=60',
  tarta: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=60',
  invitaciones: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&w=800&q=60',
  default: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=60'
};

// Funci�n para normalizar texto (quitar acentos)
const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina diacr�ticos
};

// Funci�n para obtener imagen seg�n el servicio
const getServiceImage = (service) => {
  if (!service) return SERVICE_IMAGES.default;
  const normalized = normalizeText(service);
  const key = Object.keys(SERVICE_IMAGES).find(k => {
    const normalizedKey = normalizeText(k);
    return normalized.includes(normalizedKey) || normalizedKey.includes(normalized);
  });
  return SERVICE_IMAGES[key] || SERVICE_IMAGES.default;
};

/**
 * Componente que muestra los resulta�os de b�squeda con IA de proveedores.
 * Presenta una lista de resulta�os con porcentaje de coincidencia, acciones r�pidas
 * y esta�os de carga. Tambi�n muestra mensajes de error si los hubiera.
 *
 * @param {Object} props - Propiedades del componente
 * @param {AISearchResult[]} [props.results=[]] - Resulta�os de la b�squeda con IA
 * @param {boolean} props.isLoading - Indica si la b�squeda est� en progreso
 * @param {Function} props.onSelect - Funci�n para seleccionar un resultado
 * @param {string} props.query - T�rmino de b�squeda original
 * @param {string} [props.error] - Mensaje de error, si existe
 * @returns {React.ReactElement} Componente de lista de resulta�os de b�squeda con IA
 */
const AIResultList = ({ results = [], isLoading, onSelect, query, error, usedFallback }) => {
  const { t } = useTranslations();
  if (isLoading) {
    return (
      <div data-testid="ai-results-list">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <Loader2 size={40} className="text-blue-500" />
          </div>
          <p className="text-lg font-medium text-gray-700">
            {t('suppliers.aiResultList.loading.title')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t('suppliers.aiResultList.loading.subtitle', { query })}
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div data-testid="ai-results-list">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 rounded-full bg-red-100 mb-4">
            <X size={24} className="text-red-500" />
          </div>
          <p className="text-lg font-medium text-gray-700">
            {t('suppliers.aiResultList.error.title')}
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">{error}</p>
          <Button className="mt-4" size="sm" variant="outline" type="button">
            {t('suppliers.aiResultList.error.retry')}
          </Button>
        </div>
      </div>
    );
  }
  // Mensaje "sin resulta�os" se pospone hasta despu�s de definir displayResults

  if (!query) {
    return (
      <div data-testid="ai-results-list">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 rounded-full bg-blue-100 mb-4">
            <Search size={24} className="text-blue-500" />
          </div>
          <p className="text-lg font-medium text-gray-700">
            {t('suppliers.aiResultList.emptyQuery.title')}
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            {t('suppliers.aiResultList.emptyQuery.description')}
          </p>
        </div>
      </div>
    );
  }
  // Ejemplo de da�os para m�strar en modo de dem�straci�n
  // DEMO DATA
  const demoResults = [
    {
      id: 1,
      name: 'Fotograf�a Naturaleza Viva',
      service: 'Fotograf�a',
      snippet:
        'Estudio especializado en fotograf�a de bodas con estilo natural y documental. Capta�os los momentos m�s emotivos y espont�neos de tu boda.',
      match: 95,
      image:
        'https://images.unsplash.com/photo-1537633552985-df8429e8048b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTB8fHdlZGRpbmclMjBwaG90b2dyYXBoeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Madrid',
      price: '1200� - 2500�',
      aiSummary:
        'Este fot�grafo tiene un estilo natural y documental perfecto para bodas en exteriores. Sus im�genes capturan momentos espont�neos con iluminaci�n natural, ideal para lo que buscas.',
    },
    {
      id: 2,
      name: 'Lente Azul Fotograf�a',
      service: 'Fotograf�a',
      snippet:
        'M�s de 10 a�os de experiencia en fotograf�a de bodas en playa y espacios naturales. Ofrecem�s paquetes personaliza�os para cada pareja.',
      match: 87,
      image:
        'https://images.unsplash.com/photo-1508435234994-67cfd7690508?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Nnx8d2VkZGluZyUyMHBob3RvZ3JhcGh5fGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Barcelona',
      price: '1500� - 3000�',
      aiSummary:
        'Especialistas en bodas en la playa con un estilo luminoso y natural. Su portfolio muestra una gran experiencia en entornos costeros y saben aprovechar la luz natural.',
    },
    {
      id: 3,
      name: 'Momentos Eternos',
      service: 'Fotograf�a',
      snippet:
        'Fotograf�a de autor para bodas con estilo �nico. Combina�os fotograf�a documental con retra�os art�sticos para crear un �lbum inolvidable.',
      match: 79,
      image:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fHdlZGRpbmclMjBwaG90b2dyYXBoeXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
      location: 'Valencia',
      price: '1000� - 2000�',
      aiSummary:
        'Ofrece un enfoque art�stico con elementos documentales. Aunque su estilo es m�s estilizado que puramente natural, tiene experiencia en bodas al aire libre.',
    },
  ];

  // SIEMPRE usar datos reales, nunca demo automáticamente
  const displayResults = results.length > 0 ? results : [];

  // DEBUG: Ver qué resultados llegan
  if (displayResults.length > 0) {
    // console.log('[AIResultList] ✅ Mostrando', displayResults.length, 'resultados reales');
    // console.log('[AIResultList] Primer resultado:', {
      name: displayResults[0]?.name,
      service: displayResults[0]?.service,
      hasImage: !!displayResults[0]?.image
    });
  }
  
  // Si no hay resultados reales y query existe, mostrar mensaje
  if (query && displayResults.length === 0 && !isLoading && !error) {
    return (
      <div data-testid="ai-results-list">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-3 rounded-full bg-yellow-100 mb-4">
            <Search size={24} className="text-yellow-600" />
          </div>
          <p className="text-lg font-medium text-gray-700">
            {t('suppliers.aiResultList.noResults.title')}
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            {t('suppliers.aiResultList.noResults.description', { query })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-results-list">
      {usedFallback && query && (
        <div className="w-full flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded">
          <AlertTriangle size={18} className="mt-0.5" />
          <div className="text-sm">
            {t('suppliers.aiResultList.fallbackNotice')}
          </div>
        </div>
      )}
      {/* Resumen de la búsqueda */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {t('suppliers.aiResultList.summary.prefix')}
          <span className="font-medium">{displayResults.length}</span>
          {t('suppliers.aiResultList.summary.suffix')}
        </p>
        <p className="text-lg font-medium">"{query}"</p>
      </div>

      {/* Lista de resultados */}
      {displayResults.map((result) => (
        <Card key={result.id} className="relative overflow-hidden">
          {/* Indicador de porcentaje de coincidencia */}
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {t('suppliers.aiResultList.matchBadge', { value: result.match })}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Imagen */}
            <div className="w-full md:w-32 h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
              <img 
                src={(() => {
                  // Usar imagen del resultado si existe y no es vacía, sino usar placeholder según servicio
                  const imgSrc = (result.image && result.image.trim()) 
                    ? result.image 
                    : getServiceImage(result.service);
                  return imgSrc;
                })()} 
                alt={result.name} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = SERVICE_IMAGES.default;
                }}
              />
            </div>

            {/* Contenido principal */}
            <div className="flex-1">
              <div className="flex flex-wrap justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{result.name}</h3>
                  <p className="text-sm text-gray-600">{result.service}</p>
                </div>
                {result.price && (
                  <span className="text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                    {result.price}
                  </span>
                )}
              </div>

              {result.location && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">
                    {t('suppliers.aiResultList.locationLabel')}
                  </span>{' '}
                  {result.location}
                </p>
              )}

              {/* Email, Teléfono e Instagram */}
              <div className="flex flex-wrap gap-3 mb-2">
                {result.email && (
                  <a
                    href={`mailto:${result.email}`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    title={t('suppliers.aiResultList.links.emailTitle')}
                  >
                    <Mail size={14} className="mr-1" />
                    {result.email}
                  </a>
                )}
                {result.phone && (
                  <a
                    href={`tel:${result.phone}`}
                    className="flex items-center text-sm text-green-600 hover:text-green-800 hover:underline"
                    title={t('suppliers.aiResultList.links.phoneTitle')}
                  >
                    <Phone size={14} className="mr-1" />
                    {result.phone}
                  </a>
                )}
                {result.instagram && (
                  <a
                    href={result.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-pink-600 hover:text-pink-800 hover:underline"
                    title={t('suppliers.aiResultList.links.instagramTitle')}
                  >
                    <Instagram size={14} className="mr-1" />
                    {t('suppliers.aiResultList.links.instagramLabel')}
                  </a>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-3">{result.snippet}</p>

              {/* An�lisis de IA */}
              {result.aiSummary && (
                <div className="bg-blue-50 p-3 rounded-md mb-3">
                  <p className="text-xs font-semibold text-blue-600 mb-1">
                    {t('suppliers.aiResultList.aiAnalysis')}
                  </p>
                  <p className="text-sm text-gray-700">{result.aiSummary}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Button onClick={() => onSelect(result, 'view')} variant="outline" size="sm">
                  <ArrowRight size={16} className="mr-1" />
                  {t('suppliers.aiResultList.buttons.view')}
                </Button>
                <Button onClick={() => onSelect(result, 'add')} size="sm">
                  <Plus size={16} className="mr-1" />
                  {t('suppliers.aiResultList.buttons.add')}
                </Button>
                <Button
                  onClick={() => onSelect(result, 'email')}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid="email-provider-btn"
                >
                  <Mail size={16} className="mr-1" />
                  {t('suppliers.aiResultList.buttons.email')}
                </Button>
                <Button
                  onClick={() => onSelect(result, 'select')}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Check size={16} className="mr-1" />
                  {t('suppliers.aiResultList.buttons.select')}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Optimizar renderizado con React.memo
export default React.memo(AIResultList, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia alguno de estos valores
  return (
    prevProps.results?.length === nextProps.results?.length &&
    JSON.stringify(prevProps.results) === JSON.stringify(nextProps.results) &&
    prevProps.onSelect === nextProps.onSelect
  );
});
