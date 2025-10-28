import React, { useState } from 'react';
import { Heart, Trash2, ExternalLink, Mail, MessageCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';

import { useFavorites } from '../contexts/FavoritesContext';
import SupplierCard from '../components/suppliers/SupplierCard';
import Loader from '../components/ui/Loader';

export default function SavedSuppliers() {
  const { favorites, loading, removeFavorite, count } = useFavorites();
  const [deletingId, setDeletingId] = useState(null);

  const handleRemove = async (supplierId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor de tus favoritos?')) {
      return;
    }

    setDeletingId(supplierId);
    try {
      await removeFavorite(supplierId);
      toast.success('Proveedor eliminado de favoritos');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportToPDF = () => {
    toast.info('Función de exportar a PDF próximamente disponible');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-10 h-10" />
        <span className="ml-3 text-lg">Cargando favoritos...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="text-red-500" fill="currentColor" />
              Mis Proveedores Favoritos
            </h1>
            <p className="text-gray-600 mt-2">
              {count === 0
                ? 'Aún no has guardado ningún proveedor'
                : `${count} ${count === 1 ? 'proveedor guardado' : 'proveedores guardados'}`}
            </p>
          </div>

          {count > 0 && (
            <button
              onClick={handleExportToPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Exportar a PDF
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {count === 0 ? (
        <div className="text-center py-16">
          <Heart className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No tienes proveedores guardados
          </h3>
          <p className="text-gray-500 mb-6">
            Busca proveedores y haz clic en el corazón ❤️ para guardarlos aquí
          </p>
          <a
            href="/suppliers"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Buscar proveedores
          </a>
        </div>
      ) : (
        <>
          {/* Lista de favoritos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="relative">
                {/* Botón eliminar (absoluto, esquina superior derecha) */}
                <button
                  onClick={() => handleRemove(favorite.supplierId)}
                  disabled={deletingId === favorite.supplierId}
                  className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Eliminar de favoritos"
                >
                  {deletingId === favorite.supplierId ? (
                    <Loader className="w-4 h-4" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>

                {/* Card del proveedor */}
                <SupplierCard
                  supplier={favorite.supplier}
                  onContact={(data) => {
                    console.log('Contactando:', data);
                  }}
                />

                {/* Notas (si existen) */}
                {favorite.notes && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Notas:</strong> {favorite.notes}
                    </p>
                  </div>
                )}

                {/* Fecha añadido */}
                <div className="mt-2 text-xs text-gray-500">
                  Guardado el {new Date(favorite.addedAt).toLocaleDateString('es-ES')}
                </div>
              </div>
            ))}
          </div>

          {/* Acciones globales */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">💡 Consejos</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Compara proveedores guardados para tomar la mejor decisión</li>
              <li>• Contacta varios para obtener diferentes presupuestos</li>
              <li>• Revisa sus portfolios y reseñas antes de contratar</li>
              <li>• Exporta tu lista a PDF para compartirla con tu pareja</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
