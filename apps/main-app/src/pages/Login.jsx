import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import LanguageSelector from '../components/ui/LanguageSelector';
import { useAuth } from '../hooks/useAuth.jsx';
import { performanceMonitor } from '../services/PerformanceMonitor';
import useTranslations from '../hooks/useTranslations';

const FORM_ERROR_ID = 'login-form-error';
const SOCIAL_ERROR_ID = 'login-social-error';
const INFO_MESSAGE_ID = 'login-info-message';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithEmail, authUser, loading } = useAuth();

  const isAuthenticated = !!authUser;
  const isLoading = loading;
  const { t } = useTranslations();
  
  // Pre-launch mode check
  const isPreLaunchMode = import.meta.env.VITE_PRE_LAUNCH_MODE === 'true';
  const launchDate = import.meta.env.VITE_LAUNCH_DATE || '31 de enero de 2026';

  const savedEmail =
    typeof window !== 'undefined' ? window.localStorage.getItem('maloveapp_login_email') || '' : '';

  const [username, setUsername] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(!!savedEmail);
  const rememberInitial = useRef(!!savedEmail);
  const [formError, setFormError] = useState('');
  const [socialError, setSocialError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyProvider, setBusyProvider] = useState(null);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const loginSource = location?.state?.loginSource || 'direct';
  const fromPath = location?.state?.from?.pathname || '/home';
  const safeRedirect = fromPath === '/login' || fromPath === '/' ? '/home' : fromPath;

  useEffect(() => {
    performanceMonitor?.logEvent?.('login_view', {
      source: loginSource,
      remember_pref: rememberInitial.current,
    });
  }, [loginSource]);

  const shouldSkipCypressRedirect = () =>
    typeof window !== 'undefined' &&
    !!window.Cypress &&
    window.__MALOVEAPP_DISABLE_LOGIN_REDIRECT__ === true;

  // Redirect se maneja en handleSubmit - no necesitamos useEffect que causa loops

  const providers = useMemo(() => {
    return ['google', 'facebook', 'apple'];
  }, []);

  const getValidationMessage = useCallback(
    (issue) => {
      if (issue === 'missing_email') return t('authLogin.validation.missingEmail');
      if (issue === 'missing_password') return t('authLogin.validation.missingPassword');
      return t('authLogin.errors.generic');
    },
    [t]
  );

  const resolveAuthError = useCallback(
    (code) => {
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/invalid-credentials':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'invalid-credentials':
        case 'wrong-password':
          return t('authLogin.errors.invalidCredentials');
        default:
          return t('authLogin.errors.generic');
      }
    },
    [t]
  );

  const resetFeedback = () => {
    setFormError('');
    setSocialError('');
    setInfoMessage('');
  };

  const heroFeatures = t('authLogin.hero.features', { returnObjects: true });

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();
    
    // Block login in pre-launch mode
    if (isPreLaunchMode) {
      setFormError(`La plataforma estará disponible a partir del ${launchDate}. Por ahora puedes explorar nuestras funcionalidades.`);
      return;
    }

    const context = { provider: 'password', remember_me: remember, source: loginSource };

    const issues = [];
    const trimmedEmail = username.trim();
    if (!trimmedEmail) issues.push('missing_email');
    if (!password) issues.push('missing_password');

    performanceMonitor?.logEvent?.('login_submit', {
      ...context,
      has_error: issues.length > 0,
      redirect_to: safeRedirect,
    });

    if (issues.length > 0) {
      const firstIssue = issues[0];
      setFormError(getValidationMessage(firstIssue));
      if (firstIssue === 'missing_email') {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      performanceMonitor?.logEvent?.('login_failed', {
        ...context,
        error_code: firstIssue,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[Login.jsx] Llamando loginWithEmail...');
      const result = await loginWithEmail(trimmedEmail, password);
      console.log('[Login.jsx] Resultado de loginWithEmail:', result);
      console.log('[Login.jsx] result.success:', result?.success);

      if (result?.success) {
        console.log('[Login.jsx] Login exitoso, guardando email y redirigiendo...');
        if (remember) {
          window.localStorage.setItem('maloveapp_login_email', trimmedEmail);
        } else {
          window.localStorage.removeItem('maloveapp_login_email');
        }

        performanceMonitor?.logEvent?.('login_success', {
          ...context,
          redirect_to: safeRedirect,
        });

        console.log('[Login.jsx] Navegando a:', safeRedirect);
        if (shouldSkipCypressRedirect()) {
          navigate('/home', { replace: true });
        } else {
          navigate(safeRedirect, { replace: true });
        }
        console.log('[Login.jsx] Navigate llamado');
        return;
      }

      console.log('[Login.jsx] Login no exitoso, mostrando error');
      const errorCode = result?.code || 'unknown';
      const message = resolveAuthError(errorCode);
      setFormError(message);
      passwordInputRef.current?.focus();
      performanceMonitor?.logEvent?.('login_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      const message = resolveAuthError(errorCode);
      setFormError(message);
      performanceMonitor?.logEvent?.('login_failed', {
        ...context,
        error_code: errorCode,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerKey) => {
    resetFeedback();
    setBusyProvider(providerKey);

    // TODO: Implementar OAuth propio (Google, Facebook, Apple)
    // Firebase Auth social login ha sido removido
    setSocialError(
      t('authLogin.social.notAvailable', {
        defaultValue: 'Social login temporalmente no disponible',
      })
    );
    setBusyProvider(null);
    return;

    /* DESHABILITADO - Requiere OAuth propio
    const providerName = providerKey;
    const context = { provider: providerKey, remember_me: remember, source: loginSource };
    performanceMonitor?.logEvent?.('social_login_submit', context);
    try {
      const result = { success: false };
      if (result?.success) {
        if (remember && result.user?.email) {
          window.localStorage.setItem('maloveapp_login_email', result.user.email);
        }

        if (result.pendingRedirect) {
          performanceMonitor?.logEvent?.('social_login_redirect', context);
          setInfoMessage(
            t('authLogin.social.pending', {
              provider: providerName,
              defaultValue: `Continue the sign-in flow in the ${providerName} window.`,
            })
          );
        } else {
          performanceMonitor?.logEvent?.('social_login_completed', {
            ...context,
            redirect_to: safeRedirect,
          });
          if (shouldSkipCypressRedirect()) {
            navigate('/home', { replace: true });
          } else {
            navigate(safeRedirect, { replace: true });
          }
        }
        return;
      }

      const errorCode = result?.code || 'unknown';
      setSocialError(resolveAuthError(errorCode));
      performanceMonitor?.logEvent?.('social_login_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      setSocialError(resolveAuthError(errorCode));
      performanceMonitor?.logEvent?.('social_login_failed', {
        ...context,
        error_code: errorCode,
      });
    } finally {
      setBusyProvider(null);
    }
    */
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-8 relative">
      {/* Aviso de mantenimiento */}
      <div className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3 mb-4">
        <div className="max-w-5xl mx-auto flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-800">
              <strong className="font-semibold">Aviso importante:</strong> La plataforma estará en
              mantenimiento programado hasta el <strong>31 de enero de 2026</strong>. Durante este
              periodo podrías experimentar interrupciones temporales del servicio.
            </p>
          </div>
        </div>
      </div>

      {/* Selector de idioma */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="minimal" persist={false} />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-soft bg-surface shadow-xl md:grid md:grid-cols-2">
          <div className="hidden bg-[color:var(--color-primary-10)] p-10 md:flex md:flex-col md:justify-between">
            <div>
              <img
                src="/logo.png"
                alt="Planivia"
                style={{ height: '32px', width: 'auto', marginBottom: '24px' }}
              />
              <h2 className="text-3xl font-bold text-[color:var(--color-primary)]">
                {t('authLogin.hero.title')}
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark)]">
                {t('authLogin.hero.description')}
              </p>
            </div>
            {Array.isArray(heroFeatures) && heroFeatures.length > 0 ? (
              <ul className="space-y-3 text-sm text-[color:var(--color-primary-dark)]">
                {heroFeatures.map((feature, index) => (
                  <li key={index}>- {feature}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-semibold text-[color:var(--color-text)]">
              {t('authLogin.title')}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
              {t('authLogin.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-[color:var(--color-text)]"
                >
                  {t('authLogin.emailLabel')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  data-testid="email-input"
                  autoComplete="email"
                  placeholder={t('authLogin.emailPlaceholder')}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  ref={emailInputRef}
                  aria-invalid={formError ? 'true' : 'false'}
                  aria-describedby={formError ? FORM_ERROR_ID : undefined}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-[color:var(--color-text)]"
                >
                  {t('authLogin.passwordLabel')}
                </label>
                <input
                  id="login-password"
                  type="password"
                  data-testid="password-input"
                  autoComplete="current-password"
                  placeholder={t('authLogin.passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  ref={passwordInputRef}
                  aria-invalid={formError ? 'true' : 'false'}
                  aria-describedby={formError ? FORM_ERROR_ID : undefined}
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-[color:var(--color-text-soft)]">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(event) => {
                      const isChecked = event.target.checked;
                      setRemember(isChecked);
                      if (!isChecked) {
                        window.localStorage.removeItem('maloveapp_login_email');
                      }
                    }}
                    className="rounded border-soft text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)]"
                  />
                  {t('authLogin.rememberMe')}
                </label>
                <Link
                  to="/reset-password"
                  className="text-[color:var(--color-primary)] hover:underline"
                >
                  {t('authLogin.forgotPassword')}
                </Link>
              </div>

              {formError ? (
                <p
                  id={FORM_ERROR_ID}
                  role="alert"
                  aria-live="assertive"
                  className="text-sm text-danger"
                >
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                data-testid="login-button"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary)] transition-colors hover:bg-[color:var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t('authLogin.submitting') : t('authLogin.submit')}
              </button>
            </form>

            {/* Social login temporalmente deshabilitado - requiere OAuth propio
            <AuthDivider text={t('authLogin.divider')} />
            <SocialLoginButtons
              providers={providers}
              onProviderClick={handleSocialLogin}
              busyProvider={busyProvider}
              disabled={isSubmitting}
              error={socialError}
              errorId={SOCIAL_ERROR_ID}
            />
            */}

            {socialError ? (
              <p
                id={SOCIAL_ERROR_ID}
                role="alert"
                aria-live="assertive"
                className="mt-3 text-center text-sm text-danger"
              >
                {socialError}
              </p>
            ) : null}
            {infoMessage ? (
              <p
                id={INFO_MESSAGE_ID}
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-sm text-[color:var(--color-primary)]"
              >
                {infoMessage}
              </p>
            ) : null}

            <p className="mt-6 text-center text-sm text-[color:var(--color-text-soft)]">
              {t('authLogin.noAccount')}{' '}
              <Link
                to="/signup"
                className="font-medium text-[color:var(--color-primary)] hover:underline"
              >
                {t('authLogin.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
