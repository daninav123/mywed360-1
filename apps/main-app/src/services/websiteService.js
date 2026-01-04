/**
 * Website Service - PostgreSQL Version
 * Gestión de webs de boda generadas
 */

import { get as apiGet, post as apiPost } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';
const RESERVED_SLUGS = new Set(['www', 'api', 'mg', 'mail', 'cdn', 'static', 'assets', 'admin']);

const fetchVersions = async (uid, weddingId) => {
  try {
    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams({ userId: uid });
    if (weddingId) params.append('weddingId', weddingId);
    
    const response = await fetch(`${API_URL}/api/wedding-pages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.versions || result.data || [];
  } catch {
    return [];
  }
};

const fetchPromptLibrary = async (uid) => {
  if (!uid) return [];
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/website-prompts/${uid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const result = await response.json();
    return result.prompts || result.data || [];
  } catch {
    return [];
  }
};

const normalizePromptPayload = ({ name, description, prompt, templateKey }) => {
  const trimmedPrompt = String(prompt || '').trim();
  if (!trimmedPrompt) throw new Error('El prompt no puede estar vacio');

  return {
    name: String(name || '').trim() || 'Prompt personalizado',
    description: String(description || '').trim(),
    prompt: trimmedPrompt,
    templateKey: String(templateKey || 'personalizada').trim() || 'personalizada',
  };
};

const createDraft = async (uid, weddingId, html, css, metadata = {}) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/wedding-pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: uid,
        weddingId,
        html,
        css,
        metadata,
        status: 'draft'
      })
    });
    
    if (!response.ok) throw new Error('Error creating draft');
    const result = await response.json();
    return result.page || result.data;
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};

const publishPage = async (uid, weddingId, pageId) => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/wedding-pages/${pageId}/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: uid, weddingId })
    });
    
    if (!response.ok) throw new Error('Error publishing page');
    return response.json();
  } catch (error) {
    console.error('Error publishing page:', error);
    throw error;
  }
};

const deleteVersion = async (uid, weddingId, versionId, scope) => {
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/wedding-pages/${versionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return true;
  } catch (error) {
    console.error('Error deleting version:', error);
    return false;
  }
};

export default {
  fetchVersions,
  fetchPromptLibrary,
  normalizePromptPayload,
  createDraft,
  publishPage,
  deleteVersion,
  RESERVED_SLUGS,
};
