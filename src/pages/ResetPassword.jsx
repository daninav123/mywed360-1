import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';

const STATUS_ID = 'reset-status-message';
const ERROR_ID = 'reset-error-message';

export default function ResetPassword() {
  const location = useLocation();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef(null);
  const submitButtonRef = useRef(null);

  const resetSource = location?.state?.resetSource || 'direct';

  useEffect(() => {
    performanceMonitor?.logEvent?.('password_reset_view', { source: resetSource });
    emailInputRef.current?.focus();
  }, [resetSource]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const message = 'Introduce tu correo electronico.';
      setError(message);
      emailInputRef.current?.focus();
      performanceMonitor?.logEvent?.('password_reset_failed', {
        source: resetSource,
        error_code: 'missing_email',
      });
      return;
    }

    setIsSubmitting(true);
    performanceMonitor?.logEvent?.('password_reset_requested', {
      source: resetSource,
    });

    try {
      await sendPasswordReset(trimmedEmail);
      const message = 'Te enviamos un correo con instrucciones para restablecer tu contrasena.';
      setStatus(message);
      setTimeout(() => submitButtonRef.current?.focus(), 0);
      performanceMonitor?.logEvent?.('password_reset_completed', {
        source: resetSource,
      });
    } catch (err) {
      const mappedMessage = err?.message || 'No se pudo enviar el correo de restablecimiento.';
      setError(mappedMessage);
      performanceMonitor?.logEvent?.('password_reset_failed', {
        source: resetSource,
        error_code: err?.code || 'exception',
      });
      emailInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-sm"
        noValidate
      >
        <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">Restablecer contrasena</h2>
        <p className="text-sm text-[color:var(--color-muted)]">
          Introduce tu correo y te enviaremos un enlace para definir una nueva contrasena.
        </p>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          ref={emailInputRef}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? ERROR_ID : undefined}
          className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          data-testid="reset-email"
        />
        {status ? (
          <p id={STATUS_ID} role="status" aria-live="polite" className="text-sm text-[color:var(--color-success)]">
            {status}
          </p>
        ) : null}
        {error ? (
          <p id={ERROR_ID} role="alert" aria-live="assertive" className="text-sm text-[color:var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          ref={submitButtonRef}
          disabled={isSubmitting}
          className="bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-2 rounded w-full hover:bg-[var(--color-accent)] transition-colors disabled:opacity-70"
          data-testid="reset-submit"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
    </div>
  );
}
