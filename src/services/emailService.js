// Servicio de Email para manejar operaciones de correo
// Este servicio actúa como interfaz con el backend de emails

import { get as apiGet, post as apiPost, del as apiDelete } from './apiClient';

// Indicador del modo de operación (true = dependemos de backend real)
export const USE_BACKEND = true;

// Inicialización del servicio
export async function initEmailService(weddingId) {
  console.log('[EmailService] Initialized for wedding:', weddingId);
  return { success: true, weddingId };
}

// Obtener emails con paginación
export async function getMails(params = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      folder = 'INBOX',
      unread = null,
      search = '',
      from = '',
      to = '',
      subject = ''
    } = params;

    const queryParams = new URLSearchParams({
      page,
      limit,
      folder,
      ...(unread !== null && { unread }),
      ...(search && { search }),
      ...(from && { from }),
      ...(to && { to }),
      ...(subject && { subject })
    });

    const response = await apiGet(`/api/emails?${queryParams}`);
    const data = await response.json();

    return {
      emails: data.emails || [],
      total: data.total || 0,
      page: data.page || page,
      totalPages: data.totalPages || 1,
      hasMore: data.hasMore || false
    };
  } catch (error) {
    console.error('[EmailService] Error fetching mails:', error);
    return {
      emails: [],
      total: 0,
      page: 1,
      totalPages: 1,
      hasMore: false
    };
  }
}

// Obtener una página específica de emails
export async function getMailsPage(page = 1, limit = 50) {
  return getMails({ page, limit });
}

// Enviar un email
export async function sendMail(emailData) {
  try {
    const response = await apiPost('/api/emails/send', emailData);
    const data = await response.json();
    return { success: response.ok, ...data };
  } catch (error) {
    console.error('[EmailService] Error sending mail:', error);
    return { success: false, error: error.message };
  }
}

// Marcar email como leído/no leído
export async function markAsRead(emailId, isRead = true) {
  try {
    const response = await apiPost(`/api/emails/${emailId}/read`, { isRead });
    return { success: response.ok };
  } catch (error) {
    console.error('[EmailService] Error marking email as read:', error);
    return { success: false, error: error.message };
  }
}

// Eliminar email
export async function deleteEmail(emailId) {
  try {
    const response = await apiDelete(`/api/emails/${emailId}`);
    return { success: response.ok };
  } catch (error) {
    console.error('[EmailService] Error deleting email:', error);
    return { success: false, error: error.message };
  }
}

// Actualizar etiquetas asociadas a un email
export async function updateMailTags(emailId, { add = [], remove = [] } = {}) {
  if (!emailId) throw new Error('email_id_required');
  try {
    const response = await apiPost(`/api/emails/${encodeURIComponent(emailId)}/tags`, {
      add,
      remove,
    });
    let json = {};
    try {
      json = await response.json();
    } catch {
      json = {};
    }
    if (!response.ok) {
      const err = new Error(`updateMailTags ${response.status}`);
      err.status = response.status;
      err.body = json;
      throw err;
    }
    return json.tags || true;
  } catch (error) {
    console.error('[EmailService] Error updating mail tags:', error);
    throw error;
  }
}

// Obtener carpetas de email
export async function getFolders() {
  try {
    const response = await apiGet('/api/emails/folders');
    const data = await response.json();
    return data.folders || ['INBOX', 'SENT', 'TRASH', 'SPAM'];
  } catch (error) {
    console.error('[EmailService] Error fetching folders:', error);
    return ['INBOX', 'SENT', 'TRASH', 'SPAM'];
  }
}

// Buscar emails
export async function searchEmails(query, options = {}) {
  try {
    const params = new URLSearchParams({
      q: query,
      ...options
    });
    const response = await apiGet(`/api/emails/search?${params}`);
    const data = await response.json();
    return data.emails || [];
  } catch (error) {
    console.error('[EmailService] Error searching emails:', error);
    return [];
  }
}

// Obtener estadísticas de email
export async function getEmailStats() {
  try {
    const response = await apiGet('/api/emails/stats');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[EmailService] Error fetching email stats:', error);
    return {
      total: 0,
      unread: 0,
      sent: 0,
      received: 0
    };
  }
}

// Exportar todo
export default {
  initEmailService,
  getMails,
  getMailsPage,
  sendMail,
  markAsRead,
  deleteEmail,
  getFolders,
  searchEmails,
  getEmailStats,
  updateMailTags
};
