import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: emailLogin, loginWithProvider, isAuthenticated, isLoading, availableSocialProviders, getProviderLabel } =
    useAuth();

  const savedEmail =
    typeof window !== 'undefined' ? window.localStorage.getItem('mywed360_login_email') || '' : '';

  const [username, setUsername] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!savedEmail);
  const [formError, setFormError] = useState('');
  const [socialError, setSocialError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyProvider, setBusyProvider] = useState(null);

  const providers = useMemo(() => {
    if (availableSocialProviders && availableSocialProviders.length > 0) {
      return availableSocialProviders;
    }
    return ['google', 'facebook', 'apple'];
  }, [availableSocialProviders]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;

    try {
      const fromPath =
        (location?.state && location.state.from && location.state.from.pathname) || '/home';
      const safePath = fromPath === '/login' || fromPath === '/' ? '/home' : fromPath;
      navigate(safePath, { replace: true });
    } catch (error) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSocialError('');
    setInfoMessage('');

    if (!username || !password) {
      setFormError('Introduce tu email y contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await emailLogin(username, password, remember);
      if (result?.success) {
        if (remember) {
          window.localStorage.setItem('mywed360_login_email', username);
        } else {
          window.localStorage.removeItem('mywed360_login_email');
        }
        navigate('/home');
        return;
      }

      setFormError(result?.error || 'Usuario o contraseña inválidos.');
    } catch (error) {
      setFormError(error.message || 'Usuario o contraseña inválidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerKey) => {
    setFormError('');
    setSocialError('');
    setInfoMessage('');
    setBusyProvider(providerKey);

    try {
      const result = await loginWithProvider(providerKey, {});
      if (result?.success) {
        if (result.pendingRedirect) {
          const providerName = getProviderLabel?.(providerKey) || providerKey;
          setInfoMessage(`Continúa el inicio de sesión en la ventana de ${providerName}.`);
        } else {
          if (remember && result.user?.email) {
            window.localStorage.setItem('mywed360_login_email', result.user.email);
          }
          navigate('/home');
        }
        return;
      }

      const providerName = getProviderLabel?.(providerKey) || providerKey;
      setSocialError(result?.error || `No se pudo iniciar sesión con ${providerName}.`);
    } catch (error) {
      const providerName = getProviderLabel?.(providerKey) || providerKey;
      setSocialError(error.message || `No se pudo iniciar sesión con ${providerName}.`);
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#f4f5f7)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-soft bg-surface shadow-xl md:grid md:grid-cols-2">
          <div className="hidden bg-[color:var(--color-primary,#6366f1)]/10 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[color:var(--color-primary,#6366f1)]">
                Gestiona todo desde un único panel
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark,#4338ca)]/80">
                Accede a tus invitados, tareas, presupuestos y documentos en segundos. Sigue el
                progreso del evento y coordina a todo tu equipo.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-[color:var(--color-primary-dark,#4338ca)]/80">
              <li>• Sincroniza proveedores y contratos.</li>
              <li>• Automatiza correos y recordatorios personalizados.</li>
              <li>• Recibe alertas cuando algo requiera tu atención.</li>
            </ul>
          </div>

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-semibold text-[color:var(--color-text,#111827)]">
              Inicia sesión
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft,#6b7280)]">
              Usa tu email y contraseña o accede con un proveedor social.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-[color:var(--color-text,#111827)]">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  data-testid="email-input"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-[color:var(--color-text,#111827)]">
                  Contraseña
                </label>
                <input
                  id="login-password"
                  type="password"
                  data-testid="password-input"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-[color:var(--color-text-soft,#6b7280)]">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(event) => {
                      setRemember(event.target.checked);
                      if (!event.target.checked) {
                        window.localStorage.removeItem('mywed360_login_email');
                      }
                    }}
                    className="rounded border-soft text-[color:var(--color-primary,#6366f1)] focus:ring-[color:var(--color-primary,#6366f1)]"
                  />
                  Recuérdame
                </label>
                <Link
                  to="/reset-password"
                  className="text-[color:var(--color-primary,#6366f1)] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

              <button
                type="submit"
                data-testid="login-button"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] transition-colors hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <AuthDivider label="o continúa con" />

            <SocialLoginButtons
              providers={providers}
              onProviderClick={handleSocialLogin}
              busyProvider={busyProvider}
              disabled={isSubmitting}
            />

            {socialError ? (
              <p className="mt-3 text-center text-sm text-red-600">{socialError}</p>
            ) : null}
            {infoMessage ? (
              <p className="mt-3 text-center text-sm text-[color:var(--color-primary,#6366f1)]">
                {infoMessage}
              </p>
            ) : null}

            <p className="mt-6 text-center text-sm text-[color:var(--color-text-soft,#6b7280)]">
              ¿No tienes cuenta?{' '}
              <Link
                to="/signup"
                className="font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
