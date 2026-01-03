import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4004';

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const tasksAPI = {
  getAll: async (weddingId) => {
    const { data } = await apiClient.get(`/api/tasks/wedding/${weddingId}`);
    return data;
  },
  
  create: async (weddingId, taskData) => {
    const { data } = await apiClient.post(`/api/tasks/wedding/${weddingId}`, taskData);
    return data;
  },
  
  update: async (taskId, updates) => {
    const { data } = await apiClient.put(`/api/tasks/${taskId}`, updates);
    return data;
  },
  
  delete: async (taskId) => {
    const { data } = await apiClient.delete(`/api/tasks/${taskId}`);
    return data;
  },
  
  bulkUpdate: async (weddingId, tasks) => {
    const { data } = await apiClient.put(`/api/tasks/wedding/${weddingId}/bulk`, { tasks });
    return data;
  }
};

export const timelineAPI = {
  getAll: async (weddingId) => {
    const { data } = await apiClient.get(`/api/timeline/wedding/${weddingId}`);
    return data;
  },
  
  create: async (weddingId, eventData) => {
    const { data } = await apiClient.post(`/api/timeline/wedding/${weddingId}`, eventData);
    return data;
  },
  
  update: async (eventId, updates) => {
    const { data } = await apiClient.put(`/api/timeline/${eventId}`, updates);
    return data;
  },
  
  delete: async (eventId) => {
    const { data } = await apiClient.delete(`/api/timeline/${eventId}`);
    return data;
  },
  
  bulkUpdate: async (weddingId, events) => {
    const { data } = await apiClient.put(`/api/timeline/wedding/${weddingId}/bulk`, { events });
    return data;
  }
};

export const specialMomentsAPI = {
  getAll: async (weddingId, blockId = null) => {
    const params = blockId ? { blockId } : {};
    const { data } = await apiClient.get(`/api/special-moments/wedding/${weddingId}`, { params });
    return data;
  },
  
  create: async (weddingId, momentData) => {
    const { data } = await apiClient.post(`/api/special-moments/wedding/${weddingId}`, momentData);
    return data;
  },
  
  update: async (momentId, updates) => {
    const { data } = await apiClient.put(`/api/special-moments/${momentId}`, updates);
    return data;
  },
  
  delete: async (momentId) => {
    const { data } = await apiClient.delete(`/api/special-moments/${momentId}`);
    return data;
  },
  
  deleteBlock: async (weddingId, blockId) => {
    const { data } = await apiClient.delete(`/api/special-moments/wedding/${weddingId}/block/${blockId}`);
    return data;
  }
};

export const transactionsAPI = {
  getAll: async (weddingId, filters = {}) => {
    const { data } = await apiClient.get(`/api/transactions/wedding/${weddingId}`, { params: filters });
    return data;
  },
  
  create: async (weddingId, transactionData) => {
    const { data } = await apiClient.post(`/api/transactions/wedding/${weddingId}`, transactionData);
    return data;
  },
  
  update: async (transactionId, updates) => {
    const { data } = await apiClient.put(`/api/transactions/${transactionId}`, updates);
    return data;
  },
  
  delete: async (transactionId) => {
    const { data } = await apiClient.delete(`/api/transactions/${transactionId}`);
    return data;
  },
  
  getSummary: async (weddingId) => {
    const { data } = await apiClient.get(`/api/transactions/wedding/${weddingId}/summary`);
    return data;
  }
};

export const budgetAPI = {
  get: async (weddingId) => {
    const { data } = await apiClient.get(`/api/budget/wedding/${weddingId}`);
    return data;
  },
  update: async (weddingId, budgetData) => {
    const { data } = await apiClient.put(`/api/budget/wedding/${weddingId}`, budgetData);
    return data;
  },
  updateBudget: async (weddingId, budget) => {
    const { data } = await apiClient.patch(`/api/budget/wedding/${weddingId}/budget`, budget);
    return data;
  },
  updateContributions: async (weddingId, contributions) => {
    const { data } = await apiClient.patch(`/api/budget/wedding/${weddingId}/contributions`, contributions);
    return data;
  },
  updateSettings: async (weddingId, settings) => {
    const { data } = await apiClient.patch(`/api/budget/wedding/${weddingId}/settings`, settings);
    return data;
  },
};

export const guestsAPI = {
  getAll: async (weddingId) => {
    const { data } = await apiClient.get(`/api/guests-pg/wedding/${weddingId}`);
    return data;
  },
  create: async (weddingId, guestData) => {
    const { data } = await apiClient.post(`/api/guests-pg/wedding/${weddingId}`, guestData);
    return data;
  },
  update: async (guestId, updates) => {
    const { data } = await apiClient.put(`/api/guests-pg/${guestId}`, updates);
    return data;
  },
  delete: async (guestId) => {
    const { data } = await apiClient.delete(`/api/guests-pg/${guestId}`);
    return data;
  },
  bulkUpdate: async (weddingId, guests) => {
    const { data } = await apiClient.put(`/api/guests-pg/wedding/${weddingId}/bulk`, { guests });
    return data;
  },
};

export const weddingInfoAPI = {
  get: async (weddingId) => {
    const { data } = await apiClient.get(`/api/wedding-info/${weddingId}`);
    return data;
  },
  update: async (weddingId, updates) => {
    const { data } = await apiClient.patch(`/api/wedding-info/${weddingId}`, updates);
    return data;
  },
  updateInfo: async (weddingId, infoUpdates) => {
    const { data } = await apiClient.patch(`/api/wedding-info/${weddingId}/info`, infoUpdates);
    return data;
  },
};

export const seatingPlanAPI = {
  get: async (weddingId) => {
    const { data } = await apiClient.get(`/api/seating-plan/${weddingId}`);
    return data;
  },
  update: async (weddingId, seatingData) => {
    const { data } = await apiClient.put(`/api/seating-plan/${weddingId}`, seatingData);
    return data;
  },
  updateTables: async (weddingId, tables) => {
    const { data } = await apiClient.patch(`/api/seating-plan/${weddingId}/tables`, { tables });
    return data;
  },
};

export const ceremonyAPI = {
  get: async (weddingId) => {
    const { data } = await apiClient.get(`/api/ceremony/${weddingId}`);
    return data;
  },
  update: async (weddingId, ceremonyData) => {
    const { data } = await apiClient.put(`/api/ceremony/${weddingId}`, ceremonyData);
    return data;
  },
  updateChecklist: async (weddingId, checklist) => {
    const { data } = await apiClient.patch(`/api/ceremony/${weddingId}/checklist`, checklist);
    return data;
  },
  updateTimeline: async (weddingId, timeline) => {
    const { data } = await apiClient.patch(`/api/ceremony/${weddingId}/timeline`, timeline);
    return data;
  },
  updateTexts: async (weddingId, texts) => {
    const { data } = await apiClient.patch(`/api/ceremony/${weddingId}/texts`, texts);
    return data;
  },
};

export const favoritesAPI = {
  getAll: async (weddingId) => {
    const { data } = await apiClient.get('/api/favorites', {
      headers: { 'x-wedding-id': weddingId },
    });
    return data;
  },
  add: async (weddingId, favoriteData) => {
    const { data } = await apiClient.post('/api/favorites', favoriteData, {
      headers: { 'x-wedding-id': weddingId },
    });
    return data;
  },
  remove: async (weddingId, favoriteId) => {
    const { data } = await apiClient.delete(`/api/favorites/${favoriteId}`, {
      headers: { 'x-wedding-id': weddingId },
    });
    return data;
  },
  update: async (weddingId, favoriteId, updates) => {
    const { data } = await apiClient.patch(`/api/favorites/${favoriteId}`, updates, {
      headers: { 'x-wedding-id': weddingId },
    });
    return data;
  },
};

export const supplierGroupsAPI = {
  getAll: async (weddingId) => {
    const { data } = await apiClient.get(`/api/supplier-groups/${weddingId}`);
    return data;
  },
  create: async (weddingId, groupData) => {
    const { data } = await apiClient.post(`/api/supplier-groups/${weddingId}`, groupData);
    return data;
  },
  update: async (weddingId, groupId, updates) => {
    const { data } = await apiClient.put(`/api/supplier-groups/${weddingId}/${groupId}`, updates);
    return data;
  },
  delete: async (weddingId, groupId) => {
    const { data} = await apiClient.delete(`/api/supplier-groups/${weddingId}/${groupId}`);
    return data;
  },
};

export default apiClient;
