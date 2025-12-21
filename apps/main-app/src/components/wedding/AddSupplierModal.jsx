import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import { useSupplierBudgetSync } from '../../hooks/useSupplierBudgetSync';

/**
 * Modal para añadir proveedor con información completa
 * Incluye: precio, adelanto/depósito, descripción del servicio, notas
 */
export default function AddSupplierModal({
  open,
  onClose,
  serviceId,
  serviceName,
  onAssign,
  favorites = [],
}) {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    price: '',
    serviceDescription: '',
    notes: '',
    status: 'contratado',
    depositPercentage: '',
    depositAmount: '',
    depositDueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const { syncCategoryBudget } = useSupplierBudgetSync();

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSupplier) {
      toast.error('Selecciona un proveedor');
      return;
    }

    const price = parseFloat(formData.price);
    if (!price || price <= 0) {
      toast.error('Introduce un precio válido');
      return;
    }

    setSaving(true);
    try {
      const deposit = formData.depositPercentage || formData.depositAmount ? {
        percentage: parseFloat(formData.depositPercentage) || null,
        amount: parseFloat(formData.depositAmount) || null,
        dueDate: formData.depositDueDate || null,
      } : null;

      await onAssign(
        selectedSupplier,
        price,
        formData.notes,
        formData.status,
        formData.serviceDescription,
        deposit
      );
      
      // Sincronizar con presupuesto automáticamente
      await syncCategoryBudget(serviceId, price);
      
      toast.success(`✅ ${selectedSupplier.name} añadido y presupuesto actualizado (${price}€)`);
      onClose();
    } catch (error) {
      console.error('Error añadiendo proveedor:', error);
      toast.error(error.message || 'Error al añadir proveedor');
    } finally {
      setSaving(false);
    }
  };

  // Calcular adelanto automáticamente si cambia precio o porcentaje
  const handlePriceChange = (e) => {
    const price = parseFloat(e.target.value);
    setFormData(prev => {
      const newData = { ...prev, price: e.target.value };
      if (price && prev.depositPercentage) {
        newData.depositAmount = ((price * parseFloat(prev.depositPercentage)) / 100).toFixed(2);
      }
      return newData;
    });
  };

  const handleDepositPercentageChange = (e) => {
    const percentage = parseFloat(e.target.value);
    setFormData(prev => {
      const newData = { ...prev, depositPercentage: e.target.value };
      if (percentage && prev.price) {
        newData.depositAmount = ((parseFloat(prev.price) * percentage) / 100).toFixed(2);
      }
      return newData;
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="large">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Añadir Proveedor a {serviceName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Puedes añadir varios proveedores al mismo servicio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleccionar proveedor de favoritos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Proveedor
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
              {favorites.length === 0 ? (
                <p className="text-sm text-gray-500 col-span-2">
                  No tienes favoritos para este servicio. Añade proveedores a favoritos primero.
                </p>
              ) : (
                favorites.map((fav) => (
                  <button
                    key={fav.id}
                    type="button"
                    onClick={() => handleSupplierSelect(fav.supplier)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      selectedSupplier?.id === fav.supplier.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{fav.supplier.name}</p>
                    {fav.supplier.contact?.phone && (
                      <p className="text-xs text-gray-600 mt-1">
                        📞 {fav.supplier.contact.phone}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Descripción del servicio específico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Qué cubre este proveedor? (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Alianzas, Anillo de compromiso, Arreglos florales..."
              value={formData.serviceDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, serviceDescription: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Útil cuando varios proveedores ofrecen partes diferentes del mismo servicio
            </p>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Total *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={handlePriceChange}
                required
                className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                EUR
              </span>
            </div>
          </div>

          {/* Adelanto/Depósito */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Adelanto/Depósito (Opcional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Porcentaje</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="30"
                    value={formData.depositPercentage}
                    onChange={handleDepositPercentageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="360.00"
                  value={formData.depositAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha límite</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.depositDueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositDueDate: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="interesado">Interesado</option>
              <option value="cotizando">Cotizando</option>
              <option value="contratado">Contratado ✓</option>
              <option value="confirmado">Confirmado</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              placeholder="Condiciones especiales, observaciones..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !selectedSupplier}
              loading={saving}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Añadiendo...' : 'Añadir Proveedor'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
