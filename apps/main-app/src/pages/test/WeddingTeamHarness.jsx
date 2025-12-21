import React, { useState } from 'react';

import WeddingTeamModal from '../../components/weddings/WeddingTeamModal.jsx';

export default function WeddingTeamHarness() {
  const [open, setOpen] = useState(true);
  const [weddingId, setWeddingId] = useState('w-harness');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[color:var(--color-text)] p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Harness - Gestion de equipo</h1>
        <p className="text-sm text-[color:var(--color-text-70)]">
          Esta vista de pruebas permite ejercitar el modal de seleccion/invitacion de planners y
          generacion de codigos externos sin depender de Firestore.
        </p>
      </header>

      <section className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-medium">ID de la boda en pruebas</span>
          <input
            className="border border-[color:var(--color-border)] rounded-md px-3 py-2 bg-[var(--color-surface)]"
            value={weddingId}
            onChange={(event) => setWeddingId(event.target.value)}
            data-testid="harness-wedding-id-input"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md text-sm font-semibold hover:bg-[var(--color-primary-80)] transition"
            data-testid="open-team-modal"
          >
            Abrir modal de equipo
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('maloveapp_team_invites');
                window.localStorage.removeItem('maloveapp_team_codes');
              }
            }}
            className="px-4 py-2 bg-[var(--color-accent-40)] text-[color:var(--color-text)] rounded-md text-sm font-semibold hover:bg-[var(--color-accent-60)] transition"
            data-testid="reset-team-storage"
          >
            Limpiar storage de invitaciones
          </button>
        </div>
      </section>

      <WeddingTeamModal
        open={open}
        onClose={() => setOpen(false)}
        weddingId={weddingId}
        weddingName="Boda Demo Cypress"
      />
    </div>
  );
}
