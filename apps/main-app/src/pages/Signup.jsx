import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import TwoStepRegisterForm from '../components/auth/TwoStepRegisterForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import LanguageSelector from '../components/ui/LanguageSelector';
import { useAuth } from '../hooks/useAuth.jsx';
import { performanceMonitor } from '../services/PerformanceMonitor';
import useTranslations from '../hooks/useTranslations';
const FORM_ERROR_ID = 'signup-form-error';
const SOCIAL_ERROR_ID = 'signup-social-error';
const INFO_MESSAGE_ID = 'signup-info-message';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerWithEmail } = useAuth();
  const { t } = useTranslations();

  const [formError, setFormError] = useState('');
  const [socialError, setSocialError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyProvider, setBusyProvider] = useState(null);

  const signupSource = location?.state?.signupSource || 'direct';

  useEffect(() => {
    performanceMonitor?.logEvent?.('signup_view', { source: signupSource });
  }, [signupSource]);

  // Social login temporalmente deshabilitado
  const providers = [];

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

  const handleSubmit = async (formData) => {
    resetFeedback();

    const context = {
      role: formData.role,
      provider: 'password',
      source: signupSource,
    };
    const trimmedEmail = formData.email.trim();

    // Validaciones básicas
    const issues = [];
    if (!trimmedEmail) issues.push('missing_email');
    if (!formData.password) issues.push('missing_password');
    if (formData.password && formData.password.length < 8) issues.push('password_too_short');
    if (!formData.fullName) issues.push('missing_name');

    performanceMonitor?.logEvent?.('signup_submit', {
      ...context,
      has_error: issues.length > 0,
    });

    if (issues.length > 0) {
      const firstIssue = issues[0];
      setFormError(getValidationMessage(firstIssue));
      performanceMonitor?.logEvent?.('signup_failed', {
        ...context,
        error_code: firstIssue,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar datos adicionales según rol
      const additionalData = {
        fullName: formData.fullName,
      };

      // Datos específicos por rol
      if (formData.role === 'particular') {
        additionalData.weddingInfo = {
          coupleName:
            formData.fullName + (formData.partnerName ? ` y ${formData.partnerName}` : ''),
          weddingDate: formData.weddingDate || '',
          celebrationCity: formData.weddingCity || '',
          phone: formData.phone || '',
        };
      } else if (formData.role === 'planner') {
        additionalData.plannerInfo = {
          companyName: formData.companyName || '',
          professionalPhone: formData.professionalPhone || '',
          operatingCities: formData.operatingCities || '',
          yearsExperience: formData.yearsExperience || '',
        };
      } else if (formData.role === 'assistant') {
        additionalData.assistantInfo = {
          phone: formData.assistantPhone || '',
          invitationCode: formData.invitationCode || '',
        };
      }

      // Combinar role en additionalData
      const registrationData = {
        ...additionalData,
        role: formData.role,
      };

      const result = await registerWithEmail(trimmedEmail, formData.password, registrationData);

      if (result?.success) {
        performanceMonitor?.logEvent?.('signup_completed', {
          ...context,
          user_id: result?.user?.uid || null,
        });
        setInfoMessage(
          t('authSignup.successMessage', {
            defaultValue: 'Account created successfully. Redirecting to your dashboard...',
          })
        );
        navigate('/home', { replace: true });
        return;
      }

      const errorCode = result?.code || 'unknown';
      setFormError(resolveSignupError(errorCode));
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

  // Social login deshabilitado - requiere OAuth propio
  const handleSocialLogin = async (providerKey) => {
    resetFeedback();
    setSocialError(
      t('authSignup.social.notAvailable', {
        defaultValue: 'Social login temporalmente no disponible',
      })
    );
    return;

    /* DESHABILITADO
    setBusyProvider(providerKey);
    const providerName = providerKey;
    const context = { provider: providerKey, role: 'particular', source: signupSource };
    performanceMonitor?.logEvent?.('social_signup_submit', context);
    try {
      const result = { success: false };
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
                {t('authSignup.hero.title')}
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark)]">
                {t('authSignup.hero.description')}
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
              {t('authSignup.title')}
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft)]">
              {t('authSignup.subtitle')}
            </p>

            <div className="mt-6">
              <TwoStepRegisterForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={formError}
                errorId={FORM_ERROR_ID}
              />
            </div>

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
              {t('authSignup.alreadyHaveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-[color:var(--color-primary)] hover:underline"
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
