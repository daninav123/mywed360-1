import React, { useState } from 'react';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import SupplierCategorySpecs from './SupplierCategorySpecs';
import { Card } from '../ui';
import { useWeddingCategories } from '../../hooks/useWeddingCategories';

/**
 * Mapea iconos de categorías a emojis
 */
const getCategoryIcon = (icon) => {
  const iconMap = {
    'camera': '📷',
    'video': '🎥',
    'music': '🎵',
    'disc': '💿',
    'utensils': '🍽️',
    'home': '🏛️',
    'flower': '🌸',
    'palette': '🎨',
    'shirt': '👔',
    'sparkles': '✨',
    'gem': '💎',
    'cake': '🎂',
    'mail': '📧',
    'gift': '🎁',
    'car': '🚗',
    'party-popper': '🎉',
    'lightbulb': '💡',
    'warehouse': '🏢',
    'candy': '🍬',
    'truck': '🚚',
    'shield': '🛡️',
    'parking': '🅿️',
    'baby': '👶',
    'spa': '💆',
    'coffee': '☕',
    'monitor': '💻',
    'trash': '🗑️',
    'plane': '✈️',
    'church': '⛪',
    'heart': '💕',
    'hotel': '🏨',
    'wine': '🍷',
    'clipboard-list': '📋',
    'more-horizontal': '➕',
  };
  return iconMap[icon] || '📋';
};

/**
 * Sección para gestionar especificaciones de todos los proveedores
 */
const SupplierRequirementsSection = ({ 
  requirements, 
  onChange,
  onChatOpen 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('fotografia');
  const { activeCategories, toggleCategory, isCategoryActive } = useWeddingCategories();

  // Mostrar TODAS las categorías disponibles
  const availableCategories = SUPPLIER_CATEGORIES;

  const selectedCat = SUPPLIER_CATEGORIES.find(c => c.id === selectedCategory);

  const handleSpecsChange = (newSpecs) => {
    onChange({
      ...requirements,
      [selectedCategory]: newSpecs
    });
  };

  // Verificar cuántas categorías activas tienen datos
  const categoriesWithData = activeCategories.filter(catId => {
    const req = requirements[catId];
    return req && (
      req.budget > 0 || 
      req.notes || 
      (req.specs && Object.values(req.specs).some(v => v === true || (Array.isArray(v) && v.length > 0)))
    );
  }).length;

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              👥 Especificaciones de Proveedores
            </h2>
            <p className="text-sm text-gray-600">
              Define qué necesitas de cada tipo de proveedor. La IA te ayudará a completar los detalles.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {categoriesWithData}/{activeCategories.length}
            </div>
            <div className="text-xs text-gray-600">Con especificaciones</div>
          </div>
        </div>
      </Card>

      {/* Selector de categoría */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Selecciona servicios que necesitas:
          </h3>
          <p className="text-xs text-gray-600">
            {activeCategories.length} de {SUPPLIER_CATEGORIES.length} servicios activos
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[500px] overflow-y-auto p-2">
          {availableCategories.map(cat => {
            const hasData = requirements[cat.id] && (
              requirements[cat.id].notes ||
              Object.values(requirements[cat.id].specs || {}).some(v => v === true)
            );

            const isActive = isCategoryActive(cat.id);
            
            return (
              <div
                key={cat.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : isActive
                    ? hasData
                      ? 'border-green-300 bg-green-50'
                      : 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat.id);
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-lg">{getCategoryIcon(cat.icon)}</span>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-xs font-medium text-gray-700">
                      {cat.name}
                    </div>
                  </button>
                  {hasData && <span className="text-green-600 text-sm">✓</span>}
                </div>
                {isActive && (
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 text-left"
                  >
                    {selectedCategory === cat.id ? '📝 Editando...' : '✏️ Editar especificaciones'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Specs de la categoría seleccionada */}
      {selectedCat && requirements[selectedCategory] && (
        <SupplierCategorySpecs
          category={selectedCategory}
          categoryName={selectedCat.name}
          specs={requirements[selectedCategory]}
          onChange={handleSpecsChange}
          onChatOpen={() => onChatOpen(selectedCategory)}
        />
      )}
    </div>
  );
};

export default SupplierRequirementsSection;
