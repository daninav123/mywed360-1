import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

/**
 * Página de LOGIN para proveedores
 * 
 * Los proveedores inician sesión con email/password para acceder a su dashboard
 */
export default function SupplierLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/supplier-dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'invalid_credentials') {
          throw new Error('Email o contraseña incorrectos');
        } else if (data.error === 'account_suspended') {
          throw new Error('Tu cuenta ha sido suspendida. Contacta soporte.');
        } else if (data.error === 'password_not_set') {
          throw new Error('Debes establecer tu contraseña primero. Revisa tu email.');
        } else {
          throw new Error(data.message || 'Error al iniciar sesión');
        }
      }
      
      // Guardar token en localStorage
      localStorage.setItem('supplier_token', data.token);
      localStorage.setItem('supplier_id', data.supplier.id);
      localStorage.setItem('supplier_data', JSON.stringify(data.supplier));
      
      // Redirigir al dashboard
      navigate(`/supplier/dashboard/${data.supplier.id}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Proveedores
          </h1>
          <p className="text-gray-600">
            Inicia sesión para gestionar tus solicitudes de presupuesto
          </p>
        </div>
        
        {/* Card de login */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>
            
            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}
            
            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          {/* Links adicionales */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => navigate('/supplier/forgot-password')}
              className="text-sm text-indigo-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                ¿No tienes cuenta?
              </p>
              <button
                onClick={() => navigate('/supplier/registro')}
                className="text-indigo-600 hover:underline font-medium"
              >
                Regístrate como proveedor
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2025 MyWed360. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
