// EmailTrackingService.js - Servicio para el seguimiento de respuestas de proveedores
import i18n from '../i18n';
import { saveData, loadData } from './SyncService';
import { addTagToEmail, SYSTEM_TAGS } from './tagService';
import { auth } from '../firebaseConfig';

const TRACKING_STORAGE_KEY = 'maloveapp_email_tracking';

// Estados posibles para seguimiento de correos
export const TRACKING_STATUS = {
  WAITING: 'waiting', // Esperando respuesta
  RESPONDED: 'respondedi18n.t('common.proveedor_respondio_followup')followup', // Requiere seguimiento adicional
  COMPLETED: 'completedi18n.t('common.conversacion_completadacerrada_urgent')urgenti18n.t('common.requiere_atencion_urgente_etiquetas_disponibles_para')provideri18n.t('common.comunicacion_con_proveedor_important')important', // Correo importante
  BUDGET: 'budget', // Relacionado con presupuesto
  CONTRACT: 'contract', // Relacionado con contrato
  QUESTION: 'question', // Consulta o pregunta
  OFFER: 'offeri18n.t('common.oferta_promocion_appointment')appointmenti18n.t('common.cita_reunion_aigenerated')ai-generadoi18n.t('common.correo_generado_por_estructura_registro_seguimiento')function') {
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
          snippet: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : 'i18n.t('common.actualizar_registro_lista_const_updatedrecords_listmaprecord')',
      thread: [
        {
          emailId: email.id,
          direction: 'outgoing',
          date: new Date(),
          subject: email.subject,
          snippet: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : 'i18n.t('common.isaigenerated_optionsisaigenerated_false_aitrackingid_optionsaitrackingid_null')presupuesto') ||
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
      email.subject.toLowerCase().includes(i18n.t('common.reunion')) ||
      email.body.toLowerCase().includes(i18n.t('common.reunion'))
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
        dueDate: typeof dueDate !== 'undefinedi18n.t('common.duedate_recordduedate_return_record_savetrackingrecordsupdatedrecords_obtener')maloveapp_user_profile') || '{}');
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

