import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import {
  getSupplierToken,
  getSupplierId,
  getSupplierData,
  isSupplierAuthenticated,
} from '../../utils/supplierAuth';

/**
 * Página de depuración de autenticación de proveedor
 * TEMPORAL - Solo para debugging
 */
export default function SupplierDebug() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const loadInfo = () => {
    const token = getSupplierToken();
    const supplierId = getSupplierId();
    const data = getSupplierData();
    const isAuth = isSupplierAuthenticated();

    setInfo({
      token,
      supplierId,
      data,
      isAuth,
      localStorage: {
        token: localStorage.getItem('supplier_token'),
        id: localStorage.getItem('supplier_id'),
        data: localStorage.getItem('supplier_data'),
      },
    });
  };

  const testToken = async () => {
    setVerificationResult({ loading: true });
    try {
      const token = getSupplierToken();
      const response = await fetch('/api/supplier-dashboard/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setVerificationResult({
        success: response.ok,
        status: response.status,
        data,
      });
    } catch (error) {
      setVerificationResult({
        success: false,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const clearSession = () => {
    localStorage.removeItem('supplier_token');
    localStorage.removeItem('supplier_id');
    localStorage.removeItem('supplier_data');
    loadInfo();
  };

  if (!info) return null;

  return (
    <div className="min-h-screen  p-8" className="bg-page">
      <div className="max-w-4xl mx-auto">
        <div className=" rounded-lg shadow-lg p-6" className="bg-surface">
          <h1 className="text-2xl font-bold mb-6">🔍 Debug de Autenticación de Proveedor</h1>

          {/* Estado general */}
          <div className="mb-6 p-4 rounded-lg " className="bg-page">
            <div className="flex items-center gap-3 mb-2">
              {info.isAuth ? (
                <>
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="font-semibold text-green-700">✅ AUTENTICADO</span>
                </>
              ) : (
                <>
                  <XCircle className="" className="text-danger" size={24} />
                  <span className="font-semibold text-red-700">❌ NO AUTENTICADO</span>
                </>
              )}
            </div>
          </div>

          {/* Información del token */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Token JWT:</h2>
            <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm overflow-auto">
              {info.token ? (
                <div>
                  <div className="mb-2">
                    <span className="" className="text-muted">Primeros 50 chars:</span>{' '}
                    {info.token.substring(0, 50)}...
                  </div>
                  <div>
                    <span className="" className="text-muted">Longitud:</span> {info.token.length} caracteres
                  </div>
                </div>
              ) : (
                <span className="text-red-400">❌ NO HAY TOKEN</span>
              )}
            </div>
          </div>

          {/* Supplier ID */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Supplier ID:</h2>
            <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm">
              {info.supplierId || <span className="text-red-400">❌ NO HAY ID</span>}
            </div>
          </div>

          {/* Datos del proveedor */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Datos del proveedor:</h2>
            <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-60">
              {info.data ? (
                <pre>{JSON.stringify(info.data, null, 2)}</pre>
              ) : (
                <span className="text-red-400">❌ NO HAY DATOS</span>
              )}
            </div>
          </div>

          {/* Raw localStorage */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">localStorage (raw):</h2>
            <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-xs overflow-auto">
              <pre>{JSON.stringify(info.localStorage, null, 2)}</pre>
            </div>
          </div>

          {/* Test del token */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Verificación del token:</h2>
            <button
              onClick={testToken}
              className="px-4 py-2 bg-blue-500 text-white rounded hover: flex items-center gap-2" style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <RefreshCw size={16} />
              Verificar Token en el Backend
            </button>

            {verificationResult && !verificationResult.loading && (
              <div
                className={`mt-4 p-4 rounded ${verificationResult.success ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className="font-semibold mb-2">
                  {verificationResult.success ? '✅ Token válido' : '❌ Token inválido'}
                </div>
                <div className="text-sm">Status: {verificationResult.status}</div>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(verificationResult.data || verificationResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={loadInfo}
              className="px-4 py-2 0 text-white rounded hover:bg-gray-600" className="bg-page"
            >
              Recargar Info
            </button>
            <button
              onClick={clearSession}
              className="px-4 py-2 bg-red-500 text-white rounded hover:" style={{ backgroundColor: 'var(--color-danger)' }}
            >
              Limpiar Sesión
            </button>
            <button
              onClick={() => navigate('/supplier/login')}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              Ir a Login
            </button>
            {info.supplierId && (
              <button
                onClick={() => navigate(`/supplier/dashboard/${info.supplierId}`)}
                className="px-4 py-2  text-white rounded hover:" style={{ backgroundColor: 'var(--color-success)' }} style={{ backgroundColor: 'var(--color-success)' }}
              >
                Ir a Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
