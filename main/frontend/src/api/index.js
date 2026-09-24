import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to append JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload or redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  createSuperAdmin: (data) => api.post('/auth/super-admin', data)
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  createEmployee: (data) => api.post('/users/employees', data),
  deactivate: (id) => api.delete(`/users/${id}`)
};

export const taskService = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`)
};

export const attendanceService = {
  getAll: () => api.get('/attendance'),
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  startBreak: (data) => api.post('/attendance/break/start', data),
  endBreak: () => api.post('/attendance/break/end')
};

export const leaveService = {
  getAll: () => api.get('/leaves'),
  create: (data) => api.post('/leaves', data),
  update: (id, data) => api.put(`/leaves/${id}`, data)
};

export const payrollService = {
  getAll: () => api.get('/payroll'),
  getById: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  delete: (id) => api.delete(`/payroll/${id}`)
};

export const announcementService = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  delete: (id) => api.delete(`/announcements/${id}`)
};

export const advertisementService = {
  getAll: () => api.get('/advertisements'),
  create: (data) => api.post('/advertisements', data),
  update: (id, data) => api.put(`/advertisements/${id}`, data),
  delete: (id) => api.delete(`/advertisements/${id}`)
};

export const rateService = {
  get: () => api.get('/rates'),
  update: (data) => api.put('/rates', data)
};

export default api;
