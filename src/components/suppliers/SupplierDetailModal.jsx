import React, { useState } from 'react';
import {
  X,
  Heart,
  Mail,
  Phone,
  Globe,
  MapPin,
  Star,
  DollarSign,
  Send,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import useTranslations from '../../hooks/useTranslations';

const SupplierDetailModal = ({
  supplier,
  open,
  onClose,
  onFavoriteToggle,
  isFavorite = false,
  onRequestQuote,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { t } = useTranslations();

  if (!open || !supplier) return null;

  const images =
    supplier.media?.portfolio?.length > 0
      ? supplier.media.portfolio
      : [supplier.media?.cover, supplier.media?.logo].filter(Boolean);

  const hasImages = images.length > 0;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {supplier.media?.logo && (
              <img
                src={supplier.media.logo}
                alt={supplier.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{supplier.name}</h2>
              <p className="text-sm text-muted capitalize">{supplier.category}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('app.close')}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {hasImages && (
            <div className="relative h-96 bg-surface-dark rounded-xl overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt={supplier.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                    aria-label={t('common.suppliers.detail.gallery.previous')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                    aria-label={t('common.suppliers.detail.gallery.next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {supplier.registered && (
                <Badge variant="success">{t('common.suppliers.detail.badges.verified')}</Badge>
              )}
              {supplier.badge && <Badge variant="info">{supplier.badge}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button
                variant={isFavorite ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFavoriteToggle?.(supplier)}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                {isFavorite
                  ? t('common.suppliers.detail.actions.saved')
                  : t('common.suppliers.detail.actions.save')}
              </Button>
              <Button variant="primary" size="sm" onClick={() => onRequestQuote?.(supplier)}>
                <Send className="h-4 w-4" />
                {t('common.suppliers.detail.actions.requestQuote')}
              </Button>
            </div>
          </div>

          {supplier.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {t('common.suppliers.detail.sections.about', { name: supplier.name })}
              </h3>
              <p className="text-body leading-relaxed">{supplier.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.location && (
              <div className="flex gap-3 p-4 bg-surface rounded-lg border">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('common.suppliers.detail.info.location')}</p>
                  <p className="text-sm text-muted">
                    {[supplier.location.city, supplier.location.province]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>
            )}
            {supplier.pricing?.priceRange && (
              <div className="flex gap-3 p-4 bg-surface rounded-lg border">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('common.suppliers.detail.info.price')}</p>
                  <p className="text-sm text-muted">{supplier.pricing.priceRange}</p>
                </div>
              </div>
            )}
            {supplier.rating && (
              <div className="flex gap-3 p-4 bg-surface rounded-lg border">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('common.suppliers.detail.info.rating')}</p>
                  <p className="text-sm text-muted">
                    {t('common.suppliers.detail.info.ratingValue', {
                      value: supplier.rating.toFixed(1),
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              {t('common.suppliers.detail.sections.contact')}
            </h3>
            <div className="space-y-3">
              {supplier.contact?.email && (
                <a
                  href={`mailto:${supplier.contact.email}`}
                  className="flex items-center gap-3 p-3 bg-surface rounded-lg border hover:border-primary"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {t('common.suppliers.detail.contact.email')}
                    </p>
                    <p className="text-sm text-muted">{supplier.contact.email}</p>
                  </div>
                </a>
              )}
              {supplier.contact?.phone && (
                <a
                  href={`tel:${supplier.contact.phone}`}
                  className="flex items-center gap-3 p-3 bg-surface rounded-lg border hover:border-primary"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {t('common.suppliers.detail.contact.phone')}
                    </p>
                    <p className="text-sm text-muted">{supplier.contact.phone}</p>
                  </div>
                </a>
              )}
              {supplier.contact?.website && (
                <a
                  href={supplier.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-surface rounded-lg border hover:border-primary"
                >
                  <Globe className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t('common.suppliers.detail.contact.website')}
                    </p>
                    <p className="text-sm text-muted truncate">{supplier.contact.website}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierDetailModal;
