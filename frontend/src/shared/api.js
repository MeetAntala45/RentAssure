import axios from 'axios';

// Backend port configuration: 5189 (HTTP) or 7240 (HTTPS)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5189/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends cookies across ports
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject Bearer token from localStorage for bulletproof cross-port auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: handle 401 and capture error messages cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized, clear token
    if (error.response?.status === 401) {
      // Don't auto-clear if it's already a login attempt failing with bad credentials
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('ra_token');
        localStorage.removeItem('ra_user');
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH APIS ─────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.data?.token) {
      localStorage.setItem('ra_token', res.data.data.token);
      localStorage.setItem('ra_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  adminLogin: async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    if (res.data?.data?.token) {
      localStorage.setItem('ra_token', res.data.data.token);
      localStorage.setItem('ra_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  register: async (fullName, email, password, confirmPassword, role = 'Customer') => {
    const res = await api.post('/auth/register', {
      fullName,
      email,
      password,
      confirmPassword,
      role,
    });
    return res.data;
  },

  googleLogin: async (idToken) => {
    const res = await api.post('/auth/google', { idToken });
    if (res.data?.data?.token) {
      localStorage.setItem('ra_token', res.data.data.token);
      localStorage.setItem('ra_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('ra_token');
      localStorage.removeItem('ra_user');
    }
  },

  getSession: async () => {
    const res = await api.get('/auth/session');
    if (res.data?.data) {
      localStorage.setItem('ra_user', JSON.stringify(res.data.data));
    }
    return res.data;
  },
};

// ─── VENDOR PORTAL APIS ────────────────────────────────────────────────────
export const vendorApi = {
  getStatus: async () => {
    const res = await api.get('/v1/vendor/status');
    return res.data;
  },

  submitOnboarding: async (data) => {
    const res = await api.post('/v1/vendor/onboarding', data);
    return res.data;
  },

  getDashboard: async () => {
    const res = await api.get('/v1/vendor/dashboard');
    return res.data;
  },

  getInventory: async () => {
    const res = await api.get('/v1/vendor/inventory');
    return res.data;
  },

  createItem: async (data) => {
    const res = await api.post('/v1/vendor/items', data);
    return res.data;
  },

  updateItem: async (id, data) => {
    const res = await api.put(`/v1/vendor/items/${id}`, data);
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await api.delete(`/v1/vendor/items/${id}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/v1/items/categories');
    return res.data;
  },
};

// ─── ADMIN PORTAL APIS ─────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },

  getVendors: async (status = null, search = null, page = 1, pageSize = 20) => {
    const params = { page, pageSize };
    if (status) params.status = status;
    if (search) params.search = search;
    const res = await api.get('/admin/vendors', { params });
    return res.data;
  },

  getVendorById: async (id) => {
    const res = await api.get(`/admin/vendors/${id}`);
    return res.data;
  },

  approveVendor: async (id, adminNotes = 'Approved after verification review') => {
    const res = await api.post(`/admin/vendors/${id}/approve`, { adminNotes });
    return res.data;
  },

  rejectVendor: async (id, reason = 'Application details could not be verified') => {
    const res = await api.post(`/admin/vendors/${id}/reject`, { reason });
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/admin/categories');
    return res.data;
  },

  createCategory: async (categoryData) => {
    const res = await api.post('/admin/categories', categoryData);
    return res.data;
  },
};

// ─── CUSTOMER PORTAL APIS ──────────────────────────────────────────────────
export const customerApi = {
  getItems: async (params = {}) => {
    const res = await api.get('/v1/items', { params });
    return res.data;
  },

  getItemById: async (id) => {
    const res = await api.get(`/v1/items/${id}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/v1/items/categories');
    return res.data;
  },

  getCities: async () => {
    const res = await api.get('/v1/items/cities');
    return res.data;
  },
};

export default api;
