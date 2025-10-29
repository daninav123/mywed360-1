import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Euro,
  Mail,
  Phone,
  MessageSquare,
  Send,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

export default function SupplierRequestDetail() {
  const { id, requestId } = useParams();
  const navigate = useNavigate();
  const { t, tPlural, format } = useTranslations();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [error, setError] = useState('');

  const [responseData, setResponseData] = useState({
    message: '',
    quotedPrice: { min: '', max: '', currency: 'EUR' },
    template: '',
  });

  const defaults = useMemo(
    () => ({
      coupleName: t('common.suppliers.requestDetail.defaults.coupleName'),
      weddingDate: t('common.suppliers.requestDetail.defaults.weddingDate'),
      location: t('common.suppliers.requestDetail.defaults.location'),
      minPrice: t('common.suppliers.requestDetail.defaults.minPrice'),
      maxPrice: t('common.suppliers.requestDetail.defaults.maxPrice'),
    }),
    [t]
  );

  const templates = useMemo(
    () => [
      {
        id: 'standard',
        name: t('common.suppliers.requestDetail.templates.standard.name'),
        message: t('common.suppliers.requestDetail.templates.standard.body'),
      },
      {
        id: 'availability',
        name: t('common.suppliers.requestDetail.templates.availability.name'),
        message: t('common.suppliers.requestDetail.templates.availability.body'),
      },
      {
        id: 'detailed',
        name: t('common.suppliers.requestDetail.templates.detailed.name'),
        message: t('common.suppliers.requestDetail.templates.detailed.body'),
      },
      {
        id: 'more_info',
        name: t('common.suppliers.requestDetail.templates.moreInfo.name'),
        message: t('common.suppliers.requestDetail.templates.moreInfo.body'),
      },
    ],
    [t]
  );

  const tips = useMemo(
    () => [
      t('common.suppliers.requestDetail.tips.respondFast'),
      t('common.suppliers.requestDetail.tips.personalize'),
      t('common.suppliers.requestDetail.tips.scheduleCall'),
    ],
    [t]
  );

  const statusLabels = useMemo(
    () => ({
      new: t('common.suppliers.requestDetail.status.new'),
      viewed: t('common.suppliers.requestDetail.status.viewed'),
      responded: t('common.suppliers.requestDetail.status.responded'),
    }),
    [t]
  );

  const formatDateTime = useCallback(
    (value) => {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return format.datetime(date);
    },
    [format]
  );

  const formatNumber = useCallback(
    (value) => {
      if (value === null || value === undefined || value === '') return value;
      const numeric = Number(value);
      return Number.isNaN(numeric) ? value : format.number(numeric);
    },
    [format]
  );

  const fetchRequestDetail = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          navigate('/supplier/login');
          return;
        }
        throw new Error(t('common.suppliers.requestDetail.errors.load'));
      }

      const data = await response.json();
      setRequest(data.request);

      if (data.request.status === 'new' || data.request.status === 'viewed') {
        setShowResponseForm(true);
      }
    } catch (err) {
      console.error('[SupplierRequestDetail] load error:', err);
      setError(err.message || t('common.suppliers.requestDetail.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [requestId, navigate, t]);

  useEffect(() => {
    const token = localStorage.getItem('supplier_token');
    if (!token) {
      navigate('/supplier/login');
      return;
    }

    if (!requestId) {
      setError(t('common.suppliers.requestDetail.errors.notFound'));
      setLoading(false);
      return;
    }

    fetchRequestDetail();
  }, [requestId, navigate, t, fetchRequestDetail]);

  const handleApplyTemplate = (template) => {
    let message = template.message;

    if (request) {
      message = message
        .replace(/{coupleName}/g, request.coupleName || defaults.coupleName)
        .replace(/{weddingDate}/g, request.weddingDate || defaults.weddingDate)
        .replace(/{location}/g, request.location?.city || defaults.location)
        .replace(/{minPrice}/g, responseData.quotedPrice.min || defaults.minPrice)
        .replace(/{maxPrice}/g, responseData.quotedPrice.max || defaults.maxPrice);
    }

    setResponseData({
      ...responseData,
      message,
      template: template.id,
    });
  };

  const handleSubmitResponse = async (event) => {
    event.preventDefault();
    setResponding(true);

    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: responseData.message,
          quotedPrice:
            responseData.quotedPrice.min || responseData.quotedPrice.max
              ? {
                  min: Number(responseData.quotedPrice.min) || 0,
                  max: Number(responseData.quotedPrice.max) || 0,
                  currency: responseData.quotedPrice.currency,
                }
              : null,
        }),
      });

      if (!response.ok) {
        throw new Error(t('common.suppliers.requestDetail.errors.send'));
      }

      window.alert(t('common.suppliers.requestDetail.alerts.sent'));
      navigate(`/supplier/dashboard/${id}`);
    } catch (err) {
      console.error('[SupplierRequestDetail] submit error:', err);
      window.alert(t('common.suppliers.requestDetail.alerts.error', { message: err.message }));
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: 'var(--color-primary)' }}
          />
          <p className="mt-4" style={{ color: 'var(--color-muted)' }}>
            {t('common.suppliers.requestDetail.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="rounded-lg shadow-lg p-8 max-w-md"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-danger)' }}>
            {t('common.suppliers.requestDetail.errors.title')}
          </h2>
          <p className="mb-4" style={{ color: 'var(--color-muted)' }}>
            {error || t('common.suppliers.requestDetail.errors.notFound')}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="w-full px-4 py-2 text-white rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('common.suppliers.requestDetail.navigation.back')}
          </button>
        </div>
      </div>
    );
  }

  const alreadyResponded = request.status === 'responded';
  const receivedAt = formatDateTime(request.receivedAt);
  const respondedAt = formatDateTime(request.respondedAt);
  const weddingDate = request.weddingDate || defaults.weddingDate;
  const coupleStatusLabel = statusLabels[request.status] || '';
  const charCountLabel = tPlural(
    'common.suppliers.requestDetail.response.charCount',
    responseData.message.length,
    { count: responseData.message.length }
  );

  const budgetRange =
    request.budget &&
    t('common.suppliers.requestDetail.labels.budgetRange', {
      min: formatNumber(request.budget.min),
      max: formatNumber(request.budget.max),
      currency: request.budget.currency,
    });

  const quotedRange =
    request.response?.quotedPrice &&
    t('common.suppliers.requestDetail.labels.quotedRange', {
      min: formatNumber(request.response.quotedPrice.min),
      max: formatNumber(request.response.quotedPrice.max),
      currency: request.response.quotedPrice.currency,
    });

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="layout-container max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(`/supplier/dashboard/${id}`)}
          className="flex items-center gap-2 mb-6"
          style={{ color: 'var(--color-muted)' }}
        >
          <ArrowLeft size={20} />
          {t('common.suppliers.requestDetail.navigation.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className="rounded-lg shadow-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                    {request.coupleName}
                  </h1>
                  {coupleStatusLabel && (
                    <span
                      className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                      style={{
                        backgroundColor:
                          request.status === 'responded'
                            ? 'var(--color-bg)'
                            : request.status === 'viewed'
                              ? 'rgba(94, 187, 255, 0.1)'
                              : 'rgba(34, 197, 94, 0.1)',
                        color:
                          request.status === 'responded'
                            ? 'var(--color-text)'
                            : request.status === 'viewed'
                              ? 'var(--color-info)'
                              : 'var(--color-success)',
                      }}
                    >
                      {coupleStatusLabel}
                    </span>
                  )}
                </div>
                {receivedAt && (
                  <div className="text-right text-sm" style={{ color: 'var(--color-muted)' }}>
                    <Clock size={16} className="inline mr-1" />
                    {t('common.suppliers.requestDetail.meta.receivedAt', { value: receivedAt })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <Calendar size={24} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.requestDetail.labels.weddingDate')}
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {weddingDate}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <MapPin size={24} style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.requestDetail.labels.location')}
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {request.location?.city || defaults.location}
                    </p>
                  </div>
                </div>

                {request.guestCount && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <Users size={24} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {t('common.suppliers.requestDetail.labels.guests')}
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {formatNumber(request.guestCount)}
                      </p>
                    </div>
                  </div>
                )}

                {budgetRange && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <Euro size={24} style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {t('common.suppliers.requestDetail.labels.budget')}
                      </p>
                      <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {budgetRange}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {request.message && (
                <div className="border-t pt-6">
                  <h3
                    className="font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <MessageSquare size={20} />
                    {t('common.suppliers.requestDetail.labels.messageFromCouple')}
                  </h3>
                  <p
                    className="whitespace-pre-wrap p-4 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  >
                    {request.message}
                  </p>
                </div>
              )}

              {alreadyResponded && request.response && (
                <div className="border-t pt-6 mt-6">
                  <h3
                    className="font-semibold mb-3 flex items-center gap-2"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                    {t('common.suppliers.requestDetail.labels.responseSent')}
                  </h3>
                  <div
                    className="border rounded-lg p-4"
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderColor: 'var(--color-success)',
                    }}
                  >
                    <p className="whitespace-pre-wrap mb-4" style={{ color: 'var(--color-text)' }}>
                      {request.response.message}
                    </p>
                    {quotedRange && (
                      <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        <strong>{t('common.suppliers.requestDetail.labels.quotedPrice')}</strong>{' '}
                        {quotedRange}
                      </div>
                    )}
                    {respondedAt && (
                      <div className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                        {t('common.suppliers.requestDetail.labels.sentAt', { value: respondedAt })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showResponseForm && !alreadyResponded && (
              <div
                className="rounded-lg shadow-lg p-6"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
                  {t('common.suppliers.requestDetail.response.title')}
                </h2>

                <form onSubmit={handleSubmitResponse} className="space-y-6">
                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('common.suppliers.requestDetail.labels.templateOptional')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleApplyTemplate(template)}
                          className="px-4 py-3 text-left border rounded-lg transition-colors"
                          style={{
                            borderColor:
                              responseData.template === template.id
                                ? 'var(--color-primary)'
                                : 'var(--color-border)',
                            backgroundColor:
                              responseData.template === template.id
                                ? 'rgba(94, 187, 255, 0.1)'
                                : 'transparent',
                          }}
                        >
                          <FileText
                            size={16}
                            className="inline mr-2"
                            style={{ color: 'var(--color-primary)' }}
                          />
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('common.suppliers.requestDetail.labels.messageRequired')}
                    </label>
                    <textarea
                      value={responseData.message}
                      onChange={(event) =>
                        setResponseData({ ...responseData, message: event.target.value })
                      }
                      rows={12}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
                      style={{
                        borderColor: 'var(--color-border)',
                        '--tw-ring-color': 'var(--color-primary)',
                      }}
                      placeholder={t('common.suppliers.requestDetail.placeholders.message')}
                      required
                    />
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                      {charCountLabel}
                    </p>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-3"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('common.suppliers.requestDetail.labels.quotedOptional')}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {t('common.suppliers.requestDetail.labels.rangeFrom')}
                        </label>
                        <input
                          type="number"
                          value={responseData.quotedPrice.min}
                          onChange={(event) =>
                            setResponseData({
                              ...responseData,
                              quotedPrice: { ...responseData.quotedPrice, min: event.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          style={{ borderColor: 'var(--color-border)' }}
                          placeholder={t('common.suppliers.requestDetail.placeholders.minAmount')}
                          min="0"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {t('common.suppliers.requestDetail.labels.rangeTo')}
                        </label>
                        <input
                          type="number"
                          value={responseData.quotedPrice.max}
                          onChange={(event) =>
                            setResponseData({
                              ...responseData,
                              quotedPrice: { ...responseData.quotedPrice, max: event.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          style={{ borderColor: 'var(--color-border)' }}
                          placeholder={t('common.suppliers.requestDetail.placeholders.maxAmount')}
                          min="0"
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          {t('common.suppliers.requestDetail.labels.rangeCurrency')}
                        </label>
                        <select
                          value={responseData.quotedPrice.currency}
                          onChange={(event) =>
                            setResponseData({
                              ...responseData,
                              quotedPrice: {
                                ...responseData.quotedPrice,
                                currency: event.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={responding}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Send size={20} />
                      {responding
                        ? t('common.suppliers.requestDetail.response.submitting')
                        : t('common.suppliers.requestDetail.response.submit')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div
              className="rounded-lg shadow-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                {t('common.suppliers.requestDetail.labels.contactInfo')}
              </h3>

              <div className="space-y-4">
                {request.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {t('common.suppliers.requestDetail.labels.email')}
                      </p>
                      <a
                        href={`mailto:${request.contactEmail}`}
                        className="font-medium hover:underline break-all"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {request.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {request.contactPhone && (
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {t('common.suppliers.requestDetail.labels.phone')}
                      </p>
                      <a
                        href={`tel:${request.contactPhone}`}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {request.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="rounded-lg shadow-lg p-6 text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <h4 className="font-semibold mb-3">
                {t('common.suppliers.requestDetail.tips.title')}
              </h4>
              <ul className="space-y-2 text-sm">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
