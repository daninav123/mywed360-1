import React, { useState, useEffect } from 'react';
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
  Camera,
  Loader2,
  FileText,
  Save,
  CheckCircle,
} from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import PhotoLightbox from './PhotoLightbox';
import useTranslations from '../../hooks/useTranslations';
import { useSupplierNotes } from '../../contexts/SupplierNotesContext';

const SupplierDetailModal = ({
  supplier,
  open,
  onClose,
  onFavoriteToggle,
  isFavorite = false,
  onRequestQuote,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [portfolioPhotos, setPortfolioPhotos] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { t } = useTranslations();
  const { getNote, setNote } = useSupplierNotes();

  const [noteText, setNoteText] = useState('');
  const [noteEditing, setNoteEditing] = useState(false);

  // Cargar nota al abrir modal
  useEffect(() => {
    if (open && supplier) {
      const supplierId = supplier.id || supplier.slug;
      const existingNote = getNote(supplierId);
      setNoteText(existingNote);
    }
  }, [open, supplier, getNote]);

  const handleSaveNote = () => {
    const supplierId = supplier.id || supplier.slug;
    setNote(supplierId, noteText);
    setNoteEditing(false);
  };

  // Cargar portfolio si el proveedor tiene slug
  useEffect(() => {
    if (!open || !supplier?.slug || !supplier?.hasPortfolio) {
      setPortfolioPhotos([]);
      return;
    }

    const fetchPortfolio = async () => {
      setLoadingPortfolio(true);
      try {
        const response = await fetch(`/api/suppliers/public/${supplier.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.portfolio && Array.isArray(data.portfolio)) {
            setPortfolioPhotos(data.portfolio);
          }
        }
      } catch (error) {
        // console.error('Error loading portfolio:', error);
      } finally {
        setLoadingPortfolio(false);
      }
    };

    fetchPortfolio();
  }, [open, supplier?.slug, supplier?.hasPortfolio]);

  if (!open || !supplier) return null;

  // Normalizar datos del supplier
  const normalizedSupplier = {
    ...supplier,
    category: supplier.category || supplier.service || supplier.profile?.category || 'Servicio desconocido',
    location: typeof supplier.location === 'object' && supplier.location !== null
      ? supplier.location
      : { city: '', province: '', country: '' },
  };

  const images =
    supplier.media?.portfolio?.length > 0
      ? supplier.media.portfolio
      : [supplier.media?.cover, supplier.media?.logo].filter(Boolean);

  const hasImages = images.length > 0;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {supplier.media?.logo && (
              <img
                src={supplier.media.logo}
                alt={supplier.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
                {supplier.registered && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle size={14} />
                    Verificado
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 capitalize mt-1">{normalizedSupplier.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
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
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                    aria-label="Siguiente"
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
                <Badge variant="success">Verificado</Badge>
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
                {isFavorite ? 'Guardado' : 'Guardar'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => onRequestQuote?.(supplier)}>
                <Send className="h-4 w-4" />
                Solicitar Cotización
              </Button>
            </div>
          </div>

          {supplier.description && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {supplier.name}
              </h3>
              <p className="text-body leading-relaxed">{supplier.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.location && (
              <div className="flex gap-3 p-4 bg-surface rounded-lg border">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Ubicación</p>
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
                  <p className="font-medium">Precio</p>
                  <p className="text-sm text-muted">{supplier.pricing.priceRange}</p>
                </div>
              </div>
            )}
            {supplier.rating && (
              <div className="flex gap-3 p-4 bg-surface rounded-lg border">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Calificación</p>
                  <p className="text-sm text-muted">
                    {supplier.rating.toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              Contacto
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
                      Correo electrónico
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
                      Teléfono
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
                      Sitio web
                    </p>
                    <p className="text-sm text-muted truncate">{supplier.contact.website}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted" />
                </a>
              )}
            </div>
          </div>

          {/* Sección Notas Privadas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Notas privadas
            </h3>
            {noteEditing ? (
              <div className="space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Añade notas personales sobre este proveedor..."
                  className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNote}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar nota
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setNoteEditing(false);
                      const supplierId = supplier.id || supplier.slug;
                      setNoteText(getNote(supplierId));
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {noteText ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{noteText}</p>
                    <button
                      onClick={() => setNoteEditing(true)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Editar nota
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNoteEditing(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + Añadir nota privada
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sección Portfolio */}
          {(supplier.hasPortfolio && supplier.slug) || portfolioPhotos.length > 0 ? (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Portfolio
                  </h3>
                  {portfolioPhotos.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {portfolioPhotos.length} fotos disponibles
                    </p>
                  )}
                </div>
                <a
                  href={`/proveedor/${supplier.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
                >
                  Ver página completa
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              {loadingPortfolio ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : portfolioPhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioPhotos.map((photo, index) => (
                    <div
                      key={photo.id || index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border border-gray-200 hover:border-purple-300 transition-all"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={photo.thumbnails?.medium || photo.original || photo.url}
                        alt={photo.title || `Foto ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {photo.featured && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                          ⭐ Destacada
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    No hay fotos disponibles
                  </p>
                </div>
              )}

              {portfolioPhotos.length > 6 && (
                <div className="mt-4 text-center">
                  <a
                    href={`/proveedor/${supplier.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Ver todas las fotos ({portfolioPhotos.length})
                  </a>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Lightbox para ver fotos en grande */}
      {lightboxOpen && portfolioPhotos.length > 0 && (
        <PhotoLightbox
          photos={portfolioPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </Modal>
  );
};

export default SupplierDetailModal;
