import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';
import useTranslations from '../hooks/useTranslations';

const FORM_ERROR_ID = 'login-form-error';
const SOCIAL_ERROR_ID = 'login-social-error';
const INFO_MESSAGE_ID = 'login-info-message';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    login: emailLogin,
    loginWithProvider,
    isAuthenticated,
    isLoading,
    availableSocialProviders,
    getProviderLabel,
  } = useAuth();
  const { t } = useTranslations();

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

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    if (shouldSkipCypressRedirect()) return;

    try {
      const target = safeRedirect;
      navigate(target, { replace: true });
    } catch (error) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, safeRedirect]);

  const providers = useMemo(() => {
    if (availableSocialProviders && availableSocialProviders.length > 0) {
      return availableSocialProviders;
    }
    return ['google', 'facebook', 'apple'];
  }, [availableSocialProviders]);

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
      const result = await emailLogin(trimmedEmail, password, remember);
      if (result?.success) {
        if (remember) {
          window.localStorage.setItem('maloveapp_login_email', trimmedEmail);
        } else {
          window.localStorage.removeItem('maloveapp_login_email');
        }

        performanceMonitor?.logEvent?.('login_success', {
          ...context,
          redirect_to: safeRedirect,
        });

        if (shouldSkipCypressRedirect()) {
          navigate('/home', { replace: true });
        } else {
          navigate(safeRedirect, { replace: true });
        }
        return;
      }

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

    const providerName = getProviderLabel?.(providerKey) || providerKey;
    const context = { provider: providerKey, remember_me: remember, source: loginSource };

    performanceMonitor?.logEvent?.('social_login_submit', context);

    try {
      const result = await loginWithProvider(providerKey, {});
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
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg,#f4f5f7)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-soft bg-surface shadow-xl md:grid md:grid-cols-2">
          <div className="hidden bg-[color:var(--color-primary,#6366f1)]/10 p-10 md:flex md:flex-col md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[color:var(--color-primary,#6366f1)]">
                {t('authLogin.hero.title')}
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark,#4338ca)]/80">
                {t('authLogin.hero.description')}
              </p>
            </div>
            {Array.isArray(heroFeatures) && heroFeatures.length > 0 ? (
              <ul className="space-y-3 text-sm text-[color:var(--color-primary-dark,#4338ca)]/80">
                {heroFeatures.map((feature, index) => (
                  <li key={index}>- {feature}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-semibold text-[color:var(--color-text,#111827)]">
              {t('authLogin.title')}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft,#6b7280)]">
              {t('authLogin.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="text-sm font-medium text-[color:var(--color-text,#111827)]"
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
                  className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-[color:var(--color-text,#111827)]"
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
                      const isChecked = event.target.checked;
                      setRemember(isChecked);
                      if (!isChecked) {
                        window.localStorage.removeItem('maloveapp_login_email');
                      }
                    }}
                    className="rounded border-soft text-[color:var(--color-primary,#6366f1)] focus:ring-[color:var(--color-primary,#6366f1)]"
                  />
                  {t('authLogin.rememberMe')}
                </label>
                <Link
                  to="/reset-password"
                  className="text-[color:var(--color-primary,#6366f1)] hover:underline"
                >
                  {t('authLogin.forgotPassword')}
                </Link>
              </div>

              {formError ? (
                <p
                  id={FORM_ERROR_ID}
                  role="alert"
                  aria-live="assertive"
                  className="text-sm text-red-600"
                >
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                data-testid="login-button"
                disabled={isSubmitting}
                className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] transition-colors hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t('authLogin.submitting') : t('authLogin.submit')}
              </button>
            </form>

            <AuthDivider />

            <SocialLoginButtons
              providers={providers}
              onProviderClick={handleSocialLogin}
              busyProvider={busyProvider}
              disabled={isSubmitting}
              getProviderLabel={getProviderLabel}
            />

            {socialError ? (
              <p
                id={SOCIAL_ERROR_ID}
                role="alert"
                aria-live="assertive"
                className="mt-3 text-center text-sm text-red-600"
              >
                {socialError}
              </p>
            ) : null}
            {infoMessage ? (
              <p
                id={INFO_MESSAGE_ID}
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-sm text-[color:var(--color-primary,#6366f1)]"
              >
                {infoMessage}
              </p>
            ) : null}

            <p className="mt-6 text-center text-sm text-[color:var(--color-text-soft,#6b7280)]">
              {t('authLogin.noAccount')}{' '}
              <Link
                to="/signup"
                className="font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
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
