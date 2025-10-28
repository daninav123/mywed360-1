// components/suppliers/SupplierCard.jsx
// Tarjeta de proveedor con diferenciación visual (Registrado vs Internet)

import React from 'react';
import { CheckCircle, Globe, Mail, Phone, Instagram, ExternalLink } from 'lucide-react';

export default function SupplierCard({ supplier, onContact, onViewDetails }) {
  const isRegistered = supplier.priority === 'registered';
  const isCached = supplier.priority === 'cached';
  const isInternet = supplier.priority === 'internet';
  
  // Colores según tipo
  const borderColor = isRegistered 
    ? 'border-green-500' 
    : isCached 
    ? 'border-blue-400'
    : 'border-gray-300';
  
  const bgColor = isRegistered 
    ? 'bg-green-50' 
    : isCached
    ? 'bg-blue-50'
    : 'bg-white';
  
  return (
    <div className={`
      border-2 rounded-lg p-4 transition-all hover:shadow-lg
      ${borderColor} ${bgColor}
    `}>
      {/* Header con nombre y badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {supplier.name}
          </h3>
          {supplier.location?.city && (
            <p className="text-sm text-gray-600">
              📍 {supplier.location.city}
            </p>
          )}
        </div>
        
        {/* Badge según tipo */}
        <div className="ml-2">
          {isRegistered && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={14} />
              Verificado ✓
            </span>
          )}
          {isCached && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              En caché
            </span>
          )}
          {isInternet && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <Globe size={14} />
              De internet
            </span>
          )}
        </div>
      </div>
      
      {/* Imagen */}
      {supplier.media?.logo && (
        <div className="mb-3">
          <img 
            src={supplier.media.logo} 
            alt={supplier.name}
            className="w-full h-48 object-cover rounded-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      
      {/* Descripción */}
      {supplier.business?.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">
          {supplier.business.description}
        </p>
      )}
      
      {/* Info de contacto (solo si está disponible) */}
      <div className="space-y-1 mb-3 text-sm">
        {supplier.contact?.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={14} />
            <span className="truncate">{supplier.contact.email}</span>
          </div>
        )}
        {supplier.contact?.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} />
            <span>{supplier.contact.phone}</span>
          </div>
        )}
        {supplier.contact?.instagram && (
          <div className="flex items-center gap-2 text-gray-600">
            <Instagram size={14} />
            <span className="truncate">{supplier.contact.instagram}</span>
          </div>
        )}
      </div>
      
      {/* Precio (si disponible) */}
      {supplier.business?.priceRange && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">
            {supplier.business.priceRange}
          </span>
        </div>
      )}
      
      {/* Rating (si disponible) */}
      {supplier.metrics?.rating > 0 && (
        <div className="flex items-center gap-1 mb-3 text-sm">
          <span className="text-yellow-500">⭐</span>
          <span className="font-medium">{supplier.metrics.rating.toFixed(1)}</span>
          {supplier.metrics?.reviewCount > 0 && (
            <span className="text-gray-500">
              ({supplier.metrics.reviewCount} reseñas)
            </span>
          )}
        </div>
      )}
      
      {/* Acciones */}
      <div className="flex gap-2 mt-4">
        {isRegistered || isCached ? (
          <>
            <button
              onClick={() => onContact?.(supplier)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
            >
              💬 Contactar
            </button>
            <button
              onClick={() => onViewDetails?.(supplier)}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors font-medium text-sm"
            >
              Ver perfil
            </button>
          </>
        ) : (
          <>
            <a
              href={supplier.contact?.website || supplier.sources?.[0]?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              Ver web
            </a>
            <button
              onClick={() => {
                alert('Este proveedor puede registrarse en nuestra plataforma para aparecer destacado. ¡Invítalo!');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sugerir registro
            </button>
          </>
        )}
      </div>
      
      {/* Fuente (solo para proveedores de internet) */}
      {isInternet && supplier.source && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Fuente: {supplier.sources?.[0]?.platform || 'Internet'}
          </p>
        </div>
      )}
    </div>
  );
}
