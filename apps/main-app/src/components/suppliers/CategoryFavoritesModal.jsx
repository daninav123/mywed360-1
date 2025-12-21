import React from 'react';
import Modal from '../Modal';
import SupplierCard from './SupplierCard';
import { X } from 'lucide-react';

/**
 * Modal para ver favoritos de una categoría específica
 */
const CategoryFavoritesModal = ({ 
  isOpen, 
  onClose, 
  categoryName, 
  favorites = [],
  onContact,
  onViewDetails
}) => {
  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} size="xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Favoritos de {categoryName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {favorites.length} {favorites.length === 1 ? 'proveedor guardado' : 'proveedores guardados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Lista de favoritos */}
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No tienes favoritos guardados en esta categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
            {favorites.map((favorite) => (
              <SupplierCard
                key={favorite._id || favorite.id}
                supplier={favorite.supplier}
                onContact={onContact}
                onViewDetails={() => onViewDetails?.(favorite.supplier)}
                showFavoriteButton={false}
              />
            ))}
          </div>
        )}

        {/* Footer con acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryFavoritesModal;
