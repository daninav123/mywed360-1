/**
 * Modal de confirmación final para seleccionar proveedor
 *
 * Muestra resumen del presupuesto seleccionado y permite confirmar
 * la contratación, transformando la tarjeta del servicio.
 */

import React, { useState } from 'react';
import { X, Check, AlertCircle, DollarSign, Calendar, FileText } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function QuoteSelectionConfirmModal({
  open,
  onClose,
  quote,
  category,
  onConfirm,
  loading = false,
}) {
  const [notes, setNotes] = useState('');

  if (!quote) return null;

  const handleConfirm = () => {
    onConfirm({
      quote,
      notes: notes.trim(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="🎉 Confirmar Selección de Proveedor" size="lg">
      <div className="space-y-6">
        {/* Alert informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">¿Qué sucederá al confirmar?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>
                El proveedor será asignado a tu servicio de <strong>{category}</strong>
              </li>
              <li>La tarjeta del servicio mostrará los datos del proveedor</li>
              <li>El presupuesto quedará guardado en tu boda</li>
              <li>Podrás gestionar el contrato y pagos desde aquí</li>
            </ul>
          </div>
        </div>

        {/* Resumen del proveedor seleccionado */}
        <Card className="bg-[var(--color-primary)] border-2 border-indigo-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {quote.supplierName}
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  ✓ Seleccionado
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">{category}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Score Total</p>
              <p className="text-2xl font-bold text-indigo-600">{quote.analysis?.total || 0}/100</p>
            </div>
          </div>

          {/* Detalles clave */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign size={16} />
                <span className="text-xs font-medium">Precio Total</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {(quote.pricing?.total || 0).toLocaleString('es-ES')}€
              </p>
            </div>

            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FileText size={16} />
                <span className="text-xs font-medium">Adelanto</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{quote.terms?.deposit || 0}%</p>
            </div>

            <div className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar size={16} />
                <span className="text-xs font-medium">Entrega</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {quote.terms?.deliveryTime || 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        {/* Servicios incluidos */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">📦 Servicios Incluidos</h4>
          <Card className="bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {quote.serviceOffered &&
                Object.entries(quote.serviceOffered).map(([key, value]) => {
                  if (key === 'extras') return null;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Check size={14} className="text-green-600" />
                      <span className="text-gray-700">
                        {key}:{' '}
                        <strong>
                          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}
                        </strong>
                      </span>
                    </div>
                  );
                })}
            </div>

            {quote.serviceOffered?.extras && quote.serviceOffered.extras.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">✨ Extras incluidos:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {quote.serviceOffered.extras.map((extra, i) => (
                    <li key={i}>• {extra}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Mensaje del proveedor */}
        {quote.message && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">💬 Mensaje del Proveedor</h4>
            <Card className="bg-gray-50">
              <p className="text-sm text-gray-700 italic">&quot;{quote.message}&quot;</p>
            </Card>
          </div>
        )}

        {/* Notas opcionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Recordar confirmar fecha exacta, preguntar por descuento..."
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            <X size={16} />
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-[var(--color-primary)] hover:from-indigo-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Confirmando...
              </>
            ) : (
              <>
                <Check size={16} />✅ Confirmar y Contratar
              </>
            )}
          </Button>
        </div>

        {/* Warning final */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Nota:</strong> Al confirmar, esta selección quedará registrada en tu boda.
            Podrás cambiar o cancelar posteriormente desde la gestión de proveedores.
          </p>
        </div>
      </div>
    </Modal>
  );
}
