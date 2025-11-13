import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Mail, Send } from 'lucide-react';

import Button from '../ui/Button';
import { post } from '../../services/apiClient';
import useTranslations from '../../hooks/useTranslations';

/**
 * Valida la configuracion de email (SPF, DKIM, DMARC) y permite enviar un correo de prueba.
 */
const EmailConfigValidation = ({ emailAddress, onValidationComplete }) => {
  const [validating, setValidating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [results, setResults] = useState(null);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [error, setError] = useState('');

  const { t, tVars } = useTranslations();
  const tEmail = (key, options) => t(key, { ns: 'email', ...options });
  const tEmailVars = (key, variables) => tVars(key, { ns: 'email', ...variables });

  const domain = emailAddress?.split('@')[1] || '';

  const validateConfiguration = async () => {
    if (!domain) {
      setError(tEmail('configValidation.errors.invalidEmail'));
      return;
    }

    setValidating(true);
    setError('');
    setResults(null);

    try {
      const response = await post('/api/email/validate/validate-configuration', {
        domain,
        dkimSelector: 'k1',
      });

      if (response.success) {
        setResults(response.data);
        if (onValidationComplete && typeof onValidationComplete === 'function') {
          onValidationComplete(response.data);
        }
      } else {
        setError(
          response.error?.message || tEmail('configValidation.errors.validateGeneric')
        );
      }
    } catch (err) {
      // console.error('Error validating email config:', err);
      setError(tEmail('configValidation.errors.validateGeneric'));
    } finally {
      setValidating(false);
    }
  };

  const sendTestEmail = async () => {
    if (!emailAddress) {
      setError(tEmail('configValidation.errors.invalidEmail'));
      return;
    }

    setSendingTest(true);
    setError('');

    try {
      const response = await post('/api/email/validate/send-test', {
        from: `noreply@${domain}`,
        to: emailAddress,
      });

      if (response.success) {
        setTestEmailSent(true);
      } else {
        setError(
          response.error?.message || tEmail('configValidation.errors.sendTestGeneric')
        );
      }
    } catch (err) {
      // console.error('Error sending test email:', err);
      setError(tEmail('configValidation.errors.sendTestGeneric'));
    } finally {
      setSendingTest(false);
    }
  };

  const getStatusIcon = (valid) =>
    valid ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );

  const getStatusColor = (valid) =>
    valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {tEmail('configValidation.title')}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {tEmail('configValidation.subtitle')}
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
              {tEmail('configValidation.buttons.validating')}
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              {tEmail('configValidation.buttons.validate')}
            </>
          )}
        </Button>
      </div>

      {domain && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>{tEmail('configValidation.current.domain')}</strong> {domain}
          </p>
          <p className="text-sm text-blue-800">
            <strong>{tEmail('configValidation.current.email')}</strong> {emailAddress}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {tEmail('configValidation.errorTitle')}
            </p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div
            className={`border rounded-lg p-4 ${
              results.overall ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {results.overall ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h4 className="font-semibold text-green-900">
                    {tEmail('configValidation.summary.successTitle')}
                  </h4>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">
                    {tEmail('configValidation.summary.warningTitle')}
                  </h4>
                </>
              )}
            </div>
            {results.summary?.warnings?.length > 0 && (
              <ul className="list-disc list-inside space-y-1 mt-2">
                {results.summary.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`border rounded-lg p-4 ${getStatusColor(results.spf?.valid)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(results.spf?.valid)}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  {tEmail('configValidation.checks.spfTitle')}
                </h5>
                {results.spf?.valid ? (
                  <p className="text-sm text-green-700">
                    {tEmail('configValidation.checks.spfValid')}
                  </p>
                ) : (
                  <p className="text-sm text-red-700">{results.spf?.error}</p>
                )}
                {results.spf?.record && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-xs text-gray-700 break-all">{results.spf.record}</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${getStatusColor(results.dkim?.valid)}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon(results.dkim?.valid)}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  {tEmail('configValidation.checks.dkimTitle')}
                </h5>
                {results.dkim?.valid ? (
                  <p className="text-sm text-green-700">
                    {tEmail('configValidation.checks.dkimValid')}
                  </p>
                ) : (
                  <p className="text-sm text-red-700">{results.dkim?.error}</p>
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

          <div className={`border rounded-lg p-4 ${getStatusColor(results.dmarc?.valid)}`}>
            <div className="flex items-start gap-3">
              {results.dmarc?.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900 mb-1">
                  {tEmail('configValidation.checks.dmarcTitle')}
                </h5>
                {results.dmarc?.valid ? (
                  <p className="text-sm text-green-700">
                    {tEmail('configValidation.checks.dmarcValid')}
                  </p>
                ) : (
                  <p className="text-sm text-yellow-700">{results.dmarc?.error}</p>
                )}
                {results.dmarc?.record && (
                  <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                    <code className="text-xs text-gray-700 break-all">{results.dmarc.record}</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {results.overall && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-3">
                {tEmail('configValidation.summary.cta')}
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
                    {tEmail('configValidation.buttons.sendingTest')}
                  </>
                ) : testEmailSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {tEmail('configValidation.buttons.sent')}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {tEmail('configValidation.buttons.sendTest')}
                  </>
                )}
              </Button>
              {testEmailSent && (
                <p className="text-sm text-green-700 mt-2">
                  {tEmailVars('configValidation.successNotice.description', {
                    email: emailAddress,
                  })}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!results && !validating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-2">
            {tEmail('configValidation.help.title')}
          </h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>
              <strong>SPF:</strong> {tEmail('configValidation.help.spf')}
            </li>
            <li>
              <strong>DKIM:</strong> {tEmail('configValidation.help.dkim')}
            </li>
            <li>
              <strong>DMARC:</strong> {tEmail('configValidation.help.dmarc')}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmailConfigValidation;
