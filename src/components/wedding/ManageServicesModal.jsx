import React, { useState } from 'react';
import { X, CheckCircle, Circle, Settings } from 'lucide-react';
import { useWeddingCategories } from '../../hooks/useWeddingCategories';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
export default function ManageServicesModal({ open, onClose }) {
  const { allCategories, isCategoryActive, toggleCategory, loading } = useWeddingCategories();
  const [toggling, setToggling] = useState(null);
  const { t } = useTranslations();

  // Debug: Ver qué categorías tenemos y cuáles están activas
  React.useEffect(() => {
    if (open) {
      console.log('🎯 ===== ManageServicesModal SE ESTÁ ABRIENDO =====');
      console.log('📋 Total categorías disponibles:', allCategories.length);

      // Verificar cada categoría
      const activeStatus = allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        isActive: isCategoryActive(cat.id),
      }));

      const activeCats = activeStatus.filter((c) => c.isActive);
      console.log('✅ Servicios ACTIVOS:', activeCats.length);
      console.log('   ', activeCats.map((c) => c.name).join(', '));

      const inactiveCats = activeStatus.filter((c) => !c.isActive);
      console.log('❌ Servicios INACTIVOS:', inactiveCats.length);
      console.log('   ', inactiveCats.map((c) => c.name).join(', '));

      console.log('🎯 ===============================================');
    }
  }, [open, allCategories, isCategoryActive]);

  if (!open) return null;

  console.log('🚀 ManageServicesModal está renderizando...');

  const handleToggle = async (categoryId) => {
    console.log('🎯 [ManageServicesModal] handleToggle:', categoryId);
    console.log('   Estado actual:', isCategoryActive(categoryId) ? 'ACTIVO' : 'INACTIVO');

    setToggling(categoryId);
    try {
      await toggleCategory(categoryId);
      console.log('   âœ… toggleCategory completado');
    } catch (error) {
      console.error('   âŒ Error en toggleCategory:', error);
      toast.error(
        t('wedding.manageServices.toast.updateError', {
          defaultValue: 'Error al actualizar servicio',
        })
      );
    } finally {
      setToggling(null);
      console.log('   ðŸ”“ Toggle desbloqueado');
    }
  };

  // Agrupar categorías por tipo (principales vs secundarias)
  const mainCategories = allCategories.slice(0, 10);
  const otherCategories = allCategories.slice(10);

  // Contar servicios activos
  const activeCount = allCategories.filter((cat) => isCategoryActive(cat.id)).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t('wedding.manageServices.title', { defaultValue: 'Gestionar servicios' })}
                <span className="ml-2 text-lg font-normal text-purple-600">
                  ({activeCount} {activeCount === 1 ? 'seleccionado' : 'seleccionados'})
                </span>
              </h2>
              <p className="text-sm text-gray-600">
                {t('wedding.manageServices.subtitle', {
                  defaultValue: 'Selecciona los servicios que necesitas para tu boda',
                })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Servicios principales */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('wedding.manageServices.primaryTitle', { defaultValue: 'Servicios principales' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mainCategories.map((category) => {
                const isActive = isCategoryActive(category.id);
                const isToggling = toggling === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleToggle(category.id)}
                    disabled={isToggling || loading}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${
                        isActive
                          ? 'border-purple-600 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                      ${isToggling || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isActive ? (
                      <CheckCircle className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${isActive ? 'text-purple-900' : 'text-gray-900'}`}
                        >
                          {category.name}
                        </p>
                        {isActive && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Otros servicios */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('wedding.manageServices.otherTitle', { defaultValue: 'Otros servicios' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherCategories.map((category) => {
                const isActive = isCategoryActive(category.id);
                const isToggling = toggling === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleToggle(category.id)}
                    disabled={isToggling || loading}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all text-sm
                      ${
                        isActive
                          ? 'border-purple-400 bg-purple-50 hover:bg-purple-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                      ${isToggling || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isActive ? (
                      <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <p
                        className={`font-medium ${isActive ? 'text-purple-900' : 'text-gray-700'}`}
                      >
                        {category.name}
                      </p>
                      {isActive && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                          ACTIVO
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ðŸ’¡ Tip:</strong>{' '}
              {t('wedding.manageServices.tip', {
                defaultValue:
                  'Los servicios seleccionados aparecerán como tarjetas en tu dashboard. También se añaden automáticamente cuando guardas un proveedor en favoritos.',
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} className="w-full">
            {t('wedding.manageServices.saveAndClose', { defaultValue: 'Guardar y cerrar' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
