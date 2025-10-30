import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Circle } from 'lucide-react';
import { SUPPLIER_CATEGORIES } from '../../../shared/supplierCategories';
import Button from '../ui/Button';

export default function WantedServicesModal({ open, onClose, value = [], onSave }) {
  const [services, setServices] = useState([]);

  // Usar categorías centralizadas
  const allCategories = SUPPLIER_CATEGORIES;

  useEffect(() => {
    try {
      const arr = Array.isArray(value) ? value : [];
      // Convertir nombres a IDs si es necesario
      const categoryIds = arr
        .map((it) => {
          if (typeof it === 'string') {
            // Buscar por nombre o por ID
            const found = allCategories.find((cat) => cat.id === it || cat.name === it);
            return found ? found.id : it;
          }
          return (it && (it.id || it.name)) || '';
        })
        .filter(Boolean);
      setServices(categoryIds);
    } catch {
      setServices([]);
    }
  }, [value, allCategories]);

  const toggleService = (categoryId) => {
    if (services.includes(categoryId)) {
      setServices((prev) => prev.filter((id) => id !== categoryId));
    } else {
      setServices((prev) => [...prev, categoryId]);
    }
  };

  const save = async () => {
    // Guardar IDs de categorías
    onSave && onSave(services);
    onClose();
  };

  if (!open) return null;

  // Agrupar categorías
  const mainCategories = allCategories.slice(0, 10);
  const otherCategories = allCategories.slice(10);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Servicios que necesitas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona los servicios para tu boda ({services.length} seleccionados)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Servicios principales */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📌 Servicios principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mainCategories.map((category) => {
                const isActive = services.includes(category.id);

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleService(category.id)}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left
                      ${
                        isActive
                          ? 'border-purple-600 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    {isActive ? (
                      <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isActive ? 'text-purple-900' : 'text-gray-900'
                        }`}
                      >
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Otros servicios */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✨ Otros servicios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherCategories.map((category) => {
                const isActive = services.includes(category.id);

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleService(category.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all text-sm text-left
                      ${
                        isActive
                          ? 'border-purple-400 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    {isActive ? (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <p
                      className={`font-medium flex-1 truncate ${
                        isActive ? 'text-purple-900' : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Estos servicios se usarán para filtrar proveedores y
              personalizar tu experiencia de búsqueda.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={save} className="flex-1">
            Guardar servicios ({services.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
