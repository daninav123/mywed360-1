import { apiPost } from './apiClient';
import { hasAdminSession, getAdminSessionToken, getAdminFetchOptions } from './adminSession';

const ADMIN_AUDIT_ENDPOINT = '/api/admin/audit';
const ENABLE_ADMIN_AUDIT = (import.meta && import.meta.env && import.meta.env.VITE_ENABLE_ADMIN_AUDIT === 'true') || false;

const sanitize = (value, max = 256) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const buildPayload = (event = {}) => {
  const action = sanitize(event.action) || 'UNKNOWN_ADMIN_EVENT';
  const actor = sanitize(event.actor || event.email || '');
  const outcome = sanitize(event.outcome || '');
  const resourceType = sanitize(event.resourceType || '');
  const resourceId = sanitize(event.resourceId || '');
  const reason = sanitize(event.reason || '');
  const path = sanitize(event.path || event.route || '');

  const payload = {
    action,
    outcome: outcome || undefined,
    actor: actor || undefined,
    resourceType: resourceType || undefined,
    resourceId: resourceId || undefined,
  };

  const metadata = { ...(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}) };
  if (reason) metadata.reason = reason;
  if (path) metadata.path = path;
  if (event.context && typeof event.context === 'object') {
    metadata.context = { ...(metadata.context || {}), ...event.context };
  }

  if (Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  if (event.payload && typeof event.payload === 'object') {
    payload.payload = event.payload;
  } else if (typeof event.payload === 'string') {
    payload.payload = sanitize(event.payload, 512);
  } else if (reason || path) {
    payload.payload = { reason, path };
  }

  return payload;
};

export async function recordAdminSecurityEvent(event) {
  try {
    if (!ENABLE_ADMIN_AUDIT) {
      return false;
    }
    const hasSession = hasAdminSession();
    if (!hasSession) {
      return false;
    }

    const token = getAdminSessionToken();
    const opts = getAdminFetchOptions({ auth: false, silent: true });
    if (token) {
      opts.headers = { ...(opts.headers || {}), 'X-Admin-Session': token };
    }
    // Refuerzo para evitar logging de error en consola del interceptador
    opts.headers = { ...(opts.headers || {}), 'X-Suppress-Error-Logging': '1' };

    const res = await apiPost(ADMIN_AUDIT_ENDPOINT, buildPayload(event), opts);

    if (!res?.ok && import.meta && import.meta.env && import.meta.env.DEV) {
      // console.warn('[adminAuditService] No se pudo registrar el evento', res?.status);
    }
    return !!res?.ok;
  } catch (error) {
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      // console.warn('[adminAuditService] Error enviando evento de auditoria', error);
    }
    return false;
  }
}
