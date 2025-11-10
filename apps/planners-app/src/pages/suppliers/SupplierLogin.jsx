import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import LanguageSelector from '../../components/ui/LanguageSelector';
import useTranslations from '../../hooks/useTranslations';

/**
 * Página de LOGIN para proveedores
 *
 * Los proveedores inician sesión con email/password para acceder a su dashboard
 */
export default function SupplierLogin() {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/supplier-dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'invalid_credentials') {
          throw new Error(t('suppliers.login.errors.invalidCredentials'));
        } else if (data.error === 'account_suspended') {
          throw new Error(t('suppliers.login.errors.accountSuspended'));
        } else if (data.error === 'password_not_set') {
          throw new Error(t('suppliers.login.errors.passwordNotSet'));
        } else {
          throw new Error(data.message || t('suppliers.login.errors.generic'));
        }
      }

      // Guardar token en localStorage
      localStorage.setItem('supplier_token', data.token);
      localStorage.setItem('supplier_id', data.supplier.id);
      localStorage.setItem('supplier_data', JSON.stringify(data.supplier));

      // Redirigir al dashboard
      navigate(`/supplier/dashboard/${data.supplier.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Selector de idioma */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="minimal" persist={false} />
      </div>

      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('suppliers.login.title')}
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>{t('suppliers.login.subtitle')}</p>
        </div>

        {/* Card de login */}
        <div
          className="rounded-xl shadow-lg p-8"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {t('suppliers.login.fields.email.label')}
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: 'var(--color-border)',
                    '--tw-ring-color': 'var(--color-primary)',
                  }}
                  placeholder={t('suppliers.login.fields.email.placeholder')}
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {t('suppliers.login.fields.password.label')}
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('suppliers.login.fields.password.placeholder')}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 p-4 border rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'var(--color-danger)',
                  color: 'var(--color-danger)',
                }}
              >
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading
                ? t('suppliers.login.buttons.submitting')
                : t('suppliers.login.buttons.submit')}
            </button>
          </form>

          {/* Links adicionales */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => navigate('/supplier/forgot-password')}
              className="text-sm hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('suppliers.login.links.forgotPassword')}
            </button>

            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
                {t('suppliers.login.links.noAccount')}
              </p>
              <button
                onClick={() => navigate('/supplier/registro')}
                className="hover:underline font-medium"
                style={{ color: 'var(--color-primary)' }}
              >
                {t('suppliers.login.links.register')}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
          <p>{t('suppliers.login.footer.copyright')}</p>
        </div>
      </div>
    </div>
  );
}
