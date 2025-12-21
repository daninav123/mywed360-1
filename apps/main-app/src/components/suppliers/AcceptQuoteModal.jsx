import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, DollarSign, Users, X } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

const PROVIDER_ROLES = {
  principal: {
    label: 'Proveedor Principal',
    description: 'El servicio principal para esta categoría',
    icon: '👑',
  },
  complementary: {
    label: 'Servicio Complementario',
    description: 'Un servicio adicional que complementa el principal',
    icon: '✨',
  },
  backup: {
    label: 'Opción de Backup',
    description: 'Alternativa en caso de que el principal no funcione',
    icon: '🔄',
  },
};

const AcceptQuoteModal = ({ 
  quote, 
  existingSuppliers = [], 
  categoryBudget = 0,
  totalBudget = 0,
  onAccept, 
  onClose,
  loading = false 
}) => {
  const [selectedRole, setSelectedRole] = useState('principal');
  const [notes, setNotes] = useState('');

  const hasPrincipal = existingSuppliers.some(s => s.role === 'principal' && s.status === 'active');
  const currentCategoryTotal = existingSuppliers
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.totalPrice || 0), 0);
  
  const newCategoryTotal = currentCategoryTotal + (quote.totalPrice || 0);
  const remaining = totalBudget - newCategoryTotal;
  const isOverBudget = remaining < 0;

  const handleAccept = () => {
    onAccept({
      role: selectedRole,
      notes: notes,
    });
  };

  return (
    <Modal open={true} onClose={onClose} size="large">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contratar Proveedor</h2>
              <p className="text-sm text-gray-600">Confirma los detalles antes de contratar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Resumen del presupuesto */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">📋 Resumen del Presupuesto</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Proveedor:</span>
              <span className="text-sm font-semibold text-gray-900">{quote.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Categoría:</span>
              <span className="text-sm font-semibold text-gray-900">{quote.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Precio:</span>
              <span className="text-lg font-bold text-green-600">{quote.totalPrice}€</span>
            </div>
            {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600 mb-1">Servicios incluidos:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  {quote.servicesIncluded.slice(0, 3).map((service, idx) => (
                    <li key={idx}>• {service}</li>
                  ))}
                  {quote.servicesIncluded.length > 3 && (
                    <li className="text-gray-500">+{quote.servicesIncluded.length - 3} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Proveedores existentes (si hay) */}
        {existingSuppliers.length > 0 && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-2">
                  Ya tienes {existingSuppliers.length} proveedor(es) en esta categoría
                </h4>
                <div className="space-y-2">
                  {existingSuppliers.filter(s => s.status === 'active').map((supplier, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {PROVIDER_ROLES[supplier.role]?.icon || '•'} {supplier.supplierName}
                      </span>
                      <span className="font-semibold text-gray-900">{supplier.totalPrice}€</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Selección de rol */}
        <div className="mb-6">
          <h4 className="font-bold text-gray-900 mb-3">
            🎯 ¿Cómo quieres añadir este proveedor?
          </h4>
          <div className="space-y-2">
            {Object.entries(PROVIDER_ROLES).map(([roleKey, roleData]) => {
              const isPrincipalDisabled = roleKey === 'principal' && hasPrincipal;
              
              return (
                <button
                  key={roleKey}
                  onClick={() => !isPrincipalDisabled && setSelectedRole(roleKey)}
                  disabled={isPrincipalDisabled}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedRole === roleKey
                      ? 'border-blue-500 bg-blue-50'
                      : isPrincipalDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{roleData.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{roleData.label}</p>
                        {isPrincipalDisabled && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Ya tienes uno
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{roleData.description}</p>
                    </div>
                    {selectedRole === roleKey && (
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="mb-6">
          <label className="block font-bold text-gray-900 mb-2">
            📝 Notas adicionales (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade cualquier nota o comentario sobre este proveedor..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Impacto en presupuesto */}
        <Card className={`p-4 mb-6 ${isOverBudget ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start gap-3">
            <DollarSign className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`} />
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-2">💰 Impacto en Presupuesto</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total actual en categoría:</span>
                  <span className="font-semibold">{currentCategoryTotal}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Este presupuesto:</span>
                  <span className="font-semibold text-blue-600">+{quote.totalPrice}€</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-700">Nuevo total categoría:</span>
                  <span className="font-bold text-gray-900">{newCategoryTotal}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Presupuesto disponible:</span>
                  <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {remaining}€
                  </span>
                </div>
              </div>
              {isOverBudget && (
                <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
                  ⚠️ Este presupuesto supera tu límite disponible en {Math.abs(remaining)}€
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            loading={loading}
            leftIcon={<CheckCircle className="w-5 h-5" />}
          >
            {loading ? 'Contratando...' : 'Confirmar y Contratar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AcceptQuoteModal;
