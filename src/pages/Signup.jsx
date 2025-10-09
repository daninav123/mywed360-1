import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthDivider from '../components/auth/AuthDivider';
import RegisterForm from '../components/auth/RegisterForm';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const navigate = useNavigate();
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

  const providers = useMemo(() => {
    if (availableSocialProviders && availableSocialProviders.length > 0) {
      return availableSocialProviders;
    }
    return ['google', 'facebook', 'apple'];
  }, [availableSocialProviders]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSocialError('');
    setInfoMessage('');

    if (!email || !password) {
      setFormError('Introduce tu email y una contraseña válida.');
      return;
    }

    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerWithEmail(email, password, role);
      if (result?.success) {
        navigate('/home');
        return;
      }
      const message =
        result?.error ||
        'No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.';
      setFormError(message);
    } catch (error) {
      setFormError(error.message || 'No pudimos crear tu cuenta. Inténtalo nuevamente.');
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
      const result = await registerWithProvider(providerKey, { role, forceRole: true });
      if (result?.success) {
        if (result.pendingRedirect) {
          const providerName = getProviderLabel?.(providerKey) || providerKey;
          setInfoMessage(`Continúa el registro en la ventana de ${providerName}.`);
        } else {
          navigate('/home');
        }
        return;
      }

      const providerName = getProviderLabel?.(providerKey) || providerKey;
      setSocialError(result?.error || `No se pudo completar el registro con ${providerName}.`);
    } catch (error) {
      const providerName = getProviderLabel?.(providerKey) || providerKey;
      setSocialError(error.message || `No se pudo completar el registro con ${providerName}.`);
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
                Centraliza tareas, invitados y proveedores en un solo lugar. Nuestra IA te guiará en
                cada paso para que tu boda sea perfecta.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-[color:var(--color-primary-dark,#4338ca)]/80">
              <li>• Timeline inteligente para no olvidar nada.</li>
              <li>• Automatizaciones de correo y recordatorios para invitados.</li>
              <li>• Catálogo de proveedores con recomendaciones personalizadas.</li>
            </ul>
          </div>

          <div className="p-8 sm:p-10">
            <h1 className="text-2xl font-semibold text-[color:var(--color-text,#111827)]">
              Crea tu cuenta
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text-soft,#6b7280)]">
              Puedes registrarte con tu email o usando tu cuenta social favorita.
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
              />
            </div>

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
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-[color:var(--color-primary,#6366f1)] hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
