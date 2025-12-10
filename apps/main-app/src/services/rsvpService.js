import { post } from './apiClient';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

const RSVP_COLLECTION = 'craft-webs-rsvp';

/**
 * Normalizar nombre para búsqueda (quitar acentos, minúsculas, etc.)
 */
const normalizeString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
};

/**
 * Buscar invitado por nombre en la colección de guests de la boda
 */
export const findGuestByName = async (weddingId, nombreBuscado) => {
  try {
    console.log('🔍 Buscando invitado:', nombreBuscado, 'en boda:', weddingId);

    // Buscar en la colección de guests de la boda
    const guestsRef = collection(db, 'weddings', weddingId, 'guests');
    const snapshot = await getDocs(guestsRef);

    const nombreNormalizado = normalizeString(nombreBuscado);

    // Buscar coincidencia exacta o similar
    const invitados = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`📋 Total invitados en la boda: ${invitados.length}`);

    // Buscar coincidencia exacta
    let invitado = invitados.find((inv) => {
      const nombreInvitado = inv.name || inv.nombre || '';
      return normalizeString(nombreInvitado) === nombreNormalizado;
    });

    // Si no hay coincidencia exacta, buscar parcial
    if (!invitado) {
      invitado = invitados.find((inv) => {
        const nombreInvitado = inv.name || inv.nombre || '';
        const nombreNorm = normalizeString(nombreInvitado);
        return nombreNorm.includes(nombreNormalizado) || nombreNormalizado.includes(nombreNorm);
      });
    }

    if (invitado) {
      console.log('✅ Invitado encontrado:', invitado.name || invitado.nombre);

      // Buscar si ya tiene respuesta RSVP guardada
      const rsvpRef = collection(db, RSVP_COLLECTION);
      const rsvpQuery = query(
        rsvpRef,
        where('weddingId', '==', weddingId),
        where('guestId', '==', invitado.id)
      );
      const rsvpSnapshot = await getDocs(rsvpQuery);

      if (!rsvpSnapshot.empty) {
        const rsvpData = rsvpSnapshot.docs[0].data();
        console.log('📋 Respuesta RSVP existente encontrada');
        return {
          ...invitado,
          rsvpId: rsvpSnapshot.docs[0].id,
          respondido: rsvpData.respondido || false,
          asistira: rsvpData.asistira,
          numAcompañantes: rsvpData.numAcompañantes,
          nombresAcompañantes: rsvpData.nombresAcompañantes,
          restriccionesAlimentarias: rsvpData.restriccionesAlimentarias,
          comentarios: rsvpData.comentarios,
        };
      }

      return invitado;
    }

    console.log('⚠️ Invitado no encontrado en la lista');
    return null;
  } catch (error) {
    console.error('❌ Error buscando invitado:', error);
    throw error;
  }
};

/**
 * Crear invitado en lista RSVP
 */
export const createGuest = async (webId, guestData) => {
  try {
    const guestId = `${webId}_${Date.now()}`;
    const guestRef = doc(db, RSVP_COLLECTION, guestId);

    const guest = {
      webId,
      nombre: guestData.nombre,
      email: guestData.email || null,
      telefono: guestData.telefono || null,
      maxAcompañantes: guestData.maxAcompañantes || 2,
      respondido: false,
      createdAt: serverTimestamp(),
    };

    await setDoc(guestRef, guest);

    console.log('✅ Invitado creado:', guestData.nombre);

    // Devolver guest con id incluido
    return {
      success: true,
      guest: {
        id: guestId,
        ...guest,
      },
    };
  } catch (error) {
    console.error('❌ Error creando invitado:', error);
    throw error;
  }
};

/**
 * Guardar respuesta RSVP
 */
export const saveRSVPResponse = async (weddingId, guestId, responseData, rsvpId = null) => {
  try {
    if (!weddingId || !guestId) {
      throw new Error('weddingId y guestId son requeridos');
    }

    console.log('💾 Guardando respuesta RSVP para invitado:', guestId);

    const response = {
      weddingId,
      guestId,
      respondido: true,
      asistira: responseData.asistira,
      numAcompañantes: responseData.numAcompañantes || 0,
      nombresAcompañantes: responseData.nombresAcompañantes || [],
      menuPreferencias: responseData.menuPreferencias || [],
      restriccionesAlimentarias: responseData.restriccionesAlimentarias || '',
      comentarios: responseData.comentarios || '',
      emailConfirmacion: responseData.emailConfirmacion || '', // Email usado para confirmar
      respondidoAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let responseId = rsvpId;

    // 1. Guardar respuesta RSVP
    if (rsvpId) {
      // Actualizar respuesta existente
      const invitationRef = doc(db, RSVP_COLLECTION, rsvpId);
      await updateDoc(invitationRef, response);
    } else {
      // Crear nueva respuesta
      responseId = `${weddingId}_${guestId}_${Date.now()}`;
      const invitationRef = doc(db, RSVP_COLLECTION, responseId);
      await setDoc(invitationRef, {
        ...response,
        createdAt: serverTimestamp(),
      });
    }

    console.log('✅ Respuesta RSVP guardada');

    // 2. Actualizar el invitado en la colección de guests
    const guestRef = doc(db, 'weddings', weddingId, 'guests', guestId);
    const guestUpdate = {
      status: responseData.asistira ? 'confirmed' : 'declined',
      confirmed: responseData.asistira,
      companions: responseData.numAcompañantes || 0,
      dietaryRestrictions: responseData.restriccionesAlimentarias || '',
      notes: responseData.comentarios || '',
      updatedAt: serverTimestamp(),
    };

    await updateDoc(guestRef, guestUpdate);
    console.log('✅ Invitado actualizado en la lista');

    return { success: true, id: responseId };
  } catch (error) {
    console.error('❌ Error guardando respuesta RSVP:', error);
    throw error;
  }
};

/**
 * Obtener todas las respuestas RSVP de una web
 */
export const getWebRSVPResponses = async (webId) => {
  try {
    console.log('📊 Obteniendo respuestas RSVP de la web:', webId);
    const rsvpRef = collection(db, RSVP_COLLECTION);
    const q = query(rsvpRef, where('webId', '==', webId));
    const snapshot = await getDocs(q);

    const responses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ ${responses.length} respuestas RSVP encontradas`);
    return responses;
  } catch (error) {
    console.error('❌ Error obteniendo respuestas RSVP:', error);
    throw error;
  }
};

/**
 * Crear múltiples invitados a la vez (para los novios)
 */
export const createMultipleGuests = async (webId, guestsList) => {
  try {
    console.log('📝 Creando lista de invitados:', guestsList.length);
    const createdGuests = [];

    for (const guestData of guestsList) {
      const guestId = `${webId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestRef = doc(db, RSVP_COLLECTION, guestId);

      const guest = {
        webId,
        nombre: guestData.nombre.trim(),
        email: guestData.email || null,
        telefono: guestData.telefono || null,
        maxAcompañantes: guestData.maxAcompañantes || 0,
        respondido: false,
        createdAt: serverTimestamp(),
      };

      await setDoc(guestRef, guest);
      createdGuests.push({ id: guestId, ...guest });
    }

    console.log(`✅ ${createdGuests.length} invitados creados`);
    return { success: true, guests: createdGuests };
  } catch (error) {
    console.error('❌ Error creando invitados:', error);
    throw error;
  }
};

// Función existente del backend
export async function generateRsvpLink({ weddingId, guestId }) {
  if (!weddingId || !guestId) throw new Error('weddingId and guestId are required');
  const res = await post('/api/rsvp/generate-link', { weddingId, guestId }, { auth: true });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}
