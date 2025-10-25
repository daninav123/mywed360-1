// Servicio de alto nivel para solicitar al backend la generación de un lote
// de mensajes de WhatsApp y devolver la lista { phone, message, guestId }.
// Cuando el backend responde con error, propagamos la excepción para que
// el frontend gestione la incidencia (sin recurrir a mocks silenciosos).

import i18n from '../i18n';
import { getBackendBase } from '../utils/backendBase';

async function getAuthToken() {
  try {
    const mod = await import('../firebaseConfig');
    const { auth } = mod;
    const user = auth?.currentUser;
    if (user?.getIdToken) {
      try {
        const forced = await user.getIdToken(true);
        if (forced) return forced;
      } catch {
        // Ignorar y continuar con el token normal
      }
      return await user.getIdToken();
    }
  } catch {
    // Ignorar: el token es opcional
  }
  return null;
}

function buildEndpoint() {
  const base = getBackendBase();
  const normalized = base ? base.replace(/\/$/, '') : '';
  return normalized ? `${normalized}/api/whatsapp/batch` : '/api/whatsapp/batch';
}

function assertInput({ weddingId, guestIds, messageTemplate }) {
  if (!weddingId) {
    throw new Error('weddingId es obligatorio');
  }
  if (!Array.isArray(guestIds) || guestIds.length === 0) {
    throw new Error('guestIds debe ser un array con al menos un elemento');
  }
  if (!messageTemplate || typeof messageTemplate !== 'string') {
    throw new Error('messageTemplate es obligatorio');
  }
}

export async function sendBatch({ weddingId, guestIds, messageTemplate }) {
  assertInput({ weddingId, guestIds, messageTemplate });

  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(buildEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ weddingId, guestIds, messageTemplate }),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message =
      payload?.error ||
      payload?.message ||
      `Error creando lote de WhatsApp (HTTP ${response.status})`;
    throw new Error(message);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(i18n.t('common.respuesta_invalida_del_backend_whatsapp'));
  }

  return payload;
}
