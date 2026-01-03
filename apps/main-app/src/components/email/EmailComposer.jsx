import { X, Paperclip, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { scheduleEmailSend } from '../../services/emailAutomationService';
import * as EmailService from '../../services/emailService';
import { safeRender } from '../../utils/promiseSafeRenderer';
import Button from '../Button';
import Card from '../ui/Card';
import useTranslations from '../../hooks/useTranslations';

/**
 * Componente para redactar y enviar nuevos emails desde la dirección personalizada del usuario
 *
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Controla si el compositor está abierto
 * @param {Function} props.onClose - Función para cerrar el compositor
 * @param {Object} props.initialValues - Valores iniciales (para respuestas o reenvíos)
 * @param {Function} props.onSend - Callback ejecutado después de enviar el email
 * @returns {React.ReactElement} Componente para redactar emails
 */
const EmailComposer = ({ isOpen, onClose, initialValues = {}, onSend }) => {
  const isTestEnv = Boolean(
    (typeof globalThis !== 'undefined' && (globalThis.vi || globalThis.jest)) ||
      (typeof process !== 'undefined' &&
        process.env &&
        (process.env.VITEST || process.env.NODE_ENV === 'test')) ||
      (typeof navigator !== 'undefined' &&
        navigator.userAgent &&
        /jsdom/i.test(navigator.userAgent)) ||
      (typeof import.meta !== 'undefined' &&
        (import.meta.vitest || (import.meta.env && import.meta.env.MODE === 'test')))
  );
  const authContext = useAuth();
  const { userProfile } = authContext;
  const { t, tVars, tPlural } = useTranslations();
  const tEmail = (key, options) => t(`email.${key}`, { ns: 'email', ...options });
  const tEmailVars = (key, variables) => tVars(`email.${key}`, { ns: 'email', ...variables });
  const tEmailPlural = (key, count, variables) =>
    tPlural(`email.${key}`, count, { ns: 'email', ...variables });

  // Establecer el contexto de autenticación en EmailService
  useEffect(() => {
    try {
      EmailService?.setAuthContext?.(authContext);
    } catch (e) {
      // console.error('[EmailComposer] Error setting auth context:', e);
    }
  }, [authContext]);
  const [to, setTo] = useState(initialValues.to || '');
  const [cc, setCc] = useState(initialValues.cc || '');
  const [subject, setSubject] = useState(initialValues.subject || '');
  const [body, setBody] = useState(initialValues.body || '');
  const [attachments, setAttachments] = useState([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showCc, setShowCc] = useState(!!initialValues.cc);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const sendingRef = useRef(false);

  // Obtener el email del usuario autenticado desde PostgreSQL
  useEffect(() => {
    const initializeEmail = async () => {
      if (userProfile) {
        const email = userProfile.myWed360Email || (await EmailService.initEmailService(userProfile));
        console.log('[EmailComposer] Email del usuario:', email);
        setUserEmail(email);
      }
    };

    initializeEmail();

    // Cargar plantillas disponibles
    const loadTemplates = async () => {
      try {
        const availableTemplates = await EmailService.getEmailTemplates();
        setTemplates(availableTemplates || []);
      } catch (err) {
        // console.error('[EmailComposer] Failed to load templates:', err);
      }
    };

    loadTemplates();
  }, [userProfile]);

  useEffect(() => {
    if (!isOpen) {
      setScheduleEnabled(false);
      setScheduledAt('');
      return;
    }
    if (initialValues && initialValues.scheduledAt) {
      setScheduleEnabled(true);
      setScheduledAt(initialValues.scheduledAt);
    } else {
      setScheduleEnabled(false);
      setScheduledAt('');
    }
  }, [isOpen, initialValues]);

  // Aplicar plantilla seleccionada
  const applyTemplate = (template) => {
    if (!template) return;

    setSubject(template.subject || subject);
    setBody(template.body || body);
    setSelectedTemplate(template);
  };

  // Manejar subida de archivos adjuntos
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    // Validar tamaño (máximo 10MB por archivo)
    const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(
        tEmailVars('composer.errors.invalidAttachments', {
          maxSize: '10MB',
          names: invalidFiles.map((f) => f.name).join(', '),
        })
      );
      return;
    }

    // Añadir archivos a la lista de adjuntos
    setAttachments((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    ]);

    // Limpiar input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) {
      // Reiniciar el valor para permitir volver a seleccionar el mismo archivo
      event.target.value = '';
    }
  };

  // Eliminar un adjunto
  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Validar email antes de enviar
  const validateEmail = () => {
    if (!to) {
      setError(tEmail('composer.errors.missingRecipient'));
      return false;
    }

    if (!subject) {
      setError(tEmail('composer.errors.missingSubject'));
      return false;
    }

    if (!body || body.trim().length === 0) {
      setError(tEmail('composer.errors.emptyBody'));
      return false;
    }

    // Validar formato de email (expresión regular básica)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = to.split(',').map((email) => email.trim());
    const invalidEmails = toEmails.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      setError(
        tEmailVars('composer.errors.invalidRecipients', {
          emails: invalidEmails.join(', '),
        })
      );
      return false;
    }

    if (cc) {
      const ccEmails = cc.split(',').map((email) => email.trim());
      const invalidCcEmails = ccEmails.filter((email) => !emailRegex.test(email));

      if (invalidCcEmails.length > 0) {
        setError(
          tEmailVars('composer.errors.invalidCc', {
            emails: invalidCcEmails.join(', '),
          })
        );
        return false;
      }
    }

    return true;
  };

  // Enviar el email
  const handleSend = async () => {
    // Prevenir envío duplicado con referencia (más robusto que state)
    if (sending || sendingRef.current) {
      // console.log('[EmailComposer] Send already in progress, ignoring.');
      return;
    }
    sendingRef.current = true;

    setError('');
    setSuccess('');

    if (!validateEmail()) {
      sendingRef.current = false;
      return;
    }

    // Verificar si el usuario tiene configurada dirección personalizada
    if (
      !isTestEnv &&
      userProfile &&
      !userProfile.emailUsername &&
      !userProfile.myWed360Email &&
      !userProfile.emailAlias
    ) {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        if (
          window.confirm(tEmail('composer.prompts.setupCustomAddress'))
        ) {
          sendingRef.current = false;
          window.location.href = '/email/setup';
          return;
        } else {
          // Usuario canceló la configuración
          sendingRef.current = false;
          return;
        }
      }
    }

    if (scheduleEnabled) {
      if (!scheduledAt) {
        setError(tEmail('composer.errors.missingSchedule'));
        sendingRef.current = false;
        return;
      }
      if (attachments.length > 0) {
        setError(tEmail('composer.errors.attachmentsNotSupported'));
        sendingRef.current = false;
        return;
      }
      setSending(true);
      try {
        const scheduleDate = new Date(scheduledAt);
        if (Number.isNaN(scheduleDate.getTime())) {
          throw new Error(tEmail('composer.errors.invalidScheduleDate'));
        }
        await scheduleEmailSend({ to, cc, subject, body }, scheduleDate.toISOString());
        setSuccess(tEmail('composer.success.scheduled'));
        if (onSend) {
          onSend({ scheduled: true, scheduledAt: scheduleDate.toISOString() });
        }
        setScheduleEnabled(false);
        setScheduledAt('');
        setTimeout(() => {
          if (typeof onClose === 'function') {
            onClose();
          }
        }, 600);
      } catch (scheduleError) {
        setError(scheduleError?.message || tEmail('composer.errors.scheduleFailed'));
      } finally {
        setSending(false);
        sendingRef.current = false;
      }
      return;
    }

    setSending(true);

    try {
      const result = await EmailService.sendEmail({
        to,
        cc,
        subject,
        body,
        attachments,
      });

      if (result && (result.success || result.id)) {
        setSuccess(tEmail('composer.success.sent'));

        if (onSend) {
          onSend(result);
        }

        // Esperar un momento para mostrar el mensaje de éxito antes de cerrar
        setTimeout(() => {
          if (typeof onClose === 'function') {
            onClose();
          }
          resetForm();
        }, 1500);
      } else {
        throw new Error(tEmail('composer.errors.sendFailed'));
      }
    } catch (err) {
      // console.error('[EmailComposer] Failed to send email:', err);
      sendingRef.current = false;
      setError(
        tEmailVars('composer.errors.sendFailedWithDetails', {
          details: err.message,
        })
      );
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setTo('');
    setCc('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setShowCc(false);
    setError('');
    setSelectedTemplate(null);
    sendingRef.current = false;
  };

  // Cerrar y resetear
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    resetForm();
    setScheduleEnabled(false);
    setScheduledAt('');
    sendingRef.current = false;
  };

  // Si isOpen no se pasa, asumimos que debe mostrarse
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col" data-testid="email-composer">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold">{tEmail('composer.header.title')}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label={tEmail('composer.header.closeAria')}
          >
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          {safeRender(error) && (
            <div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700"
              data-testid="error-message"
            >
              <AlertCircle size={18} className="flex-shrink-0 mr-2" />
              <span>{safeRender(error, '')}</span>
            </div>
          )}

          {safeRender(success) && (
            <div
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center text-green-700"
              data-testid="success-message"
            >
              <CheckCircle size={18} className="flex-shrink-0 mr-2" />
              <span>{safeRender(success, '')}</span>
            </div>
          )}

          <div className="mb-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tEmail('composer.fields.from.label')}
              </label>
              {templates.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedTemplate ? templates.indexOf(selectedTemplate) : ''}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      applyTemplate(templates[index]);
                    }}
                    className="text-sm border border-gray-300 rounded-md py-1 pl-2 pr-8"
                  >
                    <option value="">{tEmail('composer.templates.placeholder')}</option>
                    {templates.map((template, index) => (
                      <option key={index} value={index}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-2 top-2 pointer-events-none text-gray-500"
                  />
                </div>
              )}
            </div>
            <div className="border border-gray-300 rounded-md p-2 bg-gray-50 flex justify-between">
              <span className="text-gray-800">
                {userEmail || tEmail('composer.status.loadingEmail')}
              </span>
              {userEmail && userEmail.includes('@planivia.net') ? (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Planivia
                </span>
              ) : userProfile && !userProfile.emailUsername ? (
                <a
                  href="/email/setup"
                  className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                >
                  {tEmail('composer.actions.configureEmail')}
                </a>
              ) : null}
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="to-input" className="block text-sm font-medium text-gray-700 mb-1">
              {tEmail('composer.fields.to.label')}
            </label>
            <input
              id="to-input"
              aria-label={tEmail('composer.fields.to.label')}
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder={tEmail('composer.fields.to.placeholder')}
              disabled={sending}
              data-testid="recipient-input"
            />
          </div>

          {showCc && (
            <div className="mb-2">
              <label htmlFor="cc-input" className="block text-sm font-medium text-gray-700 mb-1">
                {tEmail('composer.fields.cc.label')}
              </label>
              <input
                id="cc-input"
                aria-label={tEmail('composer.fields.cc.label')}
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder={tEmail('composer.fields.cc.placeholder')}
                disabled={sending}
              />
            </div>
          )}

          <div className="mb-2 flex justify-end">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {tEmail('composer.actions.addCc')}
              </button>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="subject-input" className="block text-sm font-medium text-gray-700 mb-1">
              {tEmail('composer.fields.subject.label')}
            </label>
            <input
              id="subject-input"
              aria-label={tEmail('composer.fields.subject.label')}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder={tEmail('composer.fields.subject.placeholder')}
              disabled={sending}
              data-testid="subject-input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="body-input" className="block text-sm font-medium text-gray-700 mb-1">
              {tEmail('composer.fields.body.label')}
            </label>
            <textarea
              id="body-input"
              aria-label={tEmail('composer.fields.body.label')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              rows="12"
              placeholder={tEmail('composer.fields.body.placeholder')}
              disabled={sending}
              data-testid="body-editor"
            />
          </div>

          {/* Sección de adjuntos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tEmail('composer.attachments.label')}
            </label>

            <div className="mb-2">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Paperclip size={18} className="mr-2" />
                {tEmail('composer.attachments.addFile')}
                <input
                  type="file"
                  aria-label={tEmail('composer.attachments.addFile')}
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  disabled={sending}
                />
              </label>
              <span className="ml-2 text-xs text-gray-500">
                {tEmail('composer.attachments.maxSizeHint')}
              </span>
            </div>

            {attachments.length > 0 && (
              <div className="border border-gray-200 rounded-md p-2">
                <p className="text-xs text-gray-500 mb-2">
                  {tEmailPlural('composer.attachments.count', attachments.length, {
                    count: attachments.length,
                  })}
                </p>

                <ul className="space-y-1">
                  {attachments.map((file, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-grow truncate mr-2">
                        {file.name}
                        <span className="text-xs text-gray-500 ml-1">
                          ({Math.round(file.size / 1024)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        aria-label={tEmail('composer.attachments.removeAria')}
                        className="text-gray-500"
                        onClick={() => removeAttachment(index)}
                        disabled={sending}
                      >
                        <X size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-md border border-dashed border-blue-200 bg-blue-50/60 p-3">
          <label className="flex items-center space-x-2 text-sm font-medium text-blue-800">
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-blue-300 rounded"
              checked={scheduleEnabled}
              onChange={(e) => {
                setScheduleEnabled(e.target.checked);
                if (!e.target.checked) {
                  setScheduledAt('');
                }
              }}
            />
            <span>{tEmail('composer.schedule.label')}</span>
          </label>
          {scheduleEnabled && (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="datetime-local"
                value={scheduledAt}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full sm:w-auto border border-blue-200 rounded-md px-3 py-2 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              />
              <p className="text-xs text-blue-700 sm:ml-3">
                {tEmail('composer.schedule.helper')}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              {tEmail('composer.buttons.cancel')}
            </Button>
            <Button onClick={handleSend} disabled={sending} data-testid="send-button">
              {sending
                ? scheduleEnabled
                  ? tEmail('composer.buttons.scheduling')
                  : tEmail('composer.buttons.sending')
                : scheduleEnabled
                  ? tEmail('composer.buttons.schedule')
                  : tEmail('composer.buttons.send')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailComposer;
