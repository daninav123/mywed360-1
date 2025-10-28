// components/suppliers/SupplierCard.jsx
// Tarjeta de proveedor con diferenciación visual (Registrado vs Internet)

import React, { useState } from 'react';
import { CheckCircle, Globe, Mail, Phone, Instagram, ExternalLink, MessageCircle } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';

export default function SupplierCard({ supplier, onContact, onViewDetails, onMarkAsConfirmed }) {
  const { t } = useTranslations();
  const [showContactMenu, setShowContactMenu] = useState(false);
  
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
  
  const brandName = t('app.brandName');
  const fallbackName = supplier.name || t('common.suppliers.card.hybrid.defaults.name');
  const fallbackService = supplier.category || supplier.service || t('common.suppliers.card.hybrid.defaults.service');
  const locationLabel = supplier.location?.city
    ? t('common.suppliers.card.hybrid.location', { city: supplier.location.city })
    : null;

  // Funciones de contacto
  const handleContactWhatsApp = () => {
    const phone = supplier.contact?.phone?.replace(/\D/g, ''); // Solo números
    if (!phone) return;
    const message = t('common.suppliers.card.hybrid.contact.whatsappMessage', {
      name: fallbackName,
      service: fallbackService,
      brand: brandName,
    });
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    onContact?.({ method: 'whatsapp', supplier });
    setShowContactMenu(false);
  };
  
  const handleContactEmail = () => {
    if (!supplier.contact?.email) return;
    const subject = t('common.suppliers.card.hybrid.contact.emailSubject', {
      service: fallbackService,
      brand: brandName,
    });
    const body = t('common.suppliers.card.hybrid.contact.emailBody', {
      name: fallbackName,
      brand: brandName,
    });
    window.open(`mailto:${supplier.contact?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    onContact?.({ method: 'email', supplier });
    setShowContactMenu(false);
  };
  
  const handleContactPhone = () => {
    if (!supplier.contact?.phone) return;
    window.open(`tel:${supplier.contact?.phone}`, '_blank');
    onContact?.({ method: 'phone', supplier });
    setShowContactMenu(false);
  };
  
  return (
    <div className={`
      border-2 rounded-lg p-4 transition-all hover:shadow-lg
      ${borderColor} ${bgColor}
    `}>
      {/* Header con nombre y badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {supplier.name || t('common.suppliers.card.hybrid.defaults.name')}
          </h3>
          {locationLabel && (
            <p className="text-sm text-gray-600">
              {locationLabel}
            </p>
          )}
        </div>
        
        {/* Badge según tipo */}
        <div className="ml-2">
          {isRegistered && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={14} />
              {t('common.suppliers.card.hybrid.badges.registered')}
            </span>
          )}
          {isCached && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {t('common.suppliers.card.hybrid.badges.cached')}
            </span>
          )}
          {isInternet && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <Globe size={14} />
              {t('common.suppliers.card.hybrid.badges.internet')}
            </span>
          )}
        </div>
      </div>
      
      {/* Imagen */}
      {supplier.media?.logo && (
        <div className="mb-3">
          <img 
            src={supplier.media.logo} 
            alt={t('common.suppliers.card.hybrid.imageAlt', {
              name: supplier.name || t('common.suppliers.card.hybrid.defaults.name'),
            })}
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
              {t('common.suppliers.card.hybrid.reviews', { count: supplier.metrics.reviewCount })}
            </span>
          )}
        </div>
      )}
      
      {/* Acciones */}
      <div className="space-y-2 mt-4">
        {isRegistered || isCached ? (
          <>
            {/* Botón principal de contacto */}
            <div className="relative">
              <button
                onClick={() => setShowContactMenu(!showContactMenu)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} />
                {t('common.suppliers.card.hybrid.contact.primary')}
              </button>
              
              {/* Menú de opciones de contacto */}
              {showContactMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 overflow-hidden">
                  {supplier.contact?.phone && (
                    <button
                      onClick={handleContactWhatsApp}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <MessageCircle size={16} className="text-green-600" />
                      {t('common.suppliers.card.hybrid.contact.whatsapp')}
                    </button>
                  )}
                  {supplier.contact?.email && (
                    <button
                      onClick={handleContactEmail}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t"
                    >
                      <Mail size={16} className="text-blue-600" />
                      {t('common.suppliers.card.hybrid.contact.email')}
                    </button>
                  )}
                  {supplier.contact?.phone && (
                    <button
                      onClick={handleContactPhone}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t"
                    >
                      <Phone size={16} className="text-purple-600" />
                      {t('common.suppliers.card.hybrid.contact.phone')}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Botones secundarios */}
            <div className="flex gap-2">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(supplier)}
                  className="flex-1 px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors font-medium text-sm"
                >
                  {t('common.suppliers.card.hybrid.actions.viewProfile')}
                </button>
              )}
              {onMarkAsConfirmed && (
                <button
                  onClick={() => onMarkAsConfirmed(supplier)}
                  className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm flex items-center justify-center gap-1"
                >
                  <CheckCircle size={16} />
                  {t('common.suppliers.card.hybrid.actions.markConfirmed')}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Proveedores de internet */}
            <div className="flex gap-2">
              {supplier.contact?.website || supplier.sources?.[0]?.url ? (
                <a
                  href={supplier.contact?.website || supplier.sources?.[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  {t('common.suppliers.card.hybrid.actions.viewWebsite')}
                </a>
              ) : null}
              
              {supplier.contact?.phone && (
                <button
                  onClick={handleContactWhatsApp}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  title={t('common.suppliers.card.hybrid.contact.whatsappTitle')}
                >
                  <MessageCircle size={16} />
                </button>
              )}
              
              {supplier.contact?.email && (
                <button
                  onClick={handleContactEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  title={t('common.suppliers.card.hybrid.contact.emailTitle')}
                >
                  <Mail size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Fuente (solo para proveedores de internet) */}
      {isInternet && supplier.source && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {t('common.suppliers.card.hybrid.source.label', {
              source: supplier.sources?.[0]?.platform || t('common.suppliers.card.hybrid.source.internet'),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
