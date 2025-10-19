import React, { useCallback, useEffect, useState } from 'react';

import { getPortfolioData } from '../../services/adminDataService';

const statusLabels = {
  draft: 'Borrador',
  active: 'Activa',
  archived: 'Archivada',
};

const AdminPortfolio = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [meta, setMeta] = useState(null);

  const loadPortfolio = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const { items, meta: responseMeta } = await getPortfolioData(filters);
      setPortfolio(items);
      setMeta(responseMeta);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const handleApplyFilters = async () => {
    if (loading) return;
    await loadPortfolio({
      status: statusFilter || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Portfolio de bodas</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
            Filtra por estado o por rango de fechas para revisar la cartera.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Estado
            <select
              data-testid="portfolio-filter-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="ml-2 rounded-md border border-soft px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="active">Activa</option>
              <option value="archived">Archivada</option>
            </select>
          </label>
          <label className="text-sm">
            Desde
            <input
              type="date"
              data-testid="portfolio-filter-date-from"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="ml-2 rounded-md border border-soft px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Hasta
            <input
              type="date"
              data-testid="portfolio-filter-date-to"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="ml-2 rounded-md border border-soft px-3 py-2"
            />
          </label>
          <button
            type="button"
            data-testid="portfolio-filter-apply"
            onClick={handleApplyFilters}
            className="rounded-md border border-soft px-3 py-2 text-sm hover:bg-[var(--color-bg-soft,#f3f4f6)]"
          >
            {loading ? 'Aplicando…' : 'Aplicar'}
          </button>
        </div>
      </header>

      {meta && (
        <p className="text-xs text-[var(--color-text-soft,#6b7280)]">
          Mostrando {portfolio.length} de {meta.count ?? portfolio.length} bodas · Orden: {meta.order ?? 'desc'} ·
          Estado: {meta.status ?? 'all'}
        </p>
      )}

      {loading ? (
        <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
          Cargando cartera...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-soft bg-surface shadow-sm">
          <table data-testid="portfolio-table" className="min-w-full divide-y divide-soft text-sm">
            <thead className="bg-[var(--color-bg-soft,#f3f4f6)] text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
              <tr>
                <th className="px-4 py-3 text-left">Pareja</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Fecha evento</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Confirmados</th>
                <th className="px-4 py-3 text-left">Contratos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-soft">
              {portfolio.map((wedding) => (
                <tr key={wedding.id} data-testid="portfolio-row" data-status={wedding.status}>
                  <td className="px-4 py-3 font-medium">{wedding.couple}</td>
                  <td className="px-4 py-3">{wedding.owner}</td>
                  <td className="px-4 py-3">{wedding.eventDate}</td>
                  <td className="px-4 py-3">
                    {statusLabels[wedding.status] || wedding.status}
                    <span className="sr-only"> ({wedding.status})</span>
                  </td>
                  <td className="px-4 py-3">{wedding.confirmedGuests}</td>
                  <td className="px-4 py-3">{wedding.signedContracts}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        data-testid="portfolio-view-detail"
                        onClick={() => setSelectedWedding(wedding)}
                        className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {portfolio.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={7}>
                    No se encontraron bodas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedWedding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="portfolio-detail-modal">
          <div className="w-full max-w-2xl rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedWedding.couple}</h2>
                <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                  Evento el {selectedWedding.eventDate}
                </p>
              </div>
              <button type="button" className="text-sm text-[var(--color-text-soft,#6b7280)]" onClick={() => setSelectedWedding(null)}>
                Cerrar
              </button>
            </header>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-lg border border-soft px-3 py-3">
                <h3 className="font-medium">Resumen</h3>
                <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-soft,#6b7280)]">
                  <li>Owner: {selectedWedding.owner}</li>
                  <li>Estado: {statusLabels[selectedWedding.status] || selectedWedding.status}</li>
                  <li>Confirmados: {selectedWedding.confirmedGuests}</li>
                  <li>Contratos firmados: {selectedWedding.signedContracts}</li>
                </ul>
              </div>
              <div className="rounded-lg border border-soft px-3 py-3">
                <h3 className="font-medium">Notas</h3>
                <p className="mt-2 text-xs text-[var(--color-text-soft,#6b7280)]">
                  Información ficticia para la vista previa del panel administrativo.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="portfolio-export-pdf"
                className="rounded-md border border-soft px-3 py-1 text-xs hover:bg-[var(--color-bg-soft,#f3f4f6)]"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortfolio;
