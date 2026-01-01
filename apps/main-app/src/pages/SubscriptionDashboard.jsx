import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { formatDate as formatDateUtil } from '../utils/formatUtils';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Loader2,
  Crown,
  Settings
} from 'lucide-react';
import { createCustomerPortalSession } from '../services/stripeService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const SubscriptionDashboard = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken'); // TODO: Ajustar según tu auth

      const response = await fetch(`${API_BASE_URL}/api/stripe/subscription`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener suscripción');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      // console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true);
      const portalUrl = await createCustomerPortalSession();
      
      // Redirigir al portal de Stripe
      window.location.href = portalUrl;
    } catch (err) {
      // console.error('Error opening customer portal:', err);
      setError(err.message);
      setManagingSubscription(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle2 className="h-4 w-4" />,
        text: 'Activa'
      },
      trialing: {
        color: 'bg-blue-100 text-blue-800',
        icon: <Calendar className="h-4 w-4" />,
        text: 'En prueba'
      },
      past_due: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Pago pendiente'
      },
      canceled: {
        color: 'bg-gray-100 text-gray-800',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Cancelada'
      },
      unpaid: {
        color: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Impagada'
      }
    };

    const config = statusConfig[status] || statusConfig.canceled;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return formatDateUtil(date, 'long');
  };

  const formatPrice = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center " style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[color:var(--color-primary)] animate-spin mx-auto" />
          <p className="mt-4 " style={{ color: 'var(--color-text-secondary)' }}>Cargando suscripción...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center  px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="max-w-md w-full  rounded-2xl shadow-lg p-8 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 " style={{ color: 'var(--color-danger)' }} />
          </div>
          <h2 className="mt-6 text-2xl font-semibold " style={{ color: 'var(--color-text)' }}>
            Error al cargar suscripción
          </h2>
          <p className="mt-2 " style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button
            onClick={fetchSubscription}
            className="mt-6 w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen  px-4 py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div className=" rounded-2xl shadow-lg p-8 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-purple-100">
              <Crown className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold " style={{ color: 'var(--color-text)' }}>
              No tienes una suscripción activa
            </h2>
            <p className="mt-2 " style={{ color: 'var(--color-text-secondary)' }}>
              Explora nuestros planes y encuentra el perfecto para ti
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:brightness-95"
              >
                Ver Planes
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md border  px-6 py-3 text-sm font-semibold  hover:" style={{ borderColor: 'var(--color-border)' }} style={{ color: 'var(--color-text)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  px-4 py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold " style={{ color: 'var(--color-text)' }}>Mi Suscripción</h1>
          <p className="mt-2 " style={{ color: 'var(--color-text-secondary)' }}>Gestiona tu plan y métodos de pago</p>
        </div>

        {/* Plan Actual */}
        <div className=" rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="bg-[var(--color-primary)] p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    {subscription.productName || 'Plan Premium'}
                  </h2>
                </div>
                <p className="mt-2 text-purple-100">
                  {subscription.description || 'Tu plan activo'}
                </p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Detalles del Plan */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold  uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  Precio
                </h3>
                <p className="mt-2 text-2xl font-bold " style={{ color: 'var(--color-text)' }}>
                  {formatPrice(subscription.amount, subscription.currency)}
                  <span className="text-base font-normal " style={{ color: 'var(--color-text-secondary)' }}>
                    {subscription.interval === 'month' ? '/mes' : '/año'}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold  uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  Próxima renovación
                </h3>
                <p className="mt-2 text-lg font-semibold  flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Calendar className="h-5 w-5 " style={{ color: 'var(--color-muted)' }} />
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="md:col-span-2">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-yellow-800">
                          Suscripción programada para cancelar
                        </h4>
                        <p className="mt-1 text-sm text-yellow-700">
                          Tu suscripción finalizará el {formatDate(subscription.currentPeriodEnd)}. 
                          Aún tienes acceso hasta esa fecha.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {subscription.trialEnd && subscription.status === 'trialing' && (
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5  flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <h4 className="text-sm font-semibold text-blue-800">
                          Período de prueba activo
                        </h4>
                        <p className="mt-1 text-sm text-blue-700">
                          Tu prueba gratuita termina el {formatDate(subscription.trialEnd)}. 
                          Después se te cobrará automáticamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Características del Plan */}
            {subscription.features && subscription.features.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold  uppercase tracking-wide mb-3" style={{ color: 'var(--color-muted)' }}>
                  Características incluidas
                </h3>
                <ul className="space-y-2">
                  {subscription.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5  flex-shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                      <span className="" style={{ color: 'var(--color-text)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t " style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2"
              >
                {managingSubscription ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Gestionar Suscripción
                  </>
                )}
              </button>
              
              <Link
                to="/pricing"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border  px-6 py-3 text-sm font-semibold  hover: focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:ring-offset-2" style={{ borderColor: 'var(--color-border)' }} style={{ color: 'var(--color-text)' }} style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <ExternalLink className="h-4 w-4" />
                Cambiar Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className=" rounded-xl shadow p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-lg font-semibold  mb-4" style={{ color: 'var(--color-text)' }}>
            Portal del Cliente
          </h3>
          <p className=" mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            En el portal del cliente puedes:
          </p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-3">
              <CreditCard className="h-5 w-5  flex-shrink-0 mt-0.5" style={{ color: 'var(--color-muted)' }} />
              <span className="" style={{ color: 'var(--color-text)' }}>Actualizar métodos de pago</span>
            </li>
            <li className="flex items-start gap-3">
              <Calendar className="h-5 w-5  flex-shrink-0 mt-0.5" style={{ color: 'var(--color-muted)' }} />
              <span className="" style={{ color: 'var(--color-text)' }}>Ver historial de facturación</span>
            </li>
            <li className="flex items-start gap-3">
              <Settings className="h-5 w-5  flex-shrink-0 mt-0.5" style={{ color: 'var(--color-muted)' }} />
              <span className="" style={{ color: 'var(--color-text)' }}>Cancelar o modificar tu suscripción</span>
            </li>
          </ul>
          <button
            onClick={handleManageSubscription}
            disabled={managingSubscription}
            className="inline-flex items-center gap-2 text-[color:var(--color-primary)] hover:underline font-semibold"
          >
            Abrir Portal del Cliente
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* Ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-blue-700 mb-4">
            Si tienes alguna pregunta sobre tu suscripción o facturación, nuestro equipo está aquí para ayudarte.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-blue-900 hover:underline font-semibold"
          >
            Contactar Soporte
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
