import React from 'react';
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

export default function SupplierCompare() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompareList } = useSupplierCompare();

  if (compareList.length === 0) {
    return (
      <PageWrapper title="Comparar Proveedores">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No hay proveedores para comparar
          </h2>
          <p className="text-gray-600 mb-6">
            Selecciona proveedores desde la búsqueda usando el checkbox de comparar
          </p>
          <Button onClick={() => navigate('/proveedores')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a búsqueda
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const features = [
    { key: 'basic', label: 'Información básica', icon: CheckCircle },
    { key: 'rating', label: 'Valoración', icon: Star },
    { key: 'location', label: 'Ubicación', icon: MapPin },
    { key: 'price', label: 'Precio', icon: DollarSign },
    { key: 'portfolio', label: 'Portfolio', icon: Camera },
    { key: 'reviews', label: 'Reseñas', icon: MessageCircle },
  ];

  return (
    <PageWrapper title="Comparar Proveedores">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/proveedores')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
            >
              <ArrowLeft size={16} />
              Volver a búsqueda
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Comparar Proveedores</h1>
            <p className="text-gray-600 mt-1">
              Comparando {compareList.length}{' '}
              {compareList.length === 1 ? 'proveedor' : 'proveedores'}
            </p>
          </div>
          <Button variant="outline" onClick={clearCompareList}>
            Limpiar todos
          </Button>
        </div>

        {/* Tabla de comparación */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Característica
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
                          {supplier.category || supplier.service}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCompare(supplier.id || supplier.slug)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Quitar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Imagen/Logo */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  Imagen
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

              {/* Rating */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Valoración
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
                              {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin valoraciones</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Ubicación */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Ubicación
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
                      <span className="text-gray-400">No especificada</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Precio */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    Rango de precio
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
                        <span className="text-gray-400">No especificado</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Portfolio */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-purple-500" />
                    Portfolio
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
                        Ver portfolio →
                      </a>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Descripción */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Descripción
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3 text-sm">
                    <p className="text-gray-700 line-clamp-3">
                      {supplier.business?.description || supplier.description || (
                        <span className="text-gray-400">No disponible</span>
                      )}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Contacto */}
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                  Contacto
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
                        <span className="text-gray-400">No disponible</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Tipo */}
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Tipo
                </td>
                {compareList.map((supplier) => (
                  <td key={supplier.id || supplier.slug} className="px-4 py-3">
                    {supplier.priority === 'registered' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} />
                        Registrado
                      </span>
                    )}
                    {supplier.priority === 'cached' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        En caché
                      </span>
                    )}
                    {supplier.priority === 'internet' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        Internet
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="outline" onClick={() => navigate('/proveedores')}>
            Volver a búsqueda
          </Button>
          <Button variant="outline" onClick={clearCompareList}>
            Limpiar comparación
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
