import React, { useMemo, useState } from 'react';

import BulkStatusModal from '../../components/proveedores/BulkStatusModal';
import ProveedorList from '../../components/proveedores/ProveedorList';

const SAMPLE = [
  {
    id: 's1',
    name: 'Foto Natural',
    service: 'Fotografia',
    status: 'Pendiente',
    priceRange: '1200 EUR - 2500 EUR',
    rating: 40,
    ratingCount: 10,
    location: 'Madrid',
    email: 'foto@natural.es',
    phone: '+34 600 000 111',
  },
  {
    id: 's2',
    name: 'DJ Night',
    service: 'Musica',
    status: 'Contactado',
    priceRange: '800 EUR - 1500 EUR',
    rating: 0,
    ratingCount: 0,
    location: 'Valencia',
    email: 'hola@djnight.es',
    phone: '+34 600 000 222',
  },
];

export default function ProveedoresSmoke() {
  const [providers, setProviders] = useState(SAMPLE);
  const [selected, setSelected] = useState([]);
  const [openBulk, setOpenBulk] = useState(false);
  const toggleSelect = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearSelection = () => setSelected([]);

  const noop = () => {};
  const list = useMemo(() => providers, [providers]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Smoke Proveedores</h1>
      <ProveedorList
        providers={list}
        // Permitir que la tarjeta abra el detalle por sí misma
        tab={'buscados'}
        setTab={noop}
        selected={selected}
        toggleFavorite={noop}
        toggleSelect={toggleSelect}
        onEdit={noop}
        onOpenCompare={noop}
        onOpenBulkStatus={() => setOpenBulk(true)}
        onOpenDuplicates={noop}
        onClearSelection={clearSelection}
        // filtros mínimos
        searchTerm={''}
        setSearchTerm={noop}
        serviceFilter={''}
        setServiceFilter={noop}
        statusFilter={''}
        setStatusFilter={noop}
        dateFrom={''}
        setDateFrom={noop}
        dateTo={''}
        setDateTo={noop}
        ratingMin={0}
        setRatingMin={noop}
        clearFilters={noop}
      />
      <BulkStatusModal
        open={openBulk}
        onClose={() => setOpenBulk(false)}
        onApply={() => setOpenBulk(false)}
      />
    </div>
  );
}
