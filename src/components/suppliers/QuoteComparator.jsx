/**
 * 📊 QuoteComparator - Comparador Visual de Presupuestos
 *
 * Permite comparar múltiples presupuestos lado a lado con:
 * - Scoring automático
 * - Resaltado de diferencias
 * - Análisis inteligente
 * - Filtros y ordenación
 */

import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Check, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import Card from '../ui/Card';
import Button from '../ui/Button';
import QuoteSelectionConfirmModal from './QuoteSelectionConfirmModal';
import { compareQuotes, formatQuoteForComparison } from '../../utils/quoteScoring';
import { useWedding } from '../../context/WeddingContext';

export default function QuoteComparator({ quotes, request, onSelect, onClose }) {
  const { activeWedding } = useWedding();
  const [sortBy, setSortBy] = useState('score'); // score, price, rating
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Preferences del usuario (esto podría venir de un contexto)
  const [userPreferences] = useState({
    price: 30,
    service: 40,
    terms: 20,
    reputation: 10,
  });

  // Comparar y analizar presupuestos
  const comparison = useMemo(() => {
    return compareQuotes(quotes, request, userPreferences);
  }, [quotes, request, userPreferences]);

  // Ordenar según criterio
  const sortedQuotes = useMemo(() => {
    const sorted = [...comparison.quotes];

    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => a.pricing.total - b.pricing.total);
      case 'rating':
        return sorted.sort((a, b) => (b.supplier?.rating || 0) - (a.supplier?.rating || 0));
      case 'score':
      default:
        return sorted; // Ya viene ordenado por score
    }
  }, [comparison.quotes, sortBy]);

  // Manejar selección
  const handleSelect = (quote) => {
    setSelectedQuote(quote);
  };

  // Abrir modal de confirmación
  const handleOpenConfirm = () => {
    if (!selectedQuote) {
      toast.warning('Por favor selecciona un presupuesto primero');
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirmar selección final y guardar
  const handleConfirmSelection = async ({ quote, notes }) => {
    setConfirming(true);

    try {
      // Guardar en backend
      const response = await fetch('/api/weddings/' + activeWedding.id + '/services/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: request.supplierCategoryName || request.category,
          categoryKey: request.supplierCategory || 'otros',
          supplier: {
            id: request.supplierId,
            name: quote.supplierName,
            email: request.supplierEmail,
          },
          quote: {
            quoteId: quote.quoteId,
            pricing: quote.pricing,
            serviceOffered: quote.serviceOffered,
            terms: quote.terms,
            message: quote.message,
          },
          notes,
          status: 'contracted',
          requestId: request.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la selección');
      }

      toast.success(`✅ ${quote.supplierName} contratado para ${request.supplierCategoryName}!`);

      // Notificar al padre
      if (onSelect) {
        onSelect(quote);
      }

      // Cerrar modal y comparador
      setShowConfirmModal(false);
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 500);
    } catch (error) {
      console.error('Error confirming selection:', error);
      toast.error('Error al guardar la selección. Intenta de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  if (!quotes || quotes.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500">No hay presupuestos para comparar</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">📊 Comparador de Presupuestos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comparando {quotes.length} {quotes.length === 1 ? 'presupuesto' : 'presupuestos'} •{' '}
              {request.proveedor?.categoryName || 'Servicio'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Ordenar por */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="score">Ordenar por Score</option>
              <option value="price">Ordenar por Precio</option>
              <option value="rating">Ordenar por Rating</option>
            </select>

            {/* Análisis toggle */}
            <Button
              variant={showAnalysis ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              🤖 Análisis
            </Button>

            {/* Exportar */}
            <Button variant="ghost" size="sm">
              <Download size={18} />
            </Button>

            {/* Cerrar */}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-600">Precio promedio</p>
            <p className="text-lg font-bold text-gray-900">
              {comparison.stats.avgPrice.toLocaleString('es-ES')}€
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-600">Más económico</p>
            <p className="text-lg font-bold text-green-600">
              {comparison.stats.minPrice.toLocaleString('es-ES')}€
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-600">Más caro</p>
            <p className="text-lg font-bold text-orange-600">
              {comparison.stats.maxPrice.toLocaleString('es-ES')}€
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-600">Diferencia</p>
            <p className="text-lg font-bold text-gray-900">
              {comparison.stats.priceRange.toLocaleString('es-ES')}€
            </p>
          </div>
        </div>
      </Card>

      {/* Análisis automático */}
      {showAnalysis && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 text-white rounded-full p-3 flex-shrink-0">🤖</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Análisis Automático</h3>

              <div className="space-y-3">
                {comparison.insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{insight.title}</p>
                      <p className="text-sm text-gray-600">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tabla comparativa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedQuotes.map((quote, index) => {
          const isRecommended = quote === comparison.recommended;
          const isBestPrice = quote === comparison.bests.price;
          const isBestService = quote === comparison.bests.service;

          return (
            <Card
              key={quote.quoteId}
              className={`relative ${isRecommended ? 'ring-2 ring-indigo-600 shadow-lg' : ''} ${selectedQuote?.quoteId === quote.quoteId ? 'bg-indigo-50' : ''}`}
            >
              {/* Badge recomendado */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  ✨ RECOMENDADO
                </div>
              )}

              {/* Header del proveedor */}
              <div className="text-center mb-4 pt-2">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{quote.supplierName}</h3>

                {/* Rating */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.floor(quote.supplier?.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">({quote.supplier?.reviewCount || 0})</span>
                </div>

                {/* Score total */}
                <div className="mt-2">
                  <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                    <span className="text-2xl">{quote.analysis.rating.emoji}</span>
                    <span className="font-bold text-gray-900">{quote.analysis.total}/100</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{quote.analysis.rating.label}</p>
                </div>
              </div>

              {/* Precio */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-gray-600">Precio total</span>
                  {isBestPrice && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      💰 Mejor precio
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {(quote.pricing?.total || 0).toLocaleString('es-ES')}€
                </p>

                {/* Desglose */}
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  {quote.pricing?.subtotal && (
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{quote.pricing.subtotal.toLocaleString('es-ES')}€</span>
                    </div>
                  )}
                  {quote.pricing?.taxes && (
                    <div className="flex justify-between">
                      <span>IVA:</span>
                      <span>{quote.pricing.taxes.toLocaleString('es-ES')}€</span>
                    </div>
                  )}
                  {quote.pricing?.discount && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento:</span>
                      <span>-{quote.pricing.discount.toLocaleString('es-ES')}€</span>
                    </div>
                  )}
                </div>

                {/* Score de precio */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Valoración precio</span>
                    <span className="font-semibold">{quote.analysis.breakdown.price}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${quote.analysis.breakdown.price}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Servicio ofrecido */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">📋 Servicio</h4>
                  {isBestService && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                      ✨ Más completo
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  {Object.entries(quote.serviceOffered || {})
                    .slice(0, 5)
                    .map(([key, value]) => {
                      if (key === 'extras') return null;

                      const matchesRequest = request.serviceDetails?.[key] === value;

                      return (
                        <div key={key} className="flex items-start gap-2">
                          {matchesRequest ? (
                            <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle
                              size={16}
                              className="text-orange-400 flex-shrink-0 mt-0.5"
                            />
                          )}
                          <span className="text-gray-700">
                            {typeof value === 'boolean'
                              ? `${key}: ${value ? 'Sí' : 'No'}`
                              : `${key}: ${value}`}
                          </span>
                        </div>
                      );
                    })}

                  {/* Extras */}
                  {quote.serviceOffered?.extras && quote.serviceOffered.extras.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">✨ Extras incluidos:</p>
                      {quote.serviceOffered.extras.slice(0, 3).map((extra, i) => (
                        <div key={i} className="flex items-start gap-1 text-xs text-green-700">
                          <Check size={12} className="flex-shrink-0 mt-0.5" />
                          <span>{extra}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score de servicio */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Valoración servicio</span>
                    <span className="font-semibold">{quote.analysis.breakdown.service}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${quote.analysis.breakdown.service}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Condiciones */}
              <div className="mb-4 bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">📝 Condiciones</h4>
                <div className="space-y-1.5 text-xs text-gray-700">
                  <div className="flex justify-between">
                    <span>Adelanto:</span>
                    <span className="font-semibold">{quote.terms?.deposit || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega:</span>
                    <span className="font-semibold">{quote.terms?.deliveryTime || 'N/A'}</span>
                  </div>
                  <div>
                    <span>Cancelación:</span>
                    <p className="text-gray-600 mt-0.5">
                      {quote.terms?.cancellationPolicy || 'Consultar con proveedor'}
                    </p>
                  </div>
                </div>

                {/* Score de términos */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Valoración términos</span>
                    <span className="font-semibold">{quote.analysis.breakdown.terms}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${quote.analysis.breakdown.terms}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Puntos fuertes/débiles */}
              {(quote.analysis.strengths.length > 0 || quote.analysis.weaknesses.length > 0) && (
                <div className="mb-4 space-y-2">
                  {quote.analysis.strengths.length > 0 && (
                    <div className="text-xs">
                      <p className="font-semibold text-green-700 mb-1">✅ Puntos fuertes:</p>
                      {quote.analysis.strengths.map((strength, i) => (
                        <p key={i} className="text-green-600 ml-4">
                          • {strength.reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {quote.analysis.weaknesses.length > 0 && (
                    <div className="text-xs">
                      <p className="font-semibold text-orange-700 mb-1">⚠️ A considerar:</p>
                      {quote.analysis.weaknesses.map((weakness, i) => (
                        <p key={i} className="text-orange-600 ml-4">
                          • {weakness.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  variant={selectedQuote?.quoteId === quote.quoteId ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => handleSelect(quote)}
                >
                  {selectedQuote?.quoteId === quote.quoteId ? (
                    <>
                      <Check size={16} />
                      Seleccionado
                    </>
                  ) : (
                    'Seleccionar'
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  Ver detalles
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer con acción */}
      {selectedQuote && (
        <Card className="bg-indigo-50 border-2 border-indigo-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                Has seleccionado: {selectedQuote.supplierName}
              </p>
              <p className="text-sm text-gray-600">
                Precio: {(selectedQuote.pricing?.total || 0).toLocaleString('es-ES')}€ • Score:{' '}
                {selectedQuote.analysis.total}/100
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={handleOpenConfirm}>
              ✅ Continuar con esta opción
            </Button>
          </div>
        </Card>
      )}

      {/* Modal de confirmación */}
      <QuoteSelectionConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        quote={selectedQuote}
        category={request.supplierCategoryName || request.category}
        onConfirm={handleConfirmSelection}
        loading={confirming}
      />
    </div>
  );
}
