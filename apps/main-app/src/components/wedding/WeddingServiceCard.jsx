// components/wedding/WeddingServiceCard.jsx
// Tarjeta de servicio que muestra el proveedor confirmado o estado pendiente

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Search,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  MessageCircle,
  Heart,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import SelectFromFavoritesModal from '../suppliers/SelectFromFavoritesModal';
import LinkServicesModal from './LinkServicesModal';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';

/**
 * Tarjeta de servicio de la boda
 * Muestra el proveedor confirmado o botones para buscar
 */
export default function WeddingServiceCard({
  serviceId, // ID de la categoría (ej: 'fotografia')
  serviceName, // Nombre para mostrar (ej: 'Fotografía')
  service, // Retrocompatibilidad
  confirmedProvider,
  shortlistCount = 0,
  linkedServices = [], // Servicios vinculados a este
  allServices = [], // Todos los servicios para el modal de vincular
  onSearch,
}) {
  const navigate = useNavigate();
  const { favorites = [] } = useFavorites() || {}; // Guard contra undefined
  const { assignSupplier, linkServices, unlinkServices } = useWeddingServices();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const { t, format } = useTranslations();

  // Usar serviceId si está disponible, sino usar service
  const categoryId = serviceId || service?.toLowerCase();
  const displayName = serviceName || service;

  const hasConfirmed = !!confirmedProvider;
  const hasShortlist = shortlistCount > 0;

  // Filtrar favoritos por categoría del servicio (usar ID directo)
  const serviceFavorites = (favorites || []).filter((fav) => fav.supplier?.category === categoryId);
  const hasFavorites = serviceFavorites.length > 0;

  // Debug SIMPLIFICADO - solo una vez al montar
  useEffect(() => {
    if (categoryId === 'fotografia' && favorites.length > 0) {
      // console.log('🔍 DEBUG FOTOGRAFÍA - Categorías guardadas:');
      favorites.forEach((fav, idx) => {
        // console.log(`  [${idx}] "${fav.supplier?.category}" - ${fav.supplier?.name}`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  // Función para asignar proveedor
  const handleAssign = async (supplier) => {
    try {
      await assignSupplier(categoryId, supplier, null, '', 'contratado');
      // No cerramos el modal aquí, lo hace SelectFromFavoritesModal
    } catch (error) {
      throw error; // Re-lanzar para que lo maneje el modal
    }
  };

  // Función para vincular servicios
  const handleLinkServices = async (selectedServiceIds) => {
    try {
      await linkServices(categoryId, selectedServiceIds);
    } catch (error) {
      throw error;
    }
  };

  // Función para desvincular
  const handleUnlink = async () => {
    if (!confirm('¿Desvincular este servicio de los demás?')) return;
    try {
      await unlinkServices(categoryId);
      toast.success('Servicio desvinculado');
    } catch (error) {
      toast.error(error.message || 'Error al desvincular');
    }
  };

  // Iconos por servicio
  const serviceIcons = {
    fotografia: '📸',
    video: '🎥',
    catering: '🍽️',
    venue: '🏛️',
    musica: '🎵',
    dj: '🎧',
    flores: '💐',
    decoracion: '🎨',
    tarta: '🍰',
    animacion: '🎪',
    transporte: '🚗',
  };

  const icon = serviceIcons[categoryId] || '💼';

  return (
    <div
      data-testid="wedding-service-card"
      data-service-id={categoryId}
      data-service-name={displayName}
      className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
              {linkedServices.length > 0 && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />+{linkedServices.length}
                </span>
              )}
            </div>
            {linkedServices.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                Incluye: {linkedServices.map((s) => s.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Estado */}
        <div>
          {hasConfirmed ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={14} />
              {t('wedding.serviceCard.status.confirmed', { defaultValue: 'Confirmado' })}
            </span>
          ) : hasShortlist ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Clock size={14} />
              {t('wedding.serviceCard.status.inEvaluation', { defaultValue: 'En evaluación' })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <Search size={14} />
              {t('wedding.serviceCard.status.pending', { defaultValue: 'Pendiente' })}
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      {hasConfirmed ? (
        // Proveedor confirmado
        <div className="space-y-3">
          <div className="border-l-4 border-green-500 bg-[var(--color-primary)] p-4 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="font-bold text-gray-900 text-lg">{confirmedProvider.name}</p>
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                ✓ Contratado
              </span>
            </div>

            {/* Precio */}
            {confirmedProvider.price && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl font-bold text-green-700">
                  {confirmedProvider.price.toLocaleString('es-ES')}€
                </span>
                {confirmedProvider.quote?.terms?.deposit && (
                  <span className="text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
                    {confirmedProvider.quote.terms.deposit}% adelanto
                  </span>
                )}
              </div>
            )}

            {confirmedProvider.contact && (
              <p className="text-sm text-gray-600">
                {t('wedding.serviceCard.confirmed.contactLabel', { defaultValue: 'Contacto:' })}{' '}
                {confirmedProvider.contact}
              </p>
            )}

            {confirmedProvider.rating > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm">
                <span className="text-yellow-500">⭐</span>
                <span className="font-medium">{confirmedProvider.rating.toFixed(1)}</span>
                {confirmedProvider.ratingCount > 0 && (
                  <span className="text-gray-500">
                    {t('wedding.serviceCard.confirmed.reviewsCount', {
                      count: confirmedProvider.ratingCount,
                      defaultValue: '({{count}} reseñas)',
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Condiciones clave */}
            {confirmedProvider.quote?.terms && (
              <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-2 text-xs">
                {confirmedProvider.quote.terms.deliveryTime && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock size={12} />
                    <span>Entrega: {confirmedProvider.quote.terms.deliveryTime}</span>
                  </div>
                )}
                {confirmedProvider.quote.terms.paymentTerms && (
                  <div className="flex items-center gap-1 text-gray-700">
                    💳{' '}
                    <span className="truncate">
                      {confirmedProvider.quote.terms.paymentTerms.split(',')[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 flex-wrap">
            {linkedServices.length > 0 && (
              <button
                onClick={handleUnlink}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                title="Desvincular servicios"
              >
                <Unlink size={16} />
                Desvincular
              </button>
            )}
            {linkedServices.length === 0 && allServices.length > 1 && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="px-3 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors text-sm flex items-center gap-1"
                title="Vincular con otros servicios"
              >
                <LinkIcon size={16} />
                Vincular
              </button>
            )}
            {confirmedProvider.phone && (
              <button
                onClick={() =>
                  window.open(
                    `https://wa.me/${confirmedProvider.phone.replace(/\D/g, '')}`,
                    '_blank'
                  )
                }
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                title={t('wedding.serviceCard.actions.whatsappTitle', {
                  defaultValue: 'Contactar por WhatsApp',
                })}
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
            )}
            {confirmedProvider.email && (
              <button
                onClick={() => window.open(`mailto:${confirmedProvider.email}`, '_blank')}
                className="flex-1 px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors text-sm flex items-center justify-center gap-1"
                title={t('wedding.serviceCard.actions.emailTitle', {
                  defaultValue: 'Enviar Email',
                })}
              >
                <Mail size={16} />
                Email
              </button>
            )}
            {confirmedProvider.link && (
              <button
                onClick={() => window.open(confirmedProvider.link, '_blank')}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                title={t('wedding.serviceCard.actions.webTitle', { defaultValue: 'Ver web' })}
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>

          {/* Información adicional */}
          {confirmedProvider.confirmedAt && (
            <p className="text-xs text-gray-500 mt-2">
              {t('wedding.serviceCard.confirmed.hiredAt', {
                date:
                  typeof format?.dateShort === 'function'
                    ? format.dateShort(new Date(confirmedProvider.confirmedAt))
                    : new Date(confirmedProvider.confirmedAt).toLocaleDateString(),
                defaultValue: 'Contratado el {{date}}',
              })}
            </p>
          )}
        </div>
      ) : (
        // Sin proveedor confirmado
        <div className="space-y-3">
          {hasShortlist && (
            <p className="text-sm text-gray-600">
              {t('wedding.serviceCard.shortlist.count', {
                count: shortlistCount,
                defaultValue: '{{count}} proveedor en tu lista',
              })}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {/* Botón Ver Favoritos (solo si hay favoritos) */}
            {hasFavorites && (
              <button
                onClick={() => setShowFavoritesModal(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Heart size={16} fill="currentColor" />
                {t('wedding.serviceCard.actions.viewFavorites', {
                  count: serviceFavorites.length,
                  defaultValue: 'Ver favoritos ({{count}})',
                })}
              </button>
            )}

            {hasShortlist && (
              <button
                onClick={() => navigate(`/proveedores?service=${categoryId}`)}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Clock size={16} />
                {t('wedding.serviceCard.actions.reviewOptions', {
                  count: shortlistCount,
                  defaultValue: 'Revisar opciones ({{count}})',
                })}
              </button>
            )}
            <button
              onClick={() => {
                if (onSearch) {
                  onSearch(categoryId);
                } else {
                  navigate(`/proveedores?service=${categoryId}`);
                }
              }}
              className={`w-full px-4 py-2 border rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                hasShortlist || hasFavorites
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Search size={16} />
              {hasShortlist || hasFavorites
                ? t('wedding.serviceCard.actions.searchMore', { defaultValue: 'Buscar más' })
                : t('wedding.serviceCard.actions.searchProviders', {
                    defaultValue: 'Buscar proveedores',
                  })}
            </button>
          </div>

          {!hasShortlist && (
            <p className="text-xs text-gray-500 text-center mt-2">
              {t('wedding.serviceCard.empty.noExploration', {
                defaultValue: 'Aún no has explorado opciones para este servicio',
              })}
            </p>
          )}
        </div>
      )}

      {/* Modal de favoritos */}
      <SelectFromFavoritesModal
        open={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
        serviceName={displayName}
        favorites={serviceFavorites}
        onAssign={handleAssign}
      />

      {/* Modal de vincular servicios */}
      <LinkServicesModal
        open={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        currentService={{
          id: categoryId,
          name: displayName,
          assignedSupplier: confirmedProvider,
        }}
        allServices={allServices}
        onLink={handleLinkServices}
      />
    </div>
  );
}
