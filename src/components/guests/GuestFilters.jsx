import { Search, Filter, Plus, MessageSquare } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import useTranslations from '../../hooks/useTranslations';
import wh from '../../utils/whDebug';
import { Button } from '../ui';
import { Input } from '../ui';
import InviteTemplateModal from '../whatsapp/InviteTemplateModal';

/**
 * Componente de filtros y acciones para la lista de invitados
 * Optimizado con memoización y UX mejorada
 */
const GuestFilters = React.memo(
  ({
    searchTerm,
    statusFilter,
    tableFilter,
    onSearchChange,
    onStatusFilterChange,
    onTableFilterChange,
    onAddGuest,
    onOpenSaveTheDate,
    onOpenFormalInvitation,
    onOpenRsvpSummary,
    onBulkTableReassign,
    guestCount = 0,
    isLoading = false,
    selectedCount = 0,
    onSendSelectedApi,
    onScheduleSelected,
    onSendSelectedBroadcast,
    showApiButtons = true,
    coupleName = '',
  }) => {
    const { t, wedding } = useTranslations();

    // Opciones de estado para el filtro
    const statusOptions = [
      { value: '', label: 'Todos los estados' },
      { value: 'pending', label: wedding?.guestStatus?.('pending') || 'Pendiente' },
      { value: 'confirmed', label: wedding?.guestStatus?.('confirmed') || 'Confirmado' },
      { value: 'declined', label: wedding?.guestStatus?.('declined') || 'Rechazado' },
    ];

    // Manejar cambios en los filtros
    const handleSearchChange = useCallback(
      (e) => {
        onSearchChange?.(e.target.value);
      },
      [onSearchChange]
    );

    const handleStatusChange = useCallback(
      (e) => {
        onStatusFilterChange?.(e.target.value);
      },
      [onStatusFilterChange]
    );

    const handleTableChange = useCallback(
      (e) => {
        onTableFilterChange?.(e.target.value);
      },
      [onTableFilterChange]
    );

    // Funciones de acción
    const handleAddGuest = useCallback(() => {
      onAddGuest?.();
    }, [onAddGuest]);

    const handleOpenFormal = useCallback(() => {
      wh('UI – FormalInvite click', { guestCount });
      if (guestCount === 0) {
        alert('No hay invitados para enviar invitaciones');
        return;
      }
      onOpenFormalInvitation?.();
    }, [guestCount, onOpenFormalInvitation]);

    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const handleOpenRsvp = useCallback(() => {
      onOpenRsvpSummary?.();
    }, [onOpenRsvpSummary]);

    const handleReassignTables = useCallback(() => {
      if (!selectedCount) {
        alert('Selecciona invitados para reasignar mesa');
        return;
      }
      onBulkTableReassign?.();
    }, [onBulkTableReassign, selectedCount]);

    const handleEditTemplate = useCallback(() => {
      try {
        wh('UI – EditTemplate open');
      } catch {}
      setShowTemplateModal(true);
    }, []);

    return (
      <>
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          {/* Título y contador */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-body">{t('guests.guestList')}</h2>
              <p className="text-sm text-muted mt-1">
                {guestCount} {guestCount === 1 ?'invitado' : 'invitados'} en total
              </p>
            </div>

            {/* Botón principal de añadir */}
            <Button onClick={handleAddGuest} disabled={isLoading} className="flex items-center">
              <Plus size={20} className="mr-2" />
              {t('guests.addGuest')}
            </Button>
          </div>

          {/* Filtros de búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
              />
              <Input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
              />
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 border border-soft rounded-md focus:outline-none focus:ring-2 ring-primary appearance-none bg-surface"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por mesa */}
            <div>
              <Input
                type="text"
                placeholder="Filtrar por mesa..."
                value={tableFilter}
                onChange={handleTableChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Acciones masivas */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenSaveTheDate?.()}
              disabled={isLoading || guestCount === 0}
              title="Enviar SAVE THE DATE por WhatsApp"
            >
              Enviar SAVE THE DATE
            </Button>

            <Button
              variant="outline"
              onClick={handleOpenFormal}
              disabled={isLoading || guestCount === 0}
              className="flex items-center"
              title="Gestionar la invitación formal con WhatsApp y entrega física"
            >
              <MessageSquare size={16} className="mr-2" />
              Invitación formal
            </Button>

            <Button variant="outline" onClick={handleOpenRsvp} disabled={isLoading}>
              Resumen RSVP
            </Button>

            <Button variant="outline" onClick={handleEditTemplate} disabled={isLoading}>
              Editar mensaje (API)
            </Button>

            {/* Envío/Programación para seleccionados */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted">Seleccionados: {selectedCount}</span>

              {showApiButtons && (
                <Button
                  variant="outline"
                  onClick={() => onSendSelectedApi?.()}
                  disabled={isLoading || selectedCount === 0}
                  className="flex items-center"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Enviar seleccionados (API)
                </Button>
              )}

              {showApiButtons && (
                <Button
                  variant="outline"
                  onClick={() => onScheduleSelected?.()}
                  disabled={isLoading || selectedCount === 0}
                >
                  Programar seleccionados
                </Button>
              )}

              {showApiButtons && (
                <Button
                  variant="outline"
                  onClick={() => onSendSelectedBroadcast?.()}
                  disabled={isLoading || selectedCount === 0}
                  title="Enviar por difusión (requiere extensión)"
                >
                  Difusión (extensión)
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleReassignTables}
                disabled={isLoading || selectedCount === 0}
                title="Mover invitados seleccionados a otra mesa"
              >
                Reasignar mesa
              </Button>
            </div>
          </div>
        </div>
        <InviteTemplateModal
          open={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSaved={() => {
            setShowTemplateModal(false);
            alert('Plantilla actualizada');
          }}
          coupleName={coupleName}
        />
      </>
    );
  }
);

GuestFilters.displayName = 'GuestFilters';

export default GuestFilters;
