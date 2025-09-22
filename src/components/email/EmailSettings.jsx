import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import { createEmailAlias, initEmailService } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import TagsManager from './TagsManager';
import WeddingAccountLink from '../settings/WeddingAccountLink';
import { getAutomationConfig, updateAutomationConfig, getScheduledEmails as getScheduledQueue, cancelScheduledEmail } from '../../services/emailAutomationService';

/**
 * Componente para gestionar la configuración de correo electrónico del usuario
 * Permite personalizar su dirección de correo y gestionar preferencias
 */
const EmailSettings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailAlias, setEmailAlias] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplySubject, setAutoReplySubject] = useState('Re: [Asunto]');
  const [generalAutoReply, setGeneralAutoReply] = useState(`Hola [Nombre],

Hemos recibido tu mensaje y te responderemos en breve.

¡Gracias!`);
  const [providerAutoReply, setProviderAutoReply] = useState('');
  const [guestAutoReply, setGuestAutoReply] = useState('');
  const [financeAutoReply, setFinanceAutoReply] = useState('');
  const [contractAutoReply, setContractAutoReply] = useState('');
  const [invoiceAutoReply, setInvoiceAutoReply] = useState('');
  const [meetingAutoReply, setMeetingAutoReply] = useState('');
  const [rsvpAutoReply, setRsvpAutoReply] = useState('');
  const [autoReplyInterval, setAutoReplyInterval] = useState(24);
  const [autoReplyExclusions, setAutoReplyExclusions] = useState('');
  const [autoReplySaving, setAutoReplySaving] = useState(false);
  const [autoReplySuccess, setAutoReplySuccess] = useState(false);
  const [autoReplyError, setAutoReplyError] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);

  
  // Cargar datos del usuario
  useEffect(() => {
    if (userProfile) {
      // Inicializar el servicio de email y obtener la dirección actual
      const currentEmail = initEmailService(userProfile);
      setEmailAddress(currentEmail);
      setEmailAlias(userProfile.emailAlias || '');
    }
  }, [userProfile]);
  
  // Validar formato de alias
  const validateAlias = (alias) => {
    if (!alias) return false;
    if (alias.length < 3) return false;
    
    // Comprobar que solo contiene caracteres válidos (letras, números, puntos)
    const validAliasRegex = /^[a-z0-9.]+$/;
    return validAliasRegex.test(alias);
  };
  
  // Manejar cambio de alias
  const handleSaveAutoReply = (event) => {
    event.preventDefault();
    setAutoReplyError('');
    setAutoReplySaving(true);
    try {
      const ensureMessage = (value) => (value && value.trim() ? value : generalAutoReply);
      const exclusions = autoReplyExclusions
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      updateAutomationConfig({
        autoReply: {
          enabled: autoReplyEnabled,
          subjectTemplate: autoReplySubject || 'Re: [Asunto]',
          generalMessage: generalAutoReply,
          replyIntervalHours: Number(autoReplyInterval) || 24,
          excludeSenders: exclusions,
          categories: {
            Proveedor: { enabled: true, message: ensureMessage(providerAutoReply) },
            Invitado: { enabled: true, message: ensureMessage(guestAutoReply) },
            Finanzas: { enabled: true, message: ensureMessage(financeAutoReply) },
            Contratos: { enabled: true, message: ensureMessage(contractAutoReply) },
            Facturas: { enabled: true, message: ensureMessage(invoiceAutoReply) },
            Reuniones: { enabled: true, message: ensureMessage(meetingAutoReply) },
            RSVP: { enabled: true, message: ensureMessage(rsvpAutoReply) },
          },
        },
      });
      setAutoReplySuccess(true);
      setTimeout(() => setAutoReplySuccess(false), 2500);
    } catch (automationError) {
      setAutoReplyError(automationError?.message || 'No se pudo guardar la configuración.');
    } finally {
      setAutoReplySaving(false);
    }
  };

  const handleCancelScheduledEmail = (id) => {
    cancelScheduledEmail(id);
    setScheduledEmails(getScheduledQueue());
  };

  const handleChangeAlias = async (e) => {
    e.preventDefault();
    
    if (!validateAlias(newAlias)) {
      setError('El alias debe tener al menos 3 caracteres y solo puede contener letras, números y puntos.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Crear el nuevo alias
      const result = await createEmailAlias(userProfile, newAlias);
      
      if (result.success) {
        // Actualizar perfil de usuario con el nuevo alias
        const updatedProfile = {
          ...userProfile,
          emailAlias: result.alias
        };
        
        // Actualizar en backend/estado
        await updateUserProfile(updatedProfile);
        
        setEmailAddress(result.email);
        setEmailAlias(result.alias);
        setNewAlias('');
        setSuccess(true);
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error al cambiar alias de correo:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Configuración de Correo Electrónico</h2>
      
      <div className="space-y-6">
        {/* Dirección de correo actual */}
        <div>
          <h3 className="text-md font-medium mb-2">Tu dirección de correo</h3>
          <p className="text-gray-600 mb-1">Esta es tu dirección de correo electrónico actual en Lovenda:</p>
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="font-medium">{emailAddress}</p>
          </div>
        </div>
        
        {/* Cambiar alias */}
        <div>
          <h3 className="text-md font-medium mb-2">Personalizar dirección de correo</h3>
          <p className="text-gray-600 mb-3">
            Puedes personalizar la parte inicial de tu dirección de correo para hacerla más fácil de recordar.
          </p>
          
          <form onSubmit={handleChangeAlias} className="space-y-3">
            <div>
              <label htmlFor="email-alias" className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo alias de correo
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="email-alias"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value.toLowerCase())}
                  className="flex-grow p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500"
                  placeholder={emailAlias || "tunombre"}
                />
                <span className="bg-gray-100 p-2 border-r border-t border-b rounded-r-md flex items-center">
                  @lovenda.com
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números y puntos. Mínimo 3 caracteres.
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                <Check size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">¡Tu dirección de correo ha sido actualizada con éxito!</p>
              </div>
            )}
            
            <Button
              type="submit"
              variant="default"
              disabled={loading || !newAlias}
            >
              {loading ? 'Actualizando...' : 'Actualizar dirección'}
            </Button>
          </form>
        </div>
        
        {/* Opciones adicionales */}
        <div>
          <h3 className="text-md font-medium mb-2">Preferencias de notificación</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-new-email"
                defaultChecked={true}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-new-email" className="ml-2 block text-sm text-gray-700">
                Notificarme cuando reciba nuevos correos
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-read"
                defaultChecked={true}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-read" className="ml-2 block text-sm text-gray-700">
                Notificarme cuando mis correos sean leídos
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium mb-2">Respuestas automáticas inteligentes</h3>
          <p className="text-sm text-gray-600 mb-4">Configura mensajes automáticos según el tipo de correo mientras la IA analiza los emails entrantes.</p>
          {autoReplyError && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{autoReplyError}</div>
          )}
          {autoReplySuccess && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Configuración guardada correctamente.</div>
          )}
          <form className="space-y-4" onSubmit={handleSaveAutoReply}>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
              />
              <span>Activar respuestas automáticas</span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto automático</label>
                <input
                  type="text"
                  value={autoReplySubject}
                  onChange={(e) => setAutoReplySubject(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (horas)</label>
                <input
                  type="number"
                  min="1"
                  value={autoReplyInterval}
                  onChange={(e) => setAutoReplyInterval(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje general</label>
              <textarea
                value={generalAutoReply}
                onChange={(e) => setGeneralAutoReply(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-1 text-xs text-gray-500">Puedes usar [Nombre], [Categoría] y [Asunto] como variables.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para proveedores</label>
                <textarea
                  value={providerAutoReply}
                  onChange={(e) => setProviderAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para invitados</label>
                <textarea
                  value={guestAutoReply}
                  onChange={(e) => setGuestAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para finanzas</label>
                <textarea
                  value={financeAutoReply}
                  onChange={(e) => setFinanceAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para contratos</label>
                <textarea
                  value={contractAutoReply}
                  onChange={(e) => setContractAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para facturas</label>
                <textarea
                  value={invoiceAutoReply}
                  onChange={(e) => setInvoiceAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para reuniones</label>
                <textarea
                  value={meetingAutoReply}
                  onChange={(e) => setMeetingAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje para confirmaciones (RSVP)</label>
                <textarea
                  value={rsvpAutoReply}
                  onChange={(e) => setRsvpAutoReply(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remitentes excluidos</label>
              <input
                type="text"
                value={autoReplyExclusions}
                onChange={(e) => setAutoReplyExclusions(e.target.value)}
                placeholder="correo1@dominio.com, correo2@dominio.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={autoReplySaving}>
                {autoReplySaving ? 'Guardando...' : 'Guardar respuestas automáticas'}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium mb-2">Correos programados</h3>
          <p className="text-sm text-gray-600 mb-3">Consulta y gestiona los envíos que has programado desde el compositor.</p>
          {scheduledEmails.length === 0 ? (
            <p className="text-sm text-gray-500">No tienes correos programados actualmente.</p>
          ) : (
            <ul className="space-y-2">
              {scheduledEmails.map((item) => (
                <li key={item.id} className="flex items-start justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.payload?.subject || '(Sin asunto)'}</p>
                    <p className="text-xs text-gray-600">Para: {item.payload?.to || 'Sin destinatario'}</p>
                    <p className="text-xs text-gray-600">Programado: {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString('es-ES') : 'Sin fecha'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleCancelScheduledEmail(item.id)}
                  >
                    Cancelar
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setScheduledEmails(getScheduledQueue())}>Actualizar lista</Button>
          </div>
        </div>

        {/* Gestor de etiquetas */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <TagsManager />
        </div>

        {/* Vincular cuentas de boda */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <WeddingAccountLink />
        </div>
      </div>
    </Card>
  );
};

export default EmailSettings;
