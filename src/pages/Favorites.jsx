import React, { useState } from 'react';
import { Heart, Filter, Star, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useSupplierFavorites } from '../contexts/SupplierFavoritesContext';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import FavoriteButton from '../components/suppliers/FavoriteButton';

export default function Favorites() {
  const { favorites, loading, categoriesWithFavorites } = useSupplierFavorites();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFavorites =
    selectedCategory === 'all'
      ? favorites
      : favorites.filter((fav) => fav.category === selectedCategory);

  if (loading) {
    return (
      <PageWrapper title="Mis Favoritos">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Mis Favoritos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Favoritos</h1>
            <p className="text-gray-600 mt-1">
              {favorites.length}{' '}
              {favorites.length === 1 ? 'proveedor guardado' : 'proveedores guardados'}
            </p>
          </div>
          <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
        </div>

        {/* Filtros */}
        {favorites.length > 0 && (
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                transition-colors duration-200
                ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Todos ({favorites.length})
            </button>
            {categoriesWithFavorites.map((category) => {
              const categoryObj = SUPPLIER_CATEGORIES.find((cat) => cat.id === category);
              const count = favorites.filter((fav) => fav.category === category).length;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    transition-colors duration-200
                    ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {categoryObj?.name || category} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de favoritos */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCategory === 'all'
                ? 'Aún no tienes favoritos'
                : 'No hay favoritos en esta categoría'}
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedCategory === 'all'
                ? 'Explora proveedores y guarda tus favoritos con el botón ❤️'
                : 'Selecciona otra categoría o busca más proveedores'}
            </p>
            <Button onClick={() => (window.location.href = '/proveedores')}>
              Buscar proveedores
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFavorites.map((favorite) => (
              <FavoriteCard key={favorite.supplierId} favorite={favorite} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function FavoriteCard({ favorite }) {
  const supplier = favorite.supplier;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Imagen */}
      {supplier.images && supplier.images.length > 0 ? (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={supplier.images[0]}
            alt={supplier.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <FavoriteButton supplier={{ ...supplier, id: favorite.supplierId }} size="sm" />
          </div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Heart className="h-16 w-16 text-purple-300" />
          <div className="absolute top-2 right-2">
            <FavoriteButton supplier={{ ...supplier, id: favorite.supplierId }} size="sm" />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Nombre y rating */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-1">{supplier.name}</h3>
          {supplier.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                <span className="text-sm font-medium text-gray-700 ml-1">{supplier.rating}</span>
              </div>
              {supplier.reviewCount > 0 && (
                <span className="text-sm text-gray-500">({supplier.reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Categoría */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            {SUPPLIER_CATEGORIES.find((cat) => cat.id === supplier.category)?.name ||
              supplier.category}
          </span>
        </div>

        {/* Ubicación */}
        {supplier.location && (supplier.location.city || supplier.location.province) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>
              {supplier.location.city}
              {supplier.location.province && `, ${supplier.location.province}`}
            </span>
          </div>
        )}

        {/* Precio */}
        {supplier.priceRange && (
          <div className="text-sm font-medium text-purple-600">{supplier.priceRange}</div>
        )}

        {/* Descripción */}
        {supplier.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{supplier.description}</p>
        )}

        {/* Contacto rápido */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {supplier.contact?.phone && (
            <a
              href={`tel:${supplier.contact.phone}`}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Llamar"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {supplier.contact?.email && (
            <a
              href={`mailto:${supplier.contact.email}`}
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
          {supplier.contact?.website && (
            <a
              href={supplier.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Website"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* Notas */}
        {favorite.notes && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600 italic">"{favorite.notes}"</p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-2 space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            Ver detalles
          </Button>
          <Button size="sm" className="w-full">
            Contactar
          </Button>
        </div>
      </div>
    </div>
  );
}
