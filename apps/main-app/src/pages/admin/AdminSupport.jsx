import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { getSupportData, respondToTicket } from '../../services/adminDataService';

const initialSummary = {
  open: 0,
  pending: 0,
  resolved: 0,
  slaAverage: '—',
  nps: null,
};

const AdminSupport = () => {
  const [summary, setSummary] = useState(initialSummary);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [responding, setResponding] = useState(false);

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;
    
    setResponding(true);
    try {
      await respondToTicket(
        selectedTicket.id, 
        responseMessage, 
        newStatus || undefined
      );
      
      // Actualizar el ticket localmente si se cambió el estado
      if (newStatus) {
        setTickets(prev => 
          prev.map(t => 
            t.id === selectedTicket.id 
              ? { ...t, status: newStatus } 
              : t
          )
        );
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      
      // Limpiar el formulario
      setResponseMessage('');
      setNewStatus('');
      
      toast.success(t('admin.support.responseSuccess'));
    } catch (error) {
      // console.error('[AdminSupport] Error sending response:', error);
      toast.error(t('admin.support.responseError', { message: error.message }));
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadSupport = async () => {
      setLoading(true);
      const data = await getSupportData();
      if (!mounted) return;
      const currentSummary = data?.summary || initialSummary;
      const currentTickets = Array.isArray(data?.tickets) ? data.tickets : [];
      setSummary({
        open: currentSummary.open ?? initialSummary.open,
        pending: currentSummary.pending ?? initialSummary.pending,
        resolved: currentSummary.resolved ?? initialSummary.resolved,
        slaAverage: currentSummary.slaAverage || initialSummary.slaAverage,
        nps: currentSummary.nps ?? initialSummary.nps,
      });
      setTickets(currentTickets);
      setSelectedTicket(currentTickets.length ? currentTickets[0] : null);
      setLoading(false);
    };
    loadSupport();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-soft bg-surface px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
        Cargando soporte...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Soporte</h1>
        <p className="text-sm text-[color:var(--color-text-soft)]">Tickets y satisfacción de usuarios profesionales.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm" data-testid="support-kpi-tickets-open">
          <p className="text-xs uppercase text-[color:var(--color-text-soft)]">Tickets abiertos</p>
          <p className="mt-3 text-2xl font-semibold">{summary.open}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[color:var(--color-text-soft)]">Tickets pendientes</p>
          <p className="mt-3 text-2xl font-semibold">{summary.pending}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[color:var(--color-text-soft)]">Resueltos</p>
          <p className="mt-3 text-2xl font-semibold">{summary.resolved}</p>
        </article>
        <article className="rounded-xl border border-soft bg-surface px-4 py-5 shadow-sm">
          <p className="text-xs uppercase text-[color:var(--color-text-soft)]">SLA medio</p>
          <p className="mt-3 text-2xl font-semibold">{summary.slaAverage}</p>
        </article>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm p-4">
        <h2 className="text-sm font-semibold">NPS</h2>
        <div
          className="mt-4 flex h-36 items-center justify-center rounded-lg border border-dashed border-soft text-xs text-[color:var(--color-text-soft)]"
          data-testid="support-nps-chart"
        >
          {summary.npsDetails ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                NPS: {summary.nps ?? '—'}
              </div>
              <div className="text-xs space-y-1">
                <div>Promotores: {summary.npsDetails.promoters} ({Math.round((summary.npsDetails.promoters / summary.npsDetails.total) * 100)}%)</div>
                <div>Pasivos: {summary.npsDetails.passives} ({Math.round((summary.npsDetails.passives / summary.npsDetails.total) * 100)}%)</div>
                <div>Detractores: {summary.npsDetails.detractors} ({Math.round((summary.npsDetails.detractors / summary.npsDetails.total) * 100)}%)</div>
                <div className="pt-1 border-t">Total respuestas: {summary.npsDetails.total} (últimos 30 días)</div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">NPS: {summary.nps ?? '—'}</div>
              <div className="text-xs mt-1">Sin datos de feedback disponibles</div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-soft bg-surface shadow-sm">
        <header className="border-b border-soft px-4 py-3">
          <h2 className="text-sm font-semibold">Tickets</h2>
        </header>
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="divide-y divide-soft">
            {tickets.map((ticket) => (
              <button
                type="button"
                key={ticket.id}
                data-testid="support-ticket-row"
                onClick={() => setSelectedTicket(ticket)}
                className={
                  selectedTicket?.id === ticket.id
                    ? 'w-full px-4 py-3 text-left text-sm bg-[var(--color-bg-soft)]'
                    : 'w-full px-4 py-3 text-left text-sm'
                }
              >
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-xs text-[color:var(--color-text-soft)]">
                  {ticket.status} · {ticket.updatedAt}
                </p>
              </button>
            ))}
            {tickets.length === 0 && (
              <div className="px-4 py-6 text-sm text-[color:var(--color-text-soft)]">
                No hay tickets registrados.
              </div>
            )}
          </div>
          <div className="px-4 py-4" data-testid="support-ticket-detail">
            {selectedTicket ? (
              <div className="space-y-2 text-sm">
                <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                <p className="text-xs text-[color:var(--color-text-soft)]">Solicitado por {selectedTicket.requester}</p>
                <p className="text-xs text-[color:var(--color-text-soft)]">Estado: {selectedTicket.status}</p>
                <p className="text-xs text-[color:var(--color-text-soft)]">Actualizado: {selectedTicket.updatedAt}</p>
                <div className="space-y-4 mt-4">
                  <div className="rounded-md border border-soft p-4">
                    <h4 className="text-sm font-semibold mb-2">Responder al ticket</h4>
                    <textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Escribe tu respuesta..."
                      className="w-full px-3 py-2 border border-soft rounded-md text-sm"
                      rows="4"
                      disabled={responding}
                    />
                    <div className="flex items-center gap-3 mt-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="px-3 py-1 border border-soft rounded-md text-sm"
                        disabled={responding}
                      >
                        <option value="">Mantener estado actual</option>
                        <option value="pending">Pendiente</option>
                        <option value="resolved">Resuelto</option>
                        <option value="closed">Cerrado</option>
                      </select>
                      <button
                        onClick={handleSendResponse}
                        disabled={!responseMessage.trim() || responding}
                        className="px-4 py-1 bg-[var(--color-primary)] text-white rounded-md text-sm disabled:opacity-50"
                      >
                        {responding ? 'Enviando...' : 'Enviar respuesta'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[color:var(--color-text-soft)]">Selecciona un ticket para ver los detalles.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSupport;
