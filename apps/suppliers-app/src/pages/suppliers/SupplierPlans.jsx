import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

// Definición de planes - función para generar con traducciones
const getPlans = (t) => ({
  free: {
    id: 'free',
    name: t('suppliers:plans.planTypes.free.name'),
    price: 0,
    period: t('suppliers:plans.planTypes.free.period'),
    color: 'gray',
    icon: Shield,
    features: [
      { text: t('suppliers:plans.features.publicProfile'), included: true },
      { text: t('suppliers:plans.features.portfolioPhotos'), included: true },
      { text: t('suppliers:plans.features.requestsPerMonth'), included: true },
      { text: t('suppliers:plans.features.emailNotifications'), included: true },
      { text: t('suppliers:plans.features.organicSearch'), included: true },
      { text: t('suppliers:plans.features.verifiedBadge'), included: false },
      { text: t('suppliers:plans.features.unlimitedRequests'), included: false },
      { text: t('suppliers:plans.features.unlimitedPortfolio'), included: false },
      { text: t('suppliers:plans.features.featuredSearches'), included: false },
      { text: t('suppliers:plans.features.advancedAnalytics'), included: false },
      { text: t('suppliers:plans.features.apiWebhooks'), included: false },
      { text: t('suppliers:plans.features.prioritySupport'), included: false },
    ],
    cta: t('suppliers:plans.planTypes.free.cta'),
    description: t('suppliers:plans.planTypes.free.description'),
  },
  basic: {
    id: 'basic',
    name: t('suppliers:plans.planTypes.basic.name'),
    price: 19,
    period: t('suppliers:plans.planTypes.basic.period'),
    color: 'indigo',
    icon: Zap,
    popular: true,
    features: [
      { text: t('suppliers:plans.features.allFromFree'), included: true, highlight: true },
      { text: t('suppliers:plans.features.verifiedBadgeCheck'), included: true },
      { text: t('suppliers:plans.features.unlimitedRequests'), included: true },
      { text: t('suppliers:plans.features.unlimitedPortfolio'), included: true },
      { text: t('suppliers:plans.features.featuredSearches'), included: true },
      { text: t('suppliers:plans.features.noWatermark'), included: true },
      { text: t('suppliers:plans.features.basicStats'), included: true },
      { text: t('suppliers:plans.features.autoReplies'), included: true },
      { text: t('suppliers:plans.features.advancedAnalytics'), included: false },
      { text: t('suppliers:plans.features.apiWebhooks'), included: false },
      { text: t('suppliers:plans.features.prioritySupport'), included: false },
      { text: t('suppliers:plans.features.teamManager'), included: false },
    ],
    cta: t('suppliers:plans.planTypes.basic.cta'),
    description: t('suppliers:plans.planTypes.basic.description'),
  },
  pro: {
    id: 'pro',
    name: t('suppliers:plans.planTypes.pro.name'),
    price: 49,
    period: t('suppliers:plans.planTypes.pro.period'),
    color: 'purple',
    icon: Crown,
    features: [
      { text: t('suppliers:plans.features.allFromBasic'), included: true, highlight: true },
      { text: t('suppliers:plans.features.advancedAnalyticsChart'), included: true },
      { text: t('suppliers:plans.features.apiWebhooks'), included: true },
      { text: t('suppliers:plans.features.prioritySupport247'), included: true },
      { text: t('suppliers:plans.features.teamManager'), included: true },
      { text: t('suppliers:plans.features.crmIntegration'), included: true },
      { text: t('suppliers:plans.features.whiteLabel'), included: true },
      { text: t('suppliers:plans.features.customDomain'), included: true },
      { text: t('suppliers:plans.features.monthlyConsulting'), included: true },
      { text: t('suppliers:plans.features.betaAccess'), included: true },
      { text: t('suppliers:plans.features.noPaymentCommissions'), included: true },
      { text: t('suppliers:plans.features.seoPriority'), included: true },
    ],
    cta: t('suppliers:plans.planTypes.pro.cta'),
    description: t('suppliers:plans.planTypes.pro.description'),
  },
});

export default function SupplierPlans() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const PLANS = getPlans(t);
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
      toast.info(t('suppliers:plans.toast.redirectingPayment'));

      // TODO: Integrar con Stripe
      // Por ahora, simular el upgrade
      setTimeout(() => {
        toast.success(t('suppliers:plans.toast.welcomePlan', { planName: PLANS[planId].name }));
        setCurrentPlan(planId);
      }, 1500);
    } catch (error) {
      // console.error('[SupplierPlans] Error upgrading:', error);
      toast.error(t('suppliers:plans.toast.errorChanging'));
    }
  };

  const getPlanPrice = (plan) => {
    if (plan.price === 0) return t('suppliers:plans.free');

    if (billingPeriod === 'yearly') {
      const yearlyPrice = Math.floor(plan.price * 12 * 0.85); // 15% descuento
      const monthlyEquivalent = Math.floor(yearlyPrice / 12);
      return (
        <>
          <span className="text-4xl font-bold">{monthlyEquivalent}€</span>
          <span className="text-lg " style={{ color: 'var(--color-text-secondary)' }}>{t('suppliers:plans.monthly')}</span>
          <div className="text-sm  mt-1" style={{ color: 'var(--color-success)' }}>
            {t('suppliers:plans.billedAnnually', { price: yearlyPrice })}
          </div>
        </>
      );
    }

    return (
      <>
        <span className="text-4xl font-bold">{plan.price}€</span>
        <span className="text-lg " style={{ color: 'var(--color-text-secondary)' }}>{plan.period}</span>
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
              {t('suppliers:plans.mostPopular')}
            </span>
          </div>
        )}

        {isCurrentPlan && (
          <div className="absolute -top-4 right-4">
            <span className=" text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--color-success)' }}>
              {t('suppliers:plans.currentPlan')}
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
          <h3 className="text-2xl font-bold  mb-2" style={{ color: 'var(--color-text)' }}>{plan.name}</h3>
          <p className="text-sm  mb-4" style={{ color: 'var(--color-text-secondary)' }}>{plan.description}</p>
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

        <button
          onClick={() => handleUpgrade(planKey)}
          disabled={isCurrentPlan}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isCurrentPlan
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {isCurrentPlan ? t('suppliers:plans.currentPlan') : plan.price === 0 ? t('suppliers:plans.start') : t('suppliers:plans.upgrade')}
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center">{t('suppliers:plans.loading')}</div>;
  }

  return (
    <div className="min-h-screen  py-12 px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2  hover: mb-6" style={{ color: 'var(--color-text-secondary)' }} style={{ color: 'var(--color-text)' }}
        >
          <ArrowLeft size={20} />
          {t('suppliers:plans.back')}
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold  mb-4" style={{ color: 'var(--color-text)' }}>
            {t('suppliers:plans.pageTitle')}
          </h1>
          <p className=" text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            {t('suppliers:plans.pageSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.keys(PLANS).map((planKey) => renderPlanCard(planKey))}
        </div>
      </div>
    </div>
  );
}
