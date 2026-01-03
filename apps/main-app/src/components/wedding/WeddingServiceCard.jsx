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
import useTranslations from '../../hooks/useTranslations';
import { useWeddingServices } from '../../hooks/useWeddingServices';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useWedding } from '../../context/WeddingContext';
import { toast } from 'react-toastify';
import SelectProviderModal from './SelectProviderModal';
import { normalizePhoneForWhatsApp } from '../../utils/phoneUtils';
import { useFavorites } from '../../contexts/FavoritesContext';
import SelectFromFavoritesModal from '../suppliers/SelectFromFavoritesModal';
import LinkServicesModal from './LinkServicesModal';
import AddSupplierModal from './AddSupplierModal';
import { Plus, Trash2, Star } from 'lucide-react';

/**
 * Tarjeta de servicio de la boda
 * Muestra el proveedor confirmado o botones para buscar
 */
export default function WeddingServiceCard({
  serviceId, // ID de la categoría (ej: 'fotografia')
  serviceName, // Nombre para mostrar (ej: 'Fotografía')
  service, // Retrocompatibilidad
  confirmedProvider,
  confirmedProviders = [], // NUEVO: Array de proveedores
  shortlistCount = 0,
  linkedServices = [], // Servicios vinculados a este
  allServices = [], // Todos los servicios para el modal de vincular
  onSearch,
}) {
  const navigate = useNavigate();
  const { favorites = [] } = useFavorites() || {}; // Guard contra undefined
  const { assignSupplier, linkServices, unlinkServices, removeSupplier, setPrimarySupplier } = useWeddingServices();
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const { t, format } = useTranslations();

  // Usar serviceId si está disponible, sino usar service
  const categoryId = serviceId || service?.toLowerCase();
  const displayName = serviceName || service;

  // Soportar tanto confirmedProvider (singular) como confirmedProviders (array)
  const providers = confirmedProviders.length > 0 ? confirmedProviders : (confirmedProvider ? [confirmedProvider] : []);
  const hasConfirmed = providers.length > 0;
  const hasShortlist = shortlistCount > 0;
  
  // Calcular total de todos los proveedores
  const totalPrice = providers.reduce((sum, p) => sum + (p.price || 0), 0);

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

  // Función para asignar proveedor desde modal completo
  const handleAddSupplier = async (supplier, price, notes, status, serviceDescription, deposit) => {
    try {
      await assignSupplier(categoryId, supplier, price, notes, status, serviceDescription, deposit);
      setShowAddSupplierModal(false);
      toast.success(`${supplier.name} añadido correctamente`);
    } catch (error) {
      throw error;
    }
  };

  // Función para eliminar proveedor
  const handleRemoveSupplier = async (providerId, providerName) => {
    if (!confirm(`¿Eliminar ${providerName} de este servicio?`)) return;
    try {
      await removeSupplier(categoryId, providerId);
      toast.success('Proveedor eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  // Función para marcar como primario
  const handleSetPrimary = async (providerId, providerName) => {
    try {
      await setPrimarySupplier(categoryId, providerId);
      toast.success(`${providerName} marcado como principal`);
    } catch (error) {
      toast.error(error.message || 'Error al marcar como principal');
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
        // Lista de proveedores confirmados
        <div className="space-y-3">
          {providers.map((provider, index) => (
            <div
              key={provider.id || index}
              className={`border-l-4 p-4 rounded-lg transition-all ${
                provider.isPrimary
                  ? 'border-green-500 bg-green-50'
                  : 'border-blue-400 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {provider.isPrimary && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                    <p className="font-bold text-gray-900 text-lg">{provider.name}</p>
                  </div>
                  {provider.serviceDescription && (
                    <p className="text-sm text-gray-600 italic">{provider.serviceDescription}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      provider.isPrimary
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {provider.isPrimary ? '★ Principal' : 'Adicional'}
                  </span>
                  <button
                    onClick={() => handleRemoveSupplier(provider.id, provider.name)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Precio y adelanto */}
              {provider.price && (
                <div className="mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-700">
                      {provider.price.toLocaleString('es-ES')}€
                    </span>
                    {provider.deposit?.percentage && (
                      <span className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        Adelanto: {provider.deposit.percentage}% ({provider.deposit.amount}€)
                        {provider.deposit.dueDate && (
                          <span className="ml-1 text-gray-500">
                            hasta {new Date(provider.deposit.dueDate).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Contacto */}
              {(provider.contact?.phone || provider.contact?.email) && (
                <div className="text-xs text-gray-600 space-y-1">
                  {provider.contact.phone && (
                    <p>📞 {provider.contact.phone}</p>
                  )}
                  {provider.contact.email && (
                    <p>✉️ {provider.contact.email}</p>
                  )}
                </div>
              )}

              {/* Botón para marcar como principal */}
              {!provider.isPrimary && (
                <button
                  onClick={() => handleSetPrimary(provider.id, provider.name)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  ⭐ Marcar como principal
                </button>
              )}
            </div>
          ))}

          {/* Total */}
          {providers.length > 1 && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total {displayName}:</span>
                <span className="text-3xl font-bold text-green-700">
                  {totalPrice.toLocaleString('es-ES')}€
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {providers.length} proveedor{providers.length > 1 ? 'es' : ''} confirmado{providers.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 flex-wrap">
            {/* Botón para añadir otro proveedor */}
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
            >
              <Plus size={16} />
              Añadir proveedor
            </button>
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
                    `https://wa.me/${normalizePhoneForWhatsApp(confirmedProvider.phone)}`,
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

      {/* Modal para añadir proveedor con info completa */}
      <AddSupplierModal
        open={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        serviceId={categoryId}
        serviceName={displayName}
        onAssign={handleAddSupplier}
        favorites={serviceFavorites}
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
