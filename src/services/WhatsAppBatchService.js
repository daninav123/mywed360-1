// src/services/WhatsAppBatchService.js
// Servicio de alto nivel para solicitar al backend la generación de un lote
// de mensajes de WhatsApp y devolver la lista { phone, message, guestId }
// Si el backend aún no está implementado, resolvemos con un mock para seguir
// avanzando en el frontend.

export async function sendBatch({ weddingId, guestIds, messageTemplate }) {
  try {
    const res = await fetch('/api/whatsapp/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
