import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useSupplierFavorites } from '../../contexts/SupplierFavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import useTranslations from '../../hooks/useTranslations';

export default function FavoriteButton({ supplier, size = 'md', showLabel = false }) {
  const { currentUser } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useSupplierFavorites();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslations();

  const favorite = isFavorite(supplier.id || supplier.slug);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert(t('suppliers.favorites.errors.loginRequired'));
      return;
    }

    setLoading(true);
    try {
      if (favorite) {
        await removeFromFavorites(supplier.id || supplier.slug);
      } else {
        await addToFavorites(supplier);
      }
    } catch (error) {
      // console.error('Error toggling favorite:', error);
      const fallbackMessage = favorite
        ? t('suppliers.favorites.errors.removeFailed')
        : t('suppliers.favorites.errors.saveFailed');
      alert(error?.message || fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        ${
          favorite
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-red-500'
        }
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        border border-gray-200
        shadow-sm hover:shadow
        disabled:opacity-50 disabled:cursor-not-allowed
        ${showLabel ? 'px-4 gap-2 w-auto' : ''}
      `}
      title={
        favorite
          ? t('suppliers.card.hybrid.favorite.remove', 'Quitar de favoritos')
          : t('suppliers.card.hybrid.favorite.add', 'Añadir a favoritos')
      }
    >
      <Heart
        size={iconSizes[size]}
        fill={favorite ? 'currentColor' : 'none'}
        className={`transition-transform ${loading ? 'animate-pulse' : favorite ? 'scale-110' : ''}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite
            ? t('suppliers.favorites.button.saved', 'Guardado')
            : t('suppliers.favorites.button.save', 'Guardar')}
        </span>
      )}
    </button>
  );
}
