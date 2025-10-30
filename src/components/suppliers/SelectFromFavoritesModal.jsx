import React, { useState } from 'react';
import { X, Heart, Star, MapPin, CheckCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

export default function SelectFromFavoritesModal({
  open,
  onClose,
  serviceName,
  favorites,
  onAssign,
}) {
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const navigate = useNavigate();

  if (!open) return null;

  const handleAssign = async (supplier) => {
    setLoading(true);
    setSelectedSupplier(supplier.id);

    try {
      await onAssign(supplier);
      toast.success(`${supplier.name} asignado correctamente`);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al asignar proveedor');
      console.error(error);
    } finally {
      setLoading(false);
      setSelectedSupplier(null);
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
              <p className="text-sm text-gray-600">Elige uno de tus favoritos</p>
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
                No tienes favoritos en esta categoría
              </h3>
              <p className="text-gray-600 mb-6">
                Busca proveedores y guárdalos en favoritos con el botón ❤️
              </p>
              <Button
                onClick={() => {
                  onClose();
                  navigate('/proveedores');
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar proveedores
              </Button>
            </div>
          ) : (
            // List of favorites
            <div className="space-y-4">
              {favorites.map((favorite) => {
                const supplier = favorite.supplier;
                const isLoading = loading && selectedSupplier === supplier.id;

                return (
                  <div
                    key={supplier.id || favorite.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Supplier info */}
                      <div className="flex-1 min-w-0">
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

                        {/* Notes */}
                        {favorite.notes && (
                          <p className="text-sm text-gray-600 italic mt-2">"{favorite.notes}"</p>
                        )}
                      </div>

                      {/* Assign button */}
                      <Button
                        onClick={() => handleAssign(supplier)}
                        disabled={isLoading}
                        size="sm"
                        className="flex-shrink-0"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Asignando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Asignar
                          </>
                        )}
                      </Button>
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
              Buscar más proveedores
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
