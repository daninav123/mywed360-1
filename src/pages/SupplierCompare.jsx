import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  X,
  Star,
  MapPin,
  DollarSign,
  Camera,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';

import { useSupplierCompare } from '../contexts/SupplierCompareContext';
import Button from '../components/ui/Button';
import PageWrapper from '../components/PageWrapper';
import useTranslations from '../hooks/useTranslations';

const SupplierCompare = () => {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompareList } = useSupplierCompare();
  const { t } = useTranslations();

  const pageTitle = t('suppliers.compare.title', 'Comparar proveedores');
  const backLabel = t('suppliers.compare.actions.back', 'Volver a búsqueda');
  const clearAllLabel = t('suppliers.compare.actions.clearAll', 'Limpiar todos');
  const clearLabel = t('suppliers.compare.actions.clear', 'Limpiar comparación');
  const removeLabel = t('suppliers.compare.actions.remove', 'Quitar');
  const notAvailableLabel = t('suppliers.compare.table.notAvailable', 'No disponible');
  const notSpecifiedLabel = t('suppliers.compare.table.notSpecified', 'No especificado');
  const noRatingsLabel = t('suppliers.compare.table.noRatings', 'Sin valoraciones');
  const noLocationLabel = t('suppliers.compare.table.noLocation', 'No especificada');

  const typeLabels = useMemo(
    () => ({
      registered: t('suppliers.compare.typeBadges.registered', 'Registrado'),
      cached: t('suppliers.compare.typeBadges.cached', 'En caché'),
      internet: t('suppliers.compare.typeBadges.internet', 'Internet'),
    }),
    [t]
  );

  const handleBack = () => navigate('/proveedores');

  if (compareList.length === 0) {
    return (
      <PageWrapper title={pageTitle}>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('suppliers.compare.empty.title', 'No hay proveedores para comparar')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t(
              'suppliers.compare.empty.description',
              'Selecciona proveedores desde la búsqueda usando el checkbox de comparar.'
            )}
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const comparingLabel = t('suppliers.compare.summary', {
    count: compareList.length,
    defaultValue:
      compareList.length === 1
        ? `Comparando ${compareList.length} proveedor`
        : `Comparando ${compareList.length} proveedores`,
  });

  const formatReviewsCount = (count) =>
    t('suppliers.compare.table.reviewsCount', {
      count,
      defaultValue: count === 1 ? '{{count}} reseña' : '{{count}} reseñas',
    });

  return (
    <PageWrapper title={pageTitle}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft size={16} />
              {backLabel}
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">{comparingLabel}</p>
          </div>
          <Button variant="outline" onClick={clearCompareList}>
            {clearAllLabel}
          </Button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  {t('suppliers.compare.table.feature', 'Característica')}
                </th>
                {compareList.map((supplier) => (
                  <th
                    key={supplier.id || supplier.slug}
                    className="px-4 py-3 text-left min-w-[250px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{supplier.name}</p>
                        <p className="text-xs text-gray-600 font-normal">
                          {supplier.category ||
                            supplier.service ||
                            t('suppliers.compare.table.categoryFallback', 'Sin categoría')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCompare(supplier.id || supplier.slug)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title={removeLabel}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  {t('suppliers.compare.table.image', 'Imagen')}
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3">
                    {supplier.media?.logo ? (
                      <img
                        src={supplier.media.logo}
                        alt={supplier.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {t('suppliers.compare.features.rating', 'Valoración')}
                  </div>
                </td>
                {compareList.map((supplier) => {
                  const rating = supplier.metrics?.rating || supplier.rating || 0;
                  const reviewCount = supplier.metrics?.reviewCount || 0;
                  return (
                    <td key={supplier.id || supplier.slug} className="px-4 py-3">
                      {rating > 0 ? (
                        <div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-semibold">{rating.toFixed(1)}</span>
                          </div>
                          {reviewCount > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {formatReviewsCount(reviewCount)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">{noRatingsLabel}</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    {t('suppliers.compare.features.location', 'Ubicación')}
                  </div>
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3 text-sm">
                    {supplier.location?.city ? (
                      <span>
                        {supplier.location.city}
                        {supplier.location.province && `, ${supplier.location.province}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">{noLocationLabel}</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    {t('suppliers.compare.features.price', 'Precio')}
                  </div>
                </td>
                {compareList.map((supplier) => {
                  const priceRange =
                    supplier.business?.priceRange || supplier.pricing?.priceRange || '';
                  return (
                    <td key={supplier.id || supplier.slug} className="px-4 py-3 text-sm">
                      {priceRange ? (
                        <span className="font-medium">{priceRange}</span>
                      ) : (
                        <span className="text-gray-400">{notSpecifiedLabel}</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-purple-500" />
                    {t('suppliers.compare.features.portfolio', 'Portfolio')}
                  </div>
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3 text-sm">
                    {supplier.hasPortfolio && supplier.slug ? (
                      <a
                        href={`/proveedor/${supplier.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 font-medium underline"
                      >
                        {t('suppliers.compare.table.seePortfolio', 'Ver portfolio →')}
                      </a>
                    ) : (
                      <span className="text-gray-400">{notAvailableLabel}</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  {t('suppliers.compare.table.description', 'Descripción')}
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3 text-sm">
                    <p className="text-gray-700 line-clamp-3">
                      {supplier.business?.description || supplier.description || (
                        <span className="text-gray-400">{notAvailableLabel}</span>
                      )}
                    </p>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  {t('suppliers.compare.table.contact', 'Contacto')}
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3">
                    <div className="space-y-1 text-sm">
                      {supplier.contact?.email && (
                        <p className="text-gray-700">{supplier.contact.email}</p>
                      )}
                      {supplier.contact?.phone && (
                        <p className="text-gray-700">{supplier.contact.phone}</p>
                      )}
                      {!supplier.contact?.email && !supplier.contact?.phone && (
                        <span className="text-gray-400">{notAvailableLabel}</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  {t('suppliers.compare.table.type', 'Tipo')}
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3">
                    {supplier.priority === 'registered' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} />
                        {typeLabels.registered}
                      </span>
                    )}
                    {supplier.priority === 'cached' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {typeLabels.cached}
                      </span>
                    )}
                    {supplier.priority === 'internet' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {typeLabels.internet}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="outline" onClick={handleBack}>
            {backLabel}
          </Button>
          <Button variant="outline" onClick={clearCompareList}>
            {clearLabel}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SupplierCompare;
