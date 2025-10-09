import React, { useState } from 'react';

import { reportsScheduled } from '../../data/adminMock';

const AdminReports = () => {
  const [template, setTemplate] = useState('global');
  const [recipients, setRecipients] = useState('');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Reportes programados</h1>
          <button
            type="button"
            data-testid="admin-report-generate"
            className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
          >
            Generar informe
          </button>
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-xs uppercase text-[var(--color-text-soft,#6b7280)]">
            <tr>
              <th className="py-2">Nombre</th>
              <th className="py-2">Cadencia</th>
              <th className="py-2">Destinatarios</th>
              <th className="py-2">Formato</th>
              <th className="py-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {reportsScheduled.map((report) => (
              <tr key={report.id}>
                <td className="py-3">{report.name}</td>
                <td className="py-3">{report.cadence}</td>
                <td className="py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
                  {report.recipients.join(', ')}
                </td>
                <td className="py-3">{report.format}</td>
                <td className="py-3">{report.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm max-w-xl">
        <h2 className="text-sm font-semibold">Generar informe on-demand</h2>
        <form className="mt-4 space-y-4">
          <div className="space-y-1 text-sm">
            <label htmlFor="report-template" className="font-medium">
              Plantilla
            </label>
            <select
              id="report-template"
              data-testid="admin-report-template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2"
            >
              <option value="global">Métricas globales</option>
              <option value="portfolio">Portfolio</option>
              <option value="ia">Costes IA</option>
              <option value="email">Rendimiento emails</option>
            </select>
          </div>

          <div className="space-y-1 text-sm">
            <label htmlFor="report-recipients" className="font-medium">
              Destinatarios (separados por coma)
            </label>
            <input
              id="report-recipients"
              data-testid="admin-report-recipients"
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
              className="w-full rounded-md border border-soft px-3 py-2"
              placeholder="direccion@lovenda.com"
            />
          </div>

          <button
            type="button"
            data-testid="admin-report-submit"
            className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminReports;