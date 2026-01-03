import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useWedding } from '../context/WeddingContext';
import { guestsAPI } from '../services/apiService';
import { post as apiPost } from '../services/apiClient';
import { ensureExtensionAvailable, sendBatchMessages } from '../services/whatsappBridge';
import { toE164 as toE164Frontend, waDeeplink } from '../services/whatsappService';
import { renderInviteMessage } from '../services/MessageTemplateService';
import { sendMail } from '../services/emailService';
import useTranslations from './useTranslations';

const generateCheckInCode = () => {
  try {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID().slice(0, 8).toUpperCase();
    }
  } catch {}
  const seed = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CHK-${seed}${random}`.slice(0, 12);
};

const useGuests = () => {
  const { t } = useTranslations();
  const { activeWedding } = useWedding();
  
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar invitados desde PostgreSQL
  const loadGuests = useCallback(async () => {
    if (!activeWedding) {
      setGuests([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await guestsAPI.getAll(activeWedding);
      setGuests(data || []);
    } catch (err) {
      console.error('[useGuests] Error loading guests:', err);
      setError(err.message);
      toast.error('Error cargando invitados');
    } finally {
      setLoading(false);
    }
  }, [activeWedding]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  // Agregar invitado
  const addGuest = useCallback(async (guestData) => {
    if (!activeWedding) return null;

    try {
      const created = await guestsAPI.create(activeWedding, {
        ...guestData,
        status: guestData.status || 'pending',
        confirmed: guestData.confirmed || false,
        companions: guestData.companions || 0,
      });
      
      setGuests(prev => [...prev, created]);
      toast.success(t?.('guest_added') || 'Invitado agregado');
      return created;
    } catch (err) {
      console.error('[useGuests] Error adding guest:', err);
      toast.error('Error al agregar invitado');
      throw err;
    }
  }, [activeWedding, t]);

  // Actualizar invitado
  const updateGuest = useCallback(async (guestId, updates) => {
    try {
      const updated = await guestsAPI.update(guestId, updates);
      setGuests(prev => prev.map(g => g.id === guestId ? updated : g));
      return updated;
    } catch (err) {
      console.error('[useGuests] Error updating guest:', err);
      toast.error('Error al actualizar invitado');
      throw err;
    }
  }, []);

  // Eliminar invitado
  const deleteGuest = useCallback(async (guestId) => {
    try {
      await guestsAPI.delete(guestId);
      setGuests(prev => prev.filter(g => g.id !== guestId));
      toast.success(t?.('guest_deleted') || 'Invitado eliminado');
    } catch (err) {
      console.error('[useGuests] Error deleting guest:', err);
      toast.error('Error al eliminar invitado');
      throw err;
    }
  }, [t]);

  // Actualización masiva
  const bulkUpdateGuests = useCallback(async (updatedGuests) => {
    if (!activeWedding) return;

    try {
      await guestsAPI.bulkUpdate(activeWedding, updatedGuests);
      await loadGuests();
      toast.success('Invitados actualizados');
    } catch (err) {
      console.error('[useGuests] Error in bulk update:', err);
      toast.error('Error en actualización masiva');
      throw err;
    }
  }, [activeWedding, loadGuests]);

  // Confirmar asistencia
  const confirmAttendance = useCallback(async (guestId, willAttend) => {
    return updateGuest(guestId, {
      confirmed: willAttend,
      status: willAttend ? 'confirmed' : 'declined',
    });
  }, [updateGuest]);

  // Asignar mesa
  const assignTable = useCallback(async (guestId, tableNumber, seatNumber = null) => {
    return updateGuest(guestId, {
      tableNumber,
      seatNumber,
    });
  }, [updateGuest]);

  // Generar código de check-in
  const generateGuestCheckInCode = useCallback(async (guestId) => {
    const code = generateCheckInCode();
    await updateGuest(guestId, { checkInCode: code });
    return code;
  }, [updateGuest]);

  // Enviar invitación por WhatsApp
  const sendWhatsAppInvite = useCallback(async (guest, customMessage = null) => {
    if (!guest.phone) {
      toast.error('El invitado no tiene número de teléfono');
      return { success: false, error: 'No phone number' };
    }

    try {
      const available = await ensureExtensionAvailable();
      if (!available) {
        toast.error('Extensión de WhatsApp no disponible');
        return { success: false, error: 'Extension not available' };
      }

      const message = customMessage || renderInviteMessage(guest.name, { coupleName: 'Boda' });
      const phone = toE164Frontend(guest.phone);
      
      const result = await sendBatchMessages([{ phone, message }]);
      
      if (result.success) {
        toast.success(`Invitación enviada a ${guest.name}`);
        return { success: true };
      } else {
        toast.error('Error enviando invitación');
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('[useGuests] WhatsApp error:', err);
      toast.error('Error enviando por WhatsApp');
      return { success: false, error: err.message };
    }
  }, []);

  // Enviar invitación por Email
  const sendEmailInvite = useCallback(async (guest, customMessage = null) => {
    if (!guest.email) {
      toast.error('El invitado no tiene email');
      return { success: false, error: 'No email' };
    }

    try {
      const message = customMessage || renderInviteMessage(guest.name, { coupleName: 'Boda' });
      
      await sendMail({
        to: guest.email,
        subject: 'Invitación a nuestra boda',
        html: `<p>${message}</p>`,
      });

      toast.success(`Email enviado a ${guest.name}`);
      return { success: true };
    } catch (err) {
      console.error('[useGuests] Email error:', err);
      toast.error('Error enviando email');
      return { success: false, error: err.message };
    }
  }, []);

  // Estadísticas
  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.confirmed || g.status === 'confirmed').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    const pending = total - confirmed - declined;
    const totalAttendees = guests.reduce((sum, g) => {
      if (g.confirmed || g.status === 'confirmed') {
        return sum + 1 + (g.companions || 0);
      }
      return sum;
    }, 0);

    return {
      total,
      confirmed,
      declined,
      pending,
      totalAttendees,
      confirmationRate: total > 0 ? (confirmed / total) * 100 : 0,
    };
  }, [guests]);

  // Filtros comunes
  const getGuestsByStatus = useCallback((status) => {
    return guests.filter(g => g.status === status);
  }, [guests]);

  const getGuestsByTable = useCallback((tableNumber) => {
    return guests.filter(g => g.tableNumber === tableNumber);
  }, [guests]);

  const getUnassignedGuests = useCallback(() => {
    return guests.filter(g => !g.tableNumber);
  }, [guests]);

  return {
    // Datos
    guests,
    loading,
    error,
    stats,

    // Acciones CRUD
    loadGuests,
    addGuest,
    updateGuest,
    deleteGuest,
    bulkUpdateGuests,

    // Acciones específicas
    confirmAttendance,
    assignTable,
    generateGuestCheckInCode,

    // Comunicación
    sendWhatsAppInvite,
    sendEmailInvite,

    // Filtros
    getGuestsByStatus,
    getGuestsByTable,
    getUnassignedGuests,
  };
};

export default useGuests;
