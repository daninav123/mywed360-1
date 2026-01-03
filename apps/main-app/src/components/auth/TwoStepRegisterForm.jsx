import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import useTranslations from '../../hooks/useTranslations';
import PasswordStrengthMeter from './PasswordStrengthMeter';

/**
 * Formulario de registro en 2 pasos adaptativo según rol
 * - Paso 1: Datos básicos (todos los roles)
 * - Paso 2: Información específica según rol seleccionado
 */
export default function TwoStepRegisterForm({
  onSubmit,
  isSubmitting,
  error,
  errorId = 'register-form-error',
}) {
  const { t } = useTranslations();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1 - Datos básicos
    email: '',
    password: '',
    fullName: '',
    role: 'particular',
    
    // Paso 2 - Particular
    partnerName: '',
    weddingDate: '',
    phone: '',
    weddingCity: '',
    
    // Paso 2 - Planner
    companyName: '',
    professionalPhone: '',
    operatingCities: '',
    yearsExperience: '',
    
    // Paso 2 - Asistente
    assistantPhone: '',
    invitationCode: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    
    // Validaciones paso 1
    if (!formData.email || !formData.password || !formData.fullName) {
      return;
    }
    
    if (formData.password.length < 8) {
      return;
    }

    // Si es proveedor, redirigir a su registro específico
    if (formData.role === 'supplier') {
      window.location.href = '/supplier/register';
      return;
    }

    // Continuar a paso 2
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleBack = () => {
    setStep(1);
  };

  const hasError = Boolean(error);

  // PASO 1: Datos básicos
  if (step === 1) {
    return (
      <form onSubmit={handleStep1Submit} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-[color:var(--color-text)]">
            {t('authSignup.emailLabel')}
          </label>
          <input
            id="signup-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t('authSignup.emailPlaceholder')}
            value={formData.email}
            onChange={handleChange}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-[color:var(--color-text)]">
            {t('authSignup.passwordLabel')}
          </label>
          <input
            id="signup-password"
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={t('authSignup.passwordPlaceholder')}
            value={formData.password}
            onChange={handleChange}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
          <PasswordStrengthMeter password={formData.password} />
        </div>

        {/* Nombre completo */}
        <div className="space-y-2">
          <label htmlFor="signup-fullname" className="text-sm font-medium text-[color:var(--color-text)]">
            {t('authSignup.fullNameLabel', { defaultValue: 'Nombre completo' })}
          </label>
          <input
            id="signup-fullname"
            type="text"
            name="fullName"
            required
            autoComplete="name"
            placeholder={t('authSignup.fullNamePlaceholder', { defaultValue: 'Ej: María García' })}
            value={formData.fullName}
            onChange={handleChange}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          />
        </div>

        {/* Selector de rol */}
        <div className="space-y-2">
          <label htmlFor="signup-role" className="text-sm font-medium text-[color:var(--color-text)]">
            {t('authSignup.roleLabel')}
          </label>
          <select
            id="signup-role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
          >
            <option value="particular">👰 {t('authSignup.roleOptions.particular')}</option>
            <option value="planner">📋 {t('authSignup.roleOptions.planner')}</option>
            <option value="assistant">🤝 {t('authSignup.roleOptions.assistant')}</option>
            <option value="supplier">🏢 {t('authSignup.roleOptions.supplier', { defaultValue: 'Proveedor' })}</option>
          </select>
          {formData.role === 'supplier' && (
            <p className="text-xs mt-1.5 p-2 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-soft)' }}>
              ℹ️ {t('authSignup.supplierRedirectNote', { defaultValue: 'Serás redirigido al formulario específico para proveedores' })}
            </p>
          )}
        </div>

        {error ? (
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-danger-10)', borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
            <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-danger)' }} />
            <p id={errorId} role="alert" aria-live="assertive" className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)'
          }}
        >
          {t('authSignup.continueButton', { defaultValue: 'Continuar' })}
        </button>
      </form>
    );
  }

  // PASO 2: Información específica según rol
  return (
    <form onSubmit={handleStep2Submit} className="space-y-5" noValidate>
      {/* Indicador de paso */}
      <div className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
        <button 
          type="button" 
          onClick={handleBack} 
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-primary)' }}
        >
          ← {t('common.back', { defaultValue: 'Volver' })}
        </button>
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {t('authSignup.step2Of2', { defaultValue: 'Paso 2 de 2' })}
        </span>
      </div>

      {/* PARTICULAR: Info de la boda */}
      {formData.role === 'particular' && (
        <>
          <div className="rounded-xl p-4 border" style={{ 
            backgroundColor: 'var(--color-primary-10)',
            borderColor: 'var(--color-primary)'
          }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              👰 {t('authSignup.step2.particular.title', { defaultValue: 'Información de tu boda' })}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {t('authSignup.step2.particular.description', { 
                defaultValue: 'Estos datos nos ayudarán a personalizar tu experiencia' 
              })}
            </p>
          </div>

          {/* Nombre de pareja */}
          <div className="space-y-2">
            <label htmlFor="signup-partnername" className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {t('authSignup.step2.particular.partnerNameLabel', { defaultValue: 'Nombre de tu pareja / prometido(a)' })}
              <span className="ml-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-partnername"
              type="text"
              name="partnerName"
              placeholder={t('authSignup.step2.particular.partnerNamePlaceholder', { defaultValue: 'Ej: Carlos Martínez' })}
              value={formData.partnerName}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Fecha de boda */}
          <div className="space-y-2">
            <label htmlFor="signup-weddingdate" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.particular.weddingDateLabel', { defaultValue: 'Fecha aproximada de la boda' })}
              <span className="text-[color:var(--color-muted)] ml-1">({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-weddingdate"
              type="date"
              name="weddingDate"
              value={formData.weddingDate}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Ciudad de la boda */}
          <div className="space-y-2">
            <label htmlFor="signup-weddingcity" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.particular.weddingCityLabel', { defaultValue: 'Ciudad de la boda' })}
              <span className="text-[color:var(--color-muted)] ml-1">({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-weddingcity"
              type="text"
              name="weddingCity"
              placeholder={t('authSignup.step2.particular.weddingCityPlaceholder', { defaultValue: 'Ej: Madrid' })}
              value={formData.weddingCity}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label htmlFor="signup-phone" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.particular.phoneLabel', { defaultValue: 'Teléfono' })}
              <span className="text-[color:var(--color-muted)] ml-1">({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-phone"
              type="tel"
              name="phone"
              placeholder="+34 600 000 000"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>
        </>
      )}

      {/* PLANNER: Info profesional */}
      {formData.role === 'planner' && (
        <>
          <div className="rounded-xl p-4 border" style={{ 
            backgroundColor: 'var(--color-lavender-10)',
            borderColor: 'var(--color-lavender)'
          }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              📋 {t('authSignup.step2.planner.title', { defaultValue: 'Información profesional' })}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {t('authSignup.step2.planner.description', { 
                defaultValue: 'Completa tu perfil profesional' 
              })}
            </p>
          </div>

          {/* Nombre de empresa */}
          <div className="space-y-2">
            <label htmlFor="signup-companyname" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.planner.companyNameLabel', { defaultValue: 'Nombre de tu empresa/marca' })}
            </label>
            <input
              id="signup-companyname"
              type="text"
              name="companyName"
              required
              placeholder={t('authSignup.step2.planner.companyNamePlaceholder', { defaultValue: 'Ej: Bodas Elegantes' })}
              value={formData.companyName}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Teléfono profesional */}
          <div className="space-y-2">
            <label htmlFor="signup-profphone" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.planner.phoneLabel', { defaultValue: 'Teléfono profesional' })}
            </label>
            <input
              id="signup-profphone"
              type="tel"
              name="professionalPhone"
              required
              placeholder="+34 600 000 000"
              value={formData.professionalPhone}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Ciudades donde opera */}
          <div className="space-y-2">
            <label htmlFor="signup-cities" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.planner.citiesLabel', { defaultValue: 'Ciudad(es) donde operas' })}
            </label>
            <input
              id="signup-cities"
              type="text"
              name="operatingCities"
              placeholder={t('authSignup.step2.planner.citiesPlaceholder', { defaultValue: 'Ej: Madrid, Barcelona' })}
              value={formData.operatingCities}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Años de experiencia */}
          <div className="space-y-2">
            <label htmlFor="signup-experience" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.planner.experienceLabel', { defaultValue: 'Años de experiencia' })}
              <span className="text-[color:var(--color-muted)] ml-1">({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-experience"
              type="number"
              name="yearsExperience"
              min="0"
              placeholder="5"
              value={formData.yearsExperience}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>
        </>
      )}

      {/* ASISTENTE: Info de acceso */}
      {formData.role === 'assistant' && (
        <>
          <div className="rounded-xl p-4 border" style={{ 
            backgroundColor: 'var(--color-sage-10)',
            borderColor: 'var(--color-sage)'
          }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              🤝 {t('authSignup.step2.assistant.title', { defaultValue: 'Información de contacto' })}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {t('authSignup.step2.assistant.description', { 
                defaultValue: 'Información para colaborar en bodas' 
              })}
            </p>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label htmlFor="signup-assistphone" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.assistant.phoneLabel', { defaultValue: 'Teléfono' })}
            </label>
            <input
              id="signup-assistphone"
              type="tel"
              name="assistantPhone"
              placeholder="+34 600 000 000"
              value={formData.assistantPhone}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
          </div>

          {/* Código de invitación */}
          <div className="space-y-2">
            <label htmlFor="signup-invcode" className="text-sm font-medium text-[color:var(--color-text)]">
              {t('authSignup.step2.assistant.invCodeLabel', { defaultValue: 'Código de invitación' })}
              <span className="text-[color:var(--color-muted)] ml-1">({t('common.optional', { defaultValue: 'opcional' })})</span>
            </label>
            <input
              id="signup-invcode"
              type="text"
              name="invitationCode"
              placeholder="ABC-123-XYZ"
              value={formData.invitationCode}
              onChange={handleChange}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)'
            }}
            />
            <p className="text-xs p-2 rounded" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-soft)' }}>
              💡 {t('authSignup.step2.assistant.invCodeHelp', { 
                defaultValue: 'Si tienes un código de invitación de una pareja, introdúcelo aquí' 
              })}
            </p>
          </div>
        </>
      )}

      {error ? (
        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-danger-10)', borderColor: 'var(--color-danger)', borderWidth: '1px' }}>
          <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-danger)' }} />
          <p id={errorId} role="alert" aria-live="assertive" className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-primary)'
        }}
      >
        {isSubmitting ? t('authSignup.submitting') : t('authSignup.submit')}
      </button>
    </form>
  );
}
