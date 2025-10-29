import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BarChart3,
  User,
  Edit,
  Save,
  X,
  Eye,
  MousePointer,
  Mail,
  Camera,
  ArrowRight,
} from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

const PRICE_RANGE_OPTIONS = [
  { value: '', labelKey: 'common.suppliers.dashboard.profile.priceRange.placeholder' },
  { value: '\u20AC', labelKey: 'common.suppliers.dashboard.profile.priceRange.economy' },
  { value: '\u20AC\u20AC', labelKey: 'common.suppliers.dashboard.profile.priceRange.medium' },
  {
    value: '\u20AC\u20AC\u20AC',
    labelKey: 'common.suppliers.dashboard.profile.priceRange.premium',
  },
  {
    value: '\u20AC\u20AC\u20AC\u20AC',
    labelKey: 'common.suppliers.dashboard.profile.priceRange.luxury',
  },
];

export default function SupplierDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, format } = useTranslations();

  const [supplier, setSupplier] = useState(null);
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
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

  const formatNumber = useCallback((value) => format.number(value || 0), [format]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, requestsRes, analyticsRes] = await Promise.all([
        fetch('/api/supplier-dashboard/profile', { headers }),
        fetch('/api/supplier-dashboard/requests?limit=10', { headers }),
        fetch('/api/supplier-dashboard/analytics?period=30d', { headers }),
      ]);

      if (!profileRes.ok || !requestsRes.ok || !analyticsRes.ok) {
        if (
          profileRes.status === 401 ||
          requestsRes.status === 401 ||
          analyticsRes.status === 401
        ) {
          localStorage.removeItem('supplier_token');
          localStorage.removeItem('supplier_id');
          navigate('/supplier/login');
          return;
        }
        throw new Error(t('common.suppliers.dashboard.errors.load'));
      }

      const [profileData, requestsData, analyticsData] = await Promise.all([
        profileRes.json(),
        requestsRes.json(),
        analyticsRes.json(),
      ]);

      const profile = profileData.profile || {};
      setSupplier(profile);
      setRequests(requestsData.requests || []);
      setAnalytics(analyticsData.metrics || {});

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
      setErrorMessage(err.message || t('common.suppliers.dashboard.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [navigate, t]);

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
  }, [id, navigate, loadDashboard]);

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
        throw new Error(t('common.suppliers.dashboard.errors.save'));
      }

      window.alert(t('common.suppliers.dashboard.alerts.saveSuccess'));
      setEditing(false);
      loadDashboard();
    } catch (err) {
      console.error('[SupplierDashboard] save error', err);
      window.alert(
        t('common.suppliers.dashboard.alerts.saveError', { message: err.message || '' })
      );
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
            {t('common.suppliers.dashboard.login.title')}
          </h2>
          <p style={{ color: 'var(--color-muted)' }}>
            {errorMessage || t('common.suppliers.dashboard.login.message')}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full text-white py-2 rounded-md"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {t('common.suppliers.dashboard.login.button')}
          </button>
        </div>
      </div>
    );
  }

  const locationLabel = useMemo(() => {
    const parts = [supplier.category, supplier.location?.city].filter(Boolean);
    if (!parts.length) {
      return t('common.suppliers.dashboard.header.locationFallback');
    }
    return parts.join(' / ');
  }, [supplier.category, supplier.location?.city, t]);

  const views = formatNumber(supplier.metrics?.views);
  const clicks = formatNumber(supplier.metrics?.clicks);
  const conversions = formatNumber(supplier.metrics?.conversions);
  const matchScore = formatNumber(supplier.metrics?.matchScore);

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
                  {t('common.suppliers.dashboard.badges.verified')}
                </span>
              )}
            </div>

            <div>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-white rounded-md"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <Edit size={18} />
                  {t('common.suppliers.dashboard.buttons.editProfile')}
                </button>
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
                      ? t('common.suppliers.dashboard.buttons.saving')
                      : t('common.suppliers.dashboard.buttons.save')}
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
                    {t('common.suppliers.dashboard.buttons.cancel')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
                {t('common.suppliers.dashboard.analytics.title')}
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
                      {t('common.suppliers.dashboard.analytics.views.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {views}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-info)' }}>
                    {t('common.suppliers.dashboard.analytics.views.subtitle')}
                  </p>
                </div>

                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-2" style={{ color: '#a855f7' }}>
                    <MousePointer size={20} />
                    <span className="font-medium">
                      {t('common.suppliers.dashboard.analytics.clicks.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {clicks}
                  </p>
                  <p className="text-sm mt-1" style={{ color: '#a855f7' }}>
                    {t('common.suppliers.dashboard.analytics.clicks.subtitle')}
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
                      {t('common.suppliers.dashboard.analytics.contacts.title')}
                    </span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {conversions}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-success)' }}>
                    {t('common.suppliers.dashboard.analytics.contacts.subtitle')}
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
                {t('common.suppliers.dashboard.profile.title')}
              </h2>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {t('common.suppliers.dashboard.profile.fields.name')}
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
                      {t('common.suppliers.dashboard.profile.fields.description')}
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
                      {t('common.suppliers.dashboard.profile.fields.priceRange')}
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
                      {t('common.suppliers.dashboard.profile.fields.phone')}
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
                      {t('common.suppliers.dashboard.profile.fields.website')}
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
                      {t('common.suppliers.dashboard.profile.fields.instagram')}
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(event) =>
                        setFormData({ ...formData, instagram: event.target.value })
                      }
                      placeholder={t('common.suppliers.dashboard.profile.placeholders.instagram')}
                      className="w-full px-3 py-2 border rounded-md"
                      style={{ borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.dashboard.profile.fields.description')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.description ||
                        t('common.suppliers.dashboard.profileDisplay.descriptionEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.dashboard.profile.fields.priceRange')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.business?.priceRange ||
                        t('common.suppliers.dashboard.profileDisplay.priceRangeEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.dashboard.profile.fields.phone')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.phone ||
                        t('common.suppliers.dashboard.profileDisplay.phoneEmpty')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.dashboard.profile.fields.website')}
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
                        t('common.suppliers.dashboard.profileDisplay.websiteEmpty')
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                      {t('common.suppliers.dashboard.profile.fields.instagram')}
                    </p>
                    <p className="mt-1" style={{ color: 'var(--color-text)' }}>
                      {supplier.contact?.instagram ||
                        t('common.suppliers.dashboard.profileDisplay.instagramEmpty')}
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
                {t('common.suppliers.dashboard.profileState.title')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('common.suppliers.dashboard.profileState.registeredLabel')}
                  </span>
                  <span
                    className="font-medium"
                    style={{
                      color: supplier.registered ? 'var(--color-success)' : 'var(--color-muted)',
                    }}
                  >
                    {supplier.registered
                      ? t('common.suppliers.dashboard.profileState.registeredYes')
                      : t('common.suppliers.dashboard.profileState.registeredNo')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('common.suppliers.dashboard.profileState.statusLabel')}
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
                      ? t('common.suppliers.dashboard.profileState.statusActive')
                      : t('common.suppliers.dashboard.profileState.statusInactive')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>
                    {t('common.suppliers.dashboard.profileState.matchScore')}
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
                {t('common.suppliers.dashboard.insight.title')}
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('common.suppliers.dashboard.insight.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
