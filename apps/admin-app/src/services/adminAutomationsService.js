import { apiGet, apiPut, apiPost } from './apiClient';
import { getAdminFetchOptions } from './adminSession';
import { getAuthenticatedAdminOptions } from '../utils/adminApiHelper';

const ANNIVERSARY_BASE = '/api/automation/anniversary';
const PARTNER_BASE = '/api/automation/partner-summary';

export async function fetchAnniversaryAutomation(opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiGet(
    `${ANNIVERSARY_BASE}/config`,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'fetch_anniversary_config_failed');
  }
  return res.json();
}

export async function updateAnniversaryAutomation(payload, opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiPut(
    `${ANNIVERSARY_BASE}/config`,
    payload,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'update_anniversary_config_failed');
  }
  return res.json();
}

export async function runAnniversaryAutomation(payload = {}, opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiPost(
    `${ANNIVERSARY_BASE}/run`,
    payload,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'run_anniversary_automation_failed');
  }
  return res.json();
}

export async function fetchPartnerSummaryAutomation(opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiGet(
    `${PARTNER_BASE}/config`,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'fetch_partner_summary_config_failed');
  }
  return res.json();
}

export async function updatePartnerSummaryAutomation(payload, opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiPut(
    `${PARTNER_BASE}/config`,
    payload,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'update_partner_summary_config_failed');
  }
  return res.json();
}

export async function runPartnerSummaryAutomation(payload = {}, opts = {}) {
  const options = await getAuthenticatedAdminOptions({ ...opts });
  const res = await apiPost(
    `${PARTNER_BASE}/run`,
    payload,
    options,
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || 'run_partner_summary_failed');
  }
  return res.json();
}
