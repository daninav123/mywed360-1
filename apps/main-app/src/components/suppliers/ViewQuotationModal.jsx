import React, { useState } from 'react';
import { FileText, Calendar, CheckCircle, X as XIcon, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function ViewQuotationModal({ isOpen, onClose, quotation, onResponse }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // 'accept' | 'reject' | null

  if (!quotation) return null;

  const handleResponse = async (action) => {
    setLoading(true);
    try {
      // TODO: Llamar al endpoint para aceptar/rechazar cotización
      toast.success(
        action === 'accept'
          ? '¡Cotización aceptada! El proveedor será notificado.'
          : 'Cotización rechazada.'
      );

      if (onResponse) {
        onResponse(action);
      }

      onClose();
    } catch (error) {
      // console.error('Error:', error);
      toast.error('Error al procesar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cotización Recibida" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={20} className="text-primary" />
                <span className="text-sm text-muted">Cotización #{quotation.quotationId}</span>
              </div>
              <h3 className="text-xl font-bold text-body mb-1">{quotation.supplierName}</h3>
              {quotation.validUntil && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Calendar size={14} />
                  <span>
                    Válido hasta: {new Date(quotation.validUntil).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted mb-1">Total</p>
              <p className="text-3xl font-bold text-primary">{quotation.total.toFixed(2)}€</p>
            </div>
          </div>
        </Card>

        {/* Items */}
        <div>
          <h4 className="font-semibold text-body mb-3">Servicios Incluidos</h4>
          <div className="space-y-2">
            {quotation.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-3 rounded-lg bg-app">
                <div className="flex-1">
                  <p className="text-sm font-medium text-body">{item.description}</p>
                  <p className="text-xs text-muted mt-1">
                    {item.quantity} × {item.unitPrice.toFixed(2)}€
                  </p>
                </div>
                <p className="font-semibold text-body">{item.total.toFixed(2)}€</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="p-4 rounded-lg bg-app border border-soft space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Subtotal:</span>
            <span className="text-body">{quotation.subtotal.toFixed(2)}€</span>
          </div>

          {quotation.discount && quotation.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">
                Descuento (
                {quotation.discount.type === 'percentage' ? `${quotation.discount.value}%` : 'Fijo'}
                ):
              </span>
              <span className="text-danger">-{quotation.discountAmount.toFixed(2)}€</span>
            </div>
          )}

          {quotation.tax && quotation.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">IVA ({quotation.tax.rate}%):</span>
              <span className="text-body">{quotation.taxAmount.toFixed(2)}€</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-soft">
            <span className="font-bold text-body">TOTAL:</span>
            <span className="text-2xl font-bold text-primary">{quotation.total.toFixed(2)}€</span>
          </div>
        </div>

        {/* Términos */}
        {quotation.terms && (
          <div>
            <h4 className="font-semibold text-body mb-2">Términos y Condiciones</h4>
            <div className="p-3 rounded-lg bg-app text-sm text-muted whitespace-pre-line">
              {quotation.terms}
            </div>
          </div>
        )}

        {/* Notas */}
        {quotation.notes && (
          <div>
            <h4 className="font-semibold text-body mb-2">Notas Adicionales</h4>
            <div className="p-3 rounded-lg bg-app text-sm text-muted whitespace-pre-line">
              {quotation.notes}
            </div>
          </div>
        )}

        {/* Estado actual */}
        {quotation.status === 'accepted' && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle size={20} />
              <span className="font-semibold">Cotización Aceptada</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              Has aceptado esta cotización. El proveedor ha sido notificado.
            </p>
          </div>
        )}

        {quotation.status === 'rejected' && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <XIcon size={20} />
              <span className="font-semibold">Cotización Rechazada</span>
            </div>
          </div>
        )}

        {/* Confirmación */}
        {showConfirm && (
          <div className="p-4 rounded-lg bg-warning border-l-4 border-[var(--color-warning)]">
            <p className="font-semibold text-body mb-2">
              {showConfirm === 'accept'
                ? '¿Confirmas que deseas aceptar esta cotización?'
                : '¿Confirmas que deseas rechazar esta cotización?'}
            </p>
            <p className="text-sm text-muted mb-4">
              {showConfirm === 'accept'
                ? 'El proveedor será notificado y podrá proceder con la reserva.'
                : 'Esta acción no se puede deshacer.'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant={showConfirm === 'accept' ? 'primary' : 'destructive'}
                size="sm"
                onClick={() => handleResponse(showConfirm)}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        {!showConfirm && quotation.status === 'sent' && (
          <div className="flex gap-3 pt-4 border-t border-soft">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button variant="outline" onClick={() => setShowConfirm('reject')} className="flex-1">
              <XIcon size={16} className="mr-1" />
              Rechazar
            </Button>
            <Button variant="primary" onClick={() => setShowConfirm('accept')} className="flex-1">
              <CheckCircle size={16} className="mr-1" />
              Aceptar Cotización
            </Button>
          </div>
        )}

        {!showConfirm && quotation.status !== 'sent' && (
          <div className="flex gap-3 pt-4 border-t border-soft">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button variant="secondary" className="flex-1">
              <Download size={16} className="mr-1" />
              Descargar PDF
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
