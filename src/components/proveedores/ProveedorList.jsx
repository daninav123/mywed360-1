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
  onOpenCompare,
  onOpenBulkStatus,
  onOpenDuplicates,
  onClearSelection,
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
  const tabOptions = [
    { id: 'contratados', label: 'Contratados' },
    { id: 'buscados', label: 'Buscados' },
    { id: 'favoritos', label: 'Favoritos' },
  ];

  const renderTabs = () => {
    if (typeof setTab !== 'function') return null;
    const activeTab = tab || 'contratados';
    return (
      <div className="flex flex-wrap items-center gap-3">
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

  const renderSelectionBar = () => {
    if (!selectedCount) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
            {items.length > 0 ? (
              items.map((provider) => (
                <ProveedorCard
                  key={provider.id}
                  provider={provider}
                  isSelected={selected?.includes?.(provider.id)}
                  onToggleSelect={() => toggleSelect(provider.id)}
                  onViewDetail={() => handleViewDetail(provider)}
                  onToggleFavorite={toggleFavorite}
                  onCreateContract={handleCreateContract}
                  onEdit={onEdit ? () => onEdit(provider) : undefined}
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
      const provider = items[index];
      if (!provider) return null;
      return (
        <div style={style} className="px-1 md:px-2">
          <ProveedorCard
            key={provider.id}
            provider={provider}
            isSelected={selected?.includes?.(provider.id)}
            onToggleSelect={() => toggleSelect(provider.id)}
            onViewDetail={() => handleViewDetail(provider)}
            onToggleFavorite={toggleFavorite}
            onCreateContract={handleCreateContract}
            onEdit={onEdit ? () => onEdit(provider) : undefined}
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
            <div className="p-4 text-sm text-gray-500">Preparando lista...</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {renderTabs()}
      {renderSelectionBar()}
      {renderList()}
    </div>
  );
};

export default ProveedorList;
