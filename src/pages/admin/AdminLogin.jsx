import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

const MAX_ATTEMPTS = 5;

const AdminLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginAdmin, isAuthenticated, isAdmin, isLoading } = useAuth();

  const [email, setEmail] = useState('admin@lovenda.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const redirectPath = useMemo(() => {
    if (location?.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    return '/admin/dashboard';
  }, [location]);

  if (!isLoading && isAuthenticated && isAdmin) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isBlocked) {
      return;
    }

    setError('');
    const result = await loginAdmin(email.trim(), password);
    if (!result.success) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        setError('Se han superado los intentos permitidos. Contacta con soporte.');
        return;
      }
      setError(result.error || 'Email o contraseña no válidos');
      return;
    }

    navigate('/admin/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#f4f5f7)] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-surface shadow-lg border border-soft p-8 space-y-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text,#111827)]">Acceso Administrador</h1>
          <p className="text-sm text-[var(--color-text-soft,#6b7280)] mt-1">
            Introduce tus credenciales corporativas para acceder al panel global.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-sm font-medium text-[var(--color-text,#111827)]">
              Email corporativo
            </label>
            <input
              id="admin-email"
              data-testid="admin-login-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-sm font-medium text-[var(--color-text,#111827)]">
              Contraseña
            </label>
            <input
              id="admin-password"
              data-testid="admin-login-password"
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
            />
          </div>
        </div>

        {error && (
          <div
            data-testid="admin-login-error"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="admin-login-submit"
          disabled={isBlocked}
          className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] transition-colors hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          Acceder
        </button>

        <div className="text-xs text-[var(--color-text-soft,#6b7280)] flex justify-between">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="rounded border-soft" disabled />
            Recordar sesión (requiere MFA)
          </label>
          <button type="button" className="text-[color:var(--color-primary,#6366f1)]" data-testid="admin-login-help">
            ¿Problemas para entrar?
          </button>
        </div>

        <div className="hidden" data-testid="admin-mfa-step">
          <input data-testid="admin-mfa-input" type="text" inputMode="numeric" maxLength={6} />
          <button data-testid="admin-mfa-submit" type="button">
            Validar código
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;