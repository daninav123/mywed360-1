/**
 * RSVP Service - PostgreSQL Version
 * Usa API backend en lugar de Firebase
 */

import { post } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const normalizeString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Buscar invitado por nombre
 */
export const findGuestByName = async (weddingId, nombreBuscado) => {
  try {
    console.log('🔍 Buscando invitado:', nombreBuscado, 'en boda:', weddingId);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/guests?weddingId=${weddingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error obteniendo invitados');

    const result = await response.json();
    const invitados = result.guests || result.data || [];

    console.log(`📋 Total invitados en la boda: ${invitados.length}`);

    const nombreNormalizado = normalizeString(nombreBuscado);

    let invitado = invitados.find((inv) => {
      const nombreInvitado = inv.name || inv.nombre || '';
      return normalizeString(nombreInvitado) === nombreNormalizado;
    });

    if (!invitado) {
      invitado = invitados.find((inv) => {
        const nombreInvitado = inv.name || inv.nombre || '';
        const nombreNorm = normalizeString(nombreInvitado);
        return nombreNorm.includes(nombreNormalizado) || nombreNormalizado.includes(nombreNorm);
      });
    }

    if (invitado) {
      console.log('✅ Invitado encontrado:', invitado.name || invitado.nombre);

      // Buscar respuesta RSVP existente
      const rsvpResponse = await fetch(
        `${API_URL}/api/rsvp/${weddingId}/guest/${invitado.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (rsvpResponse.ok) {
        const rsvpData = await rsvpResponse.json();
        console.log('📋 Respuesta RSVP existente encontrada');
        return {
          ...invitado,
          rsvpId: rsvpData.id,
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
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/guests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weddingId: webId,
        name: guestData.nombre,
        email: guestData.email || null,
        phone: guestData.telefono || null,
        maxCompanions: guestData.maxAcompañantes || 2,
      })
    });

    if (!response.ok) throw new Error('Error creando invitado');

    const result = await response.json();
    console.log('✅ Invitado creado:', guestData.nombre);

    return {
      success: true,
      guest: result.guest || result.data,
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

    const token = localStorage.getItem('authToken');
    const method = rsvpId ? 'PUT' : 'POST';
    const url = rsvpId 
      ? `${API_URL}/api/rsvp/${rsvpId}`
      : `${API_URL}/api/rsvp`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weddingId,
        guestId,
        asistira: responseData.asistira,
        numAcompañantes: responseData.numAcompañantes || 0,
        nombresAcompañantes: responseData.nombresAcompañantes || [],
        menuPreferencias: responseData.menuPreferencias || [],
        restriccionesAlimentarias: responseData.restriccionesAlimentarias || '',
        comentarios: responseData.comentarios || '',
        emailConfirmacion: responseData.emailConfirmacion || '',
      })
    });

    if (!response.ok) throw new Error('Error guardando respuesta RSVP');

    const result = await response.json();
    console.log('✅ Respuesta RSVP guardada');

    return { success: true, id: result.id };
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
    
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/rsvp/${webId}/responses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error obteniendo respuestas');

    const result = await response.json();
    const responses = result.responses || result.data || [];

    console.log(`✅ ${responses.length} respuestas RSVP encontradas`);
    return responses;
  } catch (error) {
    console.error('❌ Error obteniendo respuestas RSVP:', error);
    throw error;
  }
};

/**
 * Crear múltiples invitados
 */
export const createMultipleGuests = async (webId, guestsList) => {
  try {
    console.log('📝 Creando lista de invitados:', guestsList.length);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/guests/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weddingId: webId,
        guests: guestsList.map(g => ({
          name: g.nombre.trim(),
          email: g.email || null,
          phone: g.telefono || null,
          maxCompanions: g.maxAcompañantes || 0,
        }))
      })
    });

    if (!response.ok) throw new Error('Error creando invitados');

    const result = await response.json();
    const createdGuests = result.guests || result.data || [];

    console.log(`✅ ${createdGuests.length} invitados creados`);
    return { success: true, guests: createdGuests };
  } catch (error) {
    console.error('❌ Error creando invitados:', error);
    throw error;
  }
};

/**
 * Generar link RSVP
 */
export async function generateRsvpLink({ weddingId, guestId }) {
  if (!weddingId || !guestId) throw new Error('weddingId and guestId are required');
  const res = await post('/api/rsvp/generate-link', { weddingId, guestId }, { auth: true });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}
