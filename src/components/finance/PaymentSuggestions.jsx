import React from 'react';

import { Button, Card } from '../ui';
import TransactionForm from './TransactionForm';
import { getPaymentSuggestions } from '../../services/EmailInsightsService';
import Modal from '../Modal';

export default function PaymentSuggestions({ onCreateTransaction, isLoading, providers = [] }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const suggestions = await getPaymentSuggestions({ folder: 'inbox', limit: 50 });
      setItems(suggestions);
    } catch (e) {
      setError('No se pudieron cargar las sugerencias de pago');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const emailDomain = (addr) => {
    try { return String(addr || '').split('@')[1]?.toLowerCase() || ''; } catch { return ''; }
  };
  const linkDomain = (url) => {
    try { const u = new URL(url); return u.hostname.replace(/^www\./,'').toLowerCase(); } catch { return ''; }
  };
  const openRegister = (s) => {
    const from = String(s.from || '').toLowerCase();
    const fromDom = emailDomain(from);
    let providerName = '';
    if (Array.isArray(providers) && providers.length) {
      // 1) match by email exact
      const byEmail = providers.find((p) => p?.email && from.includes(String(p.email).toLowerCase()));
      if (byEmail) providerName = byEmail.name || '';
      // 2) match by domain (provider email domain or website domain)
      if (!providerName && fromDom) {
        const byDomain = providers.find((p) => {
          const pd = emailDomain(p?.email || '');
          const ld = linkDomain(p?.link || p?.website || '');
          return (pd && fromDom.includes(pd)) || (ld && fromDom.includes(ld));
        });
        if (byDomain) providerName = byDomain.name || '';
      }
      // 3) match by provider name in subject
      if (!providerName) {
        const bySubject = providers.find((p) => p?.name && String(s.subject || '').toLowerCase().includes(String(p.name).toLowerCase()));
        if (bySubject) providerName = bySubject.name || '';
      }
    }
    const isIncome = (s.direction || 'outgoing') === 'incoming';
    const amt = typeof s.amount === 'number' && !Number.isNaN(s.amount) ? String(s.amount) : '';
    setPrefill({
      concept: `Pago proveedor - ${s.subject || ''}`.slice(0, 80),
      amount: amt,
      date: (s.date || '').slice(0, 10),
      type: isIncome ? 'income' : 'expense',
      category: '',
      description: `Desde email: ${s.subject}`,
      provider: providerName,
      status: isIncome ? 'received' : 'paid',
      paidAmount: amt,
    });
    setOpen(true);
  };

  return (
    <Card className="p-4 border-soft bg-[var(--color-surface)]/80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Sugerencias de pago desde emails</h3>
        <Button variant="outline" size="sm" onClick={load} disabled={loading || isLoading}>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </Button>
      </div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-600">Cargando…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">Sin sugerencias disponibles</div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((s, i) => (
            <div key={`${s.mailId}_${i}`} className="flex items-center justify-between border rounded p-2 text-sm bg-white/60">
              <div className="min-w-0">
                <div className="font-medium truncate" title={s.subject}>{s.subject || '(Sin asunto)'}</div>
                <div className="text-[color:var(--color-text)]/70">
                  {s.rawAmount || s.amount} {s.currency || ''} · {new Date(s.date).toLocaleDateString()} · {s.direction === 'incoming' ? 'Ingreso' : 'Gasto'}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" onClick={() => openRegister(s)}>Registrar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar transacción">
        <TransactionForm
          transaction={prefill}
          isLoading={isLoading}
          onCancel={() => setOpen(false)}
          onSave={async (data) => {
            try {
              const res = await onCreateTransaction?.(data);
              if (!res || res.success) {
                setOpen(false);
                // Remove first matching suggestion by subject/amount
                setItems((prev) => prev.filter((x) => !(x.subject === (prefill?.concept?.slice(17) || '') && String(x.amount||'') === String(prefill?.amount||''))));
              }
            } catch {}
          }}
        />
      </Modal>
    </Card>
  );
}
