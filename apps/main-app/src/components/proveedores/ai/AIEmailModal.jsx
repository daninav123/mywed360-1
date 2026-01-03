import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Alert from '../../../components/Alert';
import Button from '../../../components/ui/Button';
import useTranslations from '../../../hooks/useTranslations';
import { useAIProviderEmail } from '../../../hooks/useAIProviderEmail';

/**
 * Modal para enviar emails a proveedores desde los resultaños de búsqueda de IA.
 * Permite personalizar el asunto y cuerpo del email antes de enviarlo.
 *
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.aiResult - Resultado de búsqueda AI seleccionado
 * @param {string} props.searchQuery - Consulta original de búsqueda
 * @returns {React.ReactElement|null} Modal de email o null si no está abierto
 */
const AIEmailModal = ({ isOpen, onClose, aiResult, searchQuery }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSent, setIsSent] = useState(false);
  const { t } = useTranslations();

  const {
    userEmail,
    isSending,
    error,
    sendEmailFromAIResult,
    generateAISubject,
    generateAIEmailBody,
  } = useAIProviderEmail();

  // Inicializar asunto y cuerpo cuando cambia el proveedor seleccionado
  useEffect(() => {
    if (aiResult) {
      setSubject(generateAISubject(aiResult));
      setBody(generateAIEmailBody(aiResult, searchQuery));
    }
  }, [aiResult, searchQuery, generateAISubject, generateAIEmailBody]);

  // Manejar el envío del email
  const handleSendEmail = async (e) => {
    e.preventDefault();

    const result = await sendEmailFromAIResult(aiResult, searchQuery, { subject, body });

    if (result) {
      setIsSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (!isOpen || !aiResult) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {t('suppliers.aiEmailModal.title', { name: aiResult.name })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label={t('suppliers.aiEmailModal.closeAria')}
            data-testid="close-modal-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-4 overflow-y-auto flex-1">
          {isSent && (
            <Alert type="success" className="mb-4" data-testid="success-alert">
              <p className="font-semibold">
                {t('suppliers.aiEmailModal.success.title')}
              </p>
              <p className="text-sm mt-1">
                {t('suppliers.aiEmailModal.success.message')}
              </p>
            </Alert>
          )}

          {error && (
            <Alert type="error" className="mb-4" data-testid="error-alert">
              <p className="font-semibold">
                {t('suppliers.aiEmailModal.error.title')}
              </p>
              <p className="text-sm mt-1">{error}</p>
            </Alert>
          )}

          <form onSubmit={handleSendEmail} data-testid="email-form">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t('suppliers.aiEmailModal.from')}{' '}
                  <span className="font-medium">{userEmail}</span>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {t('suppliers.aiEmailModal.to')}{' '}
                  <span className="font-medium">
                    {aiResult.email ||
                      `${aiResult.name.toLowerCase().replace(/\s+/g, '.')}@proveedor.com`}
                  </span>
                </p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('suppliers.aiEmailModal.subject.label')}
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('suppliers.aiEmailModal.subject.placeholder')}
                  required
                  data-testid="email-subject"
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('suppliers.aiEmailModal.body.label')}
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                  placeholder={t('suppliers.aiEmailModal.body.placeholder')}
                  required
                  data-testid="email-body"
                />
              </div>

              {/* Información adicional */}
              {aiResult.aiSummary && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-xs font-semibold text-blue-600 mb-1">
                    {t('suppliers.aiEmailModal.aiSummary')}
                  </p>
                  <p className="text-sm text-gray-700">{aiResult.aiSummary}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mr-2"
                disabled={isSending}
              >
                {t('suppliers.aiEmailModal.buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isSending || isSent} data-testid="send-email-btn">
                {isSending
                  ? t('suppliers.aiEmailModal.buttons.sending')
                  : t('suppliers.aiEmailModal.buttons.send')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIEmailModal;
