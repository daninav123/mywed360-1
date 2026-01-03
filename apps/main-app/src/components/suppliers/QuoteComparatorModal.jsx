import React, { useState, useMemo } from 'react';
import { X, CheckCircle, TrendingDown, Star, AlertCircle, DollarSign } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import AcceptQuoteModal from './AcceptQuoteModal';
import { acceptQuote } from '../../services/quoteAcceptanceService';
import { toast } from 'react-toastify';

const QuoteComparatorModal = ({ quotes, onClose, onQuoteAccepted }) => {
  const [selectedQuotes, setSelectedQuotes] = useState(quotes.slice(0, 3).map(q => q.id));
  const [accepting, setAccepting] = useState(null);

  // Filtrar solo los presupuestos seleccionados
  const quotesToCompare = useMemo(() => {
    return quotes.filter(q => selectedQuotes.includes(q.id)).slice(0, 3);
  }, [quotes, selectedQuotes]);

  // Calcular mejor precio
  const bestPrice = useMemo(() => {
    const prices = quotesToCompare
      .map(q => q.totalPrice)
      .filter(p => p && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [quotesToCompare]);

  // Calcular recomendación
  const getRecommendation = (quote) => {
    let score = 0;
    let reasons = [];

    // Precio más bajo
    if (quote.totalPrice && quote.totalPrice === bestPrice) {
      score += 40;
      reasons.push('Mejor precio');
    }

    // Alta confianza IA
    if (quote.confidence >= 90) {
      score += 20;
      reasons.push('Alta precisión');
    }

    // Más servicios incluidos
    if (quote.servicesIncluded && quote.servicesIncluded.length >= 5) {
      score += 20;
      reasons.push('Más servicios');
    }

    // Condiciones de pago favorables
    if (quote.paymentTerms && quote.paymentTerms.toLowerCase().includes('anticipo')) {
      score += 10;
    }

    // Política de cancelación flexible
    if (quote.cancellationPolicy && 
        (quote.cancellationPolicy.toLowerCase().includes('gratis') || 
         quote.cancellationPolicy.toLowerCase().includes('flexible'))) {
      score += 10;
      reasons.push('Cancelación flexible');
    }

    return { score, reasons };
  };

  const recommendations = useMemo(() => {
    return quotesToCompare.map(q => ({
      id: q.id,
      ...getRecommendation(q),
    }));
  }, [quotesToCompare, bestPrice]);

  const bestRecommendation = useMemo(() => {
    if (recommendations.length === 0) return null;
    return recommendations.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }, [recommendations]);

  const toggleQuote = (quoteId) => {
    if (selectedQuotes.includes(quoteId)) {
      if (selectedQuotes.length > 2) {
        setSelectedQuotes(selectedQuotes.filter(id => id !== quoteId));
      }
    } else {
      if (selectedQuotes.length < 3) {
        setSelectedQuotes([...selectedQuotes, quoteId]);
      }
    }
  };

  const handleAcceptQuote = async (quote) => {
    try {
      setAccepting(quote.id);
      
      await updateQuoteResponseStatus(quote.id, 'accepted', 'Presupuesto aceptado desde comparador');
      
      toast.success(`✅ Presupuesto de ${quote.supplierName} aceptado`);
      
      if (onQuoteAccepted) {
        onQuoteAccepted(quote);
      }
      
      onClose();
    } catch (error) {
      console.error('Error aceptando presupuesto:', error);
      toast.error('Error al aceptar el presupuesto');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <Modal open={true} onClose={onClose} size="full">
      <div className="p-6 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comparar Presupuestos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona hasta 3 presupuestos para comparar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Selector de presupuestos */}
        {quotes.length > 3 && (
          <Card className="p-4 mb-6 bg-blue-50">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Elige qué presupuestos comparar:
            </p>
            <div className="flex flex-wrap gap-2">
              {quotes.map(quote => (
                <button
                  key={quote.id}
                  onClick={() => toggleQuote(quote.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedQuotes.includes(quote.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {quote.supplierName} - {quote.totalPrice}€
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Tabla comparativa con scroll horizontal */}
        <div className="overflow-x-auto pb-4">
          <div className="grid gap-4" style={{ 
            gridTemplateColumns: `repeat(${quotesToCompare.length}, minmax(350px, 1fr))`,
            minWidth: quotesToCompare.length > 2 ? `${quotesToCompare.length * 350}px` : 'auto'
          }}>
            {quotesToCompare.map(quote => {
            const recommendation = recommendations.find(r => r.id === quote.id);
            const isBest = bestRecommendation?.id === quote.id;

            return (
              <Card
                key={quote.id}
                className={`p-4 ${isBest ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
              >
                {/* Badge recomendado */}
                {isBest && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-100 rounded-full w-fit">
                    <Star className="w-4 h-4 text-green-600 fill-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      RECOMENDADO
                    </span>
                  </div>
                )}

                {/* Proveedor */}
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {quote.supplierName}
                </h3>

                {/* Precio */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      quote.totalPrice === bestPrice ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {quote.totalPrice || 'N/A'}€
                    </span>
                    {quote.totalPrice === bestPrice && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <TrendingDown className="w-3 h-3" />
                        Mejor precio
                      </div>
                    )}
                  </div>
                  {quote.confidence && (
                    <p className="text-xs text-gray-500 mt-1">
                      Confianza IA: {quote.confidence}%
                    </p>
                  )}
                </div>

                {/* Razones de recomendación */}
                {recommendation && recommendation.reasons.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      ⭐ Puntuación: {recommendation.score}/100
                    </p>
                    <div className="space-y-1">
                      {recommendation.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Servicios incluidos */}
                {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Servicios incluidos:
                    </p>
                    <div className="space-y-1">
                      {quote.servicesIncluded.slice(0, 5).map((service, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{service}</span>
                        </div>
                      ))}
                      {quote.servicesIncluded.length > 5 && (
                        <p className="text-xs text-gray-500 ml-5">
                          +{quote.servicesIncluded.length - 5} más
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Desglose de precios */}
                {quote.priceBreakdown && quote.priceBreakdown.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Desglose:
                    </p>
                    <div className="space-y-1">
                      {quote.priceBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>{item.concept}</span>
                          <span className="font-medium">{item.amount}€</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Condiciones */}
                <div className="space-y-2 mb-4 pt-4 border-t">
                  {quote.paymentTerms && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Pago:</p>
                      <p className="text-xs text-gray-600">{quote.paymentTerms}</p>
                    </div>
                  )}
                  {quote.deliveryTime && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Entrega:</p>
                      <p className="text-xs text-gray-600">{quote.deliveryTime}</p>
                    </div>
                  )}
                  {quote.cancellationPolicy && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Cancelación:</p>
                      <p className="text-xs text-gray-600">{quote.cancellationPolicy}</p>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                <Button
                  variant={isBest ? 'primary' : 'outline'}
                  className="w-full"
                  onClick={() => handleAcceptQuote(quote)}
                  disabled={accepting !== null}
                  loading={accepting === quote.id}
                >
                  {accepting === quote.id ? 'Aceptando...' : 'Aceptar presupuesto'}
                </Button>
              </Card>
            );
          })}
          </div>
        </div>

        {/* Info adicional */}
        <Card className="mt-6 p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">💡 Consejo:</p>
              <p>
                El presupuesto recomendado se calcula en base a precio, confianza de análisis, 
                servicios incluidos y condiciones. Revisa todos los detalles antes de decidir.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar comparador
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuoteComparatorModal;
