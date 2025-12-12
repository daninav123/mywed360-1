import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate as formatDateUtil } from '../../utils/formatUtils';
import { Crown, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

/**
 * Widget para mostrar resumen de suscripción en dashboard
 */
const SubscriptionWidget = () => {
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
      // console.error('Error fetching subscription:', err);
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-[var(--color-primary)] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5" />
              <h3 className="font-semibold">Activa tu cuenta Premium</h3>
            </div>
            <p className="text-sm text-purple-100 mb-4">
              Desbloquea funcionalidades exclusivas y lleva tu planificación al siguiente nivel
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors"
            >
              Ver Planes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';

  return (
    <div className={`rounded-xl shadow-sm border p-6 ${
      isActive 
        ? 'bg-white border-gray-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-yellow-600'}`} />
          <h3 className="font-semibold text-gray-900">
            {subscription.productName || 'Plan Premium'}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {subscription.status === 'trialing' ? 'En prueba' : 
           subscription.status === 'active' ? 'Activa' : 
           subscription.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-gray-600">Precio:</span>
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(subscription.amount, subscription.currency)}
            <span className="text-sm font-normal text-gray-600">
              {subscription.interval === 'month' ? '/mes' : '/año'}
            </span>
          </span>
        </div>

        {subscription.currentPeriodEnd && (
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-600">
              {subscription.cancelAtPeriodEnd ? 'Finaliza:' : 'Renueva:'}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {formatDate(subscription.currentPeriodEnd)}
            </span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-3 mt-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              Tu suscripción finalizará el {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        )}
      </div>

      <Link
        to="/subscription"
        className="mt-4 block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
      >
        Gestionar Suscripción
      </Link>
    </div>
  );
};

export default SubscriptionWidget;
