import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import RegisterForm from '../components/auth/RegisterForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';

const FORM_ERROR_ID = 'signup-form-error';
const SOCIAL_ERROR_ID = 'signup-social-error';
const INFO_MESSAGE_ID = 'signup-info-message';

const VALIDATION_MESSAGES = {
  missing_email: 'Introduce tu correo electronico.',
  missing_password: 'Introduce una contrasena valida.',
  password_too_short: 'La contrasena debe tener al menos 8 caracteres.',
};

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register: registerWithEmail,
    registerWithProvider,
    availableSocialProviders,
    getProviderLabel,
  } = useAuth();

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
      const message = VALIDATION_MESSAGES[firstIssue] || VALIDATION_MESSAGES.missing_email;
      setFormError(message);
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
        navigate('/home', { replace: true });
        return;
      }

      const errorCode = result?.code || 'unknown';
      const message =
        result?.error || 'No pudimos crear tu cuenta. Revisa los datos e intentalo de nuevo.';
      setFormError(message);
      passwordInputRef.current?.focus();
      performanceMonitor?.logEvent?.('signup_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      const message = error?.message || 'No pudimos crear tu cuenta. Intentalo nuevamente.';
      setFormError(message);
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
          setInfoMessage(`Continua el registro en la ventana de ${providerName}.`);
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
      const message = result?.error || `No se pudo completar el registro con ${providerName}.`;
      setSocialError(message);
      performanceMonitor?.logEvent?.('social_signup_failed', {
        ...context,
        error_code: errorCode,
      });
    } catch (error) {
      const errorCode = error?.code || 'exception';
      const message = error?.message || `No se pudo completar el registro con ${providerName}.`;
      setSocialError(message);
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
                Bienvenida a Lovenda
              </h2>
              <p className="mt-4 text-base text-[color:var(--color-primary-dark,#4338ca)]/80">
                Centraliza tareas, invitados y proveedores en un solo lugar. Nuestra IA te guiara en cada paso para que tu boda sea perfecta.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-[color:var(--color-primary-dark,#4338ca)]/80">
              <li>- Timeline inteligente para no olvidar nada.</li>
              <li>- Automatizaciones de correo y recordatorios para invitados.</li>
              <li>- Catalogo de proveedores con recomendaciones personalizadas.</li>
            </ul>
          </div>

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-semibold text-[color:var(--color-text,#111827)]">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft,#6b7280)]">
              Puedes registrarte con tu correo o usando tu cuenta social favorita.
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

            <AuthDivider label="o continua con" />

            <SocialLoginButtons
              providers={providers}
              onProviderClick={handleSocialLogin}
              busyProvider={busyProvider}
              disabled={isSubmitting}
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
              Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
              >
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
