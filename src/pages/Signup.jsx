import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import RegisterForm from '../components/auth/RegisterForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import useTranslations from '../hooks/useTranslations';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';

const FORM_ERROR_ID = 'signup-form-error';
const SOCIAL_ERROR_ID = 'signup-social-error';
const INFO_MESSAGE_ID = 'signup-info-message';


export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register: registerWithEmail,
    registerWithProvider,
    availableSocialProviders,
    getProviderLabel,
  } = useAuth();
  const { t } = useTranslations();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('particular');
  const [formError, setFormError] = useState('');
  const [socialError, setSocialError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyProvider, setBusyProvider] = useState(null);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const roleSelectRef = useRef(null);

  const signupSource = location?.state?.signupSource || 'direct';

  useEffect(() => {
    performanceMonitor?.logEvent?.('signup_view', { source: signupSource });
  }, [signupSource]);

  const providers = useMemo(() => {
    if (availableSocialProviders && availableSocialProviders.length > 0) {
      return availableSocialProviders;
    }
    return ['google', 'facebook', 'apple'];
  }, [availableSocialProviders]);

  const getValidationMessage = useCallback(
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

  const heroFeatures = t('authSignup.hero.features', { returnObjects: true });

  const resetFeedback = () => {
    setFormError('');
    setSocialError('');
    setInfoMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetFeedback();

    const context = { role, provider: 'password', source: signupSource };
    const trimmedEmail = email.trim();

    const issues = [];
    if (!trimmedEmail) issues.push('missing_email');
    if (!password) issues.push('missing_password');
    if (password && password.length < 8) issues.push('password_too_short');

    performanceMonitor?.logEvent?.('signup_submit', {
      ...context,
      has_error: issues.length > 0,
    });

  if (issues.length > 0) {
      const firstIssue = issues[0];
      setFormError(getValidationMessage(firstIssue));
      if (firstIssue === 'missing_email') {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      performanceMonitor?.logEvent?.('signup_failed', {
        ...context,
        error_code: firstIssue,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerWithEmail(trimmedEmail, password, role);
      if (result?.success) {
        performanceMonitor?.logEvent?.('signup_completed', {
          ...context,
          user_id: result?.user?.uid || null,
        });
        setInfoMessage(t('authSignup.successMessage', { defaultValue: 'Account created successfully. Redirecting to your dashboard...' }));
        navigate('/home', { replace: true });
        return;
      }

      const errorCode = result?.code || 'unknown';
      setFormError(resolveSignupError(errorCode));
      passwordInputRef.current?.focus();
      performanceMonitor?.logEvent?.('signup_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      setFormError(resolveSignupError(errorCode));
      performanceMonitor?.logEvent?.('signup_failed', {
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
    const context = { provider: providerKey, role, source: signupSource };

    performanceMonitor?.logEvent?.('social_signup_submit', context);

    try {
      const result = await registerWithProvider(providerKey, { role, forceRole: true });
      if (result?.success) {
        if (result.pendingRedirect) {
          performanceMonitor?.logEvent?.('social_signup_redirect', context);
          setInfoMessage(
            t('authSignup.social.pending', {
              provider: providerName,
              defaultValue: `Complete the sign-up flow in the ${providerName} window.`,
            })
          );
        } else {
          performanceMonitor?.logEvent?.('social_signup_completed', {
            ...context,
            is_new_user: Boolean(result?.isNewUser),
          });
          navigate('/home', { replace: true });
        }
        return;
      }

      const errorCode = result?.code || 'unknown';
      setSocialError(resolveSignupError(errorCode));
      performanceMonitor?.logEvent?.('social_signup_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      setSocialError(resolveSignupError(errorCode));
      performanceMonitor?.logEvent?.('social_signup_failed', {
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
          <div className="hidden bg-[color:var(--color-primary,#6366f1)]/10 p-10 md:flex md:flex-col md:justify-between md:gap-10">
            <div>
              <h2 className="text-3xl font-bold text-[color:var(--color-primary,#6366f1)]">
                {t('authSignup.hero.title')}
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark,#4338ca)]/80">
                {t('authSignup.hero.description')}
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
              {t('authSignup.title')}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft,#6b7280)]">
              {t('authSignup.subtitle')}
            </p>

            <div className="mt-6">
              <RegisterForm
                email={email}
                password={password}
                role={role}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onRoleChange={setRole}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={formError}
                emailInputRef={emailInputRef}
                passwordInputRef={passwordInputRef}
                roleSelectRef={roleSelectRef}
                errorId={FORM_ERROR_ID}
              />
            </div>

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
              {t('authSignup.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
              >
                {t('authSignup.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
