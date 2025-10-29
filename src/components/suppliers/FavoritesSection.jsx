import React, { useState, useMemo } from 'react';
import { Heart, Filter, Download, Trash2, Search } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import SupplierCard from './SupplierCard';
import SupplierDetailModal from './SupplierDetailModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../Input';
import { toast } from 'react-toastify';

/**
 * FavoritesSection - Vista dedicada para proveedores favoritos
 * 
 * Features:
 * - Lista de todos los favoritos
 * - Filtro por categoría
 * - Búsqueda por nombre
 * - Ver detalles
 * - Eliminar favoritos
 * - Exportar lista
 */
const FavoritesSection = () => {
  const { favorites, loading, removeFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Categorías únicas de favoritos
  const categories = useMemo(() => {
    if (!favorites || favorites.length === 0) return [];
    
    const unique = new Set();
    favorites.forEach(fav => {
      if (fav.supplier?.category) {
        unique.add(fav.supplier.category);
      }
    });
    return Array.from(unique).sort();
  }, [favorites]);

  // Filtrar favoritos
  const filteredFavorites = useMemo(() => {
    if (!favorites) return [];

    return favorites.filter(fav => {
      // Filtro por categoría
      if (selectedCategory !== 'all' && fav.supplier?.category !== selectedCategory) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = fav.supplier?.name?.toLowerCase() || '';
        const category = fav.supplier?.category?.toLowerCase() || '';
        const location = fav.supplier?.location?.city?.toLowerCase() || '';
        
        return name.includes(query) || category.includes(query) || location.includes(query);
      }

      return true;
    });
  }, [favorites, selectedCategory, searchQuery]);

  // Manejar eliminación
  const handleRemove = async (favoriteId) => {
    if (!confirm('¿Eliminar este proveedor de favoritos?')) return;

    try {
      await removeFavorite(favoriteId);
      toast.success('Proveedor eliminado de favoritos');
    } catch (error) {
      toast.error('Error al eliminar favorito');
      console.error(error);
    }
  };

  // Ver detalles
  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  // Exportar lista (placeholder)
  const handleExport = () => {
    toast.info('Exportar a PDF próximamente');
    // TODO: Implementar exportación PDF
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card className="text-center py-16">
        <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No tienes favoritos todavía
        </h3>
        <p className="text-muted mb-6">
          Guarda proveedores que te gusten para tenerlos organizados aquí
        </p>
        <p className="text-sm text-muted">
          💡 Usa el botón <Heart className="inline h-4 w-4" /> en cualquier proveedor para añadirlo
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con stats y acciones */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h2 className="text-2xl font-bold text-foreground">Mis Favoritos</h2>
            </div>
            <p className="text-muted">
              {filteredFavorites.length} de {favorites.length} proveedor{favorites.length !== 1 ? 'es' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Exportar lista
            </Button>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                type="search"
                placeholder="Buscar por nombre, categoría o ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por categoría */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-surface text-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contador de resultados filtrados */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted">
                Mostrando {filteredFavorites.length} resultado{filteredFavorites.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de favoritos */}
      {filteredFavorites.length === 0 ? (
        <Card className="text-center py-12">
          <Search className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">No se encontraron favoritos con estos filtros</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map(favorite => (
            <div key={favorite.id} className="relative">
              <SupplierCard
                supplier={favorite.supplier}
                onViewDetails={() => handleViewDetails(favorite.supplier)}
              />
              
              {/* Botón eliminar superpuesto */}
              <button
                onClick={() => handleRemove(favorite.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                title="Eliminar de favoritos"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Info adicional de favorito */}
              {favorite.notes && (
                <div className="mt-2 p-3 bg-surface rounded-lg border border-border">
                  <p className="text-sm text-muted">
                    <strong>Notas:</strong> {favorite.notes}
                  </p>
                </div>
              )}

              {favorite.addedAt && (
                <div className="mt-1">
                  <p className="text-xs text-muted text-right">
                    Añadido: {new Date(favorite.addedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSupplier(null);
          }}
          onFavoriteToggle={() => {
            // Ya está en favoritos, permitir eliminar desde aquí
            const fav = favorites.find(f => f.supplier.id === selectedSupplier.id);
            if (fav) {
              handleRemove(fav.id);
            }
          }}
          isFavorite={true}
          onRequestQuote={() => {
            toast.info('Formulario de presupuesto próximamente');
            setShowDetailModal(false);
          }}
        />
      )}
    </div>
  );
};

export default FavoritesSection;
