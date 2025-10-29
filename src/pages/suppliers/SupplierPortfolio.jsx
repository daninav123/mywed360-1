import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    [t],
  );

  const formatNumber = useCallback(
    (value) => (format?.number ? format.number(value) : value),
    [format],
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

      const cover = allPhotos.find((p) => p.isCover);
      const regularPhotos = allPhotos.filter((p) => !p.isCover);

      setCoverPhoto(cover || null);
      setPhotos(regularPhotos);
    } catch (error) {
      console.error('[SupplierPortfolio] load error', error);
      toast.error(t('common.suppliers.portfolio.toasts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, navigate, t]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoUploaded = () => {
    setShowUploadModal(false);
    loadPhotos();
    toast.success(t('common.suppliers.portfolio.toasts.uploaded'));
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setShowLightbox(true);
  };

  const handlePhotoDeleted = async (photoId) => {
    if (!window.confirm(t('common.suppliers.portfolio.dashboard.deleteConfirm'))) return;

    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/portfolio/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('delete_failed');

      toast.success(t('common.suppliers.portfolio.toasts.deleted'));
      loadPhotos();
    } catch (error) {
      console.error('[SupplierPortfolio] delete error', error);
      toast.error(
        error.message === 'delete_failed'
          ? t('common.suppliers.portfolio.toasts.deleteError')
          : t('common.suppliers.portfolio.toasts.genericError'),
      );
    }
  };

  const handlePhotoUpdated = () => {
    setShowLightbox(false);
    loadPhotos();
    toast.success(t('common.suppliers.portfolio.toasts.updated'));
  };

  const photoCountLabel = useMemo(
    () => tPlural('common.suppliers.portfolio.dashboard.photoCount', photos.length, { count: photos.length }),
    [photos.length, tPlural],
  );

  const coverCountLabel = useMemo(
    () =>
      coverPhoto
        ? tPlural('common.suppliers.portfolio.dashboard.coverCount', 1, { count: 1 })
        : '',
    [coverPhoto, tPlural],
  );

  const coverPhotoTitle = useMemo(
    () => coverPhoto?.title || t('common.suppliers.portfolio.dashboard.coverPhoto.untitled'),
    [coverPhoto, t],
  );

  const zeroStateTitle = t('common.suppliers.portfolio.dashboard.zeroState.title');
  const zeroStateDescription = t('common.suppliers.portfolio.dashboard.zeroState.description');
  const zeroStateCta = t('common.suppliers.portfolio.dashboard.zeroState.cta');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">{t('common.suppliers.portfolio.dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                {t('common.suppliers.portfolio.dashboard.title')}
              </h1>
            </div>
            <p className="text-muted">
              {coverCountLabel ? `${photoCountLabel} · ${coverCountLabel}` : photoCountLabel}
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t('common.suppliers.portfolio.dashboard.actions.addPhoto')}
          </button>
        </div>
      </div>

  *** End Patch
