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
      toast.error('Por favor completa los campos obligatorios');
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
        toast.success('¡Solicitud enviada! El proveedor se pondrá en contacto pronto.');

        if (onSuccess) {
          onSuccess(data);
        }

        onClose();
      } else {
        toast.error(data.error || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar la solicitud');
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
              <h2 className="text-2xl font-bold text-foreground">Solicitar Presupuesto</h2>
              <p className="text-muted">
                {supplier?.name} - {supplier?.category}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la Boda */}
          <Card className="bg-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Información de tu Boda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombres de la Pareja *
                </label>
                <Input
                  type="text"
                  name="coupleName"
                  value={formData.coupleName}
                  onChange={handleChange}
                  placeholder="Juan y María"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fecha de la Boda
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
                  Ubicación
                </label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Valencia, España"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Número de Invitados
                </label>
                <Input
                  type="number"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Presupuesto Estimado (opcional)
                </label>
                <Input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="1500"
                  min="0"
                />
                <p className="text-xs text-muted mt-1">
                  Esto ayuda al proveedor a ofrecerte opciones dentro de tu rango
                </p>
              </div>
            </div>
          </Card>

          {/* Mensaje Personalizado */}
          <Card>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Mensaje Personalizado *
            </h3>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Describe qué servicios necesitas y cualquier detalle importante..."
              required
            />
            <p className="text-xs text-muted mt-2">
              💡 Tip: Sé específico sobre lo que necesitas para recibir un presupuesto más preciso
            </p>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Tu Información de Contacto *
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                <Input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono (opcional)
                </label>
                <Input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="+34 600 123 456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Método de Contacto Preferido
                </label>
                <select
                  name="preferredContactMethod"
                  value={formData.preferredContactMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="email">Email</option>
                  <option value="phone">Teléfono</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Urgencia</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente (menos de 1 mes)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted">* Campos obligatorios</p>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Solicitud
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
