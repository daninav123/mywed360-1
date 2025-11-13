import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, MapPin, Users, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWedding } from '../../context/WeddingContext';
import useTranslations from '../../hooks/useTranslations';

/**
 * Modal para solicitar presupuesto a un proveedor
 * Envía email automático al proveedor y guarda la solicitud
 */
export default function ContactSupplierModal({ supplier, onClose }) {
  const { currentUser } = useAuth();
  const { activeWedding } = useWedding();
  const { t } = useTranslations();

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    weddingDate: '',
    weddingLocation: '',
    guestCount: '',
    budget: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Precargar datos de la boda activa
  useEffect(() => {
    setFormData({
      clientName: activeWedding?.names || currentUser?.displayName || '',
      clientEmail: currentUser?.email || '',
      clientPhone: activeWedding?.phone || '',
      weddingDate: activeWedding?.weddingDate || '',
      weddingLocation: activeWedding?.location || '',
      guestCount: activeWedding?.guestCount || '',
      budget: '',
      message: `Hola ${supplier.name},\n\nEstamos organizando nuestra boda y nos gustaría recibir más información sobre sus servicios.\n\n¡Gracias!`,
    });
  }, [activeWedding, currentUser, supplier.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/suppliers/${supplier.id}/request-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Datos de la pareja
          coupleName: formData.clientName,
          weddingDate: formData.weddingDate || null,
          location: formData.weddingLocation || null,
          guestCount: formData.guestCount ? parseInt(formData.guestCount) : null,
          budget: formData.budget || null,

          // Servicios y mensaje
          services: [supplier.category || 'General'],
          message: formData.message,

          // Contacto
          contactEmail: formData.clientEmail,
          contactPhone: formData.clientPhone || null,
          preferredContactMethod: 'email',
          urgency: 'normal',

          // Metadata
          userId: currentUser?.uid || null,
          weddingId: activeWedding?.id || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar solicitud');
      }

      setSent(true);

      // Cerrar modal automáticamente después de 3 segundos
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      // console.error('Error al enviar solicitud:', err);
      setError(err.message || 'Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito
  if (sent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-4">
            {supplier.name} recibirá tu mensaje por email y te responderá pronto.
          </p>
          <p className="text-sm text-gray-500">También recibirás un email de confirmación.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">Solicitar Presupuesto</h2>
            <p className="text-sm text-gray-600">{supplier.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tus datos */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              Tus Datos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Nombres de la pareja *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ana y Luis"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+34 612 345 678"
                />
              </div>
            </div>
          </div>

          {/* Detalles de la boda */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              Detalles de la Boda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar size={16} className="inline mr-1" />
                  Fecha de la boda *
                </label>
                <input
                  type="date"
                  value={formData.weddingDate}
                  onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <MapPin size={16} className="inline mr-1" />
                  Lugar
                </label>
                <input
                  type="text"
                  value={formData.weddingLocation}
                  onChange={(e) => setFormData({ ...formData, weddingLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Madrid"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Users size={16} className="inline mr-1" />
                  Nº Invitados
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="100"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Presupuesto Estimado</label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Selecciona un rango</option>
                  <option value="< 1000€">Menos de 1.000€</option>
                  <option value="1000-2000€">1.000€ - 2.000€</option>
                  <option value="2000-3000€">2.000€ - 3.000€</option>
                  <option value="3000-5000€">3.000€ - 5.000€</option>
                  <option value="> 5000€">Más de 5.000€</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              Tu Mensaje
            </h3>
            <label className="block text-sm font-medium mb-1">
              Cuéntale al proveedor qué necesitas *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="5"
              required
              placeholder="Describe qué servicios necesitas, tus preferencias, dudas..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Cuanto más detallado seas, mejor será el presupuesto que recibas
            </p>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>El proveedor recibirá tu solicitud por email</strong> y te responderá
                directamente a tu correo. No necesitas entrar al panel para ver su respuesta.
              </span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Send size={20} />
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
