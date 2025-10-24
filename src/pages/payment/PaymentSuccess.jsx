import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getCheckoutSession } from '../../services/stripeService';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Verificar la sesi�n
    getCheckoutSession(sessionId)
      .then((data) => {
        setSessionData(data);
        setStatus('success');
        
        // Opcional: Redirigir al dashboard despu�s de 5 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 5000);
      })
      .catch((error) => {
        console.error('Error verificando sesi�n:', error);
        setStatus('error');
      });
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[var(--color-primary)] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            Error al verificar el pago
          </h2>
          <p className="mt-2 text-gray-600">
            No pudimos verificar tu sesi�n de pago. Por favor, contacta con soporte.
          </p>
          <div className="mt-8 space-y-3">
            <Link
              to="/pricing"
              className="block w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Volver a Planes
            </Link>
            <Link
              to="/contact"
              className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
            >
              Contactar Soporte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          �Pago completado con �xito!
        </h2>
        
        <p className="mt-2 text-gray-600">
          Tu suscripci�n ha sido activada correctamente.
        </p>

        {sessionData && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Detalles de la compra:
            </h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Estado:</dt>
                <dd className="font-medium text-gray-900">
                  {sessionData.status === 'complete' ? 'Completado' : sessionData.status}
                </dd>
              </div>
              {sessionData.amount_total && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total:</dt>
                  <dd className="font-medium text-gray-900">
                    {(sessionData.amount_total / 100).toFixed(2)} EUR
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <Link
            to="/dashboard"
            className="block w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          >
            Ir al Dashboard
          </Link>
          <p className="text-xs text-gray-500">
            Ser�s redirigido autom�ticamente en 5 segundos...
          </p>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Recibir�s un email de confirmaci�n con los detalles de tu compra.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
