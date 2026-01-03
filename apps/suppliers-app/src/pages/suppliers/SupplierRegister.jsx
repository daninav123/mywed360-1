// pages/suppliers/SupplierRegister.jsx
// Registro de nuevos proveedores

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useTranslations from '../../hooks/useTranslations';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function SupplierRegister() {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    category: 'fotografia',
    location: '',
    phone: '',
    website: '',
    description: ''
  });
  
  const categories = useMemo(
    () => [
      { value: 'fotografia', label: t('suppliers.register.categories.photography') },
      { value: 'video', label: t('suppliers.register.categories.video') },
      { value: 'catering', label: t('suppliers.register.categories.catering') },
      { value: 'flores', label: t('suppliers.register.categories.flowers') },
      { value: 'musica', label: t('suppliers.register.categories.music') },
      { value: 'peluqueria', label: t('suppliers.register.categories.beauty') },
      { value: 'invitaciones', label: t('suppliers.register.categories.stationery') },
      { value: 'vestidos', label: t('suppliers.register.categories.attire') },
      { value: 'joyeria', label: t('suppliers.register.categories.jewelry') },
      { value: 'transporte', label: t('suppliers.register.categories.transport') },
      { value: 'alojamiento', label: t('suppliers.register.categories.accommodation') },
      { value: 'otros', label: t('suppliers.register.categories.other') }
    ],
    [t]
  );
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError(t('suppliers.register.errors.passwordMismatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t('suppliers.register.errors.passwordLength'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Llamar API de registro
      const response = await fetch('/api/suppliers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          category: formData.category,
          location: formData.location,
          phone: formData.phone,
          website: formData.website,
          description: formData.description
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || t('suppliers.register.errors.server'));
      }
      
      // Login automático con custom token
      await signInWithCustomToken(auth, data.customToken);
      
      // Mostrar mensaje
      toast.success(
        data.isClaimedProfile
          ? t('suppliers.register.toasts.claimedSuccess')
          : t('suppliers.register.toasts.registerSuccess')
      );
      
      // Redirigir al dashboard
      navigate(`/supplier/dashboard/${data.supplierId}`);
      
    } catch (err) {
      // console.error('Error en registro:', err);
      setError(err.message || t('suppliers.register.errors.generic'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold " style={{ color: 'var(--color-text)' }}>
            {t('suppliers.register.title')}
          </h1>
          <p className="mt-2 " style={{ color: 'var(--color-text-secondary)' }}>
            {t('suppliers.register.subtitle')}
          </p>
        </div>
        
        {/* Formulario */}
        <div className=" shadow-md rounded-lg p-8" style={{ backgroundColor: 'var(--color-surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.register.form.email.label')}
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                placeholder={t('suppliers.register.form.email.placeholder')}
              />
            </div>
            
            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.password.label')}
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('suppliers.register.form.password.placeholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.confirmPassword.label')}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('supplier.register.confirmPasswordPlaceholder')}
                />
              </div>
            </div>
            
            {/* Nombre del negocio */}
            <div>
              <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.register.form.name.label')}
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                placeholder={t('suppliers.register.form.name.placeholder')}
              />
            </div>
            
            {/* Categoría y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.category.label')}
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.location.label')}
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('suppliers.register.form.location.placeholder')}
                />
              </div>
            </div>
            
            {/* Teléfono y Web */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.phone.label')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('suppliers.register.form.phone.placeholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                  {t('suppliers.register.form.website.label')}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('suppliers.register.form.website.placeholder')}
                />
              </div>
            </div>
            
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium  mb-2" style={{ color: 'var(--color-text)' }}>
                {t('suppliers.register.form.description.label')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border  rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" style={{ borderColor: 'var(--color-border)' }}
                placeholder={t('suppliers.register.form.description.placeholder')}
              />
            </div>
            
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full  text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading
                ? t('suppliers.register.buttons.submitting')
                : t('suppliers.register.buttons.submit')}
            </button>
            
            {/* Login link */}
            <div className="text-center text-sm " style={{ color: 'var(--color-text-secondary)' }}>
              {t('suppliers.register.login.question')}{' '}
              <button
                type="button"
                onClick={() => navigate('/supplier/login')}
                className=" hover:underline font-medium" style={{ color: 'var(--color-primary)' }}
              >
                {t('suppliers.register.login.link')}
              </button>
            </div>
          </form>
        </div>
        
        {/* Beneficios */}
        <div className="mt-8  shadow-md rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-lg font-semibold  mb-4" style={{ color: 'var(--color-text)' }}>
            {t('suppliers.register.benefits.title')}
          </h2>
          <ul className="space-y-2 " style={{ color: 'var(--color-text-secondary)' }}>
            {t('suppliers.register.benefits.items', { returnObjects: true }).map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
