import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate as formatDateUtil } from '../../utils/formatUtils';
import { Crown, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from '../../hooks/useTranslations';
import { Card } from '../ui';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Widget para mostrar resumen de suscripción en dashboard
 */
const SubscriptionWidget = () => {
  const { t } = useTranslations();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/stripe/subscription`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return formatDateUtil(date, 'custom');
  };

  const primaryActionClasses =
    'inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2';
  const linkButtonClasses =
    'mt-4 inline-flex w-full items-center justify-center rounded-md border border-[color:var(--color-text)]/15 bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition-colors hover:bg-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2';

  if (loading) {
    return (
      <Card className="flex min-h-[140px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-text)]/50" />
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="space-y-4 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-accent)]/10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Crown className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
              Activa tu cuenta Premium
            </h3>
          </div>
          <p className="text-sm text-[color:var(--color-text)]/70">
            Desbloquea funcionalidades exclusivas y lleva tu planificación al siguiente nivel.
          </p>
          <Link to="/pricing" className={primaryActionClasses}>
            Ver planes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const cardStateClasses = subscription.cancelAtPeriodEnd
    ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
    : '';
  const statusBadgeClasses = isActive
    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
    : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]';
  const crownTone = isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-warning)]';

  return (
    <Card className={`space-y-4 ${cardStateClasses}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${crownTone}`} />
          <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
            {subscription.productName || 'Plan Premium'}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusBadgeClasses}`}>
          {subscription.status === 'trialing'
            ? 'En prueba'
            : subscription.status === 'active'
              ? 'Activa'
              : subscription.status}
        </span>
      </div>

      <div className="space-y-3 text-sm text-[color:var(--color-text)]/70">
        <div className="flex justify-between items-baseline">
          <span>Precio:</span>
          <span className="text-lg font-semibold text-[color:var(--color-text)]">
            {formatPrice(subscription.amount, subscription.currency)}
            <span className="ml-1 text-sm font-normal text-[color:var(--color-text)]/70">
              {subscription.interval === 'month' ? '/mes' : t('common.ano')}
            </span>
          </span>
        </div>

        {subscription.currentPeriodEnd && (
          <div className="flex justify-between items-baseline">
            <span>
              {subscription.cancelAtPeriodEnd ? 'Finaliza:' : 'Renueva:'}
            </span>
            <span className="text-sm font-semibold text-[color:var(--color-text)]">
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/15 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[var(--color-warning)]" />
            <p className="text-xs text-[color:var(--color-text)]/80">
              Tu suscripción finalizará el {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>

      <Link to="/subscription" className={linkButtonClasses}>
        Gestionar Suscripción
      </Link>
    </Card>
  );
};

export default SubscriptionWidget;
