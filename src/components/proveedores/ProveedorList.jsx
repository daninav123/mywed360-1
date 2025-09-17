import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProveedorCard from "./ProveedorCard";
import { FixedSizeList as List } from "react-window";

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Lista de proveedores con pestañas (Contratados, Buscados, Favoritos).
 * Activa virtualización cuando la lista es muy grande para mejorar rendimiento.
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
}) => {
  const navigate = useNavigate();

  const handleCreateContract = (provider) => {
    const title = `Contrato Proveedor - ${provider?.name || "Proveedor"}`;
    navigate("/protocolo/documentos-legales", {
      state: {
        prefill: {
          type: "provider_contract",
          title,
          providerName: provider?.name || "",
          service: provider?.service || "",
          eventDate: provider?.date || "",
          amount: provider?.priceRange || "",
          region: "ES",
        },
      },
    });
  };

  // La lista ya viene filtrada según la pestaña desde el hook
  const items = providers || [];

  // Virtualización: activar cuando haya muchos elementos
  const shouldVirtualize = items.length > 120;
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!shouldVirtualize) return; // solo medir si se usa virtualización
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDims({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    });
    ro.observe(el);
    // init
    const rect = el.getBoundingClientRect();
    setDims({ width: Math.max(320, rect.width), height: Math.max(300, rect.height) });
    return () => ro.disconnect();
  }, [shouldVirtualize]);

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
              No hay proveedores en esta pestaña.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Virtualized single-column list (mejora de rendimiento en listas largas)
  const ITEM_SIZE = 260; // altura aproximada de cada tarjeta

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
      <div ref={containerRef} style={{ height: '70vh' }} className="border border-gray-200 rounded-md">
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
          <div className="p-4 text-sm text-gray-500">Preparando lista…</div>
        )}
      </div>
    </div>
  );
};

export default ProveedorList;

