// src/services/WhatsAppBatchService.js
// Servicio de alto nivel para solicitar al backend la generación de un lote
// de mensajes de WhatsApp y devolver la lista { phone, message, guestId }
// Si el backend aún no está implementado, resolvemos con un mock para seguir
// avanzando en el frontend.

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_URL || '';

export async function sendBatch({ weddingId, guestIds, messageTemplate }) {
  // Intenta obtener token Firebase para cabecera Authorization
  async function getAuthToken() {
    try {
      const mod = await import('../firebaseConfig');
      const { auth } = mod;
      const u = auth?.currentUser;
      if (u?.getIdToken) {
        try { const t = await u.getIdToken(true); if (t) return t; } catch {}
        return await u.getIdToken();
      }
    } catch {}
    return null;
  }
  try {
    const token = await getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    const base = BASE ? BASE.replace(/\/$/, '') : '';
    const url = base ? `${base}/api/whatsapp/batch` : '/api/whatsapp/batch';
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ weddingId, guestIds, messageTemplate }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json(); // { batchId, items: [{phone, message, guestId}] }
  } catch (err) {
    console.warn('WhatsAppBatchService fallback mock:', err.message);
    // Fallback mock: simplemente arma mensajes concatenando número y plantilla
    return {
      batchId: 'mock-' + Date.now(),
      items: guestIds.map((id, idx) => ({
        guestId: id,
        phone: '+346000000' + String(idx).padStart(2, '0'),
        message: messageTemplate.replace('{guestName}', `Invitado ${idx + 1}`),
      })),
    };
  }
}
