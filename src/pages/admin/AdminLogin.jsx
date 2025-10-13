import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';

const MFA_CODE_LENGTH = 6;

const AdminLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    loginAdmin,
    completeAdminMfa,
    pendingAdminSession,
    logout,
    isAuthenticated,
    isAdmin,
    isLoading,
  } = useAuth();

  const [email, setEmail] = useState('admin@lovenda.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMfaStep, setShowMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const supportEmail = useMemo(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_SUPPORT_EMAIL) ||
      'soporte@lovenda.com',
    []
  );
  const supportPhone = useMemo(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_SUPPORT_PHONE) ||
      '+34 900 000 000',
    []
  );

  const redirectPath = useMemo(() => {
    if (location?.state?.from?.pathname) {
      return location.state.from.pathname;
    }
    return '/admin/dashboard';
  }, [location]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!blockedUntil) return;
    if (blockedUntil <= now) {
      setBlockedUntil(null);
    }
  }, [blockedUntil, now]);

  useEffect(() => {
    if (pendingAdminSession) {
      setShowMfaStep(true);
      setMfaError('');
    } else if (showMfaStep) {
      setShowMfaStep(false);
      setMfaCode('');
    }
  }, [pendingAdminSession, showMfaStep]);

  if (!isLoading && isAuthenticated && isAdmin) {
    return <Navigate to={redirectPath} replace />;
  }

  const isBlocked = Boolean(blockedUntil && blockedUntil > now);
  const blockUnlockTime = isBlocked ? new Date(blockedUntil).toLocaleTimeString() : '';
  const blockRemainingSeconds = isBlocked ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;

  const mfaExpiresAt = pendingAdminSession?.expiresAt ?? null;
  const mfaSecondsLeft =
    mfaExpiresAt && mfaExpiresAt > now ? Math.max(0, Math.ceil((mfaExpiresAt - now) / 1000)) : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (isBlocked) {
      setError(
        `El acceso está bloqueado. Podrás reintentarlo a las ${blockUnlockTime} o contacta con soporte.`
      );
      return;
    }

    setError('');
    setMfaError('');
    setIsSubmitting(true);

    try {
      const result = await loginAdmin(email.trim(), password);
      if (!result.success) {
        const lockedUntilMs =
          result.code === 'locked'
            ? typeof result.lockedUntil === 'number'
              ? result.lockedUntil
              : result.lockedUntil instanceof Date
              ? result.lockedUntil.getTime()
              : null
            : null;

        if (lockedUntilMs && lockedUntilMs > Date.now()) {
          setBlockedUntil(lockedUntilMs);
          const readable = new Date(lockedUntilMs).toLocaleTimeString();
          setError(
            result.error ||
              `Acceso bloqueado temporalmente. Podrás reintentarlo a las ${readable}. Si necesitas ayuda, contacta con ${supportEmail}.`
          );
        } else {
          setError(result.error || 'Email o contraseña no válidos');
        }
        return;
      }

      if (result.requiresMfa) {
        setBlockedUntil(null);
        setMfaCode('');
        setShowMfaStep(true);
        return;
      }

      setBlockedUntil(null);
      navigate('/admin/dashboard', { replace: true });
    } catch (submitError) {
      console.error('[AdminLogin] Error durante el login admin:', submitError);
      setError('No fue posible iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (event) => {
    event.preventDefault();
    if (isVerifyingMfa) return;
    if (!pendingAdminSession) {
      setMfaError('No hay un desafío MFA activo. Vuelve a iniciar sesión.');
      return;
    }
    if (mfaCode.trim().length !== MFA_CODE_LENGTH) {
      setMfaError(`Introduce los ${MFA_CODE_LENGTH} dígitos.`);
      return;
    }

    setIsVerifyingMfa(true);
    setMfaError('');

    try {
      const result = await completeAdminMfa(mfaCode.trim());
      if (!result.success) {
        if (result.lockedUntil) {
          const lockedMs =
            typeof result.lockedUntil === 'number'
              ? result.lockedUntil
              : result.lockedUntil instanceof Date
              ? result.lockedUntil.getTime()
              : null;
          if (lockedMs && lockedMs > Date.now()) {
            setBlockedUntil(lockedMs);
          }
        }
        if (result.code === 'challenge_expired') {
          setShowMfaStep(false);
        }
        setMfaError(result.error || 'Código inválido');
        return;
      }

      setBlockedUntil(null);
      setShowMfaStep(false);
      setMfaCode('');
      navigate('/admin/dashboard', { replace: true });
    } catch (mfaSubmitError) {
      console.error('[AdminLogin] Error al validar MFA:', mfaSubmitError);
      setMfaError('No fue posible validar el código. Inténtalo de nuevo.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleCancelMfa = async () => {
    setShowMfaStep(false);
    setMfaCode('');
    setMfaError('');
    try {
      await logout();
    } catch (logoutError) {
      console.warn('[AdminLogin] No se pudo cancelar la sesión MFA:', logoutError);
    }
  };

  const buttonLabel = isSubmitting ? 'Accediendo...' : 'Acceder';

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
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)] disabled:bg-[var(--color-bg-soft,#f3f4f6)]"
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
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)] disabled:bg-[var(--color-bg-soft,#f3f4f6)]"
            />
          </div>
        </div>

        {error && (
          <div
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            data-testid="admin-login-error"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          data-testid="admin-login-submit"
          disabled={isBlocked || isSubmitting}
          className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] transition-colors hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {buttonLabel}
        </button>

        {isBlocked && (
          <p className="text-xs text-red-600">
            Bloqueo temporal activo ({Math.ceil(blockRemainingSeconds / 60)} min restantes). Si necesitas ayuda,
            escríbenos a <a href={`mailto:${supportEmail}`} className="underline">{supportEmail}</a>.
          </p>
        )}

        <div className="text-xs text-[var(--color-text-soft,#6b7280)] flex justify-between items-center">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="rounded border-soft" disabled />
            Recordar sesión (requiere MFA)
          </label>
          <button
            type="button"
            className="text-[color:var(--color-primary,#6366f1)] hover:underline"
            data-testid="admin-login-help"
            onClick={() => setShowHelp(true)}
          >
            ¿Problemas para entrar?
          </button>
        </div>
      </form>

      {showHelp && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4" data-testid="admin-help-modal">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold">¿Necesitas ayuda?</h2>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Escríbenos a <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a> o llámanos al{' '}
                <a className="underline" href={`tel:${supportPhone}`}>{supportPhone}</a>.
              </p>
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)]"
              onClick={() => setShowHelp(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showMfaStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" data-testid="admin-mfa-step">
          <form
            onSubmit={handleMfaSubmit}
            className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-semibold">Verificación MFA</h3>
              <p className="text-sm text-[var(--color-text-soft,#6b7280)]">
                Introduce el código de {MFA_CODE_LENGTH} dígitos enviado al canal seguro configurado.
              </p>
              {mfaExpiresAt && (
                <p className="text-xs text-[var(--color-text-soft,#6b7280)]" data-testid="admin-mfa-countdown">
                  Caduca en {mfaSecondsLeft}s
                </p>
              )}
            </div>
            <input
              data-testid="admin-mfa-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={MFA_CODE_LENGTH}
              value={mfaCode}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, '');
                setMfaCode(nextValue);
              }}
              autoFocus
              className="w-full rounded-md border border-soft px-3 py-2 text-center text-lg tracking-[0.4em]"
            />
            {mfaError && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {mfaError}
              </div>
            )}
            <div className="flex justify-end gap-3 text-sm">
              <button
                type="button"
                onClick={handleCancelMfa}
                className="px-3 py-2 text-[var(--color-text-soft,#6b7280)] hover:underline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="admin-mfa-submit"
                disabled={isVerifyingMfa}
                className="rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isVerifyingMfa ? 'Validando...' : 'Validar código'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
