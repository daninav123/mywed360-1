import React, { forwardRef } from 'react';
import { FixedSizeList } from 'react-window';

import GuestItem from '../../components/GuestItem';

/**
 * GuestPanel
 * Muestra la lista de invitados con búsqueda y virtualización.
 * Se extrae desde SeatingPlan para mejorar la legibilidad y reutilización.
 */
const GuestPanel = ({
  guests,
  tables,
  search,
  setSearch,
  guestOpen,
  setGuestOpen,
  guestBtnRef,
  searchRef,
}) => {
  // Filtro de invitados libres según texto y mesas asignadas
  const availableGuests = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) && !tables.some((t) => t.guestId === g.id)
  );

  return (
    <>
      {/* Toggle button (mobile) */}
      <button
        ref={guestBtnRef}
        className="md:hidden mb-2 px-3 py-1 bg-gray-200 rounded"
        onClick={() => setGuestOpen((o) => !o)}
        aria-expanded={guestOpen}
        aria-controls="guestPanel"
      >
        {guestOpen ? 'Ocultar invitados' : 'Mostrar invitados'}
      </button>

      {/* Guest list container */}
      <div
        id="guestPanel"
        className={`md:w-1/4 border rounded p-2 h-96 overflow-y-auto bg-gray-50 ${
          guestOpen ? 'block md:block' : 'hidden md:block'
        } ${guestOpen ? 'fixed inset-0 z-50 bg-white md:static md:bg-gray-50' : ''}`}
        role="dialog"
        aria-modal={guestOpen}
        aria-label="Lista de invitados"
      >
        {/* Search input */}
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar invitado"
          className="mb-2 w-full border rounded px-2 py-1"
        />

        {/* Virtualized list */}
        <FixedSizeList height={400} width={300} itemSize={50} itemCount={availableGuests.length}>
          {({ index, style }) => (
            <div style={style}>
              <GuestItem guest={availableGuests[index]} />
            </div>
          )}
        </FixedSizeList>
      </div>
    </>
  );
};

export default GuestPanel;
