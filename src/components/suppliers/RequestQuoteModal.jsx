import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Calendar, Users, MapPin, CheckCircle } from 'lucide-react';
import Modal from '../Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { useAuth } from '../../hooks/useAuth';
import { useWeddingBasicInfo, formatWeddingBasicInfo } from '../../hooks/useWeddingBasicInfo';
import {
  getQuoteFormTemplate,
  getVisibleFields,
  calculateProgress,
} from '../../data/quoteFormTemplates';
import DynamicField from './DynamicField';

// Nota: El hook useTranslations está importado pero solo se usa en fallbacks.
// La mayoría del texto está hardcodeado por simplicidad en esta primera versión.

/**
 * 💰 RequestQuoteModal V2 - Sistema Inteligente de Solicitud de Presupuestos
 *
 * Características:
 * - Templates dinámicos por categoría
 * - Info automática desde WeddingContext
 * - Campos condicionales
 * - Progreso visual
 * - Validaciones inteligentes
 *
 * Props:
 * - supplier: Datos del proveedor {id, name, category, categoryName, ...}
 * - open: Boolean para mostrar/ocultar
 * - onClose: Función para cerrar
 * - onSuccess: Callback cuando se envía exitosamente
 */
const RequestQuoteModal = ({ supplier, open, onClose, onSuccess }) => {
  const { t } = useTranslations();
  const { user } = useAuth();
  const basicInfo = useWeddingBasicInfo();
  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState({});
  const [customMessage, setCustomMessage] = useState('');

  // Obtener template según categoría del proveedor
  const template = useMemo(() => {
    return getQuoteFormTemplate(supplier?.category);
  }, [supplier?.category]);

  // Campos visibles según dependencias
  const visibleFields = useMemo(() => {
    return getVisibleFields(template, serviceData);
  }, [template, serviceData]);

  // Calcular progreso
  const progress = useMemo(() => {
    return calculateProgress(template, serviceData);
  }, [template, serviceData]);

  // Inicializar formulario con valores por defecto
  useEffect(() => {
    if (open && template) {
      const initialData = {};
      template.fields.forEach((field) => {
        if (field.default !== undefined) {
          initialData[field.id] = field.default;
        }
      });
      setServiceData(initialData);
      setCustomMessage('');
    }
  }, [open, template]);

  // Manejar cambios en campos dinámicos
  const handleFieldChange = (fieldId, value) => {
    setServiceData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que info básica está disponible
    if (!basicInfo.available) {
      toast.error('⚠️ Necesitas tener una boda activa para solicitar presupuestos');
      return;
    }

    // Validar campos required del template
    const requiredFields = visibleFields.filter((f) => f.required);
    const missingFields = requiredFields.filter((field) => {
      const value = serviceData[field.id];
      if (field.type === 'boolean') return value === undefined;
      if (field.type === 'multi-select') return !value || value.length === 0;
      return !value;
    });

    if (missingFields.length > 0) {
      toast.error(`❌ Completa todos los campos requeridos (${missingFields.length} pendientes)`);
      return;
    }

    setLoading(true);

    try {
      // Preparar payload completo
      const payload = {
        // Info automática
        weddingInfo: {
          fecha: basicInfo.fecha,
          ciudad: basicInfo.ciudad,
          numeroInvitados: basicInfo.numeroInvitados,
          presupuestoTotal: basicInfo.presupuestoTotal,
        },
        // Info de contacto
        contacto: {
          nombre: basicInfo.nombreContacto,
          email: basicInfo.emailContacto,
          telefono: basicInfo.telefonoContacto,
        },
        // Info del proveedor
        proveedor: {
          id: supplier.id || supplier.slug,
          name: supplier.name,
          category: supplier.category,
          categoryName: supplier.categoryName,
        },
        // Detalles del servicio
        serviceDetails: serviceData,
        // Mensaje personalizado
        customMessage,
        // Metadatos
        userId: user?.uid || null,
        weddingId: basicInfo.weddingId || null,
        requestedAt: new Date().toISOString(),
      };

      console.log('📤 Enviando solicitud de presupuesto:', payload);

      const response = await fetch(
        `/api/suppliers/${supplier.id || supplier.slug}/quote-requests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(`✅ Presupuesto solicitado a ${supplier.name}`);

        if (onSuccess) {
          onSuccess(data);
        }

        onClose();
      } else {
        toast.error(data.error || '❌ Error al enviar solicitud');
      }
    } catch (error) {
      console.error('💥 Error enviando solicitud:', error);
      toast.error('❌ Error al enviar solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear info básica para display
  const formattedInfo = useMemo(() => {
    return formatWeddingBasicInfo(basicInfo);
  }, [basicInfo]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header con Progreso */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {supplier?.media?.logo && (
              <img
                src={supplier.media.logo}
                alt={supplier.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">💰 Solicitar Presupuesto</h2>
              <p className="text-gray-600">
                {supplier?.name}
                {supplier?.categoryName && (
                  <span className="ml-2 text-indigo-600">• {supplier.categoryName}</span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Barra de Progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm font-semibold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 📋 Sección 1: Info Automática (Read-Only) */}
          <Card className="bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              📋 Información de tu boda
            </h3>

            {basicInfo.available ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {formattedInfo.fecha && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium text-gray-900">{formattedInfo.fecha}</span>
                  </div>
                )}
                {formattedInfo.ciudad && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Ciudad:</span>
                    <span className="font-medium text-gray-900">{formattedInfo.ciudad}</span>
                  </div>
                )}
                {formattedInfo.numeroInvitados && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Invitados:</span>
                    <span className="font-medium text-gray-900">
                      {formattedInfo.numeroInvitados}
                    </span>
                  </div>
                )}
                {formattedInfo.presupuestoTotal && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Presupuesto:</span>
                    <span className="font-medium text-gray-900">
                      {formattedInfo.presupuestoTotal}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">⚠️ No hay información de boda disponible</p>
            )}
          </Card>

          {/* 🎯 Sección 2: Detalles del Servicio (Dinámico por Categoría) */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {template.icon} {template.name}
            </h3>

            <div className="space-y-4">
              {/* Renderizar campos dinámicos */}
              {visibleFields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={serviceData[field.id]}
                  onChange={handleFieldChange}
                />
              ))}

              {visibleFields.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No hay campos específicos para esta categoría. Por favor, describe tus necesidades
                  en el mensaje.
                </p>
              )}
            </div>
          </Card>

          {/* 💬 Sección 3: Mensaje Personalizado (Opcional) */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              💬 Mensaje adicional
            </h3>

            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder="Cuéntale al proveedor cualquier detalle especial, preferencias o requisitos adicionales..."
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Opcional: Añade información adicional que ayude al proveedor a preparar tu
              presupuesto
            </p>
          </Card>

          {/* Footer con acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">* Campos requeridos</p>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || progress < 100}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    📤 Solicitar Presupuesto
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
