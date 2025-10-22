import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Mail, Send } from 'lucide-react';
import Button from '../ui/Button';
import { post } from '../../services/apiClient';

/**
 * Componente para validar configuración de email (SPF, DKIM, DMARC)
 * y enviar email de prueba
 */
const EmailConfigValidation = ({ emailAddress, onValidationComplete }) => {
  const [validating, setValidating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [results, setResults] = useState(null);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [error, setError] = useState('');

  // Extraer dominio del email
  const domain = emailAddress?.split('@')[1] || '';

  const validateConfiguration = async () => {
    if (!domain) {
      setError('Email no válido');
      return;
    }

    setValidating(true);
    setError('');
    setResults(null);

    try {
      const response = await post('/api/email/validate/validate-configuration', {
        domain,
        dkimSelector: 'k1' // Selector por defecto, puede ser configurable
      });

      if (response.success) {
        setResults(response.data);
        
        // Llamar callback si está configurado
        if (onValidationComplete && typeof onValidationComplete === 'function') {
          onValidationComplete(response.data);
        }
      } else {
        setError(response.error?.message || 'Error al validar configuración');
      }
    } catch (err) {
      console.error('Error validating email config:', err);
      setError('Error al validar configuración. Por favor, intenta nuevamente.');
    } finally {
      setValidating(false);
    }
  };

  const sendTestEmail = async () => {
    if (!emailAddress) {
      setError('Email no válido');
      return;
    }

    setSendingTest(true);
    setError('');

    try {
      const response = await post('/api/email/validate/send-test', {
        from: `noreply@${domain}`,
        to: emailAddress
      });

      if (response.success) {
        setTestEmailSent(true);
      } else {
        setError(response.error?.message || 'Error al enviar email de prueba');
      }
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Error al enviar email de prueba. Verifica tu configuración.');
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusIcon = (valid) => {
    if (valid) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (valid) => {
    return valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Validación de Configuración
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Verifica que tu dominio esté correctamente configurado para enviar emails
          </p>
        </div>
        <Button
          onClick={validateConfiguration}
          disabled={validating || !domain}
          variant="primary"
          className="flex items-center gap-2"
        >
          {validating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Validar Configuración
            </>
          )}
        </Button>
      </div>

      {/* Email que se está validando */}
      {domain && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Dominio:</strong> {domain}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> {emailAddress}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {results && (
        <div className="space-y-4">
          {/* Resumen general */}
          <div className={`border rounded-lg p-4 ${
            results.overall ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {results.overall ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-900">
                    ¡Configuración correcta!
                  </h4>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">
                    Configuración incompleta
                  </h4>
                </>
              )}
            </div>
            
            {results.summary?.warnings?.length > 0 && (
              <ul className="list-disc list-inside space-y-1 mt-2">
                {results.summary.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* SPF */}
          <div className={`border rounded-lg p-4 ${getStatusColor(results.spf?.valid)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(results.spf?.valid)}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  SPF (Sender Policy Framework)
                </h5>
                {results.spf?.valid ? (
                  <p className="text-sm text-green-700">
                    Registro SPF configurado correctamente
                  </p>
                ) : (
                  <p className="text-sm text-red-700">
                    {results.spf?.error}
                  </p>
                )}
                {results.spf?.record && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-xs text-gray-700 break-all">
                      {results.spf.record}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DKIM */}
          <div className={`border rounded-lg p-4 ${getStatusColor(results.dkim?.valid)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(results.dkim?.valid)}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  DKIM (DomainKeys Identified Mail)
                </h5>
                {results.dkim?.valid ? (
                  <p className="text-sm text-green-700">
                    Registro DKIM configurado correctamente
                  </p>
                ) : (
                  <p className="text-sm text-red-700">
                    {results.dkim?.error}
                  </p>
                )}
                {results.dkim?.record && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-xs text-gray-700 break-all">
                      {results.dkim.record.substring(0, 100)}
                      {results.dkim.record.length > 100 && '...'}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DMARC */}
          <div className={`border rounded-lg p-4 ${getStatusColor(results.dmarc?.valid)}`}>
            <div className="flex items-start gap-3">
              {results.dmarc?.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  DMARC (Recomendado)
                </h5>
                {results.dmarc?.valid ? (
                  <p className="text-sm text-green-700">
                    Registro DMARC configurado (mejora deliverability)
                  </p>
                ) : (
                  <p className="text-sm text-yellow-700">
                    {results.dmarc?.error}
                  </p>
                )}
                {results.dmarc?.record && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-xs text-gray-700 break-all">
                      {results.dmarc.record}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón de email de prueba */}
          {results.overall && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-3">
                Tu configuración está lista. Envía un email de prueba para verificar que todo funciona correctamente.
              </p>
              <Button
                onClick={sendTestEmail}
                disabled={sendingTest || testEmailSent}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : testEmailSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Email enviado
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar email de prueba
                  </>
                )}
              </Button>
              
              {testEmailSent && (
                <p className="text-sm text-green-700 mt-2">
                  ✓ Email de prueba enviado a {emailAddress}. Revisa tu bandeja de entrada.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Información de ayuda */}
      {!results && !validating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-2">
            ¿Qué se valida?
          </h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>
              <strong>SPF:</strong> Verifica que tu dominio autorice a MyWed360 para enviar emails
            </li>
            <li>
              <strong>DKIM:</strong> Confirma que los emails estén firmados digitalmente
            </li>
            <li>
              <strong>DMARC:</strong> Mejora la entregabilidad y protege contra suplantación
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmailConfigValidation;
