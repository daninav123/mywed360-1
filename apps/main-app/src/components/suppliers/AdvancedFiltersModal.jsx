import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Users, Sparkles, Camera, Sliders } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Input from '../Input';

const AdvancedFiltersModal = ({ open, onClose, onApply, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    location: '',
    budget: '',
    guests: '',
    style: '',
    hasPortfolio: false,
    priceRange: '',
    rating: 0,
    ...initialFilters,
  });

  useEffect(() => {
    if (open) {
      setFilters({
        location: '',
        budget: '',
        guests: '',
        style: '',
        hasPortfolio: false,
        priceRange: '',
        rating: 0,
        ...initialFilters,
      });
    }
  }, [open, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      location: '',
      budget: '',
      guests: '',
      style: '',
      hasPortfolio: false,
      priceRange: '',
      rating: 0,
    };
    setFilters(clearedFilters);
    onApply(clearedFilters);
  };

  const activeFiltersCount = Object.values(filters).filter((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return false;
  }).length;

  return (
    <Modal open={open} onClose={onClose} title="Filtros Avanzados" size="md">
      <div className="space-y-6">
        {/* Ubicación */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            Ubicación
          </label>
          <Input
            type="text"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="Madrid, Barcelona, ..."
          />
        </div>

        {/* Presupuesto */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="w-4 h-4" />
            Presupuesto máximo (€)
          </label>
          <Input
            type="number"
            value={filters.budget}
            onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
            placeholder="5000"
          />
        </div>

        {/* Número de invitados */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-4 h-4" />
            Número de invitados
          </label>
          <Input
            type="number"
            value={filters.guests}
            onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
            placeholder="100"
          />
        </div>

        {/* Estilo de boda */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Sparkles className="w-4 h-4" />
            Estilo de boda
          </label>
          <select
            value={filters.style}
            onChange={(e) => setFilters({ ...filters, style: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Cualquier estilo</option>
            <option value="rustico">Rústico</option>
            <option value="elegante">Elegante</option>
            <option value="moderno">Moderno</option>
            <option value="bohemio">Bohemio</option>
            <option value="vintage">Vintage</option>
            <option value="minimalista">Minimalista</option>
            <option value="romantico">Romántico</option>
          </select>
        </div>

        {/* Rating mínimo */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Sliders className="w-4 h-4" />
            Rating mínimo
          </label>
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilters({ ...filters, rating })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.rating === rating
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}⭐
              </button>
            ))}
          </div>
        </div>

        {/* Solo con portfolio */}
        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <input
            type="checkbox"
            id="hasPortfolio"
            checked={filters.hasPortfolio}
            onChange={(e) => setFilters({ ...filters, hasPortfolio: e.target.checked })}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label
            htmlFor="hasPortfolio"
            className="flex items-center gap-2 text-sm font-medium text-purple-900 cursor-pointer"
          >
            <Camera size={16} />
            Solo proveedores con portfolio
          </label>
        </div>

        {/* Rango de precio */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="w-4 h-4" />
            Rango de precio
          </label>
          <select
            value={filters.priceRange}
            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Cualquier precio</option>
            <option value="€">€ - Económico</option>
            <option value="€€">€€ - Moderado</option>
            <option value="€€€">€€€ - Alto</option>
            <option value="€€€€">€€€€ - Premium</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={activeFiltersCount === 0}
          >
            Limpiar ({activeFiltersCount})
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleApply}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedFiltersModal;
