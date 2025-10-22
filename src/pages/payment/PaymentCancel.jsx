import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';

const PaymentCancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
          <XCircle className="h-8 w-8 text-yellow-600" />
        </div>
        
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Pago cancelado
        </h2>
        
        <p className="mt-2 text-gray-600">
          Has cancelado el proceso de pago. No se ha realizado ningún cargo.
        </p>

        <div className="mt-6 bg-blue-50 rounded-lg p-4 text-left">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                ¿Tuviste algún problema?
              </h3>
              <p className="mt-1 text-xs text-blue-700">
                Si encontraste algún error o tienes dudas sobre los planes, 
                nuestro equipo está aquí para ayudarte.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Link
            to="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Planes
          </Link>
          <Link
            to="/contact"
            className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          >
            Contactar Soporte
          </Link>
          <Link
            to="/"
            className="block w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Volver al inicio
          </Link>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">¿Tienes dudas?</p>
              <Link to="/faq" className="text-[var(--color-primary)] hover:underline">
                Ver preguntas frecuentes
              </Link>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Soporte</p>
              <a href="mailto:support@maloveapp.com" className="text-[var(--color-primary)] hover:underline">
                Enviar email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
