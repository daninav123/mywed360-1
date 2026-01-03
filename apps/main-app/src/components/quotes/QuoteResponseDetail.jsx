/**
 * 📄 Vista detallada de un presupuesto recibido
 */

import React, { useState } from 'react';
import {
  X,
  Euro,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  Sparkles,
  Download,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import {
  formatPrice,
  getStatusBadge,
  getConfidenceBadge,
  updateQuoteResponseStatus,
} from '../../services/quoteResponsesService';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function QuoteResponseDetail({ quote, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  if (!quote) return null;

  const statusBadge = getStatusBadge(quote.status);
  const confidenceBadge = getConfidenceBadge(quote.confidence);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await updateQuoteResponseStatus(quote.id, newStatus, notes);
      onUpdate?.();
      if (newStatus === 'accepted' || newStatus === 'rejected') {
        onClose();
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {quote.supplierName || 'Proveedor'}
              </h2>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-700`}
              >
                {statusBadge.text}
              </span>
              {quote.source === 'email_auto' && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full bg-${confidenceBadge.color}-100 text-${confidenceBadge.color}-700 flex items-center gap-1`}
                >
                  <Sparkles className="w-3 h-3" />
                  IA: {confidenceBadge.text}
                </span>
              )}
            </div>
            <p className="text-gray-600 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {quote.emailSubject || 'Sin asunto'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Precio total destacado */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Precio Total</p>
              <p className="text-4xl font-bold text-purple-600">
                {formatPrice(quote.totalPrice)}
              </p>
            </div>
          </Card>

          {/* Desglose de precios */}
          {quote.priceBreakdown && quote.priceBreakdown.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro className="w-5 h-5 text-green-600" />
                Desglose de Precios
              </h3>
              <div className="space-y-3">
                {quote.priceBreakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="text-gray-700">{item.concept}</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Servicios incluidos */}
          {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Servicios Incluidos
              </h3>
              <ul className="space-y-2">
                {quote.servicesIncluded.map((service, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{service}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Extras opcionales */}
          {quote.extras && quote.extras.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Servicios Adicionales (Opcionales)
              </h3>
              <ul className="space-y-2">
                {quote.extras.map((extra, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">+</span>
                    <span className="text-gray-700">{extra}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Condiciones */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Condiciones de pago */}
            {quote.paymentTerms && (
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Euro className="w-4 h-4 text-green-600" />
                  Condiciones de Pago
                </h4>
                <p className="text-gray-700 text-sm">{quote.paymentTerms}</p>
              </Card>
            )}

            {/* Tiempo de entrega */}
            {quote.deliveryTime && (
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Tiempo de Entrega
                </h4>
                <p className="text-gray-700 text-sm">{quote.deliveryTime}</p>
              </Card>
            )}

            {/* Política de cancelación */}
            {quote.cancellationPolicy && (
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Política de Cancelación
                </h4>
                <p className="text-gray-700 text-sm">{quote.cancellationPolicy}</p>
              </Card>
            )}

            {/* Garantía */}
            {quote.warranty && (
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Garantía
                </h4>
                <p className="text-gray-700 text-sm">{quote.warranty}</p>
              </Card>
            )}
          </div>

          {/* Notas adicionales */}
          {quote.additionalNotes && (
            <Card className="p-6 bg-yellow-50">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-600" />
                Notas Adicionales
              </h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {quote.additionalNotes}
              </p>
            </Card>
          )}

          {/* Email original (preview) */}
          {quote.emailBody && (
            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-600" />
                Email Original
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {quote.emailBody.substring(0, 500)}
                  {quote.emailBody.length > 500 && '...'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Footer - Acciones */}
        <div className="p-6 border-t bg-gray-50 space-y-4">
          {/* Notas */}
          {showNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Añadir nota (opcional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe una nota sobre este presupuesto..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            {quote.status !== 'accepted' && (
              <Button
                onClick={() => handleUpdateStatus('accepted')}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Aceptar Presupuesto
              </Button>
            )}

            {quote.status !== 'rejected' && (
              <Button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={updating}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            )}

            {quote.status === 'received' && (
              <Button
                onClick={() => handleUpdateStatus('reviewed')}
                disabled={updating}
                variant="outline"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar como Revisado
              </Button>
            )}

            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="outline"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {showNotes ? 'Ocultar Notas' : 'Añadir Nota'}
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="ml-auto"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
