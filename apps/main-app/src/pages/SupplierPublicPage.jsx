import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Star,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
export default function SupplierPublicPage() {
  const { slug } = useParams(); // URL: /p/nombre-proveedor
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadSupplierData();
  }, [slug]);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      // Buscar proveedor por slug
      const response = await fetch(`/api/suppliers/public/${slug}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Proveedor no encontrado');
          navigate('/');
          return;
        }
        throw new Error('Error loading supplier');
      }

      const data = await response.json();
      setSupplier(data.supplier);
      setPortfolio(data.portfolio || []);
    } catch (error) {
      // console.error('Error loading supplier:', error);
      toast.error('Error al cargar el proveedor');
    } finally {
      setLoading(false);
    }
  };

  const filteredPortfolio =
    selectedCategory === 'all'
      ? portfolio
      : portfolio.filter((p) => p.category === selectedCategory);

  const categories = ['all', ...new Set(portfolio.map((p) => p.category))];

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredPortfolio.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredPortfolio.length) % filteredPortfolio.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Proveedor no encontrado</p>
      </div>
    );
  }

  const coverPhoto = portfolio.find((p) => p.isCover);

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{supplier.name} - Portfolio | MyWed360</title>
        <meta
          name="description"
          content={supplier.business?.description || `Portfolio de ${supplier.name}`}
        />
        <meta property="og:title" content={`${supplier.name} - Portfolio`} />
        <meta property="og:description" content={supplier.business?.description || ''} />
        <meta property="og:image" content={coverPhoto?.original || portfolio[0]?.original || ''} />
        <meta property="og:url" content={`${window.location.origin}/p/${slug}`} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/p/${slug}`} />
      </Helmet>

      <div className="min-h-screen bg-app">
        {/* Hero Section con Foto de Portada */}
        <div className="relative h-96 bg-[var(--color-primary-20)]">
          {coverPhoto && (
            <img
              src={coverPhoto.original}
              alt={supplier.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />

          {/* Nombre del Proveedor */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="shadow-md mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{supplier.name}</h1>
              <p className="text-xl text-white/90">
                {supplier.profile?.category || 'Servicios de boda'}
              </p>

              {/* Rating */}
              {supplier.rating && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(supplier.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-white/30'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold">{supplier.rating}</span>
                  {supplier.reviewCount && (
                    <span className="text-white/80">({supplier.reviewCount} reseñas)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="layout-container-wide py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna Principal - Portfolio */}
            <div className="lg:col-span-2 space-y-8">
              {/* Sobre Nosotros */}
              {supplier.business?.description && (
                <section className="bg-surface border border-border rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Sobre Nosotros</h2>
                  <p className="text-body whitespace-pre-wrap">{supplier.business.description}</p>
                </section>
              )}

              {/* Portfolio */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Portfolio ({filteredPortfolio.length} fotos)
                  </h2>

                  {/* Filtro de Categorías */}
                  {categories.length > 1 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-border rounded-lg bg-surface text-body"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories
                        .filter((c) => c !== 'all')
                        .map((cat) => (
                          <option key={cat} value={cat} className="capitalize">
                            {cat}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                {filteredPortfolio.length === 0 ? (
                  <div className="text-center py-16 bg-surface border border-border rounded-lg">
                    <p className="text-muted">No hay fotos en esta categoría</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredPortfolio.map((photo, index) => (
                      <div
                        key={photo.id}
                        placeholder={t('supplier.publicPage.namePlaceholder')}
                        className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg"
                        onClick={() => openLightbox(index)}
                      >
                        <img
                          src={photo.thumbnails?.medium || photo.original}
                          alt={photo.title || ''}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            {photo.title && <p className="text-sm font-semibold">{photo.title}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar - Información de Contacto */}
            <div className="lg:col-span-1 space-y-6">
              {/* Botones de Acción */}
              <div className="bg-surface border border-border rounded-lg p-6 sticky top-4 space-y-4">
                <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-90)] transition-colors">
                  {t('supplier.publicPage.messagePlaceholder')}
                </button>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors">
                    <Heart className="h-5 w-5" />
                    {t('supplier.publicPage.savePlaceholder')}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-surface-muted transition-colors">
                    <Share2 className="h-5 w-5" />
                    {t('supplier.publicPage.sharePlaceholder')}
                  </button>
                </div>

                {/* Información de Contacto */}
                <div className="pt-4 border-t border-border space-y-3">
                  <h3 className="font-semibold text-foreground mb-3">{t('supplier.publicPage.contactTitle')}</h3>

                  {supplier.location?.city && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-body">{supplier.location.city}</p>
                        {supplier.location.province && (
                          <p className="text-sm text-muted">{supplier.location.province}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {supplier.contact?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted flex-shrink-0" />
                      <a
                        href={`mailto:${supplier.contact.email}`}
                        className="text-body hover:text-primary transition-colors"
                      >
                        {supplier.contact.email}
                      </a>
                    </div>
                  )}

                  {supplier.contact?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted flex-shrink-0" />
                      <a
                        href={`tel:${supplier.contact.phone}`}
                        className="text-body hover:text-primary transition-colors"
                      >
                        {supplier.contact.phone}
                      </a>
                    </div>
                  )}

                  {supplier.contact?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted flex-shrink-0" />
                      <a
                        href={supplier.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body hover:text-primary transition-colors truncate"
                      >
                        {supplier.contact.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {supplier.contact?.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-muted flex-shrink-0" />
                      <a
                        href={`https://instagram.com/${supplier.contact.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body hover:text-primary transition-colors"
                      >
                        @{supplier.contact.instagram.replace('@', '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && filteredPortfolio.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300"
            disabled={filteredPortfolio.length <= 1}
          >
            <ChevronLeft className="h-12 w-12" />
          </button>

          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300"
            disabled={filteredPortfolio.length <= 1}
          >
            <ChevronRight className="h-12 w-12" />
          </button>

          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={filteredPortfolio[lightboxIndex]?.original}
              alt={filteredPortfolio[lightboxIndex]?.title || ''}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {filteredPortfolio[lightboxIndex]?.title && (
              <div className="mt-4 text-white text-center">
                <h3 className="text-xl font-semibold">{filteredPortfolio[lightboxIndex].title}</h3>
                {filteredPortfolio[lightboxIndex].description && (
                  <p className="text-gray-300 mt-2">
                    {filteredPortfolio[lightboxIndex].description}
                  </p>
                )}
              </div>
            )}
            <div className="mt-4  text-sm" style={{ color: 'var(--color-muted)' }}>
              {lightboxIndex + 1} / {filteredPortfolio.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
