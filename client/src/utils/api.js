// src/utils/api.js – Centralized API calls
import axios from 'axios';

const BASE = '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Leads
export const leadsApi = {
  getAll: () => api.get('/leads').then(r => r.data.data),
  getOne: (id) => api.get(`/leads/${id}`).then(r => r.data.data),
  create: (data) => api.post('/leads', data).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }).then(r => r.data),
  updateTag: (id, tag) => api.patch(`/leads/${id}/tag`, { tag }).then(r => r.data),
  delete: (id) => api.delete(`/leads/${id}`).then(r => r.data)
};

// Chat
export const chatApi = {
  getMessages: (leadId) => api.get(`/chat/${leadId}/messages`).then(r => r.data),
  sendMessage: (leadId, content) => api.post(`/chat/${leadId}/send`, { content }).then(r => r.data),
  sendFollowUp: (leadId) => api.post(`/chat/${leadId}/followup`).then(r => r.data),
  checkFollowUps: () => api.get('/chat/followup/check').then(r => r.data)
};

// Admin
export const adminApi = {
  getSettings: () => api.get('/admin/settings').then(r => r.data.data),
  updateSettings: (data) => api.put('/admin/settings', data).then(r => r.data.data),
  addFaq: (q, a) => api.post('/admin/faq', { question: q, answer: a }).then(r => r.data),
  deleteFaq: (index) => api.delete(`/admin/faq/${index}`).then(r => r.data)
};

// Analytics
export const analyticsApi = {
  get: () => api.get('/analytics').then(r => r.data.data)
};

export default api;
