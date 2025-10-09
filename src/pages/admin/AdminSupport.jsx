import React, { useState } from 'react';

import { supportSummary, supportTickets } from '../../data/adminMock';

const AdminSupport = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Soporte</h1>
        <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Tickets y satisfacción de usuarios profesionales.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm" data-testid="support-kpi-tickets-open">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Tickets abiertos</p>
          <p className="mt-3 text-2xl font-semibold">{supportSummary.open}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Tickets pendientes</p>
          <p className="mt-3 text-2xl font-semibold">{supportSummary.pending}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">Resueltos</p>
          <p className="mt-3 text-2xl font-semibold">{supportSummary.resolved}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">SLA medio</p>
          <p className="mt-3 text-2xl font-semibold">{supportSummary.slaAverage}</p>
        </article>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm p-4">
        <h2 className="text-sm font-semibold">NPS</h2>
        <div
          className="mt-4 flex h-36 items-center justify-center rounded-lg border border-dashed border-soft text-xs text-[var(--color-text-soft,#6b7280)]"
          data-testid="support-nps-chart"
        >
          NPS actual: {supportSummary.nps} (placeholder)
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h2 className="text-sm font-semibold">Tickets</h2>
        </header>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="divide-y divide-soft">
            {supportTickets.map((ticket) => (
              <button
                type="button"
                key={ticket.id}
                data-testid="support-ticket-row"
                onClick={() => setSelectedTicket(ticket)}
                className={selectedTicket?.id === ticket.id ? 'w-full px-4 py-3 text-left text-sm bg-[var(--color-bg-soft,#f3f4f6)]' : 'w-full px-4 py-3 text-left text-sm'}
              >
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">{ticket.status} · {ticket.updatedAt}</p>
              </button>
            ))}
          </div>
          <div className="px-4 py-4" data-testid="support-ticket-detail">
            {selectedTicket ? (
              <div className="space-y-2 text-sm">
                <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Solicitado por {selectedTicket.requester}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Estado: {selectedTicket.status}</p>
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]">Actualizado: {selectedTicket.updatedAt}</p>
                <div className="rounded-md border border-dashed border-soft p-4 text-xs text-[var(--color-text-soft,#6b7280)]">
                  Conversación y comentarios (placeholder).
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">Selecciona un ticket para ver los detalles.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSupport;