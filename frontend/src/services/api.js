import axios from 'axios';

// Base URL: usa o proxy do Vite em dev, a URL real em produção
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de resposta — trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expirado — limpar sessão
      localStorage.removeItem('sh_token');
      localStorage.removeItem('sh_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Funções de Auth ──────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
};

// ── Funções de Eventos ───────────────────────────────────────
export const eventService = {
  getAll:        (params) => api.get('/events', { params }),
  getById:       (id)     => api.get(`/events/${id}`),
  create:        (data)   => api.post('/events', data),
  update:        (id, data) => api.put(`/events/${id}`, data),
  delete:        (id)     => api.delete(`/events/${id}`),
  join:          (id)     => api.post(`/events/${id}/join`),
  leave:         (id)     => api.delete(`/events/${id}/join`),
  getParticipants: (id)   => api.get(`/events/${id}/participants`),
};

// ── Funções de Avaliações ────────────────────────────────────
export const ratingService = {
  submit:     (data)   => api.post('/ratings', data),
  getByUser:  (userId) => api.get(`/ratings/user/${userId}`),
  getRanking: (params) => api.get('/ratings/ranking', { params }),
};

// ── Funções de Utilizadores ──────────────────────────────────
export const userService = {
  getMe:         ()       => api.get('/users/me'),
  getById:       (id)     => api.get(`/users/${id}`),
  updateProfile: (data)   => api.put('/users/profile', data),
};

// ── Upload de Ficheiros (Blob Storage) ───────────────────────
export const uploadService = {
  eventPhoto: (eventId, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('eventId', eventId);
    return api.post('/upload/event-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  avatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Admin ────────────────────────────────────────────────────
export const adminService = {
  getUsers:      ()         => api.get('/admin/users'),
  setUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser:    (id)       => api.delete(`/admin/users/${id}`),
  getEvents:     ()         => api.get('/admin/events'),
  cancelEvent:   (id)       => api.patch(`/admin/events/${id}/cancel`),
  getStats:      ()         => api.get('/admin/stats'),
};
