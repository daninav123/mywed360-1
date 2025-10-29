import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, RotateCcw, DollarSign, Users, Palette, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../Input';

/**
 * SmartFiltersBar - Muestra y permite editar filtros inteligentes detectados por la IA
 *
 * Props:
 * - weddingProfile: Perfil de la boda con presupuesto, invitados, estilo, ubicación
 * - onFiltersChange: Callback cuando usuario cambia filtros (filters) => void
 * - className: Clases CSS adicionales
 */
const SmartFiltersBar = ({ weddingProfile, onFiltersChange, className = '' }) => {
  // Estado de filtros (puede ser editado por usuario)
  const [filters, setFilters] = useState({
    budget: null,
    guests: null,
    style: null,
    location: null,
  });

  // Estado de edición (qué campo está siendo editado)
  const [editing, setEditing] = useState({
    budget: false,
    guests: false,
    style: false,
    location: false,
  });

  // Valores temporales durante edición
  const [tempValues, setTempValues] = useState({
    budget: '',
    guests: '',
    style: '',
    location: '',
  });

  // Inicializar filtros desde el perfil de la boda
  useEffect(() => {
    if (!weddingProfile) return;

    const detected = {
      budget: weddingProfile.totalBudget || weddingProfile.budget || null,
      guests: weddingProfile.guestCount || null,
      style: weddingProfile.style || null,
      location: weddingProfile.location?.city || weddingProfile.city || null,
    };

    setFilters(detected);
    onFiltersChange?.(detected);
  }, [weddingProfile]);

  // Manejar inicio de edición
  const handleStartEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: true }));
    setTempValues((prev) => ({
      ...prev,
      [field]: filters[field]?.toString() || '',
    }));
  };

  // Manejar guardado de edición
  const handleSaveEdit = (field) => {
    const value = tempValues[field].trim();

    // Convertir a número si es necesario
    let parsedValue = value;
    if (field === 'budget' || field === 'guests') {
      parsedValue = value ? parseInt(value, 10) : null;
      if (isNaN(parsedValue)) parsedValue = null;
    }

    const newFilters = { ...filters, [field]: parsedValue || null };
    setFilters(newFilters);
    setEditing((prev) => ({ ...prev, [field]: false }));
    onFiltersChange?.(newFilters);
  };

  // Manejar cancelación de edición
  const handleCancelEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: false }));
    setTempValues((prev) => ({ ...prev, [field]: '' }));
  };

  // Restablecer a valores originales del perfil
  const handleReset = () => {
    const detected = {
      budget: weddingProfile?.totalBudget || weddingProfile?.budget || null,
      guests: weddingProfile?.guestCount || null,
      style: weddingProfile?.style || null,
      location: weddingProfile?.location?.city || weddingProfile?.city || null,
    };

    setFilters(detected);
    setEditing({ budget: false, guests: false, style: false, location: false });
    onFiltersChange?.(detected);
  };

  // Limpiar todos los filtros
  const handleClear = () => {
    const empty = { budget: null, guests: null, style: null, location: null };
    setFilters(empty);
    setEditing({ budget: false, guests: false, style: false, location: false });
    onFiltersChange?.(empty);
  };

  // Verificar si hay al menos un filtro activo
  const hasActiveFilters = Object.values(filters).some((value) => value !== null);

  if (!hasActiveFilters) {
    return null; // No mostrar si no hay filtros
  }

  return (
    <Card className={`bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Filtros Inteligentes</h3>
            <span className="text-xs text-muted">(de tu perfil)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer a valores del perfil"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              title="Limpiar todos los filtros"
            >
              Limpiar todo
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Presupuesto */}
          {filters.budget && (
            <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
              <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
              {editing.budget ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempValues.budget}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, budget: e.target.value }))}
                    placeholder="Presupuesto"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSaveEdit('budget')}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('budget')}>
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-xs text-muted">Presupuesto</div>
                    <div className="font-medium text-foreground">
                      {filters.budget.toLocaleString('es-ES')}€
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartEdit('budget')}
                    className="text-muted hover:text-primary transition-colors"
                    title="Editar presupuesto"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Invitados */}
          {filters.guests && (
            <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              {editing.guests ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="number"
                    value={tempValues.guests}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, guests: e.target.value }))}
                    placeholder="Invitados"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSaveEdit('guests')}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('guests')}>
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-xs text-muted">Invitados</div>
                    <div className="font-medium text-foreground">{filters.guests}</div>
                  </div>
                  <button
                    onClick={() => handleStartEdit('guests')}
                    className="text-muted hover:text-primary transition-colors"
                    title="Editar número de invitados"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Estilo */}
          {filters.style && (
            <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
              <Palette className="h-4 w-4 text-primary flex-shrink-0" />
              {editing.style ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="text"
                    value={tempValues.style}
                    onChange={(e) => setTempValues((prev) => ({ ...prev, style: e.target.value }))}
                    placeholder="Estilo"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSaveEdit('style')}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('style')}>
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-xs text-muted">Estilo</div>
                    <div className="font-medium text-foreground capitalize">{filters.style}</div>
                  </div>
                  <button
                    onClick={() => handleStartEdit('style')}
                    className="text-muted hover:text-primary transition-colors"
                    title="Editar estilo"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Ubicación */}
          {filters.location && (
            <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-3 border border-soft">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              {editing.location ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="text"
                    value={tempValues.location}
                    onChange={(e) =>
                      setTempValues((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Ubicación"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleSaveEdit('location')}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCancelEdit('location')}>
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="text-xs text-muted">Ubicación</div>
                    <div className="font-medium text-foreground capitalize">{filters.location}</div>
                  </div>
                  <button
                    onClick={() => handleStartEdit('location')}
                    className="text-muted hover:text-primary transition-colors"
                    title="Editar ubicación"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info adicional */}
        <p className="text-xs text-muted">
          💡 Estos filtros se aplican automáticamente. Click en ✏️ para ajustarlos temporalmente.
        </p>
      </div>
    </Card>
  );
};

export default SmartFiltersBar;
