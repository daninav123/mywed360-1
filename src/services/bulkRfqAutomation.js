import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebaseConfig';
import { post as apiPost } from './apiClient';

const DEFAULT_BODY =
  'Hola,\n\nNos gustaría recibir un presupuesto detallado para nuestro evento. Por favor, incluye condiciones, logística y extras.\n\nGracias.';

const interpolate = (text, variables = {}) =>
  Object.entries(variables).reduce((acc, [key, value]) => acc.split(key).join(value || ''), String(text || ''));

const toDateString = (raw) => {
  if (!raw) return 'fecha por determinar';
  try {
    const date =
      typeof raw?.toDate === 'function'
        ? raw.toDate()
        : new Date(raw);
    if (Number.isNaN(date.getTime())) return 'fecha por determinar';
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'fecha por determinar';
  }
};

const buildWeddingVariables = (weddingInfo = {}, options = {}) => {
  const wi = weddingInfo || {};
  return {
    '{boda_nombre}': wi.name || wi.title || wi.eventName || '',
    '{novios}':
      wi.coupleNames ||
      wi.couple ||
      wi.novios ||
      wi.ownerName ||
      '',
    '{fecha_evento}': toDateString(
      wi.date ||
        wi.eventDate ||
        wi.fecha ||
        wi.weddingDate ||
        wi.receptionDate ||
        wi.ceremonyDate,
    ),
    '{lugar}':
      wi.celebrationPlace ||
      wi.place ||
      wi.location ||
      wi.city ||
      wi.venue ||
      '',
    '{wedding_id}': options.weddingId || '',
    '{servicio}': options.service || '',
    '{invitados}':
      wi.guestsTotal ||
      wi.guestCount ||
      wi.aforo ||
      wi.invitados ||
      wi.expectedGuests ||
      '',
    '{presupuesto}':
      wi.budget ||
      wi.presupuesto ||
      wi.estimatedBudget ||
      wi.totalBudget ||
      '',
    '{hora_evento}':
      wi.time ||
      wi.eventTime ||
      wi.hora ||
      wi.ceremonyTime ||
      '',
    '{organizador}':
      wi.plannerName ||
      wi.organizer ||
      wi.ownerName ||
      wi.createdBy ||
      '',
    '{lugar_direccion}':
      wi.venueAddress ||
      wi.address ||
      wi.ceremonyAddress ||
      wi.receptionAddress ||
      '',
  };
};

const buildProviderVariables = (provider = {}) => ({
  '{proveedor_nombre}': provider.name || provider.nombre || '',
  '{proveedor_servicio}': provider.service || provider.servicio || '',
  '{proveedor_presupuesto_asignado}':
    provider.assignedBudget ??
    provider.presupuestoAsignado ??
    provider.budgetTarget ??
    '',
  '{presupuesto_asignado}':
    provider.assignedBudget ??
    provider.presupuestoAsignado ??
    provider.budgetTarget ??
    '',
});

/**
 * Envía un email de solicitud de presupuesto a todos los proveedores indicados y registra la actividad.
 * Devuelve un resumen con enviados y errores.
 *
 * @param {Object} options
 * @param {string} options.weddingId
 * @param {Array<{id:string,name:string,email:string,service?:string}>} options.providers
 * @param {string} [options.subject]
 * @param {string} [options.body]
 * @param {Object} [options.weddingInfo]
 * @returns {Promise<{sent:number,errors:Array,fail:number}>}
 */
export async function sendBulkRfqAutomation({
  weddingId,
  providers = [],
  subject = 'Solicitud de presupuesto',
  body = DEFAULT_BODY,
  weddingInfo = {},
} = {}) {
  const targets = providers.filter((p) => !!p?.email);
  if (!targets.length) {
    return { sent: 0, fail: providers.length, errors: providers.map((p) => ({ id: p?.id, error: 'missing_email' })) };
  }

  const requestResults = {
    sent: 0,
    fail: 0,
    errors: [],
  };

  const baseVars = buildWeddingVariables(weddingInfo, {
    weddingId,
  });

  for (const provider of targets) {
    try {
      const subjectCompiled = interpolate(subject, {
        ...baseVars,
        ...buildProviderVariables(provider),
        '{servicio}': provider.service || baseVars['{servicio}'],
      });
      const bodyCompiled = interpolate(body, {
        ...baseVars,
        ...buildProviderVariables(provider),
        '{servicio}': provider.service || baseVars['{servicio}'],
      });

      const mailResp = await apiPost(
        '/api/mail',
        {
          to: provider.email,
          subject: subjectCompiled,
          body: bodyCompiled,
        },
        { auth: true },
      );

      if (!mailResp.ok) {
        const json = await mailResp.json().catch(() => ({}));
        requestResults.fail += 1;
        requestResults.errors.push({ id: provider.id, email: provider.email, error: json?.message || mailResp.statusText });
        continue;
      }

      requestResults.sent += 1;

      if (weddingId && provider.id) {
        try {
          const historyCol = collection(db, 'weddings', weddingId, 'suppliers', provider.id, 'rfqHistory');
          await addDoc(historyCol, {
            subject: subjectCompiled,
            body: bodyCompiled,
            email: provider.email,
            sentAt: serverTimestamp(),
            status: 'sent',
            auto: true,
          });
          await addDoc(collection(db, 'weddings', weddingId, 'suppliers', provider.id, 'rfqLogs'), {
            type: 'auto_rfq',
            subject: subjectCompiled,
            email: provider.email,
            createdAt: serverTimestamp(),
          }).catch(() => {});
          await addDoc(collection(db, 'weddings', weddingId, 'rfqActivity'), {
            supplierId: provider.id,
            supplierName: provider.name || '',
            subject: subjectCompiled,
            createdAt: serverTimestamp(),
            kind: 'auto_rfq',
          }).catch(() => {});
          await addDoc(collection(db, 'weddings', weddingId, 'suppliers', provider.id, 'rfqFollowups'), {
            subject: subjectCompiled,
            email: provider.email,
            scheduledFor: null,
            status: 'auto_sent',
            createdAt: serverTimestamp(),
            auto: true,
          }).catch(() => {});
        } catch {
          /* noop */
        }
      }
    } catch (error) {
      requestResults.fail += 1;
      requestResults.errors.push({
        id: provider.id,
        email: provider.email,
        error: error?.message || String(error),
      });
    }
  }

  return requestResults;
}
