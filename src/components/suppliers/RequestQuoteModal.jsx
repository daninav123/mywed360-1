import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, Users, MapPin, DollarSign } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Input from '../Input';
import Card from '../ui/Card';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { useAuth } from '../../hooks/useAuth';

/**
 * RequestQuoteModal - Formulario para solicitar presupuesto a un proveedor
 *
 * Props:
 * - supplier: Datos del proveedor {id, name, category, ...}
 * - weddingInfo: Info de la boda
 * - open: Boolean para mostrar/ocultar
 * - onClose: Función para cerrar
 * - onSuccess: Callback cuando se envía exitosamente
 */
const RequestQuoteModal = ({ supplier, weddingInfo, open, onClose, onSuccess }) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coupleName: '',
    weddingDate: '',
    location: '',
    guestCount: '',
    budget: '',
    services: [],
    message: '',
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: 'email',
    urgency: 'normal',
  });

  // Pre-rellenar con datos de la boda
  useEffect(() => {
    if (weddingInfo && open) {
      const profile = weddingInfo.weddingInfo || weddingInfo;

      setFormData((prev) => ({
        ...prev,
        coupleName: profile.name || profile.coupleName || '',
        weddingDate: profile.date || profile.weddingDate || '',
        location: profile.city || profile.location?.city || profile.celebrationPlace || '',
        guestCount: profile.guestCount || profile.guests || '',
        budget: profile.budget || profile.estimatedBudget || '',
        contactEmail: user?.email || '',
        services: supplier?.category ? [supplier.category] : [],
      }));
    }
  }, [weddingInfo, supplier, open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.coupleName || !formData.contactEmail || !formData.message) {
      toast.error(t('common.suppliers.requestQuoteModal.validation.requiredFields'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/request-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.uid || null,
          weddingId: weddingInfo?.id || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('common.suppliers.requestQuoteModal.toasts.success'));

        if (onSuccess) {
          onSuccess(data);
        }

        onClose();
      } else {
        toast.error(data.error || t('common.suppliers.requestQuoteModal.toasts.error'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('common.suppliers.requestQuoteModal.toasts.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            {supplier?.media?.logo && (
              <img
                src={supplier.media.logo}
                alt={supplier.name}
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {t('common.suppliers.requestQuoteModal.title')}
              </h2>
              <p className="text-muted">
                {supplier?.name} - {supplier?.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
            aria-label={t('app.close')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la Boda */}
          <Card className="bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('common.suppliers.requestQuoteModal.sections.eventInfo.title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.coupleName.label'
                  )}
                </label>
                <Input
                  type="text"
                  name="coupleName"
                  value={formData.coupleName}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.coupleName.placeholder'
                  )}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.weddingDate.label'
                  )}
                </label>
                <Input
                  type="date"
                  name="weddingDate"
                  value={formData.weddingDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('common.suppliers.requestQuoteModal.sections.eventInfo.fields.location.label')}
                </label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.location.placeholder'
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.guestCount.label'
                  )}
                </label>
                <Input
                  type="number"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.guestCount.placeholder'
                  )}
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('common.suppliers.requestQuoteModal.sections.eventInfo.fields.budget.label')}
                </label>
                <Input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.eventInfo.fields.budget.placeholder'
                  )}
                  min="0"
                />
                <p className="text-xs text-muted mt-1">
                  {t('common.suppliers.requestQuoteModal.sections.eventInfo.fields.budget.hint')}
                </p>
              </div>
            </div>
          </Card>

          {/* Mensaje Personalizado */}
          <Card>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              {t('common.suppliers.requestQuoteModal.sections.message.title')}
            </h3>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder={t('common.suppliers.requestQuoteModal.sections.message.placeholder')}
              required
            />
            <p className="text-xs text-muted mt-2">
              {t('common.suppliers.requestQuoteModal.sections.message.hint')}
            </p>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('common.suppliers.requestQuoteModal.sections.contact.title')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('common.suppliers.requestQuoteModal.sections.contact.fields.email.label')}
                </label>
                <Input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.contact.fields.email.placeholder'
                  )}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('common.suppliers.requestQuoteModal.sections.contact.fields.phone.label')}
                </label>
                <Input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder={t(
                    'common.suppliers.requestQuoteModal.sections.contact.fields.phone.placeholder'
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t(
                    'common.suppliers.requestQuoteModal.sections.contact.fields.preferredContactMethod.label'
                  )}
                </label>
                <select
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="email">
                    {t(
                      'common.suppliers.requestQuoteModal.sections.contact.fields.preferredContactMethod.options.email'
                    )}
                  </option>
                  <option value="phone">
                    {t(
                      'common.suppliers.requestQuoteModal.sections.contact.fields.preferredContactMethod.options.phone'
                    )}
                  </option>
                  <option value="whatsapp">
                    {t(
                      'common.suppliers.requestQuoteModal.sections.contact.fields.preferredContactMethod.options.whatsapp'
                    )}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('common.suppliers.requestQuoteModal.sections.contact.fields.urgency.label')}
                </label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="normal">
                    {t(
                      'common.suppliers.requestQuoteModal.sections.contact.fields.urgency.options.normal'
                    )}
                  </option>
                  <option value="urgent">
                    {t(
                      'common.suppliers.requestQuoteModal.sections.contact.fields.urgency.options.urgent'
                    )}
                  </option>
                </select>
              </div>
            </div>
          </Card>

          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted">
              {t('common.suppliers.requestQuoteModal.footer.requiredNote')}
            </p>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                {t('app.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('common.suppliers.requestQuoteModal.footer.buttons.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t('common.suppliers.requestQuoteModal.footer.buttons.submit')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RequestQuoteModal;
