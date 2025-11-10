import { getAdminFetchOptions } from './adminSession';

const BASE_URL = '/api/admin/blog';

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(payload?.error || 'admin-blog-request-failed');
    error.details = payload;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export async function listAdminBlogPosts(params = {}) {
  const url = new URL(BASE_URL, window.location.origin);
  if (params.status) url.searchParams.set('status', params.status);
  if (params.language) url.searchParams.set('language', params.language);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    ...getAdminFetchOptions(),
    method: 'GET',
  });
  return handleResponse(response);
}

export async function generateAdminBlogPost(payload) {
  const response = await fetch(BASE_URL, {
    ...getAdminFetchOptions({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  });
  return handleResponse(response);
}

export async function updateAdminBlogPost(id, payload) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    ...getAdminFetchOptions({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  });
  return handleResponse(response);
}

export async function publishAdminBlogPost(id, payload = {}) {
  const response = await fetch(`${BASE_URL}/${id}/publish`, {
    ...getAdminFetchOptions({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  });
  return handleResponse(response);
}

export async function scheduleAdminBlogPost(id, scheduledAt) {
  const response = await fetch(`${BASE_URL}/${id}/schedule`, {
    ...getAdminFetchOptions({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    }),
  });
  return handleResponse(response);
}

export async function archiveAdminBlogPost(id) {
  const response = await fetch(`${BASE_URL}/${id}/archive`, {
    ...getAdminFetchOptions({
      method: 'POST',
    }),
  });
  return handleResponse(response);
}

export async function listAdminBlogPlan(params = {}) {
  const url = new URL(`${BASE_URL}/plan`, window.location.origin);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.status) url.searchParams.set('status', params.status);
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    ...getAdminFetchOptions(),
    method: 'GET',
  });
  return handleResponse(response);
}

export async function triggerAdminBlogPlanGeneration(payload = {}) {
  const response = await fetch(`${BASE_URL}/plan/generate`, {
    ...getAdminFetchOptions({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  });
  return handleResponse(response);
}
