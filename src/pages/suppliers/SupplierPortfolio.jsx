import React, { useState, useEffect, useCallback } from 'react';
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

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'bodas', label: 'Bodas' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'flores', label: 'Flores' },
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'recepcion', label: 'Recepción' },
  { value: 'otros', label: 'Otros' },
];

export default function SupplierPortfolio() {
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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
        throw new Error('Error loading portfolio');
      }

      const data = await response.json();
      const allPhotos = data.photos || [];

      const cover = allPhotos.find((p) => p.isCover);
      const regularPhotos = allPhotos.filter((p) => !p.isCover);

      setCoverPhoto(cover || null);
      setPhotos(regularPhotos);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Error al cargar el portfolio');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, navigate]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoUploaded = () => {
    setShowUploadModal(false);
    loadPhotos();
    toast.success('Foto subida correctamente');
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setShowLightbox(true);
  };

  const handlePhotoDeleted = async (photoId) => {
    if (!window.confirm('¿Eliminar esta foto?')) return;

    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/portfolio/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error deleting photo');

      toast.success('Foto eliminada');
      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const handlePhotoUpdated = () => {
    setShowLightbox(false);
    loadPhotos();
    toast.success('Foto actualizada');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Cargando portfolio...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Mi Portfolio</h1>
            </div>
            <p className="text-muted">
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
              {coverPhoto && ' · 1 portada'}
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Añadir Foto
          </button>
        </div>
      </div>

      {/* Foto de Portada */}
      {coverPhoto && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary fill-current" />
              <h2 className="font-semibold text-foreground">Foto de Portada</h2>
            </div>
          </div>

          <div
            className="relative group cursor-pointer"
            onClick={() => handlePhotoClick(coverPhoto)}
          >
            <img
              src={coverPhoto.thumbnails?.large || coverPhoto.original}
              alt={coverPhoto.title || 'Portada'}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-white text-center">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Click para ver</p>
              </div>
            </div>
            {coverPhoto.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-semibold">{coverPhoto.title}</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtros y Vista */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-surface text-body focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-muted hover:text-foreground'
            }`}
            title="Vista en cuadrícula"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-muted hover:text-foreground'
            }`}
            title="Vista en lista"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid de Fotos */}
      {photos.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-lg">
          <ImageIcon className="h-16 w-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay fotos todavía</h3>
          <p className="text-muted mb-6">Sube tu primera foto para mostrar tu trabajo</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Subir Primera Foto
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
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative bg-surface border border-border rounded-lg overflow-hidden group ${
                viewMode === 'list' ? 'flex gap-4' : ''
              }`}
            >
              <div
                className={`relative cursor-pointer ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}
                onClick={() => handlePhotoClick(photo)}
              >
                <img
                  src={photo.thumbnails?.medium || photo.original}
                  alt={photo.title || 'Foto'}
                  className={`w-full object-cover ${viewMode === 'list' ? 'h-full' : 'h-64'}`}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                {photo.featured && (
                  <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Destacada
                  </div>
                )}
              </div>

              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-semibold text-foreground mb-1">
                  {photo.title || 'Sin título'}
                </h3>
                {photo.description && (
                  <p className="text-sm text-muted mb-2 line-clamp-2">{photo.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {photo.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {photo.likes || 0}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoClick(photo);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-surface border border-border rounded-md text-sm hover:bg-muted/50 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhotoDeleted(photo.id);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
