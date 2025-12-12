import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Check,
  X,
  Crown,
  Zap,
  Star,
  TrendingUp,
  Shield,
  Headphones,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-toastify';

// Definición de planes
const PLANS = {
  free: {
    id: 'free',
    name: 'FREE',
    price: 0,
    period: 'Gratis para siempre',
    color: 'gray',
    icon: Shield,
    features: [
      { text: 'Perfil público básico', included: true },
      { text: 'Hasta 10 fotos en portfolio', included: true },
      { text: 'Hasta 5 solicitudes/mes', included: true },
      { text: 'Notificaciones por email', included: true },
      { text: 'Búsqueda orgánica', included: true },
      { text: 'Badge verificado', included: false },
      { text: 'Solicitudes ilimitadas', included: false },
      { text: 'Portfolio ilimitado', included: false },
      { text: 'Destacado en búsquedas', included: false },
      { text: 'Analíticas avanzadas', included: false },
      { text: 'API + Webhooks', included: false },
      { text: 'Soporte prioritario', included: false },
    ],
    cta: 'Plan Actual',
    description: 'Perfecto para empezar y probar la plataforma',
  },
  basic: {
    id: 'basic',
    name: 'BASIC',
    price: 19,
    period: '/mes',
    color: 'indigo',
    icon: Zap,
    popular: true,
    features: [
      { text: 'Todo de FREE, más:', included: true, highlight: true },
      { text: 'Badge verificado ✓', included: true },
      { text: 'Solicitudes ilimitadas', included: true },
      { text: 'Portfolio ilimitado', included: true },
      { text: 'Destacado en búsquedas', included: true },
      { text: 'Sin marca de agua', included: true },
      { text: 'Estadísticas básicas', included: true },
      { text: 'Respuestas automáticas', included: true },
      { text: 'Analíticas avanzadas', included: false },
      { text: 'API + Webhooks', included: false },
      { text: 'Soporte prioritario', included: false },
      { text: 'Gestor de equipo', included: false },
    ],
    cta: 'Mejorar a BASIC',
    description: 'Para profesionales que quieren más visibilidad y leads',
  },
  pro: {
    id: 'pro',
    name: 'PRO',
    price: 49,
    period: '/mes',
    color: 'purple',
    icon: Crown,
    features: [
      { text: 'Todo de BASIC, más:', included: true, highlight: true },
      { text: 'Analíticas avanzadas 📊', included: true },
      { text: 'API + Webhooks', included: true },
      { text: 'Soporte prioritario 24/7', included: true },
      { text: 'Gestor de equipo', included: true },
      { text: 'Integración con CRM', included: true },
      { text: 'White label', included: true },
      { text: 'Dominio personalizado', included: true },
      { text: 'Consultoría mensual', included: true },
      { text: 'Acceso beta a features', included: true },
      { text: 'Sin comisiones en pagos', included: true },
      { text: 'Prioridad en SEO', included: true },
    ],
    cta: 'Mejorar a PRO',
    description: 'Para empresas que buscan máximo rendimiento y control',
  },
};

export default function SupplierPlans() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly | yearly

  useEffect(() => {
    loadCurrentPlan();
  }, [id]);

  const loadCurrentPlan = async () => {
    try {
      const token = localStorage.getItem('supplier_token');
      if (!token) {
        navigate('/supplier/login');
        return;
      }

      const response = await fetch(`/api/supplier-dashboard/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.profile?.subscription?.plan || 'free');
      }
    } catch (error) {
      // console.error('[SupplierPlans] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) return;

    try {
      toast.info('Redirigiendo a la página de pago...');

      // TODO: Integrar con Stripe
      // Por ahora, simular el upgrade
      setTimeout(() => {
        toast.success(`¡Bienvenido al plan ${PLANS[planId].name}!`);
        setCurrentPlan(planId);
      }, 1500);
    } catch (error) {
      // console.error('[SupplierPlans] Error upgrading:', error);
      toast.error('Error al procesar el cambio de plan');
    }
  };

  const getPlanPrice = (plan) => {
    if (plan.price === 0) return 'Gratis';

    if (billingPeriod === 'yearly') {
      const yearlyPrice = Math.floor(plan.price * 12 * 0.85); // 15% descuento
      const monthlyEquivalent = Math.floor(yearlyPrice / 12);
      return (
        <>
          <span className="text-4xl font-bold">{monthlyEquivalent}€</span>
          <span className="text-lg text-gray-600">/mes</span>
          <div className="text-sm text-green-600 mt-1">
            Facturado anualmente ({yearlyPrice}€/año)
          </div>
        </>
      );
    }

    return (
      <>
        <span className="text-4xl font-bold">{plan.price}€</span>
        <span className="text-lg text-gray-600">{plan.period}</span>
      </>
    );
  };

  const renderPlanCard = (planKey) => {
    const plan = PLANS[planKey];
    const isCurrentPlan = currentPlan === planKey;
    const Icon = plan.icon;

    return (
      <div
        key={planKey}
        className={`relative bg-white rounded-2xl shadow-md p-8 ${
          plan.popular ? 'ring-4 ring-indigo-500 scale-105' : 'border border-gray-200'
        } transition-transform hover:scale-105`}
      >
        {plan.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-[var(--color-primary)] text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
              <Star size={14} fill="currentColor" />
              MÁS POPULAR
            </span>
          </div>
        )}

        {isCurrentPlan && (
          <div className="absolute -top-4 right-4">
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              PLAN ACTUAL
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-${plan.color}-100`}
          >
            <Icon size={32} className={`text-${plan.color}-600`} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
          <div className="mb-4">{getPlanPrice(plan)}</div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className={`flex items-start gap-2 ${
                feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-700'
              }`}
            >
              {feature.included ? (
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X size={20} className="text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => handleUpgrade(planKey)}
          disabled={isCurrentPlan || loading}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : plan.popular
                ? 'bg-[var(--color-primary)] text-white hover:from-indigo-700 hover:to-purple-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isCurrentPlan ? plan.cta : loading ? 'Cargando...' : plan.cta}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(`/supplier/dashboard/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver al Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Elige el plan perfecto para ti</h1>
          <p className="text-xl text-gray-600 mb-8">
            Crece tu negocio con las herramientas que necesitas
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-full shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {renderPlanCard('free')}
          {renderPlanCard('basic')}
          {renderPlanCard('pro')}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Preguntas Frecuentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600 text-sm">
                Sí, puedes mejorar o reducir tu plan cuando quieras. Si mejoras, los cambios son
                inmediatos. Si reduces, se aplicarán al final del período de facturación actual.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-gray-600 text-sm">
                Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través
                de Stripe. Todos los pagos son seguros y encriptados.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">¿Hay compromiso de permanencia?</h3>
              <p className="text-gray-600 text-sm">
                No, todos los planes son sin compromiso. Puedes cancelar en cualquier momento y
                seguirás teniendo acceso hasta el final del período pagado.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Qué pasa si supero el límite del plan FREE?
              </h3>
              <p className="text-gray-600 text-sm">
                Si alcanzas el límite de solicitudes o fotos, te notificaremos y podrás mejorar a
                BASIC para continuar sin límites. Tus datos se mantienen seguros.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Banner */}
        <div className="bg-[var(--color-primary)] rounded-2xl shadow-md p-8 text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">¿Por qué mejorar tu plan?</h2>
            <p className="text-indigo-100">
              Los proveedores con plan BASIC+ reciben 3x más contactos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <TrendingUp size={48} className="mx-auto mb-3" />
              <h3 className="font-bold mb-2">Más Visibilidad</h3>
              <p className="text-sm text-indigo-100">
                Aparece destacado en los primeros resultados de búsqueda
              </p>
            </div>
            <div className="text-center">
              <Zap size={48} className="mx-auto mb-3" />
              <h3 className="font-bold mb-2">Sin Límites</h3>
              <p className="text-sm text-indigo-100">
                Recibe y gestiona solicitudes ilimitadas de clientes potenciales
              </p>
            </div>
            <div className="text-center">
              <Headphones size={48} className="mx-auto mb-3" />
              <h3 className="font-bold mb-2">Soporte Dedicado</h3>
              <p className="text-sm text-indigo-100">
                Asistencia prioritaria para hacer crecer tu negocio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
