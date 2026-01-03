import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

import LanguageSelector from '../components/ui/LanguageSelector';
import useTranslations from '../hooks/useTranslations';
import { performanceMonitor } from '../services/PerformanceMonitor';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4004';

export default function ResetPasswordConfirm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslations();
  
  const resetToken = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  const passwordInputRef = useRef(null);

  useEffect(() => {
    performanceMonitor?.logEvent?.('password_reset_confirm_view');
    
    if (!resetToken) {
      setError('Token de reset no válido o faltante');
      setTokenValid(false);
    } else {
      setTokenValid(true);
      passwordInputRef.current?.focus();
    }
  }, [resetToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    setError('');

    // Validaciones
    if (!newPassword || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La password debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las passwords no coinciden');
      return;
    }

    setIsSubmitting(true);
    performanceMonitor?.logEvent?.('password_reset_confirm_submitted');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        resetToken,
        newPassword,
      });

      performanceMonitor?.logEvent?.('password_reset_confirm_success');
      
      toast.success('✅ Password actualizada exitosamente');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password actualizada. Por favor inicia sesión con tu nueva password.' 
          } 
        });
      }, 2000);
      
      setStatus('Password actualizada exitosamente. Redirigiendo al login...');
    } catch (err) {
      console.error('[ResetPasswordConfirm] Error:', err);
      
      const errorMessage = err.response?.data?.error || 'Error al resetear password';
      setError(errorMessage);
      
      performanceMonitor?.logEvent?.('password_reset_confirm_failed', {
        error: errorMessage,
      });
      
      if (errorMessage.includes('inválido') || errorMessage.includes('expirado')) {
        setTimeout(() => {
          navigate('/reset-password');
        }, 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] px-4 py-12 relative">
        {/* Selector de idioma */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector variant="minimal" persist={false} />
        </div>

            <div className="w-full max-w-md space-y-5 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-sm text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
                Token inválido
              </h2>
              <p className="text-[color:var(--color-muted)]">
                El enlace de reset de password no es válido o ha expirado.
              </p>
              <Link
                to="/reset-password"
                className="inline-block bg-[var(--color-primary)] text-[color:var(--color-surface)] px-6 py-3 rounded-lg hover:bg-[var(--color-accent)] transition-colors"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] px-4 py-12 relative">
      {/* Selector de idioma */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector variant="minimal" persist={false} />
      </div>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-5 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-sm"
            noValidate
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔐</div>
              <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
                Crear nueva password
              </h2>
              <p className="text-sm text-[color:var(--color-muted)] mt-2">
                Ingresa tu nueva password a continuación
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text)] mb-2">
                Nueva password
              </label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                ref={passwordInputRef}
                className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-text)] mb-2">
                Confirmar password
              </label>
              <input
                type="password"
                placeholder="Repite la password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[color:var(--color-text)] shadow-inner focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                disabled={isSubmitting}
              />
            </div>

            {status && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">{status}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--color-primary)] text-[color:var(--color-surface)] px-4 py-3 rounded-lg hover:bg-[var(--color-accent)] transition-colors disabled:opacity-70 font-semibold"
            >
              {isSubmitting ? '⏳ Actualizando...' : '✓ Actualizar password'}
            </button>

            <div className="text-center pt-4">
              <Link
                to="/login"
                className="text-sm text-[color:var(--color-primary)] hover:underline"
              >
                ← Volver al login
              </Link>
            </div>
          </form>
  </div>
  );
}
