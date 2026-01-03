/**
 * 📋 Lista de presupuestos recibidos por email (analizados con IA)
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Euro, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  Mail,
  ChevronRight
} from 'lucide-react';
import {
  getQuoteResponses,
  formatPrice,
  getStatusBadge,
  getConfidenceBadge,
} from '../../services/quoteResponsesService';
import { useAuth } from '../../hooks/useAuth.jsx';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function QuoteResponsesList({ weddingId, onSelectQuote }) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, received, reviewed, accepted

  useEffect(() => {
    loadQuotes();
  }, [weddingId, user]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      if (weddingId) filters.weddingId = weddingId;
      if (user?.uid) filters.userId = user.uid;
      
      const data = await getQuoteResponses(filters);
      setQuotes(data);
    } catch (err) {
      console.error('Error cargando presupuestos:', err);
      setError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    if (filter === 'all') return true;
    return quote.status === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Fecha desconocida';
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Clock className="w-6 h-6 animate-spin text-purple-600 mr-3" />
          <p className="text-gray-600">Cargando presupuestos...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6 mr-3" />
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Presupuestos Recibidos
          </h2>
          <p className="text-gray-600 mt-1">
            {quotes.length} presupuesto{quotes.length !== 1 ? 's' : ''} recibido{quotes.length !== 1 ? 's' : ''} por email
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos ({quotes.length})
          </Button>
          <Button
            variant={filter === 'received' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('received')}
          >
            Nuevos ({quotes.filter(q => q.status === 'received').length})
          </Button>
          <Button
            variant={filter === 'accepted' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('accepted')}
          >
            Aceptados ({quotes.filter(q => q.status === 'accepted').length})
          </Button>
        </div>
      </div>

      {/* Lista de presupuestos */}
      {filteredQuotes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay presupuestos
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Aún no has recibido presupuestos por email'
              : `No hay presupuestos con estado "${filter}"`
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map((quote) => {
            const statusBadge = getStatusBadge(quote.status);
            const confidenceBadge = getConfidenceBadge(quote.confidence);
            
            return (
              <Card
                key={quote.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectQuote?.(quote)}
              >
                <div className="flex items-start justify-between">
                  {/* Info principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quote.supplierName || 'Proveedor desconocido'}
                      </h3>
                      
                      {/* Badge de estado */}
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-700`}
                      >
                        {statusBadge.text}
                      </span>
                      
                      {/* Badge de IA */}
                      {quote.source === 'email_auto' && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-${confidenceBadge.color}-100 text-${confidenceBadge.color}-700 flex items-center gap-1`}
                        >
                          <Sparkles className="w-3 h-3" />
                          IA: {confidenceBadge.text}
                        </span>
                      )}
                    </div>

                    {/* Email subject */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{quote.emailSubject || 'Sin asunto'}</span>
                    </div>

                    {/* Detalles del presupuesto */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Precio */}
                      <div className="flex items-center gap-2">
                        <Euro className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Precio</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(quote.totalPrice)}
                          </p>
                        </div>
                      </div>

                      {/* Servicios */}
                      {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-gray-500">Servicios</p>
                            <p className="font-semibold text-gray-900">
                              {quote.servicesIncluded.length} incluidos
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Entrega */}
                      {quote.deliveryTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Entrega</p>
                            <p className="font-semibold text-gray-900 truncate">
                              {quote.deliveryTime}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Fecha recibido */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-500">Recibido</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(quote.receivedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Condiciones de pago (preview) */}
                    {quote.paymentTerms && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Condiciones de pago:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {quote.paymentTerms}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Flecha */}
                  <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Botón refrescar */}
      {quotes.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadQuotes}
            disabled={loading}
          >
            Actualizar lista
          </Button>
        </div>
      )}
    </div>
  );
}
