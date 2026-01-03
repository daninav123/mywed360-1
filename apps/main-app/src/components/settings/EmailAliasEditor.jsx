import { useState, useEffect } from 'react';
import { Mail, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';

export default function EmailAliasEditor() {
  const [currentAlias, setCurrentAlias] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [checkTimeout, setCheckTimeout] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [mailCount, setMailCount] = useState(0);

  useEffect(() => {
    // Esperar a que el token esté disponible
    const token = localStorage.getItem('authToken');
    if (token) {
      loadCurrentAlias();
    }
  }, []);

  const loadCurrentAlias = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/user/email-alias`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('[EmailAliasEditor] Response data:', responseData);
        // El backend usa sendSuccess que envuelve en { success: true, data: {...} }
        const data = responseData.data || responseData;
        const alias = data.myWed360Email ? data.myWed360Email.split('@')[0] : '';
        console.log('[EmailAliasEditor] Alias extracted:', alias);
        setCurrentAlias(alias);
        setNewAlias(alias);
        setCanEdit(data.canEdit ?? true);
        setMailCount(data.mailCount ?? 0);
      }
    } catch (error) {
      console.error('Error cargando alias:', error);
    }
  };

  const checkAvailability = async (alias) => {
    if (!alias || alias === currentAlias) {
      setAvailability(null);
      return;
    }

    setIsChecking(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/user/email-alias/check`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ alias }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability({
          available: data.available,
          cleanAlias: data.alias,
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAliasChange = (value) => {
    setNewAlias(value);
    
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    const timeout = setTimeout(() => {
      checkAvailability(value);
    }, 500);
    
    setCheckTimeout(timeout);
  };

  const handleSave = async () => {
    if (!newAlias || newAlias === currentAlias) {
      toast.error('Por favor, ingresa un alias diferente');
      return;
    }

    if (availability && !availability.available) {
      toast.error('Este alias no está disponible');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/user/email-alias`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ newAlias }),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedAlias = data.myWed360Email?.split('@')[0] || newAlias;
        setCurrentAlias(updatedAlias);
        setNewAlias(updatedAlias);
        setIsEditing(false);
        setAvailability(null);
        toast.success('Alias de email actualizado correctamente');
      } else {
        const errorMsg = data.error?.details?.[0]?.message || data.error?.message || 'Error actualizando alias';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error actualizando alias:', error);
      toast.error('Error actualizando alias de email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewAlias(currentAlias);
    setIsEditing(false);
    setAvailability(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <Mail className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Email de la plataforma
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Este es tu email único dentro de MyWed360 para recibir y enviar mensajes a proveedores.
      </p>

      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
            <Mail className="w-5 h-5 text-purple-600" />
            <span className="font-mono text-purple-900">
              {currentAlias}@planivia.net
            </span>
          </div>
          
          {canEdit ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Editar alias (solo se puede cambiar una vez)
              </button>
              <p className="text-xs text-gray-500">
                Puedes personalizarlo antes de enviar o recibir tu primer email
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">
                Tu alias ya no se puede modificar porque has usado el sistema de correo ({mailCount} email{mailCount !== 1 ? 's' : ''})
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAlias}
                onChange={(e) => handleAliasChange(e.target.value)}
                placeholder="tu-nombre"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                disabled={isLoading}
              />
              <span className="text-gray-600 font-mono">@planivia.net</span>
            </div>
            
            {isChecking && (
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando disponibilidad...
              </div>
            )}

            {availability && !isChecking && (
              <div className={`flex items-center gap-2 mt-2 text-sm ${
                availability.available ? 'text-green-600' : 'text-red-600'
              }`}>
                {availability.available ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      <strong>{availability.cleanAlias}@planivia.net</strong> está disponible
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>{availability.message}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Los emails anteriores seguirán asociados a tu cuenta. 
              El nuevo alias se usará para futuros mensajes.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isLoading || !availability?.available}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
