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

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)] px-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center space-y-4">
        <h2 className="text-2xl">Verifica tu email</h2>
        <p className="text-sm text-gray-600">
          Debes verificar tu direccion de correo para continuar usando la aplicacion.
        </p>
        {status ? (
          <p id={STATUS_ID} role="status" aria-live="polite" className="text-green-600 text-sm">
            {status}
          </p>
        ) : null}
        {error ? (
          <p id={ERROR_ID} role="alert" aria-live="assertive" className="text-red-600 text-sm">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            data-testid="resend-verification"
            onClick={handleResend}
            disabled={isSending}
            className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded hover:bg-[var(--color-accent)] transition-colors disabled:opacity-70"
          >
            {isSending ? 'Enviando...' : 'Reenviar verificacion'}
          </button>
          <button
            data-testid="refresh-verification"
            onClick={handleRefresh}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Ya verifique
          </button>
        </div>
      </div>
    </div>
  );
}
