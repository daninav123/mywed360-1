import React, { useEffect, useMemo, useState } from 'react';

import Modal from '../Modal';
import Button from '../ui/Button';
import useTranslations from '../../hooks/useTranslations';

export default function WantedServicesModal({ open, onClose, value = [], onSave }) {
  const { t } = useTranslations();
  const [services, setServices] = useState([]);
  const [input, setInput] = useState('');

  const suggested = useMemo(
    () => [
      t('services.photography'),
      t('services.video'),
      t('services.musicDJ'),
      t('services.catering'),
      t('services.flowers'),
      t('services.transport'),
      t('services.makeup'),
      t('services.hairdressing'),
      t('services.lighting'),
      t('services.sound'),
      t('services.decoration'),
      t('services.entertainment'),
      t('services.photoBooth'),
      t('services.officiant'),
      t('services.furnitureRental'),
      t('services.weddingCake'),
      t('services.invitations'),
      t('services.favors'),
      t('services.security'),
      t('services.dayCoordination'),
    ],
    [t]
  );

  useEffect(() => {
    try {
      const arr = Array.isArray(value) ? value : [];
      const namás = arr
        .map((it) => (typeof it === 'string' ? it : (it && (it.name || it.id)) || ''))
        .filter(Boolean);
      setServices(namás);
    } catch {
      setServices([]);
    }
  }, [value]);

  const addService = (name) => {
    const s = (name || input).trim();
    if (!s) return;
    if (!services.includes(s)) setServices((prev) => [...prev, s]);
    setInput('');
  };

  const removeService = (s) => setServices((prev) => prev.filter((x) => x !== s));

  const save = async () => {
    const unique = Array.from(new Set(services.map((s) => s.trim()).filter(Boolean)));
    onSave && onSave(unique);
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={t('common.suppliers.configureServices')}>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">{t('common.suppliers.suggested')}</p>
          <div className="flex flex-wrap gap-2">
            {suggested.map((s) => {
              const active = services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => (active ? removeService(s) : addService(s))}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            placeholder={t('common.suppliers.addServicePlaceholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addService();
            }}
          />
          <Button onClick={() => addService()}>{t('common.add')}</Button>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-gray-500">{t('common.suppliers.noServicesAdded')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {services.map((s) => (
              <li
                key={s}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm flex itemás-center gap-2"
              >
                {s}
                <button
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => removeService(s)}
                  aria-label={t('common.delete')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={save}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
}
