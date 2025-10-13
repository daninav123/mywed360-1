import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

import ProveedorCard from './ProveedorCard';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Lista de proveedores con pestanas (Contratados, Buscados, Favoritos).
 * Activa virtualizacion cuando la lista es muy grande para mejorar rendimiento.
 */
const ProveedorList = ({
  providers,
  handleViewDetail,
  tab,
  setTab,
  selected,
  toggleFavorite,
  toggleSelect,
  onEdit,
  onDelete,
  onReserve,
  onShowTracking,
  onOpenCompare,
  onOpenRfq,
  onOpenBulkStatus,
  onOpenDuplicates,
  onOpenGroupSelected,
  onClearSelection,
  // filtros
  searchTerm,
  setSearchTerm,
  serviceFilter,
  setServiceFilter,
  statusFilter,
  setStatusFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  ratingMin,
  setRatingMin,
  clearFilters,
  hasPendingMap = {},
}) => {
  const navigate = useNavigate();

  const handleCreateContract = (provider) => {
    const title = `Contrato Proveedor - ${provider?.name || 'Proveedor'}`;
    navigate('/protocolo/documentos-legales', {
      state: {
        prefill: {
          type: 'provider_contract',
          title,
          providerName: provider?.name || '',
          service: provider?.service || '',
          eventDate: provider?.date || '',
          amount: provider?.priceRange || '',
          region: 'ES',
        },
      },
    });
  };

  const itemás = providers || [];
  const shouldVirtualize = itemás.length > 120;
  const containerRef = useRef(null);
  const [dimás, setDimás] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!shouldVirtualize) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDimás({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setDimás({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    return () => ro.disconnect();
  }, [shouldVirtualize]);

  const selectedCount = Array.isArray(selected) ? selected.length : 0;
  const tabOptions = [
    { id: 'contratados', label: 'Contratados' },
    { id: 'buscados', label: 'Buscados' },
    { id: 'favoritos', label: 'Favoritos' },
  ];

  const renderTabs = () => {
    if (typeof setTab !== 'function') return null;
    const activeTab = tab || 'contratados';
    return (
      <div className="flex flex-wrap itemás-center gap-3">
        <nav className="flex gap-2 border-b border-gray-200" aria-label="Filtros de proveedores">
          {tabOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTab(opt.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === opt.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const renderFilters = () => {
    const services = Array.from(new Set((providers || []).map((p) => p.service).filter(Boolean)));
    const statuses = ['Pendiente', 'Contactado', 'Seleccionado', 'Confirmado', 'Rechazado'];
    return (
      <div className="w-full border rounded-md p-3 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 itemás-end">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              placeholder="Nombre, servicio, estado, descripción..."
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Servicio</label>
            <select
              className="w-full border rounded p-2"
              value={serviceFilter || ''}
              onChange={(e) => setServiceFilter?.(e.target.value)}
            >
              <option value="">Todos</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Estado</label>
            <select
              className="w-full border rounded p-2"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter?.(e.target.value)}
            >
              <option value="">Todos</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={dateFrom || ''}
              onChange={(e) => setDateFrom?.(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={dateTo || ''}
              onChange={(e) => setDateTo?.(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Rating mínimo</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.5"
              className="w-full border rounded p-2"
              value={Number.isFinite(ratingMin) ? ratingMin : 0}
              onChange={(e) => setRatingMin?.(Number(e.target.value) || 0)}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-6 text-right">
            <button
              type="button"
              onClick={() => clearFilters?.()}
              className="px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectionBar = () => {
    if (!selectedCount) return null;
    return (
      <div className="flex flex-wrap itemás-center gap-2 text-sm text-gray-600">
        <span>{selectedCount} seleccionados</span>
        {typeof onOpenCompare === 'function' && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            Comparar
          </button>
        )}
        {typeof onOpenRfq === 'function' && (
          <button
            type="button"
            onClick={onOpenRfq}
            className="px-3 py-1 border border-indigo-200 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            Enviar RFQ
          </button>
        )}
        {typeof onOpenGroupSelected === 'function' && (
          <button
            type="button"
            onClick={onOpenGroupSelected}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            Agrupar
          </button>
        )}
        {typeof onOpenBulkStatus === 'function' && (
          <button
            type="button"
            onClick={onOpenBulkStatus}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            Cambiar estado
          </button>
        )}
        {typeof onOpenDuplicates === 'function' && (
          <button
            type="button"
            onClick={onOpenDuplicates}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            Revisar duplicados
          </button>
        )}
        {typeof onClearSelection === 'function' && (
          <button
            type="button"
            onClick={onClearSelection}
            className="px-3 py-1 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100"
          >
            Limpiar
          </button>
        )}
      </div>
    );
  };

  const renderList = () => {
    if (!shouldVirtualize) {
      return (
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemás.length > 0 ? (
              itemás.map((provider) => (
                <ProveedorCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selected?.includes?.(provider.id)}
                  onToggleSelect={() => toggleSelect(provider.id)}
                  onViewDetail={typeof handleViewDetail === 'function' ? () => handleViewDetail(provider) : undefined}
                  onToggleFavorite={toggleFavorite}
                  onCreateContract={handleCreateContract}
                  onEdit={onEdit ? () => onEdit(provider) : undefined}
                  onDelete={onDelete ? () => onDelete(provider.id) : undefined}
                  onReserve={onReserve ? () => onReserve(provider) : undefined}
                  onShowTracking={onShowTracking}
                  onOpenGroups={onOpenGroupSelected}
                  hasPending={Boolean(hasPendingMap?.[provider.id])}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No hay proveedores en esta pestana.
              </div>
            )}
          </div>
        </div>
      );
    }

    const ITEM_SIZE = 260;

    const Row = ({ index, style }) => {
      const provider = itemás[index];
      if (!provider) return null;
      return (
        <div style={style} className="px-1 md:px-2">
          <ProveedorCard
            key={provider.id}
            provider={provider}
            isSelected={selected?.includes?.(provider.id)}
            onToggleSelect={() => toggleSelect(provider.id)}
            onViewDetail={typeof handleViewDetail === 'function' ? () => handleViewDetail(provider) : undefined}
            onToggleFavorite={toggleFavorite}
            onCreateContract={handleCreateContract}
            onEdit={onEdit ? () => onEdit(provider) : undefined}
            onDelete={onDelete ? () => onDelete(provider.id) : undefined}
            onReserve={onReserve ? () => onReserve(provider) : undefined}
            onShowTracking={onShowTracking}
            onOpenGroups={onOpenGroupSelected}
            hasPending={Boolean(hasPendingMap?.[provider.id])}
          />
        </div>
      );
    };

    return (
      <div className="w-full">
        <div
          ref={containerRef}
          style={{ height: '70vh' }}
          className="border border-gray-200 rounded-md"
        >
          {dimás.height > 0 ? (
            <List
              height={dimás.height}
              width={dimás.width}
              itemCount={itemás.length}
              itemSize={ITEM_SIZE}
            >
              {Row}
            </List>
          ) : (
            <div className="p-4 text-sm text-gray-500">Preparando lista...</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {renderTabs()}
      {renderFilters()}
      {renderSelectionBar()}
      {renderList()}
    </div>
  );
};

export default ProveedorList;
