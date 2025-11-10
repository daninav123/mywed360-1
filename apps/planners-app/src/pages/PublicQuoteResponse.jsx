/**
 * 📧 PublicQuoteResponse - Página pública para que proveedores respondan
 *
 * Los proveedores reciben un email con un link único:
 * /responder-presupuesto/:token
 *
 * Esta página les permite ingresar su presupuesto sin necesidad de login.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Package,
  FileText,
  Send,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function PublicQuoteResponse() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    // Precio
    subtotal: '',
    taxes: '',
    discount: '',
    total: '',

    // Servicios (se populará según lo solicitado)
    serviceOffered: {},
    extras: '',

    // Condiciones
    deposit: '30',
    paymentTerms: '30% adelanto, 40% día boda, 30% entrega',
    cancellationPolicy: 'Reembolso 100% hasta 60 días antes',
    deliveryTime: '45',
    warranty: '',

    // Mensaje
    message: '',
  });

  useEffect(() => {
    loadQuoteRequest();
  }, [token]);

  // Cargar la solicitud de presupuesto
  const loadQuoteRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quote-requests/public/${token}`);
      const data = await response.json();

      if (response.ok) {
        setRequestData(data.request);

        // Pre-rellenar servicios solicitados
        if (data.request.serviceDetails) {
          setFormData((prev) => ({
            ...prev,
            serviceOffered: { ...data.request.serviceDetails },
          }));
        }
      } else {
        setError(data.error || 'No se pudo cargar la solicitud');
      }
    } catch (err) {
      console.error('Error loading quote request:', err);
      setError('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular total automáticamente
  useEffect(() => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const taxes = parseFloat(formData.taxes) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + taxes - discount;

    if (total !== parseFloat(formData.total)) {
      setFormData((prev) => ({ ...prev, total: total.toFixed(2) }));
    }
  }, [formData.subtotal, formData.taxes, formData.discount]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleServiceChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      serviceOffered: {
        ...prev.serviceOffered,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.total || parseFloat(formData.total) <= 0) {
      alert('Ingresa un precio válido');
      return;
    }

    if (!formData.message || formData.message.trim().length < 20) {
      alert('Añade un mensaje explicativo (mínimo 20 caracteres)');
      return;
    }

    setSubmitting(true);

    try {
      const quote = {
        pricing: {
          subtotal: parseFloat(formData.subtotal) || 0,
          taxes: parseFloat(formData.taxes) || 0,
          discount: parseFloat(formData.discount) || 0,
          total: parseFloat(formData.total),
          currency: 'EUR',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        },
        serviceOffered: {
          ...formData.serviceOffered,
          extras: formData.extras.split('\n').filter((e) => e.trim()),
        },
        terms: {
          deposit: parseInt(formData.deposit),
          paymentTerms: formData.paymentTerms,
          cancellationPolicy: formData.cancellationPolicy,
          deliveryTime: `${formData.deliveryTime} días`,
          warranty: formData.warranty,
        },
        message: formData.message,
        attachments: [], // TODO: Implementar upload de archivos
      };

      const response = await fetch(`/api/quote-requests/public/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Opcional: Redirigir a página de confirmación
        }, 3000);
      } else {
        alert(data.error || 'Error al enviar presupuesto');
      }
    } catch (err) {
      console.error('Error submitting quote:', err);
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12">
          <Loader className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando solicitud...</p>
        </Card>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link inválido o expirado</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta con el cliente directamente.
          </p>
        </Card>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Presupuesto enviado!</h2>
          <p className="text-gray-600 mb-6">
            Tu presupuesto ha sido enviado correctamente a{' '}
            <strong>{requestData?.contacto?.nombre}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            El cliente recibirá una notificación y podrá comparar tu propuesta con otras opciones.
          </p>
          <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-800 font-semibold mb-2">¿Qué sigue?</p>
            <p className="text-xs text-indigo-600">
              El cliente revisará tu presupuesto y se pondrá en contacto contigo si decide
              contratarte.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 rounded-full p-3">
              <DollarSign className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Responder Solicitud de Presupuesto
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Solicitud de: <strong>{requestData?.contacto?.nombre}</strong> •{' '}
                {requestData?.supplierCategoryName}
              </p>
            </div>
          </div>
        </Card>

        {/* Info de la boda */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50">
          <h3 className="font-semibold text-gray-900 mb-3">📋 Información del Evento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {requestData?.weddingInfo?.fecha && (
              <div>
                <p className="text-gray-600">Fecha</p>
                <p className="font-semibold">
                  {new Date(requestData.weddingInfo.fecha).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
            {requestData?.weddingInfo?.ciudad && (
              <div>
                <p className="text-gray-600">Ciudad</p>
                <p className="font-semibold">{requestData.weddingInfo.ciudad}</p>
              </div>
            )}
            {requestData?.weddingInfo?.numeroInvitados && (
              <div>
                <p className="text-gray-600">Invitados</p>
                <p className="font-semibold">{requestData.weddingInfo.numeroInvitados}</p>
              </div>
            )}
            {requestData?.weddingInfo?.presupuestoTotal && (
              <div>
                <p className="text-gray-600">Presupuesto Total</p>
                <p className="font-semibold">
                  {requestData.weddingInfo.presupuestoTotal.toLocaleString('es-ES')}€
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Precio */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="text-indigo-600" size={20} />
              💰 Precio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtotal (sin IVA) *
                </label>
                <input
                  type="number"
                  name="subtotal"
                  value={formData.subtotal}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IVA (21%)</label>
                <input
                  type="number"
                  name="taxes"
                  value={formData.taxes}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="420"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (opcional)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold text-lg"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              El total se calcula automáticamente: Subtotal + IVA - Descuento
            </p>
          </Card>

          {/* Servicios */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="text-indigo-600" size={20} />
              📸 Servicios Incluidos
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Confirma o modifica los servicios que ofrecerás:
            </p>

            <div className="space-y-3">
              {requestData?.serviceDetails &&
                Object.entries(requestData.serviceDetails).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 min-w-[200px]">
                      {key}:
                    </label>
                    {typeof value === 'boolean' ? (
                      <select
                        value={
                          formData.serviceOffered[key] !== undefined
                            ? formData.serviceOffered[key]
                            : value
                        }
                        onChange={(e) => handleServiceChange(key, e.target.value === 'true')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={
                          formData.serviceOffered[key] !== undefined
                            ? formData.serviceOffered[key]
                            : value
                        }
                        onChange={(e) => handleServiceChange(key, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ✨ Extras Incluidos (uno por línea)
              </label>
              <textarea
                name="extras"
                value={formData.extras}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej:&#10;Pendrive USB personalizado&#10;Galería online privada 2 años&#10;Impresión 20x30cm regalo"
              />
            </div>
          </Card>

          {/* Condiciones */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              📋 Condiciones Comerciales
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adelanto requerido (%) *
                  </label>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo de entrega (días) *
                  </label>
                  <input
                    type="number"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de pago *
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="30% adelanto, 40% día boda, 30% entrega"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Política de cancelación *
                </label>
                <input
                  type="text"
                  name="cancellationPolicy"
                  value={formData.cancellationPolicy}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reembolso 100% hasta 60 días antes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garantía (opcional)
                </label>
                <input
                  type="text"
                  name="warranty"
                  value={formData.warranty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Garantía de satisfacción 100%"
                />
              </div>
            </div>
          </Card>

          {/* Mensaje */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="text-indigo-600" size={20} />
              💬 Mensaje para el Cliente
            </h3>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={6}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Cuéntale al cliente por qué eres la mejor opción para su boda. Destaca tu experiencia, estilo de trabajo, y cualquier detalle que te diferencie..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Mínimo 20 caracteres. Este mensaje aparecerá en el comparador de presupuestos.
            </p>
          </Card>

          {/* Footer */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Antes de enviar, verifica que:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>El precio total sea correcto</li>
                  <li>Los servicios incluidos estén completos</li>
                  <li>Las condiciones sean claras</li>
                  <li>Tu mensaje sea profesional y convincente</li>
                </ul>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap"
              >
                {submitting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    📤 Enviar Presupuesto
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
