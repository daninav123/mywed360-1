import i18n from '../i18n';
import { apiPost } from './apiClient';

const LOGIN_PATH = '/api/admin/login';
const MFA_PATH = '/api/admin/login/mfa';
const LOGOUT_PATH = '/api/admin/logout';

function parseDate(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

async function request(path, body = {}) {
  const res = await apiPost(path, body, { auth: false, credentials: 'include' });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const error = new Error(
      data?.message ||
        i18n.t('common.pudo_completar_operacion_administrativa')
    );
    error.code = data?.code || 'admin_request_failedi18n.t('common.datalockeduntil_errorlockeduntil_parsedatedatalockeduntil_throw_error_return')admin_request_failed') {
      console.warn('[adminAuthClient] logout admin fallback:', error);
    }
  }
  return { success: true };
}
