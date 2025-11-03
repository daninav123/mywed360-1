import { X, Calendar, Mail, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useTranslations from '../../hooks/useTranslations';
import { useProviderEmail } from '../../hooks/useProviderEmail';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente modal para agendar reuniones o citas con un proveedor.
 * Permite seleccionar fecha, hora, método de contacto y añadir notas.
 * Incluye validación de campos y manejo de errores.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Provider} props.provider - Proveedor con el que se desea agendar la cita
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSubmit - Función para enviar los daños de la reserva
 * @returns {React.ReactElement} Modal para agendar citas
 */
const ReservationModal = ({ provider, onClose, onSubmit }) => {
  const { t } = useTranslations();
  // Integración con el hook de email para proveedores
  const {
    loading: emailLoading,
    error: emailError,
    userEmail,
    sendEmailToProvider,
    generateDefaultSubject,
    generateDefaultEmailBody,
  } = useProviderEmail();

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
    status: 'Pendiente',
    contactMethod: 'email',
  });

  const [emailSent, setEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
  });

  const [errors, setErrors] = useState({});

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    // Limpiar error cuando el usuario comienza a corregir
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null,
      }));
    }
  };

  // Inicializar daños del email cuando se muestra el formulario
  const initializeEmailData = () => {
    setEmailData({
      subject: generateDefaultSubject(provider),
      body: generateDefaultEmailBody(provider),
    });
    setShowEmailForm(true);
  };

  // Manejar cambios en el formulario de email
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Enviar email al proveedor
  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.body) {
      setErrors((prev) => ({
        ...prev,
        email: t('suppliers.reservationModal.errors.emailRequired'),
      }));
      return;
    }

    const result = await sendEmailToProvider(provider, emailData.subject, emailData.body);

    if (result) {
      setEmailSent(true);
      setShowEmailForm(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = t('suppliers.reservationModal.errors.dateRequired');
    }

    if (!formData.time) {
      newErrors.time = t('suppliers.reservationModal.errors.timeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        providerId: provider.id,
        providerName: provider.name,
        ...formData,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {t('suppliers.reservationModal.title', { name: provider.name })}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label={t('suppliers.reservationModal.actions.closeAria')}
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <div className="overflow-y-auto p-4 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <div className="mb-4">
                <label htmlFor="date" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.form.dateLabel')}
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="time" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.form.timeLabel')}
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                />
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
              </div>

              <div className="mb-4">
                <label htmlFor="contactMethod" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.form.contactMethodLabel')}
                </label>
                <select
                  id="contactMethod"
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="email">
                    {t('suppliers.reservationModal.form.contactMethods.email')}
                  </option>
                  <option value="phone">
                    {t('suppliers.reservationModal.form.contactMethods.phone')}
                  </option>
                  <option value="presencial">
                    {t('suppliers.reservationModal.form.contactMethods.inPerson')}
                  </option>
                  <option value="videollamada">
                    {t('suppliers.reservationModal.form.contactMethods.videoCall')}
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="notes" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.form.notesLabel')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder={t('suppliers.reservationModal.form.notesPlaceholder')}
                ></textarea>
              </div>

              {/* Información de contacto del proveedor */}
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-2 flex items-center">
                  <Calendar size={16} className="mr-1 text-blue-600" />
                  {t('suppliers.reservationModal.providerInfo.title')}
                </h3>
                {provider.contact && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">
                      {t('suppliers.reservationModal.providerInfo.contact')}
                    </span>{' '}
                    {provider.contact}
                  </p>
                )}
                {provider.phone && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">
                      {t('suppliers.reservationModal.providerInfo.phone')}
                    </span>{' '}
                    {provider.phone}
                  </p>
                )}
                {provider.email && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">
                      {t('suppliers.reservationModal.providerInfo.email')}
                    </span>{' '}
                    {provider.email}
                  </p>
                )}
                {provider.location && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">
                      {t('suppliers.reservationModal.providerInfo.location')}
                    </span>{' '}
                    {provider.location}
                  </p>
                )}
              </div>
            </Card>
          </form>
        </div>

        {/* Sección de email */}
        {!showEmailForm && !emailSent && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center mb-2">
              <Mail size={18} className="mr-2 text-blue-600" />
              <h3 className="font-medium">
                {t('suppliers.reservationModal.emailSection.title')}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {t('suppliers.reservationModal.emailSection.description')}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={initializeEmailData}
              className="w-full flex items-center justify-center"
            >
              <Mail size={16} className="mr-2" />
              {t('suppliers.reservationModal.emailSection.button')}
            </Button>
          </div>
        )}

        {/* Formulario de email */}
        {showEmailForm && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium flex items-center">
                <Mail size={18} className="mr-2 text-blue-600" />
                {t('suppliers.reservationModal.emailForm.title')}
              </h3>
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label={t('suppliers.reservationModal.emailForm.closeAria')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="subject" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.emailForm.subjectLabel')}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={emailData.subject}
                  onChange={handleEmailChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="body" className="block mb-1 text-sm font-medium">
                  {t('suppliers.reservationModal.emailForm.bodyLabel')}
                </label>
                <textarea
                  id="body"
                  name="body"
                  value={emailData.body}
                  onChange={handleEmailChange}
                  rows="6"
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              {emailError && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{emailError}</div>
              )}
              {errors.email && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{errors.email}</div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleSendEmail}
              disabled={emailLoading}
              className="w-full flex items-center justify-center"
            >
              {emailLoading
                ? t('suppliers.reservationModal.emailForm.sending')
                : t('suppliers.reservationModal.emailForm.send')}
            </Button>
          </div>
        )}

        {/* Confirmación de email enviado */}
        {emailSent && (
          <div className="p-4 border-t bg-green-50">
            <div className="flex items-center text-green-700 mb-2">
              <CheckCircle size={18} className="mr-2" />
              <span className="font-medium">
                {t('suppliers.reservationModal.emailSuccess.title')}
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {t('suppliers.reservationModal.emailSuccess.description', {
                name: provider.name,
                email: userEmail,
              })}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="p-4 border-t flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('suppliers.reservationModal.actions.cancel')}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={emailLoading}>
            {t('suppliers.reservationModal.actions.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
