import React, { useState, useCallback, useEffect } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { Button } from '../ui';
import { Input } from '../ui';

/**
 * Formulario optimizado para aÃ±adir/editar invitados
 * Componente reutilizable con validaciÃ³n y UX mejorada
 */
const GuestForm = ({ guest = null, onSave, onCancel, isLoading = false, groupOptions = [] }) => {
  const { t, wedding } = useTranslations();

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    address: guest?.address || '',
    // Campos de direcciÃ³n detallada (opcionales)
    addressStreet: guest?.addressStreet || '',
    addressStreet2: guest?.addressStreet2 || '',
    addressCity: guest?.addressCity || '',
    addressState: guest?.addressState || '',
    addressZip: guest?.addressZip || '',
    addressCountry: guest?.addressCountry || '',
    group: guest?.group || '',
    companion: guest?.companion || 0,
    companionType: guest?.companionType || 'none',
    table: guest?.table || '',
    companionGroupId: guest?.companionGroupId || '',
    response: guest?.response || 'Pendiente',
    status: guest?.status || 'pending',
    dietaryRestrictions: guest?.dietaryRestrictions || '',
    notes: guest?.notes || '',
  });

  // Estado de validaciÃ³n
  const [errors, setErrors] = useState({});

  // DirecciÃ³n completa (desplegable) y helper para componer
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const composeAddress = (fd) => {
    const parts = [];
    const line1 = [fd.addressStreet, fd.addressStreet2].filter(Boolean).join(', ').trim();
    if (line1) parts.push(line1);
    const cityLine = [fd.addressZip, fd.addressCity].filter(Boolean).join(' ').trim();
    const stateLine = [fd.addressState, fd.addressCountry].filter(Boolean).join(', ').trim();
    if (cityLine) parts.push(cityLine);
    if (stateLine) parts.push(stateLine);
    return parts.join(' Â· ');
  };

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('forms.fieldRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('forms.fieldRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('forms.invalidEmail');
    }

    if (formData.phone && !/^\+[1-9]\d{7,14}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = t('forms.invalidPhone');
    }

    if (formData.companion < 0) {
      newErrors.companion = 'El nÃºmero de acompaÃ±antes no puede ser negativo';
    }

    if (formData.companion > 0 && formData.companionType === 'none') {
      newErrors.companionType = 'Selecciona el tipo de acompaÃ±ante';
    }
    if (formData.companion === 0 && formData.companionType !== 'none') {
      newErrors.companionType = 'Establece "Sin acompaÃ±ante" o aÃ±ade alguno';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Manejar cambios en el formulario
  const handleChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        // Si se editan campos de direcciÃ³n detallada, recomponer 'address'
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

  // Manejar envÃ­o del formulario
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
      // Si hay direcciÃ³n detallada y el resumen estÃ¡ vacÃ­o, componerlo
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
      {/* InformaciÃ³n bÃ¡sica */}
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

        <div>
          <label className="block text-sm font-medium text-body mb-1">
            {t('guests.guestEmail')} *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            className={errors.email ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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

      {/* DirecciÃ³n */}
      <div>
        <label className="block text-sm font-medium text-body mb-1">
          {t('guests.guestAddress')}
        </label>
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="DirecciÃ³n completa (opcional)"
          disabled={isLoading}
        />
        <div className="mt-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setShowAddressDetails((v) => !v)}
            disabled={isLoading}
          >
            {showAddressDetails ? 'Ocultar direcciÃ³n completa' : 'AÃ±adir direcciÃ³n completa'}
          </button>
          {showAddressDetails && (
            <div className="mt-3 p-3 border rounded-md bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-body mb-1">Calle y nÃºmero</label>
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
                    placeholder="Ej. 3ÂºB"
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
                  <label className="block text-xs font-medium text-body mb-1">CÃ³digo Postal</label>
                  <Input
                    type="text"
                    value={formData.addressZip}
                    onChange={(e) => handleChange('addressZip', e.target.value)}
                    placeholder="Ej. 28001"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-body mb-1">PaÃ­s</label>
                  <Input
                    type="text"
                    value={formData.addressCountry}
                    onChange={(e) => handleChange('addressCountry', e.target.value)}
                    placeholder="Ej. EspaÃ±a"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted mt-2">
                El campo "DirecciÃ³n" se compone automÃ¡ticamente a partir de estos datos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grupo / CategorÃ­a */}
      <div>
        <label className="block text-sm font-medium text-body mb-1">Grupo / CategorÃ­a</label>
        <Input
          type="text"
          value={formData.group}
          onChange={(e) => handleChange('group', e.target.value)}
          list="guest-group-options"
          placeholder="Ej. Familia novia, Amigos, Trabajo"
          disabled={isLoading}
        />
        {Array.isArray(groupOptions) && groupOptions.length > 0 && (
          <datalist id="guest-group-options">
            {groupOptions.map((opt) => (
              <option key={String(opt)} value={String(opt)} />
            ))}
          </datalist>
        )}
        <p className="text-xs text-muted mt-1">Este campo permite filtrar y gestionar grupos.</p>
      </div>

      {/* AcompaÃ±antes y mesa */}
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

        {/* Grupo de acompaÃ±antes */}
        <div>
          <label className="block text-sm font-medium text-body mb-1">
            Grupo de acompaÃ±antes
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
            Tipo de acompaÃ±ante
          </label>
          <select
            value={formData.companionType}
            onChange={(e) => handleChange('companionType', e.target.value)}
            className={`w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary ${errors.companionType ? 'border-red-500' : ''}`}
            disabled={isLoading}
          >
            <option value="none">Sin acompaÃ±ante</option>
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
            placeholder="NÃºmero o nombre de mesa"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Restricciones dietÃ©ticas */}
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
          placeholder="InformaciÃ³n adicional sobre el invitado..."
          className="w-full border border-soft rounded-md px-3 py-2 focus:outline-none focus:ring-2 ring-primary resize-none"
          rows="2"
          disabled={isLoading}
        />
      </div>

      {/* Botones de acciÃ³n */}
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
