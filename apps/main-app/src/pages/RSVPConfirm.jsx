import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import useTranslations from '../hooks/useTranslations';
import { get as apiGet, put as apiPut } from '../services/apiClient';

function RSVPConfirm() {
  const { token } = useParams();
  const { t } = useTranslations();
  const [guest, setGuest] = useState(null);
  const [status, setStatus] = useState('accepted');
  const [companions, setCompanions] = useState(0);
  const [allergens, setAllergens] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const res = await apiGet(`/api/rsvp/by-token/${token}`);
        if (!res.ok) throw new Error(t('public.rsvp.errors.fetchNotFound'));
        const data = await res.json();
        setGuest(data);
        setStatus(data.status === 'rejected' ? 'rejected' : 'accepted');
        setCompanions(data.companions || 0);
        setAllergens(data.allergens || '');
      } catch (err) {
        toast.error(err?.message || t('public.rsvp.toasts.fetchError'));
      } finally {
        setLoading(false);
      }
    };
    fetchGuest();
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await apiPut(`/api/rsvp/by-token/${token}`, {
        status,
        companions: Number(companions),
        allergens,
      });
      if (!res.ok) throw new Error(t('public.rsvp.errors.submit'));
      toast.success(t('public.rsvp.toasts.submitSuccess'));
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.message || t('public.rsvp.toasts.submitError'));
    }
  };

  if (loading) return <div className="p-6 text-center">{t('public.rsvp.loading')}</div>;
  if (!guest) return <div className="p-6 text-center">{t('public.rsvp.notFound')}</div>;

  if (submitted) {
    return (
      <div className="p-6 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {t('public.rsvp.thanksTitle', { name: guest.name })}
        </h1>
        <p>{t('public.rsvp.thanksDescription')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('public.rsvp.title')}</h1>
      <p className="mb-4">
        {t('public.rsvp.greeting', { name: guest.name })}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium mr-4">{t('public.rsvp.question')}</label>
          <label className="mr-4">
            <input
              type="radio"
              value="accepted"
              checked={status === 'accepted'}
              onChange={() => setStatus('accepted')}
            />{' '}
            {t('public.rsvp.statusOptions.accepted')}
          </label>
          <label>
            <input
              type="radio"
              value="rejected"
              checked={status === 'rejected'}
              onChange={() => setStatus('rejected')}
            />{' '}
            {t('public.rsvp.statusOptions.rejected')}
          </label>
        </div>
        <div>
          <label className="font-medium block mb-1">
            {t('public.rsvp.companionsLabel')}
          </label>
          <input
            type="number"
            min="0"
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="font-medium block mb-1">
            {t('public.rsvp.allergensLabel')}
          </label>
          <textarea
            value={allergens}
            onChange={(e) => setAllergens(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            rows={3}
            placeholder={t('public.rsvp.messagePlaceholder')}
          />
        </div>
        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded"
        >
          {t('public.rsvp.submit')}
        </button>
      </form>
    </div>
  );
}

export default RSVPConfirm;
