import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Trash2, Download } from 'lucide-react';
import { toast } from 'react-toastify';

import { useFavorites } from '../contexts/FavoritesContext';
import SupplierCard from '../components/suppliers/SupplierCard';
import Loader from '../components/ui/Loader';
import useTranslations from '../hooks/useTranslations';
export default function SavedSuppliers() {
  const { favorites, loading, removeFavorite, count } = useFavorites();
  const [deletingId, setDeletingId] = useState(null);
  const { t, tPlural, format } = useTranslations();

  const handleRemove = async (supplierId) => {
    if (!window.confirm(t('suppliers.favorites.confirmRemove'))) {
      return;
    }

    setDeletingId(supplierId);
    try {
      await removeFavorite(supplierId);
      toast.success(t('suppliers.favorites.toasts.removed'));
    } catch (error) {
      toast.error(error.message || t('suppliers.favorites.toasts.removeError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportToPDF = () => {
    toast.info(t('suppliers.favorites.toasts.exportSoon'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10" />
        <span className="ml-3 text-lg">{t('suppliers.favorites.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold  flex items-center gap-2" className="text-body">
              <Heart className="" className="text-danger" fill="currentColor" />
              {t('suppliers.saved.title')}
            </h1>
            <p className=" mt-2" className="text-secondary">
              {count === 0
                ? t('suppliers.saved.count.zero')
                : tPlural('common.suppliers.saved.count', count, { count })}
            </p>
          </div>

          {count > 0 && (
            <button
              type="button"
              onClick={handleExportToPDF}
              className="px-4 py-2  text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2" style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Download size={18} />
              {t('suppliers.saved.buttons.export')}
            </button>
          )}
        </div>
      </div>

      {count === 0 ? (
        <div className="text-center py-16">
          <Heart className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold  mb-2" className="text-body">
            {t('suppliers.saved.empty.title')}
          </h3>
          <p className=" mb-6" className="text-muted">{t('suppliers.saved.empty.description')}</p>
          <a
            href="/suppliers"
            className="inline-block px-6 py-3  text-white rounded-md hover:bg-green-700 transition-colors" style={{ backgroundColor: 'var(--color-success)' }}
          >
            {t('suppliers.saved.empty.cta')}
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemove(favorite.supplierId)}
                  disabled={deletingId === favorite.supplierId}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover: transition-colors shadow-lg" style={{ backgroundColor: 'var(--color-danger)' }}
                  title={t('suppliers.favorites.actions.removeTooltip')}
                >
                  {deletingId === favorite.supplierId ? (
                    <Loader className="w-4 h-4" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>

                <SupplierCard
                  supplier={favorite.supplier}
                  onContact={(data) => {
                    // console.log('Contacting supplier', data);
                  }}
                />

                {favorite.notes && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm " className="text-body">
                      <strong>{t('suppliers.favorites.notesLabel')}</strong> {favorite.notes}
                    </p>
                  </div>
                )}

                {favorite.addedAt && (
                  <div className="mt-2 text-xs " className="text-muted">
                    {t('suppliers.saved.addedAt', {
                      value: format.dateShort(new Date(favorite.addedAt)),
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">{t('suppliers.saved.tips.title')}</h3>
            <ul className="space-y-2 text-sm " className="text-body">
              {[
                t('suppliers.saved.tips.compare'),
                t('suppliers.saved.tips.contact'),
                t('suppliers.saved.tips.review'),
                t('suppliers.saved.tips.export'),
              ].map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
