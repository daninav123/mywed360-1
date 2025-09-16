import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function SupplierPortal() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [availability, setAvailability] = useState('unknown');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState(['']);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/supplier-portal/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const j = await res.json().catch(()=>({}));
          throw new Error(j?.error || `http-${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setState({ loading: false, error: '', data: json });
        setCurrency('EUR');
      } catch (e) {
        if (!mounted) return;
        setState({ loading: false, error: e?.message || 'error', data: null });
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const w = state.data?.wedding || {};
  const s = state.data?.supplier || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const cleanLinks = links.map(l => String(l||'').trim()).filter(Boolean).slice(0,5);
      const body = {
        availability,
        message,
        budget: (description || amount) ? { description, amount: Number(amount||0), currency, links: cleanLinks } : null,
      };
      const res = await fetch(`/api/supplier-portal/${encodeURIComponent(token)}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(()=>({}));
      if (!res.ok || j?.error) throw new Error(j?.error || `http-${res.status}`);
      setSent(true);
    } catch (e) {
      alert(`No se pudo enviar: ${e?.message || e}`);
    } finally {
      setSending(false);
    }
  };

  if (state.loading) return <div className="p-6 text-center">Cargando…</div>;
  if (state.error) return <div className="p-6 text-center text-red-700">Enlace no válido o expirado</div>;

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">¡Gracias!</h1>
          <p className="text-gray-600">Hemos recibido su respuesta. Nos pondremos en contacto en breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border rounded-xl p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Portal del Proveedor</h1>
          <p className="text-gray-600">Boda: <strong>{w.name}</strong> {w.date ? `· ${String(w.date).slice(0,10)}` : ''} {w.location ? `· ${w.location}` : ''}</p>
          <p className="text-gray-600">Proveedor: <strong>{s.name}</strong> {s.service ? `· ${s.service}` : ''}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Disponibilidad</label>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-1"><input type="radio" name="avail" checked={availability==='available'} onChange={()=>setAvailability('available')} /> Disponible</label>
              <label className="inline-flex items-center gap-1"><input type="radio" name="avail" checked={availability==='unavailable'} onChange={()=>setAvailability('unavailable')} /> No disponible</label>
              <label className="inline-flex items-center gap-1"><input type="radio" name="avail" checked={availability==='unknown'} onChange={()=>setAvailability('unknown')} /> Por confirmar</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mensaje</label>
            <textarea className="w-full border rounded p-2" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Comentarios, dudas o condiciones" />
          </div>

          <div className="border rounded p-3">
            <p className="font-medium mb-2">Presupuesto (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input className="border rounded p-2" placeholder="Importe" type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} />
              <select className="border rounded p-2" value={currency} onChange={(e)=>setCurrency(e.target.value)}>
                {['EUR','USD','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="border rounded p-2" placeholder="Enlaces a archivos (Drive, Dropbox)" value={links[0]} onChange={(e)=>{ const next=[...links]; next[0]=e.target.value; setLinks(next); }} />
            </div>
            <textarea className="w-full border rounded p-2" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Descripción o detalle del presupuesto" />
          </div>

          <div className="text-right">
            <button type="submit" disabled={sending} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">{sending ? 'Enviando…' : 'Enviar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

