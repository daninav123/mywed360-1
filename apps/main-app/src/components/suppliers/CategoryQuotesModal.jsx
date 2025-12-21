import React, { useState } from 'react';
import { X, Clock, CheckCircle, Mail, DollarSign, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import QuoteComparatorModal from './QuoteComparatorModal';

const CategoryQuotesModal = ({ category, categoryLabel, stats, onClose, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showComparator, setShowComparator] = useState(false);

  console.log('[CategoryQuotesModal] Renderizando con:', {
    category,
    categoryLabel,
    stats,
    providers: stats?.providers?.length,
    responses: stats?.responses?.length
  });

  const pendingProviders = stats?.providers?.filter(p => p.status === 'pending') || [];
  const receivedQuotes = stats?.responses?.filter(r => r.status === 'received') || [];
  const acceptedQuote = stats?.acceptedQuote;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Modal open={true} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{categoryLabel}</h2>
            <p className="text-sm text-gray-600 mt-1">Gestión de presupuestos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{stats.stats.contacted}</p>
                <p className="text-xs text-blue-700">Contactados</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{stats.stats.pending}</p>
                <p className="text-xs text-purple-700">Pendientes</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{stats.stats.received}</p>
                <p className="text-xs text-green-700">Recibidos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{stats.stats.accepted}</p>
                <p className="text-xs text-orange-700">Aceptados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Accepted Quote Banner */}
        {acceptedQuote && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">✅ CONTRATADO</p>
                  <p className="text-sm text-green-700">
                    {acceptedQuote.supplierName} - {acceptedQuote.totalPrice}€
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Ver contrato
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pendientes ({pendingProviders.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'received'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Presupuestos ({receivedQuotes.length})
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === 'pending' && (
            <div className="space-y-3">
              {pendingProviders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay solicitudes pendientes</p>
                </div>
              ) : (
                pendingProviders.map((provider) => (
                  <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-600">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Enviado: {formatDate(provider.sentAt)}
                          </span>
                          {provider.email && (
                            <span className="text-xs text-gray-600">{provider.email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reenviar
                        </Button>
                        <Button variant="ghost" size="sm">
                          Contactar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'received' && (
            <div className="space-y-3">
              {receivedQuotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay presupuestos recibidos</p>
                  <p className="text-xs mt-2">Los presupuestos aparecerán aquí automáticamente</p>
                </div>
              ) : (
                <>
                  {receivedQuotes.map((quote) => (
                    <Card key={quote.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{quote.supplierName}</h4>
                            {quote.confidence && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {quote.confidence}% confianza
                              </span>
                            )}
                          </div>
                          
                          {quote.totalPrice && (
                            <p className="text-2xl font-bold text-green-600 mb-2">
                              {quote.totalPrice}€
                            </p>
                          )}
                          
                          {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Incluye:</p>
                              <div className="flex flex-wrap gap-1">
                                {quote.servicesIncluded.slice(0, 3).map((service, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                    {service}
                                  </span>
                                ))}
                                {quote.servicesIncluded.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                    +{quote.servicesIncluded.length - 3} más
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Recibido: {formatDate(quote.receivedAt)}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            Ver detalles
                          </Button>
                          <Button variant="primary" size="sm">
                            Aceptar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {receivedQuotes.length > 1 && (
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                      <button 
                        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                        onClick={() => setShowComparator(true)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-purple-900">Comparar presupuestos</p>
                            <p className="text-xs text-purple-700">Ver diferencias y elegir el mejor</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-purple-600" />
                      </button>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={onRefresh}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Modal comparador */}
      {showComparator && (
        <QuoteComparatorModal
          quotes={receivedQuotes}
          onClose={() => setShowComparator(false)}
          onQuoteAccepted={(quote) => {
            setShowComparator(false);
            onRefresh();
          }}
        />
      )}
    </Modal>
  );
};

export default CategoryQuotesModal;
