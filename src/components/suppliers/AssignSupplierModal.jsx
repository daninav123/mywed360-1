import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { SUPPLIER_CATEGORIES } from '../../../shared/supplierCategories';
import Button from '../ui/Button';
import Input from '../Input';
import { toast } from 'react-toastify';

export default function AssignSupplierModal({ supplier, open, onClose, onAssign }) {
  const [selectedService, setSelectedService] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('interesado');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService) {
      toast.error('Selecciona un servicio');
      return;
    }

    setLoading(true);
    try {
      await onAssign(selectedService, supplier, parseFloat(price) || null, notes, status);
      toast.success(
        `${supplier.name} asignado a ${SUPPLIER_CATEGORIES.find((c) => c.id === selectedService)?.name}`
      );
      onClose();

      // Reset form
      setSelectedService('');
      setPrice('');
      setNotes('');
      setStatus('interesado');
    } catch (error) {
      toast.error(error.message || 'Error al asignar proveedor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedService('');
      setPrice('');
      setNotes('');
      setStatus('interesado');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Check className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Asignar a Servicio</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Proveedor seleccionado */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium mb-1">Proveedor seleccionado:</p>
            <p className="font-semibold text-gray-900 text-lg">{supplier.name}</p>
            {supplier.category && (
              <p className="text-sm text-gray-600 mt-1">
                Categoría:{' '}
                {SUPPLIER_CATEGORIES.find((c) => c.id === supplier.category)?.name ||
                  supplier.category}
              </p>
            )}
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servicio de la boda <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              required
              disabled={loading}
            >
              <option value="">Seleccionar servicio...</option>
              {SUPPLIER_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Elige el servicio de tu boda al que quieres asignar este proveedor
            </p>
          </div>

          {/* Estado inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              disabled={loading}
            >
              <option value="interesado">🔵 Interesado - Estoy considerando este proveedor</option>
              <option value="cotizando">🟡 Cotizando - Solicitando presupuesto</option>
              <option value="contratado">🟠 Contratado - Ya firmé contrato</option>
            </select>
          </div>

          {/* Precio estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio estimado (€)
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1500.00"
                disabled={loading}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                €
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Precio aproximado del servicio (opcional)</p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas y observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
              rows="3"
              placeholder="Ej: Me gustó su portfolio, precio razonable, disponible en mi fecha..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Agrega cualquier información relevante sobre este proveedor
            </p>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">¿Qué sucede al asignar?</p>
              <ul className="space-y-1 text-blue-700">
                <li>• El proveedor aparecerá en la tarjeta del servicio</li>
                <li>• Podrás cambiar el estado según avances</li>
                <li>• Puedes registrar pagos cuando confirmes</li>
              </ul>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedService} className="flex-1">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Asignando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Asignar proveedor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
