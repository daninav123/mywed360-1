import { getAdminFetchOptions } from './adminSession';
import { getAuthenticatedAdminOptions } from '../utils/adminApiHelper';

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
  const options = await getAuthenticatedAdminOptions();
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    ...options,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function generateAdminBlogPost(payload) {
  const options = await getAuthenticatedAdminOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await fetch(BASE_URL, options);
  return handleResponse(response);
}

export async function updateAdminBlogPost(id, payload) {
  const options = await getAuthenticatedAdminOptions({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await fetch(`${BASE_URL}/${id}`, options);
  return handleResponse(response);
}

export async function publishAdminBlogPost(id, payload = {}) {
  const options = await getAuthenticatedAdminOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await fetch(`${BASE_URL}/${id}/publish`, options);
  return handleResponse(response);
}

export async function scheduleAdminBlogPost(id, scheduledAt) {
  const options = await getAuthenticatedAdminOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduledAt }),
  });
  const response = await fetch(`${BASE_URL}/${id}/schedule`, options);
  return handleResponse(response);
}

export async function archiveAdminBlogPost(id) {
  const options = await getAuthenticatedAdminOptions({
    method: 'POST',
  });
  const response = await fetch(`${BASE_URL}/${id}/archive`, options);
  return handleResponse(response);
}

export async function listAdminBlogPlan(params = {}) {
  const url = new URL(`${BASE_URL}/plan`, window.location.origin);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.status) url.searchParams.set('status', params.status);
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  const options = await getAuthenticatedAdminOptions();
  const response = await fetch(url.toString().replace(window.location.origin, ''), {
    ...options,
    method: 'GET',
  });
  return handleResponse(response);
}

export async function triggerAdminBlogPlanGeneration(payload = {}) {
  const options = await getAuthenticatedAdminOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const response = await fetch(`${BASE_URL}/plan/generate`, options);
  return handleResponse(response);
}
