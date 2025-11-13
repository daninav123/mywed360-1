/**
 * Hook que combina favoritos con auto-añadir categorías
 * Cuando guardas un favorito, automáticamente añade la categoría del proveedor
 * a los servicios activos de la boda si no está ya incluida
 */

import { useFavorites } from '../contexts/FavoritesContext';
import { useWeddingCategories } from './useWeddingCategories';
import { toast } from 'react-toastify';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';

export function useFavoritesWithAutoCategory() {
  const favorites = useFavorites();
  const { addCategory, isCategoryActive } = useWeddingCategories();

  // Wrapper de addFavorite que auto-añade categoría
  const addFavoriteWithCategory = async (supplier, notes = '') => {
    // Primero añadir el favorito
    const result = await favorites.addFavorite(supplier, notes);

    // Luego verificar si necesitamos añadir la categoría
    if (supplier.category && !isCategoryActive(supplier.category)) {
      try {
        await addCategory(supplier.category);
        
        const categoryName = SUPPLIER_CATEGORIES.find(c => c.id === supplier.category)?.name;
        toast.info(
          `✨ Servicio "${categoryName}" añadido a tu boda`,
          { autoClose: 3000 }
        );
      } catch (error) {
        // console.error('Error auto-añadiendo categoría:', error);
        // No lanzar error, el favorito ya se guardó correctamente
      }
    }

    return result;
  };

  return {
    ...favorites,
    addFavorite: addFavoriteWithCategory,
  };
}
