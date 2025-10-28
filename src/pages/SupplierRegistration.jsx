import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useTranslations from '../hooks/useTranslations';

/**
 * REGISTRO PÚBLICO DE PROVEEDORES
 * 
 * Esta página permite que CUALQUIER proveedor se registre sin necesidad de invitación
 * NO requiere autenticación ni token previo
 */
export default function SupplierRegistration() {
  const { t } = useTranslations();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    businessName: '',
    category: '',
    services: [],
    city: '',
    province: '',
    country: 'España',
    description: '',
    minPrice: '',
    maxPrice: '',
    currency: 'EUR',
    availability: 'available',
    acceptedTerms: false,
  });
  
  // Cargar categorías
  useEffect(() => {
    fetch('/api/supplier-registration/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(err => console.error('Error loading categories:', err));
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleServicesChange = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'El nombre es obligatorio (mínimo 2 caracteres)';
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }
    
    if (formData.services.length === 0) {
      newErrors.services = 'Selecciona al menos un servicio';
    }
    
    if (!formData.city) {
      newErrors.city = 'La ciudad es obligatoria';
    }
    
    if (!formData.province) {
      newErrors.province = 'La provincia es obligatoria';
    }
    
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }
    
    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'Debes aceptar los términos y condiciones';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/supplier-registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          businessName: formData.businessName || undefined,
          category: formData.category,
          services: formData.services,
          location: {
            city: formData.city,
            province: formData.province,
            country: formData.country,
          },
          description: formData.description,
          priceRange: formData.minPrice || formData.maxPrice ? {
            min: Number(formData.minPrice) || 0,
            max: Number(formData.maxPrice) || undefined,
            currency: formData.currency,
          } : undefined,
          availability: formData.availability,
          acceptedTerms: formData.acceptedTerms,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'email_exists') {
          setErrors({ email: 'Este email ya está registrado' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (data.details) {
          const fieldErrors = {};
          data.details.forEach(err => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          throw new Error(data.message || 'Error en el registro');
        }
        return;
      }
      
      setSuccess(true);
      setSuccessData(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white border rounded-xl p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-4">¡Registro exitoso!</h1>
          <p className="text-gray-600 mb-6">
            Hemos enviado un email a <strong>{formData.email}</strong> para verificar tu cuenta.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold mb-2">Próximos pasos:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {successData?.nextSteps?.map((step, index) => (
                <li key={index}>{step}</li>
              )) || (
                <>
                  <li>Verifica tu email y establece tu contraseña</li>
                  <li>Inicia sesión en tu dashboard</li>
                  <li>Completa tu perfil</li>
                  <li>Sube fotos de tu portfolio</li>
                  <li>Activa tu cuenta</li>
                </>
              )}
            </ol>
          </div>
          
          {/* Solo mostrar en desarrollo para testing */}
          {successData?.setupPasswordUrl && import.meta.env.DEV && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                🔧 MODO DESARROLLO - Link de prueba:
              </p>
              <a 
                href={successData.setupPasswordUrl}
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {successData.setupPasswordUrl}
              </a>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/supplier/login')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Ir al Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Regístrate como Proveedor
          </h1>
          <p className="text-lg text-gray-600">
            Únete a nuestra plataforma y conecta con parejas que buscan tus servicios
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Información básica */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Información básica</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Tu nombre o nombre del negocio"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="+34 600 000 000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sitio web
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="https://tuweb.com"
                  />
                </div>
              </div>
            </div>
            
            {/* Categoría y servicios */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Servicios</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Categoría principal *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 ${errors.category ? 'border-red-500' : ''}`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Servicios que ofreces * (selecciona al menos uno)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Básico', 'Premium', 'Personalizado', 'Paquete completo', 'Por horas', 'Asesoramiento'].map(service => (
                    <label key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service)}
                        onChange={() => handleServicesChange(service)}
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
                {errors.services && <p className="text-red-600 text-sm mt-1">{errors.services}</p>}
              </div>
            </div>
            
            {/* Ubicación */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Ubicación</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${errors.city ? 'border-red-500' : ''}`}
                    placeholder="Valencia"
                  />
                  {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${errors.province ? 'border-red-500' : ''}`}
                    placeholder="Valencia"
                  />
                  {errors.province && <p className="text-red-600 text-sm mt-1">{errors.province}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            {/* Descripción */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Descripción</h2>
              
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className={`w-full border rounded-md px-3 py-2 ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Describe tus servicios, experiencia y qué te hace único..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              <p className="text-sm text-gray-500 mt-1">{formData.description.length} caracteres</p>
            </div>
            
            {/* Precios */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Rango de precios (opcional)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Precio mínimo
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    value={formData.minPrice}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Precio máximo
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    value={formData.maxPrice}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="2000"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Moneda
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Términos */}
            <div className="border-t pt-6">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  className={`mt-1 ${errors.acceptedTerms ? 'border-red-500' : ''}`}
                />
                <span className="text-sm text-gray-700">
                  Acepto los <a href="/terminos" className="text-indigo-600 hover:underline">términos y condiciones</a> y la <a href="/privacidad" className="text-indigo-600 hover:underline">política de privacidad</a> *
                </span>
              </label>
              {errors.acceptedTerms && <p className="text-red-600 text-sm mt-1 ml-6">{errors.acceptedTerms}</p>}
            </div>
            
            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
