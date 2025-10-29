import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';

/**
 * Página para establecer contraseña por primera vez
 *
 * El proveedor llega aquí desde el link en su email de verificación
 */
export default function SupplierSetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Obtener email y token de los query params
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);

    if (!emailParam || !tokenParam) {
      setError(t('common.suppliers.setPassword.errors.invalidLink'));
    }
  }, [searchParams, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 8) {
      setError(t('common.suppliers.setPassword.errors.passwordShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('common.suppliers.setPassword.errors.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/supplier-dashboard/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verificationToken: token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'invalid_token') {
          throw new Error(t('common.suppliers.setPassword.errors.invalidToken'));
        }
        if (data.error === 'password_too_short') {
          throw new Error(t('common.suppliers.setPassword.errors.passwordShort'));
        }
        throw new Error(data.message || t('common.suppliers.setPassword.errors.generic'));
      }

      setSuccess(true);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/supplier/login');
      }, 2000);
    } catch (err) {
      setError(err.message || t('common.suppliers.setPassword.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="max-w-md w-full text-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)' }}
          >
            <CheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
            {t('common.suppliers.setPassword.success.title')}
          </h1>
          <p className="mb-8" style={{ color: 'var(--color-muted)' }}>
            {t('common.suppliers.setPassword.success.description')}
          </p>
          <div className="animate-pulse">
            <div
              className="w-16 h-1 mx-auto rounded-full"
              style={{ backgroundColor: 'var(--color-success)' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full text-white mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('common.suppliers.setPassword.title')}
          </h1>
          <p style={{ color: 'var(--color-muted)' }}>
            {t('common.suppliers.setPassword.subtitle')}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl shadow-lg p-8"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.suppliers.setPassword.fields.email')}
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border rounded-lg cursor-not-allowed"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-muted)',
                }}
              />
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.suppliers.setPassword.fields.password.label')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('common.suppliers.setPassword.fields.password.placeholder')}
                required
                minLength={8}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                {t('common.suppliers.setPassword.fields.password.hint')}
              </p>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.suppliers.setPassword.fields.confirm.label')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('common.suppliers.setPassword.fields.confirm.placeholder')}
                required
              />
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !token}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading
                ? t('common.suppliers.setPassword.buttons.submitting')
                : t('common.suppliers.setPassword.buttons.submit')}
            </button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/supplier/login')}
              className="text-sm hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('common.suppliers.setPassword.links.login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
