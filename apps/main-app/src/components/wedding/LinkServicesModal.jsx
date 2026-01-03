import React, { useState, useMemo } from 'react';
import { X, Link as LinkIcon, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

/**
 * Modal para vincular/desv

incular servicios cuando son del mismo proveedor
 */
export default function LinkServicesModal({
  open,
  onClose,
  currentService,
  allServices = [],
  onLink,
}) {
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // Filtrar servicios que tienen proveedor asignado (excepto el actual)
  const availableServices = useMemo(() => {
    return allServices.filter(
      (service) =>
        service.id !== currentService.id &&
        service.assignedSupplier &&
        service.assignedSupplier.name
    );
  }, [allServices, currentService.id]);

  const handleToggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleLink = async () => {
    if (selectedServices.length === 0) {
      toast.warning('Selecciona al menos un servicio para vincular');
      return;
    }

    setLoading(true);
    try {
      await onLink(selectedServices);
      toast.success(`Servicios vinculados correctamente`);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al vincular servicios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vincular Servicios</h2>
              <p className="text-sm text-gray-600">
                {currentService.name} - {currentService.assignedSupplier?.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Explicación */}
        <div className="p-6 bg-blue-50 border-b">
          <p className="text-sm text-gray-700">
            <strong>¿Por qué vincular servicios?</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Si <strong>{currentService.assignedSupplier?.name}</strong> también proporciona otros
            servicios (ej: Venue + Catering), vincúlalos para verlos juntos y evitar duplicados.
          </p>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                No hay otros servicios con proveedores asignados para vincular.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Primero asigna proveedores a otros servicios.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Selecciona los servicios que son del mismo proveedor:
              </p>
              {availableServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                const isSameSupplier =
                  service.assignedSupplier?.name === currentService.assignedSupplier?.name;

                return (
                  <button
                    key={service.id}
                    onClick={() => handleToggleService(service.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isSameSupplier ? 'ring-2 ring-green-200' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{service.name}</span>
                          {isSameSupplier && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ Mismo proveedor
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.assignedSupplier?.name}
                        </p>
                        {service.assignedSupplier?.price && (
                          <p className="text-sm font-medium text-purple-600 mt-1">
                            {service.assignedSupplier.price.toLocaleString('es-ES')}€
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleLink}
            className="flex-1"
            disabled={loading || selectedServices.length === 0}
          >
            {loading ? 'Vinculando...' : `Vincular (${selectedServices.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
