import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

import ProveedorCard from './ProveedorCard';
import useTranslations from '../../hooks/useTranslations';

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
  const { t } = useTranslations();

  const handleCreateContract = (provider) => {
    const providerName = provider?.name || t('common.suppliers.list.contractFallback');
    const title = t('common.suppliers.list.contractTitle', { name: providerName });
    navigate('/protocolo/documentos-legales', {
      state: {
        prefill: {
          type: 'provider_contract',
          title,
          providerName,
          service: provider?.service || '',
          eventDate: provider?.date || '',
          amount: provider?.priceRange || '',
          region: 'ES',
        },
      },
    });
  };

  const items = providers || [];
  const shouldVirtualize = items.length > 120;
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!shouldVirtualize) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDims({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setDims({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    return () => ro.disconnect();
  }, [shouldVirtualize]);

  const selectedCount = Array.isArray(selected) ? selected.length : 0;
  const tabOptions = useMemo(
    () => [
      { id: 'contratados', label: t('common.suppliers.list.tabs.contracted') },
      { id: 'buscados', label: t('common.suppliers.list.tabs.searching') },
      { id: 'favoritos', label: t('common.suppliers.list.tabs.favorites') },
    ],
    [t]
  );
  const statusOptions = useMemo(
    () => [
      { value: 'Pendiente', label: t('common.suppliers.list.filters.statusOptions.pending') },
      { value: 'Contactado', label: t('common.suppliers.list.filters.statusOptions.contacted') },
      { value: 'Seleccionado', label: t('common.suppliers.list.filters.statusOptions.selected') },
      { value: 'Confirmado', label: t('common.suppliers.list.filters.statusOptions.confirmed') },
      { value: 'Rechazado', label: t('common.suppliers.list.filters.statusOptions.rejected') },
    ],
    [t]
  );

  const renderTabs = () => {
    if (typeof setTab !== 'function') return null;
    const activeTab = tab || 'contratados';
    return (
      <div className="flex flex-wrap items-center gap-3">
        <nav
          className="flex gap-2 border-b border-gray-200"
          aria-label={t('common.suppliers.list.tabs.aria')}
        >
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
    return (
      <div className="w-full border rounded-md p-3 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.searchLabel')}
            </label>
            <input
              type="text"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              placeholder={t('common.suppliers.list.filters.searchPlaceholder')}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.serviceLabel')}
            </label>
            <select
              className="w-full border rounded p-2"
              value={serviceFilter || ''}
              onChange={(e) => setServiceFilter?.(e.target.value)}
            >
              <option value="">{t('common.suppliers.list.filters.allOption')}</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.statusLabel')}
            </label>
            <select
              className="w-full border rounded p-2"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter?.(e.target.value)}
            >
              <option value="">{t('common.suppliers.list.filters.allOption')}</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.dateFrom')}
            </label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={dateFrom || ''}
              onChange={(e) => setDateFrom?.(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.dateTo')}
            </label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={dateTo || ''}
              onChange={(e) => setDateTo?.(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t('common.suppliers.list.filters.ratingLabel')}
            </label>
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
              {t('common.suppliers.list.filters.clear')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSelectionBar = () => {
    if (!selectedCount) return null;
    return (
      <div
        className="flex flex-wrap items-center gap-2 text-sm text-gray-600"
        data-cy="selection-bar"
      >
        <span>
          {t('common.suppliers.list.selection.count', { count: selectedCount })}
        </span>
        {typeof onOpenCompare === 'function' && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            {t('common.suppliers.list.selection.compare')}
          </button>
        )}
        {typeof onOpenRfq === 'function' && (
          <button
            type="button"
            onClick={onOpenRfq}
            className="px-3 py-1 border border-indigo-200 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            {t('common.suppliers.list.selection.sendRfq')}
          </button>
        )}
        {typeof onOpenGroupSelected === 'function' && (
          <button
            type="button"
            onClick={onOpenGroupSelected}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            {t('common.suppliers.list.selection.group')}
          </button>
        )}
        {typeof onOpenBulkStatus === 'function' && (
          <button
            type="button"
            onClick={onOpenBulkStatus}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            {t('common.suppliers.list.selection.changeStatus')}
          </button>
        )}
        {typeof onOpenDuplicates === 'function' && (
          <button
            type="button"
            onClick={onOpenDuplicates}
            className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            {t('common.suppliers.list.selection.duplicates')}
          </button>
        )}
        {typeof onClearSelection === 'function' && (
          <button
            type="button"
            onClick={onClearSelection}
            className="px-3 py-1 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100"
            data-cy="selection-clear"
          >
            {t('common.suppliers.list.selection.clear')}
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
            {items.length > 0 ? (
              items.map((provider) => (
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
                {t('common.suppliers.list.empty')}
              </div>
            )}
          </div>
        </div>
      );
    }

    const ITEM_SIZE = 260;

    const Row = ({ index, style }) => {
      const provider = items[index];
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
          {dims.height > 0 ? (
            <List
              height={dims.height}
              width={dims.width}
              itemCount={items.length}
              itemSize={ITEM_SIZE}
            >
              {Row}
            </List>
          ) : (
            <div className="p-4 text-sm text-gray-500">
              {t('common.suppliers.list.loadingVirtualized')}
            </div>
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
