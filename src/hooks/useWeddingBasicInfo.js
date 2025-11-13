/**
 * 📋 Hook: useWeddingBasicInfo
 *
 * Extrae información básica de la boda para pre-rellenar solicitudes de presupuesto.
 *
 * Esta info NO se pide al usuario porque ya la tenemos en WeddingContext.
 */

import { useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from './useAuth';

export function useWeddingBasicInfo() {
  const { activeWeddingData } = useWedding();
  const { user } = useAuth();

  const basicInfo = useMemo(() => {
    if (!activeWeddingData) {
      return {
        available: false,
        fecha: null,
        ciudad: null,
        numeroInvitados: null,
        presupuestoTotal: null,
        nombreContacto: null,
        emailContacto: null,
        telefonoContacto: null,
      };
    }

    // Extraer fecha
    let fecha = null;
    if (activeWeddingData.date) {
      try {
        if (activeWeddingData.date.toDate) {
          // Firestore Timestamp
          fecha = activeWeddingData.date.toDate();
        } else if (typeof activeWeddingData.date === 'string') {
          fecha = new Date(activeWeddingData.date);
        } else if (activeWeddingData.date instanceof Date) {
          fecha = activeWeddingData.date;
        }
      } catch (error) {
        // console.warn('Error parseando fecha:', error);
      }
    }

    // Extraer ciudad
    const ciudad =
      activeWeddingData.location?.city ||
      activeWeddingData.location?.name ||
      activeWeddingData.city ||
      activeWeddingData.venue?.city ||
      null;

    // Extraer número de invitados
    const numeroInvitados =
      activeWeddingData.guestCount ||
      activeWeddingData.guests?.length ||
      activeWeddingData.invitados ||
      null;

    // Extraer presupuesto total
    const presupuestoTotal =
      activeWeddingData.budget?.total || activeWeddingData.presupuesto || null;

    // Info de contacto del usuario
    const nombreContacto = activeWeddingData.owner?.name || user?.displayName || null;

    const emailContacto = activeWeddingData.owner?.email || user?.email || null;

    const telefonoContacto =
      activeWeddingData.owner?.phone || activeWeddingData.phone || user?.phoneNumber || null;

    return {
      available: true,
      fecha,
      ciudad,
      numeroInvitados,
      presupuestoTotal,
      nombreContacto,
      emailContacto,
      telefonoContacto,

      // Info adicional útil
      weddingName: activeWeddingData.name || null,
      weddingId: activeWeddingData.id || null,
    };
  }, [activeWeddingData, user]);

  return basicInfo;
}

/**
 * Formatea la info básica para mostrar al usuario
 */
export function formatWeddingBasicInfo(basicInfo) {
  const formatted = {};

  if (basicInfo.fecha) {
    formatted.fecha = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(basicInfo.fecha);
  }

  if (basicInfo.ciudad) {
    formatted.ciudad = basicInfo.ciudad;
  }

  if (basicInfo.numeroInvitados) {
    formatted.numeroInvitados = `${basicInfo.numeroInvitados} ${
      basicInfo.numeroInvitados === 1 ? 'invitado' : 'invitados'
    }`;
  }

  if (basicInfo.presupuestoTotal) {
    formatted.presupuestoTotal = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(basicInfo.presupuestoTotal);
  }

  return formatted;
}

export default useWeddingBasicInfo;
