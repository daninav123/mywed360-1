import { X, Calendar } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useTranslations from '../../hooks/useTranslations';
import { SUPPLIER_CATEGORIES } from '../../shared/supplierCategories';
import PaymentScheduleEditor from './PaymentScheduleEditor';
import { useWedding } from '../../context/WeddingContext';
import { formatCurrency } from '../../utils/formatUtils';

/**
 * Componente de formulario para crear o editar un proveedor.
 * Incluye validación de campos, previsualización de imágenes y manejo de estados.
 *
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onSubmit - Función para enviar el formulario con los datos del proveedor
 * @param {Function} props.onCancel - Función para cancelar y cerrar el formulario
 * @param {import('../../hooks/useProveedores').Provider} [props.initialData] - Datos iniciales para edición (opcional)
 * @returns {React.ReactElement}
 */
const ProveedorForm = ({ onSubmit, onCancel, initialData }) => {
  const { t } = useTranslations();
  const { activeWeddingData } = useWedding();
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    contact: '',
    phone: '',
    email: '',
    link: '',
    location: '',
    date: '',
    assignedBudget: '',
    priceRange: '',
    status: t('status.pending'),
    snippet: '',
    image: '',
    paymentSchedule: [],
  });

  const [errors, setErrors] = useState({});
  const [showPaymentScheduleEditor, setShowPaymentScheduleEditor] = useState(false);

  // Cargar datos iniciales si existen (modo edición)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const isEditing = Boolean(initialData?.id);

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.name.trim()) newErrors.name = t('validation.nameRequired');
    if (!formData.service.trim()) newErrors.service = t('validation.serviceRequired');
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('validation.emailInvalid');
    if (formData.link && !formData.link.startsWith('http'))
      newErrors.link = t('validation.linkMustStartHttp');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const parsedAssignedBudget = formData.assignedBudget
      ? parseFloat(String(formData.assignedBudget).replace(/[^0-9.,-]/g, '').replace(',', '.'))
      : null;

    onSubmit({
      ...formData,
      assignedBudget: Number.isFinite(parsedAssignedBudget) ? parsedAssignedBudget : null,
      paymentSchedule: formData.paymentSchedule || [],
    });
  };

  const handleSavePaymentSchedule = (schedule) => {
    setFormData(prev => ({ ...prev, paymentSchedule: schedule }));
    setShowPaymentScheduleEditor(false);
  };

  const totalScheduled = formData.paymentSchedule?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0) || 0;

  const serviceOptions = SUPPLIER_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    nameEn: cat.nameEn,
  }));

  // Lista de estados disponibles
  const statusOptions = [
    t('status.pending'),
    t('status.contacted'),
    t('status.selected'),
    t('status.confirmed'),
    t('status.rejected')
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
      </div>

      {/* Formulario con scroll */}
      <div className="overflow-y-auto p-4 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <h3 className="text-lg font-medium mb-4">Información básica</h3>

            {/* Nombre y Servicio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="Nombre del proveedor"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="service" className="block mb-1 text-sm font-medium">
                  Servicio *
                </label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.service ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                >
                  <option value="">Seleccionar servicio</option>
                  {serviceOptions.map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {errors.service && <p className="text-red-500 text-sm mt-1">{errors.service}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Este servicio se vinculará automáticamente con tu presupuesto
                </p>
              </div>
            </div>

            {/* Estado y Rango de precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="status" className="block mb-1 text-sm font-medium">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priceRange" className="block mb-1 text-sm font-medium">
                  Rango de precios
                </label>
                <input
                  type="text"
                  id="priceRange"
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ej: 1000 € - 2000 €"
                />
              </div>
            </div>

            {/* Presupuesto asignado */}
            <div className="mb-4">
              <label htmlFor="assignedBudget" className="block mb-1 text-sm font-medium">
                Presupuesto asignado
              </label>
              <input
                type="text"
                id="assignedBudget"
                name="assignedBudget"
                value={formData.assignedBudget}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ej: 2000"
              />
            </div>

            {/* Plan de pagos */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Plan de pagos
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentScheduleEditor(true)}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {formData.paymentSchedule?.length > 0 ? 'Editar plan' : 'Definir plan'}
                </Button>
              </div>
              {formData.paymentSchedule?.length > 0 ? (
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">{formData.paymentSchedule.length}</span> cuotas programadas
                  </p>
                  <p className="text-xs text-gray-600">
                    Total: {formatCurrency(totalScheduled)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  💡 Define cómo y cuándo debes pagar a este proveedor. Recibirás alertas en Finanzas.
                </p>
              )}
            </div>

            {/* Fecha */}
            <div className="mb-4">
              <label htmlFor="date" className="block mb-1 text-sm font-medium">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label htmlFor="snippet" className="block mb-1 text-sm font-medium">
                Descripción
              </label>
              <textarea
                id="snippet"
                name="snippet"
                value={formData.snippet}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Descripción breve del proveedor"
              />
            </div>

            {/* URL de imagen */}
            <div className="mb-4">
              <label htmlFor="image" className="block mb-1 text-sm font-medium">
                URL de la imagen
              </label>
              <input
                type="text"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-medium mb-4">Información de contacto</h3>

            {/* Nombre de contacto */}
            <div className="mb-4">
              <label htmlFor="contact" className="block mb-1 text-sm font-medium">
                Persona de contacto
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Nombre del contacto"
              />
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="email" className="block mb-1 text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block mb-1 text-sm font-medium">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            {/* Enlace web */}
            <div className="mb-4">
              <label htmlFor="link" className="block mb-1 text-sm font-medium">
                Sitio web
              </label>
              <input
                type="text"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.link ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                placeholder="https://www.ejemplo.com"
              />
              {errors.link && <p className="text-red-500 text-sm mt-1">{errors.link}</p>}
            </div>

            {/* Ubicación */}
            <div className="mb-4">
              <label htmlFor="location" className="block mb-1 text-sm font-medium">
                Ubicación
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ciudad, Provincia"
              />
            </div>
          </Card>
        </form>
      </div>

      {/* Footer con botones */}
      <div className="border-t p-4 bg-gray-50 flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {initialData ? 'Guardar cambios' : 'Crear proveedor'}
        </Button>
      </div>

      {/* Payment Schedule Editor Modal */}
      {showPaymentScheduleEditor && (
        <PaymentScheduleEditor
          totalAmount={parseFloat(formData.assignedBudget) || 0}
          schedule={formData.paymentSchedule || []}
          weddingDate={activeWeddingData?.weddingDate || activeWeddingData?.date}
          onSave={handleSavePaymentSchedule}
          onCancel={() => setShowPaymentScheduleEditor(false)}
        />
      )}
    </div>
  );
};

export default ProveedorForm;
