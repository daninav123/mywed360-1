import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';
import { getCheckoutSession } from '../../services/stripeService';

const PaymentSuccess = () => {
  const { t } = useTranslations();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      return;
    }

    getCheckoutSession(sessionId)
      .then((data) => {
        setSessionData(data);
        setStatus('success');

        const timeout = setTimeout(() => {
          navigate('/dashboard');
        }, 5000);

        return () => clearTimeout(timeout);
      })
      .catch((error) => {
        // console.error('Error verifying payment session:', error);
        setStatus('error');
      });
  }, [searchParams, navigate]);

  const statusLabel = useMemo(() => {
    if (!sessionData?.status) return '';
    if (sessionData.status === 'complete') {
      return t('public.payment.success.status.complete');
    }
    return sessionData.status;
  }, [sessionData?.status, t]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center " className="bg-page">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[color:var(--color-primary)] animate-spin mx-auto" />
          <p className="mt-4 " className="text-secondary">
            {t('public.payment.success.loadingMessage')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center  px-4" className="bg-page">
        <div className="max-w-md w-full  rounded-2xl shadow-lg p-8 text-center" className="bg-surface">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 " className="text-danger" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold " className="text-body">
            {t('public.payment.success.errorTitle')}
          </h2>
          <p className="mt-2 " className="text-secondary">
            {t('public.payment.success.errorDescription')}
          </p>
          <div className="mt-8 space-y-3">
            <Link
              to="/pricing"
              className="block w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
            >
              {t('public.payment.success.buttons.backPricing')}
            </Link>
            <Link
              to="/contact"
              className="block w-full rounded-md border  px-4 py-3 text-sm font-semibold  hover: focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2" className="border-default" className="text-body" className="bg-page"
            >
              {t('public.payment.success.buttons.contactSupport')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  px-4" className="bg-page">
      <div className="max-w-md w-full  rounded-2xl shadow-lg p-8 text-center" className="bg-surface">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 " className="text-success" />
        </div>

        <h2 className="mt-6 text-2xl font-semibold " className="text-body">
          {t('public.payment.success.title')}
        </h2>

        <p className="mt-2 " className="text-secondary">
          {t('public.payment.success.description')}
        </p>

        {sessionData && (
          <div className="mt-6  rounded-lg p-4 text-left" className="bg-page">
            <h3 className="text-sm font-semibold  mb-2" className="text-body">
              {t('public.payment.success.detailsHeading')}
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="" className="text-muted">
                  {t('public.payment.success.statusLabel')}
                </dt>
                <dd className="font-medium " className="text-body">{statusLabel}</dd>
              </div>
              {sessionData.amount_total && (
                <div className="flex justify-between">
                  <dt className="" className="text-muted">
                    {t('public.payment.success.totalLabel')}
                  </dt>
                  <dd className="font-medium " className="text-body">
                    {(sessionData.amount_total / 100).toFixed(2)} EUR
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Link
            to="/dashboard"
            className="block w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
          >
            {t('public.payment.success.buttons.goDashboard')}
          </Link>
          <p className="text-xs " className="text-muted">
            {t('public.payment.success.redirectNotice')}
          </p>
        </div>

        <div className="mt-6 border-t  pt-6" className="border-default">
          <p className="text-sm " className="text-muted">
            {t('public.payment.success.emailNotice')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
