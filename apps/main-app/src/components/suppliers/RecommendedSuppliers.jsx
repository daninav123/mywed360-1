import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import SupplierCard from './SupplierCard';
import { searchSuppliersHybrid } from '../../services/suppliersService';

export default function RecommendedSuppliers({ onClose }) {
  const { favorites } = useFavorites();
  const { info: weddingProfile } = useActiveWeddingInfo();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Algoritmo de recomendación
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const results = [];
        const location = weddingProfile?.location || weddingProfile?.city || 'españa';

        // 1. Basado en categorías de favoritos
        if (favorites && favorites.length > 0) {
          const categories = [...new Set(favorites.map((f) => f.category || f.service))].filter(
            Boolean
          );
          for (const category of categories.slice(0, 2)) {
            if (!category) continue; // Skip empty categories
            try {
              const response = await searchSuppliersHybrid(
                category, // service
                location, // location
                '', // query
                null, // budget
                { mode: 'database' } // filters
              );
              if (response.suppliers && response.suppliers.length > 0) {
                results.push(...response.suppliers.slice(0, 2));
              }
            } catch (err) {
              // console.log('Error fetching by category:', err);
            }
          }
        }

        // 2. Basado en ubicación y estilo
        if (weddingProfile?.weddingStyle) {
          try {
            const styleQuery = `${weddingProfile.weddingStyle} wedding`;
            const response = await searchSuppliersHybrid(
              'bodas', // service genérico
              location, // location
              styleQuery, // query con el estilo
              null, // budget
              { mode: 'database' } // filters
            );
            if (response.suppliers && response.suppliers.length > 0) {
              results.push(...response.suppliers.slice(0, 2));
            }
          } catch (err) {
            // console.log('Error fetching by style:', err);
          }
        }

        // 3. Proveedores populares generales (solo si tenemos pocos resultados)
        if (results.length < 4) {
          try {
            const response = await searchSuppliersHybrid(
              'bodas', // service genérico
              location, // location
              '', // query
              null, // budget
              { mode: 'database' } // filters
            );
            if (response.suppliers && response.suppliers.length > 0) {
              results.push(...response.suppliers.slice(0, 3));
            }
          } catch (err) {
            // console.log('Error fetching popular:', err);
          }
        }

        // Eliminar duplicados y favoritos existentes
        const favoriteIds = new Set(favorites.map((f) => f.id || f.slug));
        const uniqueResults = results
          .filter(
            (r, index, self) =>
              index === self.findIndex((t) => (t.id || t.slug) === (r.id || r.slug))
          )
          .filter((r) => !favoriteIds.has(r.id || r.slug))
          .slice(0, 6);

        setRecommendations(uniqueResults);
      } catch (error) {
        // console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [favorites, weddingProfile]);

  if (loading) {
    return (
      <div className="p-6 border border-purple-200 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900">Recomendaciones para ti</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-purple-600 hover:text-purple-700">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-sm text-purple-700">Buscando proveedores recomendados...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="p-6 border border-purple-200 bg-[var(--color-primary)] rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900">✨ Recomendaciones para ti</h3>
            <p className="text-xs text-purple-700">
              Basado en tu perfil de boda y proveedores guardados
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-purple-600 hover:text-purple-700 transition-colors"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((supplier) => (
          <SupplierCard
            key={supplier.id || supplier.slug}
            supplier={supplier}
            onContact={(info) => {
              // console.log('Contact:', info)
            }}
            onViewDetails={(s) => {
              // console.log('View details:', s)
            }}
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-purple-700">
          💡 Estas recomendaciones se personalizan según tus búsquedas y favoritos
        </p>
      </div>
    </div>
  );
}
