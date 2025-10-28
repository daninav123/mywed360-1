import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Página para establecer contraseña por primera vez
 * 
 * El proveedor llega aquí desde el link en su email de verificación
 */
export default function SupplierSetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Obtener email y token de los query params
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
    
    if (!emailParam || !tokenParam) {
      setError('Enlace inválido. Verifica que la URL esté completa.');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/supplier-dashboard/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verificationToken: token,
          newPassword: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'invalid_token') {
          throw new Error('Token inválido o expirado. Solicita un nuevo enlace.');
        } else if (data.error === 'password_too_short') {
          throw new Error('La contraseña debe tener al menos 8 caracteres');
        } else {
          throw new Error(data.message || 'Error al establecer contraseña');
        }
      }
      
      setSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/supplier/login');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Contraseña Establecida!
          </h1>
          <p className="text-gray-600 mb-8">
            Tu contraseña ha sido configurada correctamente.
            Redirigiendo al login...
          </p>
          <div className="animate-pulse">
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Establece tu Contraseña
          </h1>
          <p className="text-gray-600">
            Crea una contraseña segura para tu cuenta de proveedor
          </p>
        </div>
        
        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Al menos 8 caracteres
              </p>
            </div>
            
            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Repite la contraseña"
                required
              />
            </div>
            
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}
            
            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !token}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Estableciendo...' : 'Establecer Contraseña'}
            </button>
          </form>
          
          {/* Link a login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/supplier/login')}
              className="text-sm text-indigo-600 hover:underline"
            >
              ¿Ya tienes contraseña? Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
