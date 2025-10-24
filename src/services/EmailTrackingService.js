// EmailTrackingService.js - Servicio para el seguimiento de respuestas de proveedores
import { saveData, loadData } from './SyncService';
import { addTagToEmail, SYSTEM_TAGS } from './tagService';
import { auth } from '../firebaseConfig';

const TRACKING_STORAGE_KEY = 'maloveapp_email_tracking';

// Estados posibles para seguimiento de correos
export const TRACKING_STATUS = {
  WAITING: 'waiting', // Esperando respuesta
  RESPONDED: 'responded', // Proveedor respondió
  FOLLOWUP: 'followup', // Requiere seguimiento adicional
  COMPLETED: 'completed', // Conversación completada/cerrada
  URGENT: 'urgent', // Requiere atención urgente
};

// Etiquetas disponibles para correos
export const EMAIL_TAGS = {
  PROVIDER: 'provider', // Comunicación con proveedor
  IMPORTANT: 'important', // Correo importante
  BUDGET: 'budget', // Relacionado con presupuesto
  CONTRACT: 'contract', // Relacionado con contrato
  QUESTION: 'question', // Consulta o pregunta
  OFFER: 'offer', // Oferta o promoción
  APPOINTMENT: 'appointment', // Cita o reunión
  AI_GENERATED: 'ai-generado', // Correo generado por AI
};

// Estructura de un registro de seguimiento
// {
//   id: string,              // ID único del seguimiento
//   emailId: string,         // ID del correo relacionado
//   providerId: string,      // ID del proveedor (si aplica)
//   providerName: string,    // Nombre del proveedor
//   providerEmail: string,   // Email del proveedor
//   subject: string,         // Asunto del correo
//   status: string,          // Estado del seguimiento (TRACKING_STATUS)
//   tags: string[],          // Etiquetas aplicadas
//   lastEmailDate: Date,     // Fecha del último correo
//   dueDate: Date,           // Fecha límite para seguimiento (opcional)
//   notes: string,           // Notas adicionales
//   thread: [                // Hilo de correos relacionados
//     { emailId, direction, date, subject, snippet }
//   ]
//   isAIGenerated: boolean,  // Si el correo fue generado por AI
//   aiTrackingId: string,    // ID de seguimiento de actividad AI (si aplica)
// }

// Cargar registros de seguimiento
export function loadTrackingRecords() {
  try {
    const data = loadData(TRACKING_STORAGE_KEY, { defaultValue: [] });
    // Si loadData es asíncrono (Promise), usar localStorage como lectura síncrona
    if (data && typeof data.then === 'function') {
      try {
        const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  } catch {
    try {
      const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

// Guardar registros de seguimiento
export function saveTrackingRecords(records) {
  try {
    localStorage.setItem(
      TRACKING_STORAGE_KEY,
      JSON.stringify(Array.isArray(records) ? records : [])
    );
  } catch {}
  // Persistencia en segundo plano (no bloquear UI)
  try {
    void saveData(TRACKING_STORAGE_KEY, records, { showNotification: false });
  } catch {}
}

// Crear un nuevo registro de seguimiento para un correo a un proveedor
export function createTrackingRecord(email, provider, options = {}) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];

  // Verificar si ya existe un registro para este proveedor
  const existingRecord = list.find((record) => record.providerEmail === provider.email);

  if (existingRecord) {
    // Actualizar el registro existente con el nuevo correo
    const updatedRecord = {
      ...existingRecord,
      subject: email.subject,
      lastEmailDate: new Date(),
      status: TRACKING_STATUS.WAITING,
      thread: [
        ...(existingRecord.thread || []),
        {
          emailId: email.id,
          direction: 'outgoing',
          date: new Date(),
          subject: email.subject,
          snippet: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
        },
      ],
    };

    // Actualizar el registro en la lista
    const updatedRecords = list.map((record) =>
      record.id === existingRecord.id ? updatedRecord : record
    );

    saveTrackingRecords(updatedRecords);
    return updatedRecord;
  } else {
    // Crear un nuevo registro de seguimiento
    const newRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      emailId: email.id,
      providerId: provider.id,
      providerName: provider.name,
      providerEmail: provider.email,
      subject: email.subject,
      status: TRACKING_STATUS.WAITING,
      tags: [EMAIL_TAGS.PROVIDER],
      lastEmailDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Por defecto, 7 días
      notes: '',
      thread: [
        {
          emailId: email.id,
          direction: 'outgoing',
          date: new Date(),
          subject: email.subject,
          snippet: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
        },
      ],
      isAIGenerated: options.isAIGenerated || false,
      aiTrackingId: options.aiTrackingId || null,
    };

    // Añadir etiquetas adicionales basadas en el asunto y contenido
    if (
      email.subject.toLowerCase().includes('presupuesto') ||
      email.body.toLowerCase().includes('presupuesto')
    ) {
      newRecord.tags.push(EMAIL_TAGS.BUDGET);
    }

    if (
      email.subject.toLowerCase().includes('contrato') ||
      email.body.toLowerCase().includes('contrato')
    ) {
      newRecord.tags.push(EMAIL_TAGS.CONTRACT);
    }

    if (
      email.subject.toLowerCase().includes('cita') ||
      email.body.toLowerCase().includes('cita') ||
      email.subject.toLowerCase().includes('reunión') ||
      email.body.toLowerCase().includes('reunión')
    ) {
      newRecord.tags.push(EMAIL_TAGS.APPOINTMENT);
    }

    if (options.isAIGenerated) {
      newRecord.tags.push(EMAIL_TAGS.AI_GENERATED);
    }

    // Añadir el nuevo registro
    const updatedRecords = [...list, newRecord];
    saveTrackingRecords(updatedRecords);
    return newRecord;
  }
}

// Actualizar un registro de seguimiento cuando se recibe una respuesta
export function updateTrackingWithResponse(email) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];

  // Buscar el registro que corresponde al remitente de este correo
  const recordIndex = trackingRecords.findIndex((record) => record.providerEmail === email.from);

  if (recordIndex >= 0) {
    // Actualizar el registro con la respuesta
    const record = trackingRecords[recordIndex];
    const updatedRecord = {
      ...record,
      status: TRACKING_STATUS.RESPONDED,
      lastEmailDate: new Date(email.date),
      thread: [
        ...(record.thread || []),
        {
          emailId: email.id,
          direction: 'incoming',
          date: new Date(email.date),
          subject: email.subject,
          snippet: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
        },
      ],
    };

    // Actualizar la lista de registros
    trackingRecords[recordIndex] = updatedRecord;
    saveTrackingRecords(trackingRecords);
    return updatedRecord;
  }

  return null;
}

// Actualizar estado de un registro de seguimiento
export function updateTrackingStatus(recordId, status, notes = null, dueDate = undefined) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];

  const updatedRecords = list.map((record) => {
    if (record.id === recordId) {
      return {
        ...record,
        status,
        notes: notes !== null ? notes : record.notes,
        dueDate: typeof dueDate !== 'undefined' ? dueDate : record.dueDate,
      };
    }
    return record;
  });

  saveTrackingRecords(updatedRecords);
}

// Obtener registros que necesitan seguimiento (sin respuesta después de N días)
export function getTrackingNeedingFollowup(days = 3) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return trackingRecords.filter(
    (record) =>
      record.status === TRACKING_STATUS.WAITING && new Date(record.lastEmailDate) < cutoffDate
  );
}

// Añadir o eliminar etiquetas de un registro
export function updateTrackingTags(recordId, tags) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];

  const updatedRecords = list.map((record) => {
    if (record.id === recordId) {
      return {
        ...record,
        tags,
      };
    }
    return record;
  });

  saveTrackingRecords(updatedRecords);
}

// Eliminar un registro de seguimiento
export function deleteTrackingRecord(recordId) {
  const trackingRecords = loadTrackingRecords();
  const list = Array.isArray(trackingRecords) ? trackingRecords : [];
  const updatedRecords = trackingRecords.filter((record) => record.id !== recordId);
  saveTrackingRecords(updatedRecords);
}

// Detectar automáticamente si un correo entrante es de un proveedor conocido
export function detectProviderResponse(email, providers) {
  // Si el correo entrante es de un dominio conocido de proveedor
  const providerMatch = providers.find(
    (p) => p.email && email.from.toLowerCase().includes(p.email.toLowerCase())
  );

  if (providerMatch) {
    return updateTrackingWithResponse(email);
  }

  return null;
}

// Marcar un correo relacionado con un proveedor
export function tagProviderEmail_old(emailId, providerId) {
  try {
    const profile = (() => {
      try {
        return JSON.parse(localStorage.getItem('maloveapp_user_profile') || '{}');
      } catch {
        return {};
      }
    })();
    const uid = (auth && auth.currentUser && auth.currentUser.uid) || profile.uid || 'local';
    // Etiqueta del sistema: 'provider'
    addTagToEmail(uid, emailId, 'provider');
    return true;
  } catch (err) {
    console.warn('tagProviderEmail_old: fallo al etiquetar correo como proveedor', err);
    return false;
  }
}

