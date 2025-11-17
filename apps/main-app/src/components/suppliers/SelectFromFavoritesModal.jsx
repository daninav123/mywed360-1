import React, { useState } from 'react';
import { X, Heart, Star, MapPin, CheckCircle, Search, Trash2, FileText, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { useFavorites } from '../../contexts/FavoritesContext';

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
  const navigate = useNavigate();
  const { t } = useTranslations();
  const { removeFavorite } = useFavorites();

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
    onClose();
    navigate(`/proveedores?service=${supplier.category}&quote=${supplier.id}`);
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
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
              {favorites.map((favorite) => {
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
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={portfolioImage}
                            alt={supplier.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
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

                        {/* Notes */}
                        {favorite.notes && (
                          <p className="text-sm text-gray-600 italic mt-2 bg-yellow-50 p-2 rounded">
                            💭 {favorite.notes}
                          </p>
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
    </div>
  );
}
