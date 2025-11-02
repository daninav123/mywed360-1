// components/suppliers/SupplierCard.jsx
// Tarjeta de proveedor con diferenciación visual (Registrado vs Internet)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Globe,
  Mail,
  Phone,
  Instagram,
  ExternalLink,
  MessageCircle,
  Heart,
  Camera,
  Star,
  Share2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import { useFavoritesWithAutoCategory } from '../../hooks/useFavoritesWithAutoCategory';
import { useSupplierCompare } from '../../contexts/SupplierCompareContext';
import { useSupplierContacts } from '../../contexts/SupplierContactsContext';
import { useWedding } from '../../context/WeddingContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import SupplierDetailModal from './SupplierDetailModal';
import RequestQuoteModal from './RequestQuoteModal';

export default function SupplierCard({ supplier, onContact, onViewDetails, onMarkAsConfirmed }) {
  const { t, tPlural, format } = useTranslations();
  const { isFavorite, toggleFavorite } = useFavoritesWithAutoCategory();
  const { isInCompareList, addToCompare, removeFromCompare } = useSupplierCompare();
  const { logContact, getLastContact, needsFollowUp } = useSupplierContacts();
  const { info: weddingProfile } = useActiveWeddingInfo();
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const isFav = isFavorite(supplier.id);
  const isComparing = isInCompareList(supplier.id || supplier.slug);
  const supplierId = supplier.id || supplier.slug;
  const lastContact = getLastContact(supplierId);
  const shouldFollowUp = needsFollowUp(supplierId);
  const contactDate = lastContact?.timestamp ? new Date(lastContact.timestamp) : null;
  const isValidContactDate = contactDate && !Number.isNaN(contactDate.getTime());
  const formattedLastContact =
    isValidContactDate && typeof format?.dateShort === 'function'
      ? format.dateShort(contactDate)
      : isValidContactDate
        ? contactDate.toLocaleDateString()
        : '';
  const followUpMethodKey = lastContact?.method
    ? `common.suppliers.card.hybrid.followUp.methods.${lastContact.method}`
    : null;
  let followUpMethodLabel =
    followUpMethodKey && lastContact?.method
      ? t(followUpMethodKey, { method: lastContact.method })
      : null;
  if (followUpMethodLabel && followUpMethodLabel === followUpMethodKey && lastContact?.method) {
    followUpMethodLabel = t('common.suppliers.card.hybrid.followUp.methods.other', {
      method: lastContact.method,
    });
  }
  const lastContactLabel =
    formattedLastContact &&
    t(
      followUpMethodLabel
        ? 'common.suppliers.card.hybrid.followUp.lastContact'
        : 'common.suppliers.card.hybrid.followUp.lastContactNoMethod',
      {
        date: formattedLastContact,
        method: followUpMethodLabel || '',
      }
    );

  const isRegistered = supplier.priority === 'registered';
  const isCached = supplier.priority === 'cached';
  const isInternet = supplier.priority === 'internet';

  // Colores según tipo
  const borderColor = isRegistered
    ? 'border-green-500'
    : isCached
      ? 'border-blue-400'
      : 'border-gray-300';

  const bgColor = isRegistered ? 'bg-green-50' : isCached ? 'bg-blue-50' : 'bg-white';

  const brandName = t('app.brandName');
  const fallbackName = supplier.name || t('common.suppliers.card.hybrid.defaults.name');
  const fallbackService =
    supplier.category || supplier.service || t('common.suppliers.card.hybrid.defaults.service');
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

    // Registrar contacto
    logContact(supplierId, 'whatsapp', supplier.name || fallbackName);
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
    window.open(
      `mailto:${supplier.contact?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank'
    );

    // Registrar contacto
    logContact(supplierId, 'email', supplier.name || fallbackName);
    onContact?.({ method: 'email', supplier });
    setShowContactMenu(false);
  };

  const handleContactPhone = () => {
    if (!supplier.contact?.phone) return;
    window.open(`tel:${supplier.contact?.phone}`, '_blank');

    // Registrar contacto
    logContact(supplierId, 'phone', supplier.name || fallbackName);
    onContact?.({ method: 'phone', supplier });
    setShowContactMenu(false);
  };

  // Manejar favoritos
  const handleToggleFavorite = async (e) => {
    e?.stopPropagation?.(); // Evitar propagación al card (opcional)

    setIsFavoriting(true);
    try {
      console.log('🔍 [SupplierCard] Guardando favorito con:', {
        name: supplier.name,
        category: supplier.category,
        service: supplier.service,
        fullSupplier: supplier,
      });
      await toggleFavorite(supplier);

      if (isFav) {
        toast.success(t('common.suppliers.card.hybrid.toasts.removed'));
      } else {
        toast.success(t('common.suppliers.card.hybrid.toasts.added'));
      }
    } catch (error) {
      toast.error(error.message || t('common.suppliers.card.hybrid.toasts.error'));
    } finally {
      setIsFavoriting(false);
    }
  };

  // Manejar comparador
  const handleToggleCompare = (e) => {
    e?.stopPropagation?.();
    if (isComparing) {
      removeFromCompare(supplier.id || supplier.slug);
    } else {
      addToCompare(supplier);
    }
  };

  // Manejar compartir
  const handleShare = async (e) => {
    e?.stopPropagation?.();

    const shareUrl = supplier.slug
      ? `${window.location.origin}/proveedor/${supplier.slug}`
      : window.location.href;

    const shareService = supplier.category || supplier.service || fallbackService;
    const shareText = t('common.suppliers.card.hybrid.share.message', {
      name: supplier.name || fallbackName,
      service: shareService,
    });

    // Compartir en WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');

    toast.success(
      t('common.suppliers.card.hybrid.share.toast', 'Abriendo WhatsApp para compartir')
    );
  };

  return (
    <div
      className={`
      border-2 rounded-lg p-4 transition-all hover:shadow-lg
      ${borderColor} ${bgColor}
    `}
    >
      {/* Header con nombre, favorito y badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {supplier.name || t('common.suppliers.card.hybrid.defaults.name')}
          </h3>
          {locationLabel && <p className="text-sm text-gray-600">{locationLabel}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Checkbox Comparar */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isComparing}
              onChange={handleToggleCompare}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              title={
                isComparing
                  ? t('common.suppliers.card.hybrid.compare.remove', 'Quitar de comparación')
                  : t('common.suppliers.card.hybrid.compare.add', 'Añadir a comparación')
              }
            />
          </div>

          {/* Botón de favorito */}
          <button
            onClick={handleToggleFavorite}
            disabled={isFavoriting}
            className={`
              p-2 rounded-full transition-all hover:scale-110
              ${isFav ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100'}
              ${isFavoriting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={
              isFav
                ? t('common.suppliers.card.hybrid.favorite.remove')
                : t('common.suppliers.card.hybrid.favorite.add')
            }
          >
            <Heart
              size={20}
              fill={isFav ? 'currentColor' : 'none'}
              className={isFavoriting ? 'animate-pulse' : ''}
            />
          </button>
        </div>

        {/* Badges según tipo y portfolio */}
        <div className="ml-2 flex flex-wrap gap-1">
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
          {/* Badge Portfolio Disponible */}
          {supplier.hasPortfolio && supplier.slug && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Camera size={14} />
              {t('common.suppliers.card.hybrid.badges.portfolio')}
            </span>
          )}
          {/* 🤖 Badge Categoría Detectada */}
          {supplier.categoryName && supplier.categoryConfidence && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                ${
                  supplier.categoryConfidence >= 70
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-yellow-100 text-yellow-800'
                }
              `}
              title={`Categoría detectada automáticamente (${supplier.categoryConfidence}% confianza)`}
            >
              🏷️ {supplier.categoryName}
              {supplier.categoryConfidence < 70 && ' ?'}
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
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Descripción */}
      {supplier.business?.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">{supplier.business.description}</p>
      )}

      {/* Info de contacto (solo si está disponible) */}
      <div className="space-y-1 mb-3 text-sm">
        {supplier.contact?.email ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={14} className="text-blue-600" />
            <span className="truncate">{supplier.contact.email}</span>
          </div>
        ) : (
          isInternet && (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <Mail size={14} />
              <span className="text-xs">{t('common.suppliers.card.hybrid.contact.noEmail')}</span>
            </div>
          )
        )}
        {supplier.contact?.phone ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} className="text-green-600" />
            <span>{supplier.contact.phone}</span>
          </div>
        ) : (
          isInternet && (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <Phone size={14} />
              <span className="text-xs">{t('common.suppliers.card.hybrid.contact.noPhone')}</span>
            </div>
          )
        )}
        {supplier.contact?.instagram && (
          <div className="flex items-center gap-2 text-gray-600">
            <Instagram size={14} className="text-pink-600" />
            <span className="truncate text-xs">
              {supplier.contact.instagram.replace('https://instagram.com/', '@')}
            </span>
          </div>
        )}
      </div>

      {/* Precio (si disponible) */}
      {supplier.business?.priceRange && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">{supplier.business.priceRange}</span>
        </div>
      )}

      {/* Rating con mejor visualización */}
      {supplier.metrics?.rating > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">
              {supplier.metrics.rating.toFixed(1)}
            </span>
          </div>
          {supplier.metrics?.reviewCount > 0 && (
            <span className="text-sm text-gray-600">
              (
              {tPlural('common.suppliers.card.hybrid.reviews.count', supplier.metrics.reviewCount, {
                count: supplier.metrics.reviewCount,
              })}
              )
            </span>
          )}
        </div>
      )}

      {/* Indicador de último contacto / seguimiento */}
      {lastContact && (
        <div className="mb-3">
          {shouldFollowUp ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock size={14} className="text-yellow-600" />
              <span className="text-xs text-yellow-800 font-medium">
                {t(
                  'common.suppliers.card.hybrid.followUp.reminder',
                  '💡 Hace más de 7 días • Considera hacer seguimiento'
                )}
              </span>
            </div>
          ) : (
            lastContactLabel && <div className="text-xs text-gray-500">{lastContactLabel}</div>
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
              {/* Botón Ver Portfolio (solo si tiene slug y portfolio) */}
              {supplier.hasPortfolio && supplier.slug && (
                <Link
                  to={`/proveedor/${supplier.slug}`}
                  className="flex-1 px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Camera size={16} />
                  {t('common.suppliers.card.hybrid.actions.viewPortfolio')}
                </Link>
              )}
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

            {/* Botón Solicitar Presupuesto */}
            <button
              onClick={() => setShowQuoteModal(true)}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <DollarSign size={16} />
              💰 {t('common.suppliers.card.hybrid.actions.requestQuote', 'Solicitar Presupuesto')}
            </button>

            {/* Botón Compartir */}
            <button
              onClick={handleShare}
              className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              {t('common.suppliers.card.hybrid.actions.share', 'Compartir')}
            </button>
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
              source:
                supplier.sources?.[0]?.platform ||
                t('common.suppliers.card.hybrid.source.internet'),
            })}
          </p>
        </div>
      )}

      {/* Botón Ver Detalles */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowDetailModal(true)}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          {t('common.suppliers.card.hybrid.actions.viewDetails')}
        </button>
      </div>

      {/* Modal de Detalles */}
      <SupplierDetailModal
        supplier={supplier}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onFavoriteToggle={handleToggleFavorite}
        isFavorite={isFav}
        onRequestQuote={() => {
          setShowDetailModal(false);
          setShowQuoteModal(true);
        }}
      />

      {/* Modal Solicitar Presupuesto */}
      <RequestQuoteModal
        supplier={supplier}
        weddingInfo={weddingProfile}
        open={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onSuccess={() => {
          toast.success(t('common.suppliers.requestQuoteModal.toasts.success'));
        }}
      />
    </div>
  );
}
