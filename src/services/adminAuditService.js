import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebaseConfig.jsx';
import errorLogger from '../utils/errorLogger';
import { apiPost } from './apiClient';
import { getAdminHeaders, getAdminSessionToken } from './adminSession';

const AUDIT_COLLECTION = 'adminAuditLogs';

const withTimestamp = (payload = {}) => ({
  ...payload,
  createdAt: payload.createdAt || serverTimestamp(),
});

const safeCollection = () => {
  if (!db) {
    return null;
  }
  try {
    return collection(db, AUDIT_COLLECTION);
  } catch (error) {
    errorLogger?.logError?.('AdminAuditCollectionError', { message: error.message });
    return null;
  }
};

export const recordAdminAudit = async (action, payload = {}) => {
  if (!action) {
    return false;
  }
  // 1) Intentar vía backend protegido si hay sesión admin
  try {
    const token = getAdminSessionToken();
    if (token) {
      const res = await apiPost('/api/admin/audit', { action, ...payload }, { auth: false, headers: getAdminHeaders() });
      if (res && res.status === 204) return true;
    }
  } catch (error) {
    errorLogger?.logError?.('AdminAuditHttpError', { action, message: error?.message });
  }

  // 2) Fallback: escribir directamente en Firestore (puede fallar según reglas)
  const col = safeCollection();
  if (!col) return false;
  try {
    await addDoc(col, withTimestamp({ action, ...payload }));
    return true;
  } catch (error) {
    errorLogger?.logError?.('AdminAuditWriteError', { action, message: error.message });
    return false;
  }
};

export const recordAdminSecurityEvent = async ({ action, email, outcome, reason }) => {
  return recordAdminAudit(action, {
    actor: email || 'unknown',
    resourceType: 'auth',
    outcome,
    details: reason,
  });
};

export default recordAdminAudit;
