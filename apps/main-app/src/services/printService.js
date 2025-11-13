import { post as apiPost } from './apiClient';

const DEFAULT_ENDPOINT = '/api/print/invitations';

export async function createInvitationPrintBatch({
  weddingId,
  batchId,
  assetUrl,
  guests = [],
  ownerAddress = {},
}) {
  try {
    const payload = {
      weddingId,
      batchId,
      assetUrl,
      guests,
      ownerAddress,
    };
    const response = await apiPost(DEFAULT_ENDPOINT, payload, { auth: true });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
      return {
        success: false,
        error: json.error || `HTTP ${response.status}`,
      };
    }
    return { success: true, ...json };
  } catch (error) {
    if (import.meta.env.DEV) {
      // console.warn('[printService] createInvitationPrintBatch error', error);
    }
    return { success: false, error: error?.message || 'print-batch-error' };
  }
}

export default {
  createInvitationPrintBatch,
};
