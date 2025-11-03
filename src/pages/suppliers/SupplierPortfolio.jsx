import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Star,
  Eye,
  Heart,
  Filter,
  Grid,
  List,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { toast } from 'react-toastify';
import PhotoUploadModal from '../../components/suppliers/PhotoUploadModal';
import PhotoLightbox from '../../components/suppliers/PhotoLightbox';
import useTranslations from '../../hooks/useTranslations';

const CATEGORY_KEYS = ['all', 'bodas', 'decoracion', 'flores', 'ceremonia', 'recepcion', 'otros'];
const VIEW_MODES = ['grid', 'list'];

export default function SupplierPortfolio() {
  const navigate = useNavigate();
  const { t, tPlural, format } = useTranslations();

  const [photos, setPhotos] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const categoryOptions = useMemo(
    () =>
      CATEGORY_KEYS.map((key) => ({
        value: key,
        label: t(`common.suppliers.portfolio.categories.${key}`),
      })),
    [t]
  );

  const formatNumber = useCallback(
    (value) => {
      if (!Number.isFinite(value)) return 0;
      return format?.number ? format.number(value) : value;
    },
    [format]
  );

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const params = new URLSearchParams();

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/supplier-dashboard/portfolio?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('load_error');
      }

      const data = await response.json();
      const allPhotos = data.photos || [];

      const cover = allPhotos.find((photo) => photo.isCover);
      const portfolioPhotos = allPhotos.filter((photo) => !photo.isCover);

      setCoverPhoto(cover || null);
      setPhotos(portfolioPhotos);
    } catch (error) {
      console.error('[SupplierPortfolio] load error', error);
      toast.error(t('suppliers.portfolio.toasts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedCategory, t]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoUploaded = () => {
    setShowUploadModal(false);
    loadPhotos();
    toast.success(t('suppliers.portfolio.toasts.uploaded'));
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setShowLightbox(true);
  };

  const handlePhotoDeleted = async (photoId) => {
    if (!window.confirm(t('suppliers.portfolio.dashboard.deleteConfirm'))) return;

    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/portfolio/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('delete_failed');

      toast.success(t('suppliers.portfolio.toasts.deleted'));
      loadPhotos();
    } catch (error) {
      console.error('[SupplierPortfolio] delete error', error);
      toast.error(
        error.message === 'delete_failed'
          ? t('suppliers.portfolio.toasts.deleteError')
          : t('suppliers.portfolio.toasts.genericError')
      );
    }
  };

  const handlePhotoUpdated = () => {
    setShowLightbox(false);
    loadPhotos();
    toast.success(t('suppliers.portfolio.toasts.updated'));
  };

  const totalPhotos = photos.length + (coverPhoto ? 1 : 0);

  const photoCountLabel = useMemo(
    () =>
      tPlural('common.suppliers.portfolio.dashboard.photoCount', totalPhotos, {
        count: totalPhotos,
      }),
    [totalPhotos, tPlural]
  );

  const coverCountLabel = useMemo(() => {
    const count = coverPhoto ? 1 : 0;
    if (!count) return '';
    return tPlural('common.suppliers.portfolio.dashboard.coverCount', count, { count });
  }, [coverPhoto, tPlural]);

  const coverPhotoTitle = useMemo(
    () => coverPhoto?.title || t('suppliers.portfolio.dashboard.coverPhoto.untitled'),
    [coverPhoto, t]
  );

  const zeroStateTitle = t('suppliers.portfolio.dashboard.zeroState.title');
  const zeroStateDescription = t('suppliers.portfolio.dashboard.zeroState.description');
  const zeroStateCta = t('suppliers.portfolio.dashboard.zeroState.cta');

  const showZeroState = !coverPhoto && photos.length === 0;

  const changeCategory = (event) => {
    setSelectedCategory(event.target.value);
  };

  const changeViewMode = (mode) => {
    if (VIEW_MODES.includes(mode)) {
      setViewMode(mode);
    }
  };

  const renderCoverPhotoCard = () => {
    if (!coverPhoto) return null;

    return (
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-sm text-muted uppercase tracking-wide">
              {t('suppliers.portfolio.dashboard.coverPhotoCard.title')}
            </p>
            <h2 className="text-lg font-semibold text-foreground">{coverPhotoTitle}</h2>
            <p className="text-sm text-muted">
              {t('suppliers.portfolio.dashboard.coverPhotoCard.description')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handlePhotoClick(coverPhoto)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit className="h-4 w-4" />
            {t('suppliers.portfolio.dashboard.photoCard.open')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => handlePhotoClick(coverPhoto)}
          className="relative block"
        >
          <img
            src={coverPhoto.thumbnails?.large || coverPhoto.original}
            alt={coverPhotoTitle}
            className="w-full h-64 object-cover"
          />
          {coverPhoto.featured && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-white px-3 py-1 rounded-md text-xs uppercase tracking-wide">
              <Star className="h-3 w-3 fill-current" />
              {t('suppliers.portfolio.lightbox.tags.featured')}
            </span>
          )}
        </button>
        <div className="flex items-center gap-6 px-4 py-3 text-sm text-muted border-t border-border">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {formatNumber(coverPhoto.views || 0)}{' '}
            {t('suppliers.portfolio.dashboard.stats.views')}
          </span>
          <span className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4" />
            {formatNumber(coverPhoto.likes || 0)}{' '}
            {t('suppliers.portfolio.dashboard.stats.likes')}
          </span>
        </div>
      </div>
    );
  };

  const renderPhotoCard = (photo) => {
    const title = photo.title || t('suppliers.portfolio.lightbox.view.noTitle');
    const description = photo.description || '';

    return (
      <div
        key={photo.id}
        className={`relative bg-surface border border-border rounded-lg overflow-hidden group ${
          viewMode === 'list' ? 'flex gap-4' : ''
        }`}
      >
        <button
          type="button"
          className={`relative cursor-pointer ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}
          onClick={() => handlePhotoClick(photo)}
        >
          <img
            src={photo.thumbnails?.medium || photo.original}
            alt={title}
            className={`w-full object-cover ${viewMode === 'list' ? 'h-full' : 'h-64'}`}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-8 w-8 text-white" />
          </div>
          {photo.featured && (
            <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              {t('suppliers.portfolio.lightbox.tags.featured')}
            </div>
          )}
        </button>

        <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              {photo.category && (
                <p className="text-xs text-muted">
                  {t('suppliers.portfolio.dashboard.filters.label')}:&nbsp;
                  {t(`common.suppliers.portfolio.lightbox.categories.${photo.category}`, {
                    defaultValue: photo.category,
                  })}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handlePhotoDeleted(photo.id);
              }}
              className="text-red-500 hover:text-red-600 transition-colors"
              title={t('suppliers.portfolio.dashboard.photoCard.delete')}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>

          {description && <p className="text-sm text-muted mb-3 line-clamp-3">{description}</p>}

          <div className="flex items-center gap-4 text-sm text-muted mb-4">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {formatNumber(photo.views || 0)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {formatNumber(photo.likes || 0)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handlePhotoClick(photo);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              {t('suppliers.portfolio.dashboard.photoCard.edit')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">{t('suppliers.portfolio.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {t('suppliers.portfolio.dashboard.title')}
              </h1>
            </div>
            <p className="text-muted">
              {coverCountLabel ? `${photoCountLabel} · ${coverCountLabel}` : photoCountLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t('suppliers.portfolio.dashboard.actions.addPhoto')}
          </button>
        </div>
      </div>

      {renderCoverPhotoCard()}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-muted" />
          <div>
            <label htmlFor="portfolio-category" className="block text-sm text-muted">
              {t('suppliers.portfolio.dashboard.filters.label')}
            </label>
            <select
              id="portfolio-category"
              value={selectedCategory}
              onChange={changeCategory}
              className="mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-muted hover:text-foreground'
            }`}
            title={t('suppliers.portfolio.dashboard.viewModes.grid')}
            aria-label={t('suppliers.portfolio.dashboard.viewModes.grid')}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => changeViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-muted hover:text-foreground'
            }`}
            title={t('suppliers.portfolio.dashboard.viewModes.list')}
            aria-label={t('suppliers.portfolio.dashboard.viewModes.list')}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showZeroState ? (
        <div className="text-center py-16 bg-surface border border-border rounded-lg">
          <ImageIcon className="h-16 w-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">{zeroStateTitle}</h3>
          <p className="text-muted mb-6">{zeroStateDescription}</p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-5 w-5" />
            {zeroStateCta}
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {photos.map((photo) => renderPhotoCard(photo))}
        </div>
      )}

      {showUploadModal && (
        <PhotoUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handlePhotoUploaded}
        />
      )}

      {showLightbox && selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setShowLightbox(false)}
          onUpdate={handlePhotoUpdated}
          onDelete={() => {
            handlePhotoDeleted(selectedPhoto.id);
            setShowLightbox(false);
          }}
        />
      )}
    </div>
  );
}
