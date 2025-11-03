import React, { useState, useCallback, useEffect } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { Button } from '../ui';
import { Input } from '../ui';

/**
 * Formulario optimizado para a�adir/editar invitados
 * Componente reutilizable con validaci�n y UX mejorada
 */
const GuestForm = ({ guest = null, onSave, onCancel, isLoading = false }) => {
  const { t, wedding } = useTranslations();

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    address: guest?.address || '',
    // Campos de direcci�n detallada (opcionales)
    addressStreet: guest?.addressStreet || '',
    addressStreet2: guest?.addressStreet2 || '',
    addressCity: guest?.addressCity || '',
    addressState: guest?.addressState || '',
    addressZip: guest?.addressZip || '',
    addressCountry: guest?.addressCountry || '',
    group: guest?.group || guest?.table || '',
    companion: guest?.companion || 0,
    companionType: guest?.companionType || 'none',
    table: guest?.table || '',
    companionGroupId: guest?.companionGroupId || '',
    response: guest?.response || t('status.pending'),
    status: guest?.status || 'pending',
    dietaryRestrictions: guest?.dietaryRestrictions || '',
    notes: guest?.notes || '',
  });

  // Estado de validaci�n
  const [errors, setErrors] = useState({});

  // Direcci�n completa (desplegable) y helper para componer
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const composeAddress = (fd) => {
    const parts = [];
    const line1 = [fd.addressStreet, fd.addressStreet2].filter(Boolean).join(', ').trim();
    if (line1) parts.push(line1);
    const cityLine = [fd.addressZip, fd.addressCity].filter(Boolean).join(' ').trim();
    const stateLine = [fd.addressState, fd.addressCountry].filter(Boolean).join(', ').trim();
    if (cityLine) parts.push(cityLine);
    if (stateLine) parts.push(stateLine);
    return parts.join(' � ');
  };

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('forms.fieldRequired');
    }

    if (formData.phone && !/^\+[1-9]\d{7,14}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = t('forms.invalidPhone');
    }

    if (formData.companion < 0) {
      newErrors.companion = t('validation.companionNegative');
    }

    if (formData.companion > 0 && formData.companionType === 'none') {
      newErrors.companionType = t('validation.selectCompanionType');
    }
    if (formData.companion === 0 && formData.companionType !== 'none') {
      newErrors.companionType = t('validation.companionMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Manejar cambios en el formulario
  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        // Si se editan campos de direcci�n detallada, recomponer 'address'
        if (
          field === 'addressStreet' ||
          field === 'addressStreet2' ||
          field === 'addressCity' ||
          field === 'addressState' ||
          field === 'addressZip' ||
          field === 'addressCountry'
        ) {
          next.address = composeAddress(next);
        }
        if (field === 'table') {
          next.group = value;
        }
        return next;
      });

      // Limpiar error del campo cuando el usuario empiece a escribir
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  // Manejar env�o del formulario
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      // Preparar datos para guardar
      const guestData = {
        ...formData,
        companion: parseInt(formData.companion, 10) || 0,
        id: guest?.id || `guest-${Date.now()}`,
        createdAt: guest?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Si hay direcci�n detallada y el resumen est� vac�o, componerlo
      const hasDetailed =
        formData.addressStreet ||
        formData.addressStreet2 ||
        formData.addressCity ||
        formData.addressState ||
        formData.addressZip ||
        formData.addressCountry;
      if (hasDetailed && !guestData.address) {
        guestData.address = composeAddress(formData);
      }

      onSave(guestData);
    },
    [formData, validateForm, onSave, guest]
  );

  // Opciones de estado RSVP
  const rsvpOptions = [
    { value: 'pending', label: wedding.guestStatus('pending') },
    { value: 'confirmed', label: wedding.guestStatus('confirmed') },
    { value: 'declined', label: wedding.guestStatus('declined') },
  ];

  // Autosave cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && validateForm()) {
        const guestData = {
          ...formData,
          companion: parseInt(formData.companion, 10) || 0,
          companionType: formData.companionType,
          id: guest?.id || `guest-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
        onSave(guestData, { autosave: true });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, isLoading, validateForm, onSave, guest]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informaci�n b�sica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.guestName')} *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Nombre completo del invitado"
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.guestPhone')}
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+34 123 456 789"
            className={errors.phone ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.guestStatus')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary"
            disabled={isLoading}
          >
            {rsvpOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Direcci�n */}
      <div>
        <label className="block text-sm font-medium text-body mb-1">
          {t('guests.guestAddress')}
        </label>
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Direcci�n completa (opcional)"
          disabled={isLoading}
        />
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setShowAddressDetails((v) => !v)}
            disabled={isLoading}
          >
            {showAddressDetails ? 'Ocultar direcci�n completa' : 'A�adir direcci�n completa'}
          </button>
          {showAddressDetails && (
            <div className="mt-3 p-3 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Calle y n�mero</label>
                  <Input
                    type="text"
                    value={formData.addressStreet}
                    onChange={(e) => handleChange('addressStreet', e.target.value)}
                    placeholder="Ej. Calle Luna 23"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Piso, puerta, etc.</label>
                  <Input
                    type="text"
                    value={formData.addressStreet2}
                    onChange={(e) => handleChange('addressStreet2', e.target.value)}
                    placeholder="Ej. 3�B"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Ciudad</label>
                  <Input
                    type="text"
                    value={formData.addressCity}
                    onChange={(e) => handleChange('addressCity', e.target.value)}
                    placeholder="Ej. Madrid"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Provincia/Estado</label>
                  <Input
                    type="text"
                    value={formData.addressState}
                    onChange={(e) => handleChange('addressState', e.target.value)}
                    placeholder="Ej. Madrid"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">C�digo Postal</label>
                  <Input
                    type="text"
                    value={formData.addressZip}
                    onChange={(e) => handleChange('addressZip', e.target.value)}
                    placeholder="Ej. 28001"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Pa�s</label>
                  <Input
                    type="text"
                    value={formData.addressCountry}
                    onChange={(e) => handleChange('addressCountry', e.target.value)}
                    placeholder="Ej. Espa�a"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted mt-2">
                El campo "Direcci�n" se compone autom�ticamente a partir de estos datos.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Acompa�antes y mesa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.plusOne')}
          </label>
          <Input
            type="number"
            min="0"
            max="10"
            value={formData.companion}
            onChange={(e) => handleChange('companion', e.target.value)}
            placeholder="0"
            className={errors.companion ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.companion && <p className="text-red-500 text-xs mt-1">{errors.companion}</p>}
        </div>

        {/* Grupo de acompa�antes */}
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            Grupo de acompa�antes
          </label>
          <div className="flex space-x-2">
            <Input
              value={formData.companionGroupId}
              onChange={(e) => handleChange('companionGroupId', e.target.value)}
              placeholder="group-12345"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => handleChange('companionGroupId', `group-${Date.now()}`)}
            >
              Generar
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-body mb-1">
            Tipo de acompa�ante
          </label>
          <select
            value={formData.companionType}
            onChange={(e) => handleChange('companionType', e.target.value)}
            className={`w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary ${errors.companionType ? 'border-red-500' : ''}`}
            disabled={isLoading}
          >
            <option value="none">Sin acompa�ante</option>
            <option value="partner">Pareja</option>
            <option value="child">Hijo/a(s)</option>
            <option value="plus_one">+1</option>
          </select>
          {errors.companionType && (
            <p className="text-red-500 text-xs mt-1">{errors.companionType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.guestTable')}
          </label>
          <Input
            type="text"
            value={formData.table}
            onChange={(e) => handleChange('table', e.target.value)}
            placeholder="N�mero o nombre de mesa"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Restricciones diet�ticas */}
      <div>
        <label className="block text-sm font-medium text-body mb-1">
          {t('guests.dietaryRestrictions')}
        </label>
        <textarea
          value={formData.dietaryRestrictions}
          onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
          placeholder="Alergias, intolerancias o preferencias alimentarias..."
          className="w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary resize-none"
          rows="2"
          disabled={isLoading}
        />
      </div>

      {/* Notas adicionales */}
      <div>
        <label className="block text-sm font-medium text-body mb-1">Notas adicionales</label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Informaci�n adicional sobre el invitado..."
          className="w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary resize-none"
          rows="2"
          disabled={isLoading}
        />
      </div>

      {/* Botones de acci�n */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('app.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[100px]">
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </div>
          ) : (
            t('app.save')
          )}
        </Button>
      </div>
    </form>
  );
};

export default GuestForm;

