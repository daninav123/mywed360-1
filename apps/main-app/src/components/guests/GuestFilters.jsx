import { Search, Filter, Plus, MessageSquare } from 'lucide-react';
import React, { useCallback } from 'react';
import { toast } from 'react-toastify';

import useTranslations from '../../hooks/useTranslations';
import wh from '../../utils/whDebug';
import { Button } from '../ui';
import { Input } from '../ui';

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
    onBulkInvite,
    guestCount = 0,
    isLoading = false,
  }) => {
    const { t, wedding } = useTranslations();

    // Opciones de estado para el filtro
    const statusOptions = [
      {
        value: '',
        label: t('guests.filters.allStatuses', 'Todos los estados'),
      },
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

    const handleBulkInviteApi = useCallback(() => {
      wh('UI – BulkInvite click', { guestCount });
      if (guestCount === 0) {
        toast.info(
          t('guests.filters.noGuestsForBulk', 'No hay invitados para enviar invitaciones')
        );
        return;
      }
      onBulkInvite?.();
    }, [guestCount, onBulkInvite]);

    return (
      <>
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          {/* Título y contador */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-body">Lista de invitados</h2>
              <p className="text-sm text-muted mt-1">
                {t('guests.filters.totalGuests', {
                  count: guestCount,
                  defaultValue:
                    guestCount === 1 ? '1 invitado en total' : `${guestCount} invitados en total`,
                })}
              </p>
            </div>

            {/* Botón principal de añadir */}
            <Button
              onClick={handleAddGuest}
              disabled={isLoading}
              className="flex items-center"
              data-testid="guest-add-manual"
            >
              <Plus size={20} className="mr-2" />
              Añadir invitado
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
                placeholder={t(
                  'common.guests.filters.searchPlaceholder',
                  'Buscar por nombre, email o teléfono...'
                )}
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
                data-testid="guest-filter-rsvp"
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
                placeholder={t('guests.filters.tablePlaceholder', 'Filtrar por mesa...')}
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
              title={t(
                'common.guests.filters.saveTheDate.title',
                'Enviar SAVE THE DATE por WhatsApp'
              )}
            >
              {t('guests.filters.saveTheDate.label', 'Enviar SAVE THE DATE')}
            </Button>

            <Button
              variant="outline"
              onClick={handleBulkInviteApi}
              disabled={isLoading || guestCount === 0}
              className="flex items-center"
              title={t(
                'common.guests.filters.bulkInvite.title',
                'Enviar la invitación formal por WhatsApp API'
              )}
            >
              <MessageSquare size={16} className="mr-2" />
              {t('guests.filters.bulkInvite.label', 'Invitaciones masivas (API)')}
            </Button>
          </div>
        </div>
      </>
    );
  }
);

GuestFilters.displayName = 'GuestFilters';

export default GuestFilters;
