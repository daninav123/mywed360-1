import React, { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { getFirebaseAuth } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmail() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setStatus('');
    setError('');
    try {
      const auth = getFirebaseAuth && getFirebaseAuth();
      if (!auth?.currentUser) throw new Error('No hay usuario autenticado');
      await sendEmailVerification(auth.currentUser);
      setStatus('Correo de verificaci?n enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el email de verificaci?n.');
    }
  };

  const handleRefresh = async () => {
    try {
      const auth = getFirebaseAuth && getFirebaseAuth();
      if (auth?.currentUser?.reload) {
        await auth.currentUser.reload();
        setStatus('Estado actualizado. Vuelve a intentar acceder.');
      }
    } catch {}
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)]">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl mb-2">Verifica tu email</h2>
        <p className="text-sm text-gray-600 mb-4">
          Debes verificar tu direcci?n de correo para continuar usando la aplicaci?n.
        </p>
        {status && <p className="text-green-600 text-sm mb-4">{status}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <div className="flex gap-2">
          <button data-testid="resend-verification" onClick={handleResend} className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded hover:bg-[var(--color-accent)] transition-colors">
            Reenviar verificaci?n
          </button>
          <button data-testid="refresh-verification" onClick={handleRefresh} className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors">
            Ya verifiqu?
          </button>
        </div>
      </div>
    </div>
  );
}

