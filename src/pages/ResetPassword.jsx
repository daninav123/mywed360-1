import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function ResetPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      await sendPasswordReset(email);
      setStatus('Te hemos enviado un correo para restablecer tu contrase?a.');
    } catch (err) {
      setError(err?.message || 'No se pudo enviar el correo de restablecimiento.');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-bg)]">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4">Restablecer contrase?a</h2>
        <p className="text-sm text-gray-600 mb-4">Introduce tu email y te enviaremos instrucciones.</p>
        <input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full mb-4"
          data-testid="reset-email"
        />
        {status && <p className="text-green-600 text-sm mb-4">{status}</p>}
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-2 rounded w-full hover:bg-[var(--color-accent)] transition-colors"
        data-testid="reset-submit"
        >
          Enviar enlace
        </button>
      </form>
    </div>
  );
}

