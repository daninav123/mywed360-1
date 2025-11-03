import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import useTranslations from '../hooks/useTranslations';

export default function SupplierPortal() {
  const { token } = useParams();
  const { t } = useTranslations();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [availability, setAvailability] = useState('unknown');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState(['']);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const availabilityOptions = useMemo(
    () => [
      { value: 'available', label: t('public.supplierPortal.availability.available') },
      { value: 'unavailable', label: t('public.supplierPortal.availability.unavailable') },
      { value: 'unknown', label: t('public.supplierPortal.availability.unknown') },
    ],
    [t]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/supplier-portal/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
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
    return () => {
      mounted = false;
    };
  }, [token]);

  const w = state.data?.wedding || {};
  const s = state.data?.supplier || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const cleanLinks = links
        .map((l) => String(l || '').trim())
        .filter(Boolean)
        .slice(0, 5);
      const body = {
        availability,
        message,
        budget:
          description || amount
            ? { description, amount: Number(amount || 0), currency, links: cleanLinks }
            : null,
      };
      const res = await fetch(`/api/supplier-portal/${encodeURIComponent(token)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) throw new Error(j?.error || `http-${res.status}`);
      setSent(true);
    } catch (e) {
      window.alert(
        t('public.supplierPortal.alerts.submitError', {
          message: String(e?.message || e),
        })
      );
    } finally {
      setSending(false);
    }
  };

  if (state.loading)
    return (
      <div className="p-6 text-center">
        {t('public.supplierPortal.loading')}
      </div>
    );
  if (state.error) {
    let message = 'Ha ocurrido un error. Por favor, intenta de nuevo.';
    let isTokenError = false;
    
    if (state.error === 'invalid_token' || state.error === 'not_found') {
      isTokenError = true;
      message = 'Este enlace no es válido o ha expirado.';
    } else if (state.error === 'http-404') {
      isTokenError = true;
      message = 'Este enlace no existe. Verifica que la URL esté completa.';
    } else if (state.error && state.error !== 'error') {
      message = `Error: ${state.error}`;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-xl p-6">
          <div className="text-center mb-4">
            <div className="text-red-600 text-4xl mb-2">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isTokenError ? 'Enlace no válido' : 'Error'}
            </h2>
            <p className="text-red-700">{message}</p>
          </div>
          
          {isTokenError && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-sm text-left">
              <p className="font-medium text-blue-900 mb-2">Posibles causas:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>El enlace ha expirado</li>
                <li>El enlace ya fue utilizado</li>
                <li>La URL está incompleta (falta copiar toda la dirección)</li>
                <li>La pareja canceló la solicitud</li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
            {isTokenError && (
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Volver
              </button>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>
              Si crees que esto es un error, contacta con la pareja que te envió este enlace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border rounded-xl p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">
            {t('public.supplierPortal.thanksTitle')}
          </h1>
          <p className="text-gray-600">
            {t('public.supplierPortal.thanksDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border rounded-xl p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">
            {t('public.supplierPortal.title')}
          </h1>
          <p className="text-gray-600">
            {t('public.supplierPortal.labels.wedding')}:{' '}
            <strong>{w.name}</strong> {w.date ? `· ${String(w.date).slice(0, 10)}` : ''}{' '}
            {w.location ? `· ${w.location}` : ''}
          </p>
          <p className="text-gray-600">
            {t('public.supplierPortal.labels.supplier')}:{' '}
            <strong>{s.name}</strong> {s.service ? `· ${s.service}` : ''}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('public.supplierPortal.labels.availability')}
            </label>
            <div className="flex gap-4 text-sm">
              {availabilityOptions.map((option) => (
                <label key={option.value} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    name="avail"
                    checked={availability === option.value}
                    onChange={() => setAvailability(option.value)}
                  />{' '}
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('public.supplierPortal.labels.message')}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('public.supplierPortal.placeholders.message')}
            />
          </div>

          <div className="border rounded p-3">
            <p className="font-medium mb-2">
              {t('public.supplierPortal.labels.budget')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <input
                className="border rounded p-2"
                placeholder={t('public.supplierPortal.placeholders.amount')}
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select
                className="border rounded p-2"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {['EUR', 'USD', 'GBP'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className="border rounded p-2"
                placeholder={t('public.supplierPortal.placeholders.links')}
                value={links[0]}
                onChange={(e) => {
                  const next = [...links];
                  next[0] = e.target.value;
                  setLinks(next);
                }}
              />
            </div>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('public.supplierPortal.placeholders.description')}
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
            >
              {sending
                ? t('public.supplierPortal.buttons.submitting')
                : t('public.supplierPortal.buttons.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
