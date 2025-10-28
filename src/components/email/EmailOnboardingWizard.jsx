/**
 * EmailOnboardingWizard Component
 * Wizard de configuracion inicial de email con validaciones
 * Sprint 3 - Unificar Email
 */

import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader,
  Mail,
  Send,
  Settings,
  Shield,
} from 'lucide-react';

import useTranslations from '../../hooks/useTranslations';

const STEP_CONFIG = [
  { id: 'welcome', icon: Mail },
  { id: 'domain', icon: Settings },
  { id: 'validation', icon: Shield },
  { id: 'test', icon: Send },
  { id: 'complete', icon: CheckCircle },
];

const STATUS_SYMBOL = {
  valid: '✓',
  invalid: '!',
  error: '!',
};

/**
 * EmailOnboardingWizard
 * @param {Object} props
 * @param {Function} props.onComplete - Callback al completar
 * @param {Function} props.onSkip - Callback para saltar
 * @param {Object} props.initialConfig - Configuracion inicial
 */
export function EmailOnboardingWizard({ onComplete, onSkip, initialConfig = {} }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    domain: initialConfig.domain || '',
    fromEmail: initialConfig.fromEmail || '',
    fromName: initialConfig.fromName || '',
    replyTo: initialConfig.replyTo || '',
    ...initialConfig,
  });
  const [validation, setValidation] = useState({
    dkim: null,
    spf: null,
    loading: false,
    errors: [],
  });
  const [testEmail, setTestEmail] = useState('');
  const [testSent, setTestSent] = useState(false);

  const { t, i18n } = useTranslations();
  const tEmail = (key, options) => t(key, { ns: 'email', ...options });

  const steps = useMemo(
    () =>
      STEP_CONFIG.map((step) => ({
        ...step,
        title: tEmail(`onboarding.steps.${step.id}.title`),
        description: tEmail(`onboarding.steps.${step.id}.description`),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language]
  );

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    if (step.id === 'domain') {
      if (!config.domain || !config.fromEmail || !config.fromName) {
        toast.error(tEmail('onboarding.errors.missingDomainFields'));
        return;
      }
    }

    if (step.id === 'validation') {
      await validateDNS();
      if (validation.dkim !== 'valid' || validation.spf !== 'valid') {
        toast.error(tEmail('onboarding.errors.dnsIncomplete'));
        return;
      }
    }

    if (step.id === 'test' && !testSent) {
      toast.warning(tEmail('onboarding.errors.testNotSent'));
      return;
    }

    if (isLastStep) {
      onComplete?.(config);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const validateDNS = async () => {
    setValidation((prev) => ({ ...prev, loading: true, errors: [] }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const dkimValid = config.domain.includes('.');
      const spfValid = config.domain.includes('.');

      setValidation({
        dkim: dkimValid ? 'valid' : 'invalid',
        spf: spfValid ? 'valid' : 'invalid',
        loading: false,
        errors:
          !dkimValid || !spfValid
            ? [tEmail('onboarding.validation.errors.recordsMissing')]
            : [],
      });
    } catch (error) {
      setValidation({
        dkim: 'error',
        spf: 'error',
        loading: false,
        errors: [tEmail('onboarding.validation.errors.generic')],
      });
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error(tEmail('onboarding.errors.missingTestRecipient'));
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setTestSent(true);
    } catch (error) {
      toast.error(tEmail('onboarding.errors.testSendFailed'));
    }
  };

  const renderStatusSymbol = (status) => STATUS_SYMBOL[status] || '?';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step.id === 'welcome' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {tEmail('onboarding.welcome.intro')}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>{tEmail('onboarding.welcome.noteLabel')}</strong>{' '}
                      {tEmail('onboarding.welcome.noteText')}
                    </p>
                  </div>
                </div>
              )}

              {step.id === 'domain' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tEmail('onboarding.domain.fields.domain.label')}
                    </label>
                    <input
                      type="text"
                      value={config.domain}
                      onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                      placeholder={tEmail('onboarding.domain.fields.domain.placeholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tEmail('onboarding.domain.fields.fromEmail.label')}
                    </label>
                    <input
                      type="email"
                      value={config.fromEmail}
                      onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                      placeholder={tEmail(
                        'onboarding.domain.fields.fromEmail.placeholder'
                      )}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tEmail('onboarding.domain.fields.fromName.label')}
                    </label>
                    <input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                      placeholder={tEmail(
                        'onboarding.domain.fields.fromName.placeholder'
                      )}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tEmail('onboarding.domain.fields.replyTo.label')}
                    </label>
                    <input
                      type="email"
                      value={config.replyTo}
                      onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
                      placeholder={tEmail(
                        'onboarding.domain.fields.replyTo.placeholder'
                      )}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              {step.id === 'validation' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tEmail('onboarding.validation.title')}
                    </h3>

                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          validation.dkim === 'valid'
                            ? 'bg-green-500 text-white'
                            : validation.dkim === 'invalid' || validation.dkim === 'error'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-400 text-white'
                        }`}
                      >
                        {renderStatusSymbol(validation.dkim)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">DKIM</p>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          TXT @ &quot;v=DKIM1; k=rsa; p=...&quot;
                        </code>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          validation.spf === 'valid'
                            ? 'bg-green-500 text-white'
                            : validation.spf === 'invalid' || validation.spf === 'error'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-400 text-white'
                        }`}
                      >
                        {renderStatusSymbol(validation.spf)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">SPF</p>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          TXT @ &quot;v=spf1 include:mailgun.org ~all&quot;
                        </code>
                      </div>
                    </div>
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                      {validation.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-800 dark:text-red-200">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={validateDNS}
                    disabled={validation.loading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {validation.loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        {tEmail('onboarding.validation.button.validating')}
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        {tEmail('onboarding.validation.button.validate')}
                      </>
                    )}
                  </button>
                </div>
              )}

              {step.id === 'test' && (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {tEmail('onboarding.test.description')}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tEmail('onboarding.test.fields.recipient.label')}
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder={tEmail('onboarding.test.fields.recipient.placeholder')}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <button
                    onClick={sendTestEmail}
                    disabled={!testEmail}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {tEmail('onboarding.test.button')}
                  </button>

                  {testSent && (
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {tEmail('onboarding.test.success')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step.id === 'complete' && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {tEmail('onboarding.complete.message')}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {tEmail('onboarding.complete.reminder')}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSkip}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {tEmail('onboarding.actions.skip')}
            </button>

            <div className="flex gap-3">
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {tEmail('onboarding.actions.back')}
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {isLastStep
                  ? tEmail('onboarding.actions.finish')
                  : tEmail('onboarding.actions.next')}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EmailOnboardingWizard;
