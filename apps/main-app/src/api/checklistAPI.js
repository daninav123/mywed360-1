import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Obtener el token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Configurar headers con autenticación
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`
  }
});

// GET /api/checklist/:weddingId/tabs - Obtener todas las tabs con sus tasks
export const getTabs = async (weddingId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/checklist/${weddingId}/tabs`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error fetching tabs:', error);
    throw error;
  }
};

// POST /api/checklist/:weddingId/tabs - Crear nueva tab
export const createTab = async (weddingId, name) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/checklist/${weddingId}/tabs`,
      { name },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error creating tab:', error);
    throw error;
  }
};

// DELETE /api/checklist/:weddingId/tabs/:tabId - Eliminar tab
export const deleteTab = async (weddingId, tabId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/checklist/${weddingId}/tabs/${tabId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error deleting tab:', error);
    throw error;
  }
};

// POST /api/checklist/:weddingId/tasks - Crear nueva task
export const createTask = async (weddingId, tabId, title, category) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/checklist/${weddingId}/tasks`,
      { tabId, title, category },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error creating task:', error);
    throw error;
  }
};

// PATCH /api/checklist/:weddingId/tasks/:taskId - Actualizar task (completar/descompletar)
export const updateTask = async (weddingId, taskId, completed) => {
  try {
    const response = await axios.patch(
      `${API_URL}/api/checklist/${weddingId}/tasks/${taskId}`,
      { completed },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error updating task:', error);
    throw error;
  }
};

// DELETE /api/checklist/:weddingId/tasks/:taskId - Eliminar task
export const deleteTask = async (weddingId, taskId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/checklist/${weddingId}/tasks/${taskId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('[checklistAPI] Error deleting task:', error);
    throw error;
  }
};

export default {
  getTabs,
  createTab,
  deleteTab,
  createTask,
  updateTask,
  deleteTask
};
