import React, { useState, useMemo } from 'react';
import {
  X,
  Heart,
  Star,
  MapPin,
  CheckCircle,
  Search,
  Trash2,
  FileText,
  Image,
  ChevronDown,
  Edit3,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { useFavorites } from '../../contexts/FavoritesContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import RequestQuoteModal from './RequestQuoteModal';
import ImageGalleryModal from './ImageGalleryModal';

export default function SelectFromFavoritesModal({
  open,
  onClose,
  serviceName,
  favorites,
  onAssign,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteSupplier, setQuoteSupplier] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // recent, rating, price, distance
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editedNote, setEditedNote] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { removeFavorite, updateFavoriteNotes } = useFavorites();
  const { info: weddingProfile } = useActiveWeddingInfo();

  // Ordenar favoritos - DEBE estar ANTES del early return
  const sortedFavorites = useMemo(() => {
    const sorted = [...favorites];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => (b.supplier?.rating || 0) - (a.supplier?.rating || 0));
      case 'price':
        // Ordenar por precio mínimo del rango
        return sorted.sort((a, b) => {
          const priceA = a.supplier?.priceRange?.match(/\d+/)?.[0] || Infinity;
          const priceB = b.supplier?.priceRange?.match(/\d+/)?.[0] || Infinity;
          return Number(priceA) - Number(priceB);
        });
      case 'distance':
        // Por ahora solo por ciudad
        return sorted.sort((a, b) => {
          const cityA = a.supplier?.location?.city || '';
          const cityB = b.supplier?.location?.city || '';
          return cityA.localeCompare(cityB);
        });
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [favorites, sortBy]);

  if (!open) return null;

  const handleAssign = async (supplier) => {
    setLoading(true);
    setSelectedSupplier(supplier.id);

    try {
      await onAssign(supplier);
      toast.success(
        t('suppliers.selectFavorites.toast.assigned', {
          name: supplier.name || t('suppliers.card.hybrid.defaults.name', 'Proveedor'),
        })
      );
      onClose();
    } catch (error) {
      toast.error(
        error?.message || t('suppliers.selectFavorites.toast.error', 'Error al asignar proveedor')
      );
      // console.error(error);
    } finally {
      setLoading(false);
      setSelectedSupplier(null);
    }
  };

  const handleDelete = async (supplierId, supplierName) => {
    if (
      !confirm(
        t('suppliers.selectFavorites.delete.confirm', {
          name: supplierName,
          defaultValue: '¿Eliminar {{name}} de favoritos?',
        })
      )
    ) {
      return;
    }

    setDeletingId(supplierId);
    try {
      await removeFavorite(supplierId);
      toast.success(
        t('suppliers.selectFavorites.delete.success', { defaultValue: 'Eliminado de favoritos' })
      );
    } catch (error) {
      toast.error(
        t('suppliers.selectFavorites.delete.error', { defaultValue: 'Error al eliminar' })
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleRequestQuote = (supplier) => {
    setQuoteSupplier(supplier);
    setShowQuoteModal(true);
  };

  const handleViewGallery = (portfolio) => {
    setGalleryImages(portfolio || []);
    setShowGallery(true);
  };

  const handleStartEditNote = (favoriteId, currentNote) => {
    setEditingNoteId(favoriteId);
    setEditedNote(currentNote || '');
  };

  const handleSaveNote = async (supplierId) => {
    try {
      await updateFavoriteNotes(supplierId, editedNote);
      toast.success(
        t('suppliers.selectFavorites.notes.updated', { defaultValue: 'Nota actualizada' })
      );
      setEditingNoteId(null);
      setEditedNote('');
    } catch (error) {
      toast.error(
        t('suppliers.selectFavorites.notes.error', { defaultValue: 'Error al actualizar nota' })
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{serviceName}</h2>
              <p className="text-sm text-gray-600">
                {t('suppliers.selectFavorites.subtitle', 'Elige uno de tus favoritos')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Ordenar */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                <option value="recent">📅 Recientes</option>
                <option value="rating">⭐ Mejor valorados</option>
                <option value="price">💰 Menor precio</option>
                <option value="distance">📍 Ubicación</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {favorites.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(
                  'common.suppliers.selectFavorites.empty.title',
                  'No tienes favoritos en esta categoría'
                )}
              </h3>
              <p className="text-gray-600 mb-6">
                {t(
                  'common.suppliers.selectFavorites.empty.description',
                  'Busca proveedores y guárdalos en favoritos con el botón ❤️'
                )}
              </p>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/proveedores');
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                {t('suppliers.selectFavorites.empty.cta', 'Buscar proveedores')}
              </Button>
            </div>
          ) : (
            // List of favorites
            <div className="space-y-4">
              {sortedFavorites.map((favorite) => {
                const supplier = favorite.supplier;
                const isLoading = loading && selectedSupplier === supplier.id;

                const portfolioImage =
                  supplier.portfolio?.[0]?.url ||
                  supplier.profileImage ||
                  supplier.coverImage ||
                  null;
                const isDeleting = deletingId === supplier.id;

                return (
                  <div
                    key={supplier.id || favorite.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {/* Imagen del portfolio */}
                      {portfolioImage ? (
                        <div
                          className="w-32 h-32 flex-shrink-0 cursor-pointer relative group"
                          onClick={() =>
                            supplier.portfolio?.length > 0 && handleViewGallery(supplier.portfolio)
                          }
                        >
                          <img
                            src={portfolioImage}
                            alt={supplier.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {supplier.portfolio?.length > 1 && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                Ver {supplier.portfolio.length} fotos
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <Image className="h-12 w-12 text-purple-300" />
                        </div>
                      )}

                      {/* Supplier info */}
                      <div className="flex-1 min-w-0 p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{supplier.name}</h3>

                        {/* Rating */}
                        {supplier.rating > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                              <span className="text-sm font-medium text-gray-700 ml-1">
                                {supplier.rating.toFixed(1)}
                              </span>
                            </div>
                            {supplier.reviewCount > 0 && (
                              <span className="text-sm text-gray-500">
                                ({supplier.reviewCount})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Location */}
                        {supplier.location &&
                          (supplier.location.city || supplier.location.province) && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>
                                {supplier.location.city}
                                {supplier.location.province && `, ${supplier.location.province}`}
                              </span>
                            </div>
                          )}

                        {/* Price range */}
                        {supplier.priceRange && (
                          <div className="text-sm font-medium text-purple-600 mb-2">
                            {supplier.priceRange}
                          </div>
                        )}

                        {/* Portfolio count */}
                        {supplier.portfolio && supplier.portfolio.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-purple-600 mb-2">
                            <Image className="h-4 w-4" />
                            <span>
                              {supplier.portfolio.length}{' '}
                              {t('suppliers.selectFavorites.portfolioPhotos', {
                                count: supplier.portfolio.length,
                                defaultValue: 'foto(s)',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Notes - Editable */}
                        {editingNoteId === (favorite.id || supplier.id) ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={editedNote}
                              onChange={(e) => setEditedNote(e.target.value)}
                              className="flex-1 text-sm border border-purple-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Escribe una nota..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(supplier.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {favorite.notes ? (
                              <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded group">
                                <p className="flex-1 text-sm text-gray-600 italic">
                                  💭 {favorite.notes}
                                </p>
                                <button
                                  onClick={() =>
                                    handleStartEditNote(favorite.id || supplier.id, favorite.notes)
                                  }
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-700"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEditNote(favorite.id || supplier.id, '')}
                                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              >
                                <Edit3 className="h-3 w-3" />
                                Agregar nota
                              </button>
                            )}
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            onClick={() => handleAssign(supplier)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            className="flex-1 min-w-[120px]"
                          >
                            {isLoading && selectedSupplier === supplier.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                {t('suppliers.selectFavorites.assign.loading', 'Asignando...')}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('suppliers.selectFavorites.assign.action', 'Asignar')}
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => handleRequestQuote(supplier)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[120px]"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {t('suppliers.selectFavorites.requestQuote', {
                              defaultValue: 'Presupuesto',
                            })}
                          </Button>

                          <Button
                            onClick={() => handleDelete(supplier.id, supplier.name)}
                            disabled={isLoading || isDeleting}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {isDeleting ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {favorites.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate('/proveedores');
              }}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              {t('suppliers.selectFavorites.footer.more', 'Buscar más proveedores')}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Solicitar Presupuesto */}
      {quoteSupplier && (
        <RequestQuoteModal
          supplier={quoteSupplier}
          weddingInfo={weddingProfile}
          open={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            setQuoteSupplier(null);
          }}
          onSuccess={() => {
            toast.success(
              t('suppliers.requestQuoteModal.toasts.success', {
                defaultValue: 'Presupuesto solicitado correctamente',
              })
            );
            setShowQuoteModal(false);
            setQuoteSupplier(null);
          }}
        />
      )}

      {/* Galería de imágenes */}
      {showGallery && (
        <ImageGalleryModal
          images={galleryImages}
          initialIndex={0}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}
