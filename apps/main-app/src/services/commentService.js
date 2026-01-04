/**
 * Comment Service - PostgreSQL Version
 * Gestión de comentarios en emails usando API backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';

const COMMENTS_KEY_PREFIX = 'maloveapp_email_comments_';
const getStorageKey = (userId) => `${COMMENTS_KEY_PREFIX}${userId}`;

const safeLocalStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {}
  return null;
};

const loadAllComments = (userId) => {
  const store = safeLocalStorage();
  if (!store) return {};
  try {
    const raw = store.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveAllComments = (userId, mapping) => {
  const store = safeLocalStorage();
  if (!store) return;
  try {
    store.setItem(getStorageKey(userId), JSON.stringify(mapping));
  } catch {}
};

export async function getComments(userId, emailId) {
  if (!userId || !emailId) return [];

  const local = loadAllComments(userId)[emailId] || [];

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/mail/${emailId}/comments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return local;

    const result = await response.json();
    const comments = result.comments || result.data || [];

    if (comments.length) {
      const mapping = loadAllComments(userId);
      mapping[emailId] = comments;
      saveAllComments(userId, mapping);
    }

    return comments;
  } catch {
    return local;
  }
}

export async function addComment(userId, emailId, authorName, body) {
  if (!userId || !emailId || !body?.trim()) return null;

  const commentData = {
    authorId: userId,
    authorName: authorName || 'Usuario',
    body: body.trim(),
    date: new Date().toISOString(),
  };

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/mail/${emailId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) throw new Error('Error añadiendo comentario');

    const result = await response.json();
    const comment = result.comment || result.data;

    const mapping = loadAllComments(userId);
    if (!mapping[emailId]) mapping[emailId] = [];
    mapping[emailId].push(comment);
    saveAllComments(userId, mapping);

    return comment;
  } catch (error) {
    console.error('Error añadiendo comentario:', error);

    const tempId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const tempComment = { ...commentData, id: tempId };
    
    const mapping = loadAllComments(userId);
    if (!mapping[emailId]) mapping[emailId] = [];
    mapping[emailId].push(tempComment);
    saveAllComments(userId, mapping);

    return tempComment;
  }
}

export async function deleteComment(userId, emailId, commentId) {
  if (!userId || !emailId || !commentId) return false;

  try {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_URL}/api/mail/${emailId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const mapping = loadAllComments(userId);
    if (mapping[emailId]) {
      mapping[emailId] = mapping[emailId].filter(c => c.id !== commentId);
      saveAllComments(userId, mapping);
    }

    return true;
  } catch (error) {
    console.error('Error eliminando comentario:', error);

    const mapping = loadAllComments(userId);
    if (mapping[emailId]) {
      mapping[emailId] = mapping[emailId].filter(c => c.id !== commentId);
      saveAllComments(userId, mapping);
    }

    return false;
  }
}
