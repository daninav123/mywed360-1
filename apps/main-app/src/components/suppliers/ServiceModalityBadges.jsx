import React from 'react';
import { Building2, Truck } from 'lucide-react';

/**
 * Badges para mostrar las modalidades de servicio de un catering
 * - Espacio propio (🏛️)
 * - Servicio externo (🚚)
 * - Ambos
 */
const ServiceModalityBadges = ({ supplier, size = 'md', showDetails = false }) => {
  if (!supplier || supplier.category !== 'catering') {
    return null;
  }

  const modalities = supplier.serviceModalities || {};
  const hasOwnVenue = modalities.ownVenue || supplier.hasVenue;
  const hasExternal = modalities.external || supplier.external;

  // Si no tiene ninguna modalidad definida, no mostrar nada
  if (!hasOwnVenue && !hasExternal) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const baseClasses = `inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Badge: Espacio Propio */}
      {hasOwnVenue && (
        <div className={`${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`}>
          <Building2 className={iconSizes[size]} />
          <span>
            {hasExternal ? 'Espacio propio' : 'Solo en nuestro espacio'}
          </span>
        </div>
      )}

      {/* Badge: Servicio Externo */}
      {hasExternal && (
        <div className={`${baseClasses} bg-green-100 text-green-800 border border-green-200`}>
          <Truck className={iconSizes[size]} />
          <span>
            {hasOwnVenue ? 'También servicio externo' : 'Solo servicio externo'}
          </span>
        </div>
      )}

      {/* Detalles adicionales (opcional) */}
      {showDetails && hasOwnVenue && (
        <div className="w-full mt-1 text-sm text-gray-600">
          {supplier.venueCapacity && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Capacidad: {supplier.venueCapacity} personas</span>
            </div>
          )}
          {supplier.venueType && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>Tipo: {getVenueTypeLabel(supplier.venueType)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Función auxiliar para obtener el label del tipo de espacio
const getVenueTypeLabel = (type) => {
  const labels = {
    finca: 'Finca',
    masia: 'Masía',
    hotel: 'Hotel',
    restaurante: 'Restaurante',
    salon: 'Salón de eventos',
    otro: 'Otro'
  };
  return labels[type] || type;
};

export default ServiceModalityBadges;
