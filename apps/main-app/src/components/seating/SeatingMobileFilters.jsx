import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useTranslations from '../../hooks/useTranslations';

/**
 * Filtros Avanzados para Seating Móvil
 * Filtrar por ocupación, estado, tipo de mesa
 */
const SeatingMobileFilters = ({ isOpen, onClose, onApply, currentFilters = {} }) => {
  const { t } = useTranslations();
  const [filters, setFilters] = useState({
    occupancy: currentFilters.occupancy || [], // ['empty', 'partial', 'full', 'over']
    locked: currentFilters.locked || null, // null, true, false
    shape: currentFilters.shape || [], // ['round', 'rectangular', 'custom']
  });

  const handleToggleOccupancy = (value) => {
    setFilters((prev) => ({
      ...prev,
      occupancy: prev.occupancy.includes(value)
        ? prev.occupancy.filter((v) => v !== value)
        : [...prev.occupancy, value],
    }));
  };

  const handleToggleShape = (value) => {
    setFilters((prev) => ({
      ...prev,
      shape: prev.shape.includes(value)
        ? prev.shape.filter((v) => v !== value)
        : [...prev.shape, value],
    }));
  };

  const handleApply = () => {
    onApply?.(filters);
    onClose?.();
  };

  const handleClear = () => {
    setFilters({ occupancy: [], locked: null, shape: [] });
  };

  const hasActiveFilters =
    filters.occupancy.length > 0 || filters.locked !== null || filters.shape.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('seatingMobile.filters.title', { defaultValue: 'Filtros' })}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Ocupación */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('seatingMobile.filters.occupancy', { defaultValue: 'Ocupación' })}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: 'empty',
                      label: t('seatingMobile.filters.empty', { defaultValue: 'Vacías' }),
                      color: 'bg-gray-100 text-gray-700',
                    },
                    {
                      value: 'partial',
                      label: t('seatingMobile.filters.partial', { defaultValue: 'Parciales' }),
                      color: 'bg-orange-100 text-orange-700',
                    },
                    {
                      value: 'full',
                      label: t('seatingMobile.filters.full', { defaultValue: 'Llenas' }),
                      color: 'bg-green-100 text-green-700',
                    },
                    {
                      value: 'over',
                      label: t('seatingMobile.filters.over', { defaultValue: 'Sobreocupadas' }),
                      color: 'bg-red-100 text-red-700',
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleToggleOccupancy(option.value)}
                      className={`
                        p-3 rounded-lg border-2 transition-all flex items-center justify-between
                        ${
                          filters.occupancy.includes(option.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.color}`} />
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </div>
                      {filters.occupancy.includes(option.value) && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado de Bloqueo */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('seatingMobile.filters.lockStatus', { defaultValue: 'Estado' })}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: null,
                      label: t('seatingMobile.filters.all', { defaultValue: 'Todas' }),
                    },
                    {
                      value: true,
                      label: t('seatingMobile.filters.locked', { defaultValue: 'Bloqueadas' }),
                    },
                    {
                      value: false,
                      label: t('seatingMobile.filters.unlocked', { defaultValue: 'Desbloqueadas' }),
                    },
                  ].map((option) => (
                    <button
                      key={String(option.value)}
                      onClick={() => setFilters((prev) => ({ ...prev, locked: option.value }))}
                      className={`
                        p-3 rounded-lg border-2 transition-all text-sm font-medium
                        ${
                          filters.locked === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forma de Mesa */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('seatingMobile.filters.shape', { defaultValue: 'Forma' })}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: 'round',
                      label: t('seatingMobile.filters.round', { defaultValue: 'Redonda' }),
                      icon: '⭕',
                    },
                    {
                      value: 'rectangular',
                      label: t('seatingMobile.filters.rectangular', { defaultValue: 'Rectangular' }),
                      icon: '▭',
                    },
                    {
                      value: 'custom',
                      label: t('seatingMobile.filters.custom', { defaultValue: 'Otra' }),
                      icon: '◇',
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleToggleShape(option.value)}
                      className={`
                        p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                        ${
                          filters.shape.includes(option.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-xs font-medium text-gray-900">{option.label}</span>
                      {filters.shape.includes(option.value) && (
                        <Check className="w-3 h-3 text-blue-600 absolute top-1 right-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleClear}
                disabled={!hasActiveFilters}
                className={`
                  flex-1 py-3 rounded-lg font-medium transition-colors
                  ${
                    hasActiveFilters
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {t('seatingMobile.filters.clear', { defaultValue: 'Limpiar' })}
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t('seatingMobile.filters.apply', { defaultValue: 'Aplicar' })}
                {hasActiveFilters && (
                  <span className="ml-1">
                    ({filters.occupancy.length + (filters.locked !== null ? 1 : 0) + filters.shape.length})
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SeatingMobileFilters;
