import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3,
  User,
  Edit,
  TrendingUp,
  MessageSquare,
  FileText,
  Mail,
  Calendar,
  CreditCard,
  ChevronRight,
  Camera,
  ArrowRight,
  Save,
  X,
  Eye,
  MousePointer,
  Inbox,
  Crown,
  Zap,
  LogOut,
} from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';
import Spinner from '../../components/ui/Spinner';

const PRICE_RANGE_OPTIONS = [
  { value: '', labelKey: 'suppliers.dashboard.profile.priceRange.placeholder' },
  { value: '\u20AC', labelKey: 'suppliers.dashboard.profile.priceRange.economy' },
  { value: '\u20AC\u20AC', labelKey: 'suppliers.dashboard.profile.priceRange.medium' },
  {
    value: '\u20AC\u20AC\u20AC',
    labelKey: 'suppliers.dashboard.profile.priceRange.premium',
  },
  {
    value: '\u20AC\u20AC\u20AC\u20AC',
    labelKey: 'suppliers.dashboard.profile.priceRange.luxury',
  },
];

export default function SupplierDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, format } = useTranslations();

  const [supplier, setSupplier] = useState(null);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    website: '',
    instagram: '',
    priceRange: '',
  });

  // formatNumber estable usando useCallback con dependencia de format.number (función)
  const formatNumber = useCallback(
    (value) => {
      try {
        return format?.number ? format.number(value || 0) : (value || 0).toLocaleString();
      } catch {
        return String(value || 0);
      }
    },
    [format?.number]
  );

  // Calcular locationLabel con useMemo ANTES de cualquier return condicional
  const locationLabel = useMemo(() => {
    if (!supplier) return t('suppliers.dashboard.header.locationFallback');
    const parts = [supplier.category, supplier.location?.city].filter(Boolean);
    if (!parts.length) {
      return t('suppliers.dashboard.header.locationFallback');
    }
    return parts.join(' / ');
  }, [supplier, t]);

  // Métricas formateadas - MEMOIZADAS para evitar re-renders
  const views = useMemo(
    () => formatNumber(supplier?.metrics?.views || 0),
    [supplier?.metrics?.views, formatNumber]
  );
  const clicks = useMemo(
    () => formatNumber(supplier?.metrics?.clicks || 0),
    [supplier?.metrics?.clicks, formatNumber]
  );
  const conversions = useMemo(
    () => formatNumber(supplier?.metrics?.conversions || 0),
    [supplier?.metrics?.conversions, formatNumber]
  );
  const matchScore = useMemo(
    () => formatNumber(supplier?.metrics?.matchScore || 0),
    [supplier?.metrics?.matchScore, formatNumber]
  );

  // Usar ref para evitar dependencia de t que cambia
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      if (!token) {
        navigate('/supplier/login');
        return;
      }

      const response = await fetch(`/api/supplier-dashboard/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error('load_error');
      }

      const data = await response.json();

      // Cargar contador de solicitudes nuevas
      try {
        const requestsResponse = await fetch(`/api/supplier-requests/${id}?status=new&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setNewRequestsCount(requestsData.pagination?.total || 0);
        }
      } catch (err) {
        console.error('[SupplierDashboard] Error loading requests count:', err);
      }

      const profile = data.profile || {};
      setSupplier(profile);
      setAnalytics(data.metrics || {});
      setCurrentPlan(profile.subscription?.plan || 'free');

      setFormData({
        name: profile.profile?.name || '',
        description: profile.business?.description || '',
        phone: profile.contact?.phone || '',
        website: profile.contact?.website || '',
        instagram: profile.contact?.instagram || '',
        priceRange: profile.business?.priceRange || '',
      });
    } catch (err) {
      console.error('[SupplierDashboard] load error', err);
      setErrorMessage(err.message || tRef.current('suppliers.dashboard.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // useEffect sin loadDashboard en dependencias para evitar bucle
  useEffect(() => {
    const token = localStorage.getItem('supplier_token');
    const supplierId = localStorage.getItem('supplier_id');

    if (!token || !supplierId) {
      navigate('/supplier/login');
      return;
    }

    if (id !== supplierId) {
      navigate(`/supplier/dashboard/${supplierId}`);
      return;
    }

    loadDashboard();
  }, [id, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch('/api/supplier-dashboard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: {
            name: formData.name,
          },
          business: {
            description: formData.description,
            priceRange: formData.priceRange,
          },
          contact: {
            phone: formData.phone,
            website: formData.website,
            instagram: formData.instagram,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(t('suppliers.dashboard.errors.save'));
      }

      window.alert(t('suppliers.dashboard.alerts.saveSuccess'));
      setEditing(false);
      loadDashboard();
    } catch (err) {
      console.error('[SupplierDashboard] save error', err);
      window.alert(t('suppliers.dashboard.alerts.saveError', { message: err.message || '' }));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_id');
    localStorage.removeItem('supplier_data');
    navigate('/supplier/login');
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Spinner />
      </div>
    );
  }

  if (errorMessage || !supplier) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div
          className="max-w-md w-full shadow-lg rounded-lg p-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-danger)' }}>
            {t('suppliers.dashboard.login.title')}
          </h2>
          <p style={{ color: 'var(--color-muted)' }}>
            {errorMessage || t('suppliers.dashboard.login.message')}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full text-white py-2 rounded-md"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('suppliers.dashboard.login.button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="layout-container max-w-6xl">
        <div
          className="shadow-md rounded-lg p-6 mb-6"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {supplier.name}
              </h1>
              <p className="mt-1" style={{ color: 'var(--color-muted)' }}>
                {locationLabel}
              </p>
              {supplier.registered && (
                <span
                  className="inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--color-success)',
                  }}
                >
                  {t('suppliers.dashboard.badges.verified')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    <Edit size={18} />
                    {t('suppliers.dashboard.buttons.editProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-red-50 transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-danger)' }}
                    title="Cerrar sesión"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-md disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    <Save size={18} />
                    {saving
                      ? t('suppliers.dashboard.buttons.saving')
                      : t('suppliers.dashboard.buttons.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      loadDashboard();
                    }}
                    className="flex items-center gap-2 px-4 py-2 border rounded-md"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <X size={18} />
                    {t('suppliers.dashboard.buttons.cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner del Plan Actual */}
        {currentPlan === 'free' && (
          <div
            className="shadow-md rounded-lg p-4 mb-6 border-l-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeftColor: 'var(--color-warning)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={24} style={{ color: 'var(--color-warning)' }} />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    Plan FREE - Funcionalidad Limitada
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Mejora a BASIC para solicitudes ilimitadas, badge verificado y más visibilidad
                  </p>
                </div>
              </div>
              <Link
                to={`/supplier/dashboard/${id}/plans`}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                }}
              >
                Ver Planes
              </Link>
            </div>
          </div>
        )}

        {currentPlan === 'basic' && (
          <div
            className="shadow-md rounded-lg p-4 mb-6 border-l-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeftColor: 'var(--color-primary)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown size={24} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    Plan BASIC Activo ✓
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    ¿Quieres analíticas avanzadas y API? Descubre el plan PRO
                  </p>
                </div>
              </div>
              <Link
                to={`/supplier/dashboard/${id}/plans`}
                className="px-4 py-2 rounded-lg font-medium transition-colors border"
                style={{
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)',
                }}
              >
                Ver PRO
              </Link>
            </div>
          </div>
        )}

        {currentPlan === 'pro' && (
          <div
            className="shadow-md rounded-lg p-4 mb-6 border-l-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeftColor: 'var(--color-success)',
            }}
          >
            <div className="flex items-center gap-3">
              <Crown size={24} style={{ color: 'var(--color-success)' }} />
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Plan PRO Activo 🎉
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Tienes acceso completo a todas las funcionalidades premium
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Acceso rápido a Solicitudes */}
        <Link
          to={`/supplier/dashboard/${id}/requests`}
          className="block shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(109, 40, 217, 0.1)' }}
              >
                <Inbox size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Mis Solicitudes
                  </h3>
                  {newRequestsCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        minWidth: '24px',
                      }}
                    >
                      {newRequestsCount}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Gestiona las solicitudes de presupuesto de tus clientes potenciales
                </p>
              </div>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
        </Link>

        {/* Acceso rápido al Portfolio */}
        <Link
          to={`/supplier/dashboard/${id}/portfolio`}
          className="block shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(109, 40, 217, 0.1)' }}
              >
                <Camera size={24} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Mi Portfolio
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Gestiona las fotos de tu trabajo y muestra tu mejor portfolio
                </p>
              </div>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
        </Link>

        {/* Acceso rápido a Productos/Servicios */}
        <Link
          to={`/supplier/dashboard/${id}/products`}
          className="block shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderLeft: '4px solid var(--color-success)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                <FileText size={24} style={{ color: 'var(--color-success)' }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Mis Servicios/Productos
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Gestiona tu catálogo para crear cotizaciones rápidamente
                </p>
              </div>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--color-success)' }} />
          </div>
        </Link>

        {/* Grid de accesos adicionales - FASE 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Acceso a Reseñas */}
          <Link
            to={`/supplier/dashboard/${id}/reviews`}
            className="shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid #fbbf24',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
              >
                <MessageSquare size={20} style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Mis Reseñas
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Ver y responder reseñas
                </p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#fbbf24' }} />
          </Link>

          {/* Acceso a Analíticas */}
          <Link
            to={`/supplier/dashboard/${id}/analytics`}
            className="shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid var(--color-info)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(94, 187, 255, 0.1)' }}
              >
                <TrendingUp size={20} style={{ color: 'var(--color-info)' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Analíticas Avanzadas
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Gráficos y estadísticas
                </p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: 'var(--color-info)' }} />
          </Link>
        </div>

        {/* Grid de accesos adicionales - FASE 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Mensajes */}
          <Link
            to={`/supplier/dashboard/${id}/messages`}
            className="shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid #8b5cf6',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
              >
                <Mail size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Mensajes
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Chat con clientes
                </p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#8b5cf6' }} />
          </Link>

          {/* Disponibilidad */}
          <Link
            to={`/supplier/dashboard/${id}/availability`}
            className="shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid #10b981',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
              >
                <Calendar size={20} style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Calendario
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Gestionar disponibilidad
                </p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#10b981' }} />
          </Link>

          {/* Pagos */}
          <Link
            to={`/supplier/dashboard/${id}/payments`}
            className="shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '3px solid #f59e0b',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <CreditCard size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  Pagos
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Facturas y cobros
                </p>
              </div>
            </div>
            <ArrowRight size={16} style={{ color: '#f59e0b' }} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h2
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                <BarChart3 size={20} />
                {t('suppliers.dashboard.analytics.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(94, 187, 255, 0.1)' }}
                >
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-info)' }}
                  >
                    <Eye size={20} />
                    <span className="font-medium">
                      {t('suppliers.dashboard.analytics.views.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {views}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-info)' }}>
                    {t('suppliers.dashboard.analytics.views.subtitle')}
                  </p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-2" style={{ color: '#a855f7' }}>
                    <MousePointer size={20} />
                    <span className="font-medium">
                      {t('suppliers.dashboard.analytics.clicks.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {clicks}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#a855f7' }}>
                    {t('suppliers.dashboard.analytics.clicks.subtitle')}
                  </p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <div
                    className="flex items-center gap-2 mb-2"
                    style={{ color: 'var(--color-success)' }}
                  >
                    <Mail size={20} />
                    <span className="font-medium">
                      {t('suppliers.dashboard.analytics.contacts.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {conversions}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-success)' }}>
                    {t('suppliers.dashboard.analytics.contacts.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.dashboard.profile.title')}
              </h2>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(event) =>
                        setFormData({ ...formData, description: event.target.value })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.priceRange')}
                    </label>
                    <select
                      value={formData.priceRange}
                      onChange={(event) =>
                        setFormData({ ...formData, priceRange: event.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {PRICE_RANGE_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {t(option.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.website')}
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(event) =>
                        setFormData({ ...formData, website: event.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('suppliers.dashboard.profile.fields.instagram')}
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(event) =>
                        setFormData({ ...formData, instagram: event.target.value })
                      }
                      placeholder={t('suppliers.dashboard.profile.placeholders.instagram')}
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('suppliers.dashboard.profile.fields.description')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.description ||
                        t('suppliers.dashboard.profileDisplay.descriptionEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('suppliers.dashboard.profile.fields.priceRange')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.priceRange ||
                        t('suppliers.dashboard.profileDisplay.priceRangeEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('suppliers.dashboard.profile.fields.phone')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.phone ||
                        t('suppliers.dashboard.profileDisplay.phoneEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('suppliers.dashboard.profile.fields.website')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.website ? (
                        <a
                          href={supplier.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {supplier.contact.website}
                        </a>
                      ) : (
                        t('suppliers.dashboard.profileDisplay.websiteEmpty')
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('suppliers.dashboard.profile.fields.instagram')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.instagram ||
                        t('suppliers.dashboard.profileDisplay.instagramEmpty')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="shadow-md rounded-lg p-6"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.dashboard.profileState.title')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('suppliers.dashboard.profileState.registeredLabel')}
                  </span>
                  <span
                    className="font-medium"
                    style={{
                      color: supplier.registered ? 'var(--color-success)' : 'var(--color-muted)',
                    }}
                  >
                    {supplier.registered
                      ? t('suppliers.dashboard.profileState.registeredYes')
                      : t('suppliers.dashboard.profileState.registeredNo')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('suppliers.dashboard.profileState.statusLabel')}
                  </span>
                  <span
                    className="font-medium"
                    style={{
                      color:
                        supplier.status === 'active'
                          ? 'var(--color-success)'
                          : 'var(--color-muted)',
                    }}
                  >
                    {supplier.status === 'active'
                      ? t('suppliers.dashboard.profileState.statusActive')
                      : t('suppliers.dashboard.profileState.statusInactive')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('suppliers.dashboard.profileState.matchScore')}
                  </span>
                  <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                    {matchScore}/100
                  </span>
                </div>
              </div>
            </div>

            <div
              className="border rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(94, 187, 255, 0.1)',
                borderColor: 'var(--color-primary)',
              }}
            >
              <h4 className="font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.dashboard.insight.title')}
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('suppliers.dashboard.insight.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
