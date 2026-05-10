// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ws_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ws_token');
      localStorage.removeItem('ws_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// --- Auth ---
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// --- Trips ---
export const tripsApi = {
  list: () => api.get('/api/trips'),
  get: (id: string) => api.get(`/api/trips/${id}`),
  create: (data: any) => api.post('/api/trips', data),
  update: (id: string, data: any) => api.put(`/api/trips/${id}`, data),
  delete: (id: string) => api.delete(`/api/trips/${id}`),
  join: (inviteCode: string) => api.post(`/api/trips/join/${inviteCode}`),
  members: (id: string) => api.get(`/api/trips/${id}/members`),
};

// --- Itinerary ---
export const itineraryApi = {
  list: (tripId: string) => api.get(`/api/itinerary/trip/${tripId}`),
  create: (data: any) => api.post('/api/itinerary', data),
  update: (id: string, data: any) => api.put(`/api/itinerary/${id}`, data),
  delete: (id: string) => api.delete(`/api/itinerary/${id}`),
  reorder: (items: { id: string; order: number; dayIndex: number }[]) =>
    api.put('/api/itinerary/reorder/bulk', { items }),
};

// --- Chat ---
export const chatApi = {
  messages: (tripId: string, params?: { limit?: number; before?: string }) =>
    api.get(`/api/chat/trip/${tripId}`, { params }),
  send: (tripId: string, content: string) =>
    api.post(`/api/chat/trip/${tripId}`, { content }),
};

// --- Voting ---
export const votingApi = {
  list: (tripId: string) => api.get(`/api/voting/trip/${tripId}`),
  create: (data: any) => api.post('/api/voting', data),
  vote: (id: string, value: 1 | -1) => api.post(`/api/voting/${id}/vote`, { value }),
  delete: (id: string) => api.delete(`/api/voting/${id}`),
};

// --- Notifications ---
export const notificationsApi = {
  list: () => api.get('/api/notifications'),
  readAll: () => api.put('/api/notifications/read-all'),
  read: (id: string) => api.put(`/api/notifications/${id}/read`),
};
