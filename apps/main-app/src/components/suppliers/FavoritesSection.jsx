import React, { useState, useMemo } from 'react';
import { Heart, Filter, Download, Trash2, Search, Send } from 'lucide-react';
import { toast } from 'react-toastify';

import { useFavorites } from '../../contexts/FavoritesContext';
import useTranslations from '../../hooks/useTranslations';
import useActiveWeddingInfo from '../../hooks/useActiveWeddingInfo';
import SupplierCard from './SupplierCard';
import SupplierDetailModal from './SupplierDetailModal';
import RequestQuoteModal from './RequestQuoteModal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../Input';

const FavoritesSection = () => {
  const { favorites, loading, removeFavorite } = useFavorites();
  const { t, tPlural, format } = useTranslations();
  const { info: weddingProfile } = useActiveWeddingInfo();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const categories = useMemo(() => {
    if (!favorites || favorites.length === 0) return [];

    const unique = new Set();
    favorites.forEach((fav) => {
      if (fav.supplier?.category) {
        unique.add(fav.supplier.category);
      }
    });

    return Array.from(unique).sort();
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (!favorites) return [];

    return favorites.filter((fav) => {
      if (selectedCategory !== 'all' && fav.supplier?.category !== selectedCategory) {
        return false;
      }

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

  const handleRemove = async (favoriteId) => {
    if (!window.confirm(t('suppliers.favorites.confirmRemove'))) return;

    try {
      await removeFavorite(favoriteId);
      toast.success(t('suppliers.favorites.toasts.removed'));
    } catch (error) {
      toast.error(t('suppliers.favorites.toasts.removeError'));
      // console.error(error);
    }
  };

  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    toast.info(t('suppliers.favorites.toasts.exportSoon'));
    // TODO: Implement PDF export
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">{t('suppliers.favorites.loading')}</p>
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card className="text-center py-16">
        <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t('suppliers.favorites.empty.title')}
        </h3>
        <p className="text-muted mb-6">{t('suppliers.favorites.empty.description')}</p>
        <p className="text-sm text-muted">
          {t('suppliers.favorites.empty.hintPrefix')} <Heart className="inline h-4 w-4" />{' '}
          {t('suppliers.favorites.empty.hintSuffix')}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[var(--color-primary)]accent/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-6 w-6 text-primary fill-current" />
              <h2 className="text-2xl font-bold text-foreground">
                {t('suppliers.favorites.title')}
              </h2>
            </div>
            <p className="text-muted">
              {tPlural('common.suppliers.favorites.stats', favorites.length, {
                filtered: filteredFavorites.length,
                total: favorites.length,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {t('suppliers.favorites.actions.export')}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                type="search"
                placeholder={t('suppliers.favorites.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-surface text-body focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t('suppliers.favorites.filters.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted">
                {tPlural('common.suppliers.favorites.filters.results', filteredFavorites.length, {
                  count: filteredFavorites.length,
                })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-primary hover:underline"
              >
                {t('suppliers.favorites.filters.clear')}
              </button>
            </div>
          )}
        </div>
      </Card>

      {filteredFavorites.length === 0 ? (
        <Card className="text-center py-12">
          <Search className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-muted">{t('suppliers.favorites.filters.empty')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((favorite) => (
            <div key={favorite.id} className="relative">
              <SupplierCard
                supplier={favorite.supplier}
                onViewDetails={() => handleViewDetails(favorite.supplier)}
              />

              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                <button
                  type="button"
                  onClick={() => handleRemove(favorite.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title={t('suppliers.favorites.actions.removeTooltip')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplier(favorite.supplier);
                    setShowQuoteModal(true);
                  }}
                  className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-lg"
                  title={t('suppliers.detail.actions.requestQuote')}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {favorite.notes && (
                <div className="mt-2 p-3 bg-surface rounded-lg border border-border">
                  <p className="text-sm text-muted">
                    <strong>{t('suppliers.favorites.notesLabel')}</strong> {favorite.notes}
                  </p>
                </div>
              )}

              {favorite.addedAt && (
                <div className="mt-1">
                  <p className="text-xs text-muted text-right">
                    {t('suppliers.favorites.addedAt', {
                      value: format.dateShort(new Date(favorite.addedAt)),
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSupplier(null);
          }}
          onFavoriteToggle={() => {
            const fav = favorites.find((f) => f.supplier.id === selectedSupplier.id);
            if (fav) {
              handleRemove(fav.id);
            }
          }}
          isFavorite
          onRequestQuote={() => {
            setShowDetailModal(false);
            setShowQuoteModal(true);
          }}
        />
      )}

      {/* Modal Solicitar Presupuesto */}
      {selectedSupplier && (
        <RequestQuoteModal
          supplier={selectedSupplier}
          weddingInfo={weddingProfile}
          open={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => {
            toast.success(t('suppliers.requestQuoteModal.toasts.success'));
          }}
        />
      )}
    </div>
  );
};

export default FavoritesSection;
