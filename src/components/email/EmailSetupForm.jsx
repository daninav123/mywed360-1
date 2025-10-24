import { Check, AlertCircle, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import Button from '../ui/Button';

const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{2,29}$/i;

/**
 * Formulario para seleccionar el alias @mywed360.
 * Realiza validaciones de formato y consulta disponibilidad en tiempo real.
 */
const EmailSetupForm = ({
  onSave,
  onCheckAvailability,
  defaultUsername = '',
  userId, // mantenido por compatibilidad con props existentes
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [availabilityStatus, setAvailabilityStatus] = useState('idle'); // idle | checking | available | unavailable
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const lastCheckIdRef = useRef(0);

  const performAvailabilityCheck = async (value) => {
    const trimmed = value.trim();

    if (!trimmed) {
      setAvailabilityStatus('idle');
      setError('');
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      setAvailabilityStatus('unavailable');
      setError(
        'El nombre solo puede contener letras, n�meros, puntos, guiones y guiones bajos. M�nimo 3 caracteres.'
      );
      return;
    }

    const checkId = Date.now();
    lastCheckIdRef.current = checkId;
    setAvailabilityStatus('checking');
    setError('');

    try {
      let isAvailable = true;
      if (typeof onCheckAvailability === 'function') {
        isAvailable = await onCheckAvailability(trimmed);
      }

      if (lastCheckIdRef.current !== checkId) return;

      if (isAvailable) {
        setAvailabilityStatus('available');
        setError('');
      } else {
        setAvailabilityStatus('unavailable');
        setError(`El nombre "${trimmed}" ya est� en uso. Por favor elige otro.`);
      }
    } catch (err) {
      console.error('Error al comprobar disponibilidad:', err);
      if (lastCheckIdRef.current !== checkId) return;
      setAvailabilityStatus('unavailable');
      setError('No se pudo verificar la disponibilidad. Int�ntalo nuevamente.');
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      void performAvailabilityCheck(username);
    }, 400);
    return () => clearTimeout(handle);
  }, [username]);

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed || availabilityStatus !== 'available') return;

    setIsSaving(true);
    setError('');
    try {
      if (typeof onSave === 'function') {
        const result = await onSave(trimmed);
        if (result === false) {
          setIsSaving(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error al guardar alias:', err);
      setError('Error al guardar. Int�ntalo de nuevo m�s tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Configura tu correo electr�nico myWed360
      </h2>

      <p className="text-gray-600 mb-5">
        Elige un nombre de usuario �nico para tu correo electr�nico myWed360. Este ser� tu correo
        oficial dentro de la plataforma.
      </p>

      <div className="mb-4">
        <label htmlFor="email-username" className="block text-sm font-medium text-gray-700 mb-1">
          Tu direcci�n de correo:
        </label>

        <div className="flex items-center">
          <input
            id="email-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`border px-3 py-2 rounded-l-md flex-1 focus:ring-2 focus:outline-none ${
              availabilityStatus === 'available'
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : availabilityStatus === 'unavailable'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder="tunombre"
            aria-label="Nombre de usuario para correo"
            disabled={isSaving}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="bg-gray-100 px-3 py-2 border-y border-r rounded-r-md text-gray-700 whitespace-nowrap">
            @mywed360
          </div>
        </div>

        <div className="mt-2 min-h-[24px]">
          {availabilityStatus === 'checking' && (
            <div className="flex items-center text-gray-500">
              <Loader2 size={16} className="animate-spin mr-2" />
              <span className="text-sm">Comprobando disponibilidad...</span>
            </div>
          )}

          {availabilityStatus === 'available' && username && (
            <div className="flex items-center text-green-600">
              <Check size={16} className="mr-2" />
              <span className="text-sm">�Nombre disponible!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center text-red-600">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={availabilityStatus !== 'available' || isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar direcci�n de correo'
          )}
        </Button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Notas:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>
            Tu direcci�n de correo ser� <strong>{username || 'tunombre'}@mywed360</strong>
          </li>
          <li>Podr�s enviar y recibir correos desde esta direcci�n</li>
          <li>Este correo se utilizar� para todas las comunicaciones con proveedores</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailSetupForm;

