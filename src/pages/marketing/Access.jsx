import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LogOut } from 'lucide-react';

import MarketingLayout from '../../components/marketing/MarketingLayout';
import RegisterForm from '../../components/auth/RegisterForm';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import { useAuth } from '../../hooks/useAuth';
import useTranslations from '../../hooks/useTranslations';

const DEFAULT_PROVIDERS = ['google', 'facebook', 'apple'];

const Access = ({ defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    loginWithProvider,
    register: registerWithEmail,
    registerWithProvider,
    availableSocialProviders,
    getProviderLabel,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();
  const { t } = useTranslations();

  const initialMode =
    location.state?.signupMode === true
      ? 'signup'
      : location.state?.signupMode === false
      ? 'login'
      : defaultMode;
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');

  const savedEmail =
    typeof window !== 'undefined' ? window.localStorage.getItem('mywed360_login_email') || '' : '';

  const [loginEmail, setLoginEmail] = useState(savedEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(Boolean(savedEmail));
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginBusyProvider, setLoginBusyProvider] = useState(null);

  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('particular');
  const [signupError, setSignupError] = useState('');
  const [signupInfo, setSignupInfo] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupBusyProvider, setSignupBusyProvider] = useState(null);

  const signupEmailRef = useRef(null);
  const signupPasswordRef = useRef(null);
  const signupRoleRef = useRef(null);

  const redirectPath =
    location?.state?.from?.pathname && location.state.from.pathname !== '/'
      ? location.state.from.pathname
      : '/home';

  const providers = useMemo(
    () => (availableSocialProviders?.length ? availableSocialProviders : DEFAULT_PROVIDERS),
    [availableSocialProviders]
  );

  const getLoginValidationMessage = useCallback(
    (issue) => {
      switch (issue) {
        case 'missing_email':
          return t('authLogin.validation.missingEmail');
        case 'missing_password':
          return t('authLogin.validation.missingPassword');
        default:
          return t('authLogin.errors.generic');
      }
    },
    [t]
  );

  const resolveLoginError = useCallback(
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

  const getSignupValidationMessage = useCallback(
    (issue) => {
      switch (issue) {
        case 'missing_email':
          return t('authSignup.validation.missingEmail');
        case 'missing_password':
          return t('authSignup.validation.missingPassword');
        case 'password_too_short':
          return t('authSignup.validation.shortPassword');
        default:
          return t('authSignup.errors.generic');
      }
    },
    [t]
  );

  const resolveSignupError = useCallback(
    (code) => {
      switch (code) {
        case 'auth/email-already-in-use':
        case 'email-already-in-use':
          return t('authSignup.errors.emailInUse');
        case 'auth/invalid-email':
        case 'invalid-email':
          return t('authSignup.errors.invalidEmail');
        case 'auth/weak-password':
        case 'weak-password':
          return t('authSignup.errors.weakPassword');
        default:
          return t('authSignup.errors.generic');
      }
    },
    [t]
  );

  const heroCopy = t(`marketingAccess.hero.${mode}`, { returnObjects: true });
  const heroBadge = t('marketingAccess.hero.badge', { defaultValue: 'Lovenda Access' });
  const heroFeatures = Array.isArray(heroCopy?.features) ? heroCopy.features : [];
  const heroTitle =
    heroCopy?.title ||
    (mode === 'signup'
      ? t('marketingAccess.hero.signup.title', { defaultValue: 'Welcome to Lovenda' })
      : t('marketingAccess.hero.login.title', { defaultValue: 'Manage everything from one place' }));
  const heroDescription =
    heroCopy?.description ||
    (mode === 'signup'
      ? t('marketingAccess.hero.signup.description', {
          defaultValue:
            'Centralise tasks, guests, and vendors in one place. Our assistant guides you every step.',
        })
      : t('marketingAccess.hero.login.description', {
          defaultValue:
            'Access your guests, tasks, budgets, and documents in seconds. Keep your team in sync.',
        }));

  const resetFeedback = () => {
    setLoginError('');
    setLoginInfo('');
    setSignupError('');
    setSignupInfo('');
  };

  const handleModeChange = (value) => {
    resetFeedback();
    setMode(value);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoginInfo('');

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setLoginError(getLoginValidationMessage('missing_email'));
      loginEmailRef.current?.focus();
      return;
    }
    if (!loginPassword) {
      setLoginError(getLoginValidationMessage('missing_password'));
      loginPasswordRef.current?.focus();
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(trimmedEmail, loginPassword);
      if (result?.success) {
        if (typeof window !== 'undefined') {
          if (rememberLogin) {
            window.localStorage.setItem('mywed360_login_email', trimmedEmail);
          } else {
            window.localStorage.removeItem('mywed360_login_email');
          }
        }
        navigate(redirectPath, { replace: true });
        return;
      }

      const loginErrorMessage = resolveLoginError(result?.code || 'unknown');
      setLoginError(loginErrorMessage);
      loginPasswordRef.current?.focus();
    } catch (error) {
      setLoginError(resolveLoginError(error?.code || 'exception'));
      loginPasswordRef.current?.focus();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginProvider = async (provider) => {
    setLoginError('');
    setLoginInfo('');
    setLoginBusyProvider(provider);
    const label = getProviderLabel?.(provider) || provider;
    try {
      setLoginInfo(t('marketingAccess.social.redirect', { provider: label, defaultValue: `Redirecting to ${label}...` }));
      await loginWithProvider(provider);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setLoginError(error?.message || t('marketingAccess.errors.provider', { provider: label, defaultValue: `We could not authenticate with ${label}.` }));
    } finally {
      setLoginBusyProvider(null);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    setSignupError('');
    setSignupInfo('');

    const trimmedEmail = signupEmail.trim();
    if (!trimmedEmail) {
      setSignupError(getSignupValidationMessage('missing_email'));
      signupEmailRef.current?.focus();
      return;
    }
    if (!signupPassword) {
      setSignupError(getSignupValidationMessage('missing_password'));
      signupPasswordRef.current?.focus();
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError(getSignupValidationMessage('password_too_short'));
      signupPasswordRef.current?.focus();
      return;
    }

    setIsSigningUp(true);
    try {
      const result = await registerWithEmail(trimmedEmail, signupPassword, signupRole);
      if (result?.success) {
        setSignupInfo(
          t('marketingAccess.signup.successMessage', {
            defaultValue: 'Account created successfully. Redirecting to your dashboard...',
          })
        );
        navigate('/home', { replace: true });
        return;
      }

      const signupErrorMessage = resolveSignupError(result?.code || 'unknown');
      setSignupError(signupErrorMessage);
      signupPasswordRef.current?.focus();
    } catch (error) {
      setSignupError(resolveSignupError(error?.code || 'exception'));
      signupPasswordRef.current?.focus();
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSignupProvider = async (provider) => {
    setSignupError('');
    setSignupInfo('');
    setSignupBusyProvider(provider);
    const label = getProviderLabel?.(provider) || provider;
    try {
      setSignupInfo(
        t('marketingAccess.signup.socialPending', {
          provider: label,
          defaultValue: `Complete the sign-up flow in the ${label} window.`,
        })
      );
      await registerWithProvider(provider, { role: signupRole });
      navigate('/home', { replace: true });
    } catch (error) {
      setSignupError(resolveSignupError(error?.code || 'exception'));
    } finally {
      setSignupBusyProvider(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      resetFeedback();
      setMode('login');
    } catch (error) {
      setLoginError(error?.message || t('authLogin.errors.generic'));
    }
  };

  const alreadyLoggedIn = isAuthenticated && !isLoading;

  return (
    <MarketingLayout>
      <div className="layout-container space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-soft bg-white/95 px-3 py-1 text-xs font-medium text-muted transition hover:text-body"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('marketingAccess.backLink', { defaultValue: 'Back to home' })}
        </Link>

        <section className="overflow-hidden rounded-3xl border border-soft bg-white/95 shadow-lg shadow-[var(--color-primary)]/15">
          <div className="grid gap-10 p-8 lg:grid-cols-[1fr,0.85fr] lg:items-start lg:p-12">
            <div className="space-y-5">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                {heroBadge}
              </span>
              <h1 className="text-4xl font-semibold leading-snug text-body md:text-5xl">{heroTitle}</h1>
              <p className="text-base text-muted">{heroDescription}</p>
              {heroFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  {heroFeatures.map((feature) => (
                    <span key={feature} className="rounded-full border border-soft bg-white/95 px-3 py-1">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-soft bg-white p-6 shadow-lg shadow-[var(--color-primary)]/20">
              {alreadyLoggedIn ? (
                <div className="space-y-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-[var(--color-primary)]">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-body">
                      {t('marketingAccess.loggedIn.title', { defaultValue: 'Active session' })}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {t('marketingAccess.loggedIn.description', {
                        defaultValue:
                          'Your Lovenda account is already open. Continue with your events or sign out if you need to switch accounts.',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/home"
                      className="inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95"
                    >
                      {t('marketingAccess.loggedIn.primaryCta', { defaultValue: 'Go to dashboard' })}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-soft px-4 py-2.5 text-sm font-semibold text-body transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('marketingAccess.loggedIn.secondaryCta', { defaultValue: 'Sign out' })}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-full bg-primary-soft/70 p-1 text-sm font-semibold text-muted">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => handleModeChange('login')}
                        className={`w-1/2 rounded-full px-4 py-2 transition ${
                          mode === 'login'
                            ? 'bg-[var(--color-primary)] text-white shadow'
                            : 'bg-transparent text-muted hover:text-body'
                        }`}
                      >
                        {t('marketingAccess.toggle.login', { defaultValue: 'Sign in' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('signup')}
                        className={`w-1/2 rounded-full px-4 py-2 transition ${
                          mode === 'signup'
                            ? 'bg-[var(--color-primary)] text-white shadow'
                            : 'bg-transparent text-muted hover:text-body'
                        }`}
                      >
                        {t('marketingAccess.toggle.signup', { defaultValue: 'Create account' })}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="space-y-4 text-left" noValidate>
                      <div className="space-y-2">
                        <label htmlFor="access-login-email" className="text-sm font-medium text-body">
                          {t('marketingAccess.loginForm.emailLabel', { defaultValue: 'Email' })}
                        </label>
                        <input
                          id="access-login-email"
                          type="email"
                          ref={loginEmailRef}
                          value={loginEmail}
                          onChange={(event) => setLoginEmail(event.target.value)}
                          autoComplete="email"
                          placeholder={t('marketingAccess.loginForm.emailPlaceholder', { defaultValue: 'your@email.com' })}
                          className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          aria-invalid={loginError ? 'true' : 'false'}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="access-login-password" className="text-sm font-medium text-body">
                          {t('marketingAccess.loginForm.passwordLabel', { defaultValue: 'Password' })}
                        </label>
                        <input
                          id="access-login-password"
                          type="password"
                          ref={loginPasswordRef}
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                          autoComplete="current-password"
                          placeholder={t('marketingAccess.loginForm.passwordPlaceholder', { defaultValue: 'Your password' })}
                          className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                          aria-invalid={loginError ? 'true' : 'false'}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-soft text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            checked={rememberLogin}
                            onChange={(event) => setRememberLogin(event.target.checked)}
                          />
                          {t('marketingAccess.loginForm.rememberMe', { defaultValue: 'Remember me' })}
                        </label>
                        <Link to="/reset-password" className="text-[var(--color-primary)] hover:brightness-110">
                          {t('marketingAccess.loginForm.forgotPassword', { defaultValue: 'Forgot password?' })}
                        </Link>
                      </div>

                      {loginError ? (
                        <p role="alert" className="text-sm text-[var(--color-primary)]">
                          {loginError}
                        </p>
                      ) : null}
                      {loginInfo ? (
                        <p role="status" className="text-sm text-[var(--color-primary)]">
                          {loginInfo}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoggingIn ? t('marketingAccess.loginForm.submitting', { defaultValue: 'Signing in…' }) : t('marketingAccess.loginForm.submit', { defaultValue: 'Sign in' })}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 text-left">
                      <p className="text-sm text-muted">{t('marketingAccess.signup.info', { defaultValue: 'Complete the form to create your account.' })}</p>
                      <RegisterForm
                        email={signupEmail}
                        password={signupPassword}
                        role={signupRole}
                        onEmailChange={setSignupEmail}
                        onPasswordChange={setSignupPassword}
                        onRoleChange={setSignupRole}
                        onSubmit={handleSignupSubmit}
                        isSubmitting={isSigningUp}
                        error={signupError}
                        emailInputRef={signupEmailRef}
                        passwordInputRef={signupPasswordRef}
                        roleSelectRef={signupRoleRef}
                        errorId="marketing-signup-error"
                      />
                      {signupInfo ? (
                        <p role="status" className="text-sm text-[var(--color-primary)]">
                          {signupInfo}
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="border-t border-soft pt-6">
                    <SocialLoginButtons
                      providers={providers}
                      onProviderClick={mode === 'login' ? handleLoginProvider : handleSignupProvider}
                      busyProvider={mode === 'login' ? loginBusyProvider : signupBusyProvider}
                      disabled={mode === 'login' ? isLoggingIn : isSigningUp}
                      getProviderLabel={getProviderLabel}
                    />
                    <p className="mt-4 text-sm text-muted">
                      {mode === 'login' ? (
                        <>
                          {t('marketingAccess.switch.noAccount', { defaultValue: 'Do not have an account?' })}{' '}
                          <button
                            type="button"
                            className="font-semibold text-[var(--color-primary)] hover:brightness-110"
                            onClick={() => handleModeChange('signup')}
                          >
                            {t('marketingAccess.switch.registerLink', { defaultValue: 'Create one' })}
                          </button>
                        </>
                      ) : (
                        <>
                          {t('marketingAccess.switch.alreadyHaveAccount', { defaultValue: 'Already have an account?' })}{' '}
                          <button
                            type="button"
                            className="font-semibold text-[var(--color-primary)] hover:brightness-110"
                            onClick={() => handleModeChange('login')}
                          >
                            {t('marketingAccess.switch.loginLink', { defaultValue: 'Sign in' })}
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Access;
