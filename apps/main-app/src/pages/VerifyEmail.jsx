import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';

import { getFirebaseAuth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';

const STATUS_ID = 'verify-email-status';
const ERROR_ID = 'verify-email-error';

export default function VerifyEmail() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const verifySource = location?.state?.verifySource || 'direct';

  useEffect(() => {
    if (isAuthenticated) {
      performanceMonitor?.logEvent?.('verification_email_view', { source: verifySource });
    }
  }, [isAuthenticated, verifySource]);

  const handleResend = async () => {
    setStatus('');
    setError('');
    setIsSending(true);

    performanceMonitor?.logEvent?.('verification_email_resent', {
      source: verifySource,
      status: 'requested',
    });

    try {
      const auth = getFirebaseAuth && getFirebaseAuth();
      if (!auth?.currentUser) throw new Error('No hay usuario autenticado.');
      await sendEmailVerification(auth.currentUser);
      const message = 'Correo de verificacion enviado. Revisa tu bandeja de entrada.';
      setStatus(message);
      performanceMonitor?.logEvent?.('verification_email_resent', {
        source: verifySource,
        status: 'success',
      });
    } catch (err) {
      const message = err?.message || 'No se pudo enviar el correo de verificacion.';
      setError(message);
      performanceMonitor?.logEvent?.('verification_email_resent', {
        source: verifySource,
        status: 'failed',
        error_code: err?.code || 'exception',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setStatus('');
    setError('');

    performanceMonitor?.logEvent?.('verification_email_refresh', {
      source: verifySource,
    });

    try {
      const auth = getFirebaseAuth && getFirebaseAuth();
      if (auth?.currentUser?.reload) {
        await auth.currentUser.reload();
        setStatus('Estado actualizado. Vuelve a intentar acceder.');
      }
    } catch (err) {
      setError(err?.message || 'No se pudo actualizar el estado de verificacion.');
    }
  };

  // Renderizar siempre la UI para ofrecer instrucciones y permitir feedback
  // En ausencia de sesión, los botones devolverán errores controlados visibles por el usuario

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">Verifica tu email</h2>
        <p className="text-sm text-[color:var(--color-muted)]">
          Debes verificar tu direccion de correo para continuar usando la aplicacion.
        </p>
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            data-testid="resend-verification"
            onClick={handleResend}
            disabled={isSending}
            className="flex-1 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-[color:var(--color-surface)] transition-colors hover:bg-[var(--color-accent)] disabled:opacity-70"
          >
            {isSending ? 'Enviando...' : 'Reenviar verificacion'}
          </button>
          <button
            data-testid="refresh-verification"
            onClick={handleRefresh}
            className="flex-1 rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-primary-10)]"
          >
            Ya verifique
          </button>
        </div>
      </div>
    </div>
  );
}
