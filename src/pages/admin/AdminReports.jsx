import React, { useEffect, useState } from 'react';

import { getReportsData, generateReport } from '../../services/adminDataService';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [template, setTemplate] = useState('global');
  const [recipients, setRecipients] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadReports = async () => {
      setLoading(true);
      const data = await getReportsData();
      if (!mounted) return;
      setReports(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    loadReports();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateReport = () => {
    setShowGenerateModal(true);
  };

  const handleSubmitReport = async () => {
    setError('');
    setSuccess('');

    // Validar recipients
    const recipientList = recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (recipientList.length === 0) {
      setError('Debes especificar al menos un destinatario');
      return;
    }

    // Validar formato de emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipientList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      setError(`Emails inválidos: ${invalidEmails.join(', ')}`);
      return;
    }

    setGenerating(true);

    try {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      };

      await generateReport(template, recipientList, dateRange);
      
      setSuccess(`✅ Reporte "${template}" enviado a ${recipientList.length} destinatario(s)`);
      setRecipients('');
      setTemplate('global');
      
      // Recargar lista de reportes
      const data = await getReportsData();
      setReports(Array.isArray(data) ? data : []);
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('[AdminReports] Error generando reporte:', err);
      setError(err.message || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[var(--color-text-soft,#6b7280)]">
        Cargando reportes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Reportes programados</h1>
          <button
            type="button"
            data-testid="admin-report-generate"
            onClick={handleGenerateReport}
            disabled={generating}
            className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-50 disabled:cursor-not-allowed"
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
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="py-3">{report.name}</td>
                <td className="py-3">{report.cadence}</td>
                <td className="py-3 text-xs text-[var(--color-text-soft,#6b7280)]">
                  {Array.isArray(report.recipients) ? report.recipients.join(', ') : ''}
                </td>
                <td className="py-3">{report.format}</td>
                <td className="py-3">{report.status}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td className="py-6 text-center text-sm text-[var(--color-text-soft,#6b7280)]" colSpan={5}>
                  No hay reportes configurados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm max-w-xl">
        <h2 className="text-sm font-semibold">Generar informe on-demand</h2>
        <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmitReport(); }}>
          <div className="space-y-1 text-sm">
            <label htmlFor="report-template" className="font-medium">
              Plantilla
            </label>
            <select
              id="report-template"
              data-testid="admin-report-template"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              disabled={generating}
              className="w-full rounded-md border border-soft px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={generating}
              className="w-full rounded-md border border-soft px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="direccion@lovenda.com, admin@lovenda.com"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            data-testid="admin-report-submit"
            disabled={generating}
            className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Generando...' : 'Enviar'}
          </button>
        </form>
      </div>

      {/* Modal para generar informe desde el header */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generar informe</h2>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-sm text-[var(--color-text-soft,#6b7280)] hover:text-gray-900"
              >
                Cerrar
              </button>
            </header>
            <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
              Usa el formulario de abajo para generar un informe on-demand. Selecciona la plantilla y añade los destinatarios.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
