/**
 * EmailOnboardingWizard Component
 * Wizard de configuración inicial de email con validaciones
 * Sprint 3 - Unificar Email
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader,
  Shield,
  Send,
  Settings
} from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Bienvenido a Email',
    description: 'Configura tu sistema de correo en 3 simples pasos',
    icon: Mail
  },
  {
    id: 'domain',
    title: 'Configuración de Dominio',
    description: 'Configura tu dominio de envío',
    icon: Settings
  },
  {
    id: 'validation',
    title: 'Validación DNS',
    description: 'Verificaremos tu configuración DKIM y SPF',
    icon: Shield
  },
  {
    id: 'test',
    title: 'Envío de Prueba',
    description: 'Envía un email de prueba',
    icon: Send
  },
  {
    id: 'complete',
    title: '¡Listo!',
    description: 'Tu email está configurado correctamente',
    icon: CheckCircle
  }
];

/**
 * EmailOnboardingWizard
 * @param {Object} props
 * @param {Function} props.onComplete - Callback al completar
 * @param {Function} props.onSkip - Callback para saltar
 * @param {Object} props.initialConfig - Configuración inicial
 */
export function EmailOnboardingWizard({ onComplete, onSkip, initialConfig = {} }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    domain: initialConfig.domain || '',
    fromEmail: initialConfig.fromEmail || '',
    fromName: initialConfig.fromName || '',
    replyTo: initialConfig.replyTo || '',
    ...initialConfig
  });
  const [validation, setValidation] = useState({
    dkim: null,
    spf: null,
    loading: false,
    errors: []
  });
  const [testEmail, setTestEmail] = useState('');
  const [testSent, setTestSent] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  /**
   * Avanzar al siguiente paso
   */
  const handleNext = async () => {
    // Validar antes de avanzar
    if (step.id === 'domain') {
      if (!config.domain || !config.fromEmail || !config.fromName) {
        alert('Por favor completa todos los campos obligatorios');
        return;
      }
    }

    if (step.id === 'validation') {
      await validateDNS();
      if (validation.dkim !== 'valid' || validation.spf !== 'valid') {
        alert('Por favor completa la configuración DNS antes de continuar');
        return;
      }
    }

    if (step.id === 'test') {
      if (!testSent) {
        alert('Por favor envía un email de prueba antes de continuar');
        return;
      }
    }

    if (isLastStep) {
      onComplete?.(config);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  /**
   * Retroceder al paso anterior
   */
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /**
   * Validar configuración DNS
   */
  const validateDNS = async () => {
    setValidation(prev => ({ ...prev, loading: true, errors: [] }));

    try {
      // Simular validación DNS (en producción, llamar a API backend)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock validation
      const dkimValid = config.domain.includes('.');
      const spfValid = config.domain.includes('.');

      setValidation({
        dkim: dkimValid ? 'valid' : 'invalid',
        spf: spfValid ? 'valid' : 'invalid',
        loading: false,
        errors: !dkimValid || !spfValid 
          ? ['Verifica que hayas añadido correctamente los registros DNS']
          : []
      });
    } catch (error) {
      setValidation({
        dkim: 'error',
        spf: 'error',
        loading: false,
        errors: ['Error al validar DNS. Intenta de nuevo.']
      });
    }
  };

  /**
   * Enviar email de prueba
   */
  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Por favor ingresa un email de destino');
      return;
    }

    try {
      // Simular envío (en producción, llamar a API backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestSent(true);
    } catch (error) {
      alert('Error al enviar email de prueba');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {step.description}
            </p>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Welcome Step */}
              {step.id === 'welcome' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Vamos a configurar tu sistema de correo para que puedas enviar invitaciones y comunicarte con tus invitados.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Nota:</strong> Necesitarás acceso a la configuración DNS de tu dominio.
                    </p>
                  </div>
                </div>
              )}

              {/* Domain Configuration */}
              {step.id === 'domain' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dominio *
                    </label>
                    <input
                      type="text"
                      value={config.domain}
                      onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                      placeholder="miboda.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Envío *
                    </label>
                    <input
                      type="email"
                      value={config.fromEmail}
                      onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                      placeholder="invitaciones@miboda.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Remitente *
                    </label>
                    <input
                      type="text"
                      value={config.fromName}
                      onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                      placeholder="María & Juan"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Respuesta (opcional)
                    </label>
                    <input
                      type="email"
                      value={config.replyTo}
                      onChange={(e) => setConfig({ ...config, replyTo: e.target.value })}
                      placeholder="contacto@miboda.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}

              {/* DNS Validation */}
              {step.id === 'validation' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Registros DNS Requeridos:
                    </h3>
                    
                    {/* DKIM */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        validation.dkim === 'valid' ? 'bg-green-500' :
                        validation.dkim === 'invalid' ? 'bg-red-500' :
                        validation.dkim === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}>
                        {validation.dkim === 'valid' ? '✓' : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">DKIM</p>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          TXT @ "v=DKIM1; k=rsa; p=..."
                        </code>
                      </div>
                    </div>

                    {/* SPF */}
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        validation.spf === 'valid' ? 'bg-green-500' :
                        validation.spf === 'invalid' ? 'bg-red-500' :
                        validation.spf === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}>
                        {validation.spf === 'valid' ? '✓' : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">SPF</p>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          TXT @ "v=spf1 include:mailgun.org ~all"
                        </code>
                      </div>
                    </div>
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                      {validation.errors.map((error, i) => (
                        <p key={i} className="text-sm text-red-800 dark:text-red-200">
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
                        Validando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Validar DNS
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Test Email */}
              {step.id === 'test' && (
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Envía un email de prueba para verificar que todo funciona correctamente.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Destino
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                    />
                  </div>

                  <button
                    onClick={sendTestEmail}
                    disabled={!testEmail}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Enviar Email de Prueba
                  </button>

                  {testSent && (
                    <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Email de prueba enviado correctamente. Revisa tu bandeja de entrada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Complete Step */}
              {step.id === 'complete' && (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Tu configuración de email está completa. Ya puedes empezar a enviar invitaciones.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Recuerda: Puedes cambiar esta configuración en cualquier momento desde Ajustes.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSkip}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Saltar por ahora
            </button>

            <div className="flex gap-3">
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {isLastStep ? 'Finalizar' : 'Siguiente'}
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
