import axiosInstance from '../../../lib/axiosInstance';

const authService = {
  register: async (data) => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  login: async (data) => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (idToken) => {
    const response = await axiosInstance.post('/auth/google', { idToken });
    return response.data;
  },

  getSession: async () => {
    const response = await axiosInstance.get('/auth/session');
    return response.data;
  },

  refresh: async () => {
    const response = await axiosInstance.post('/auth/refresh');
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },
};

export default authService;
