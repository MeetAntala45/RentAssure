import axiosInstance from '../../../lib/axiosInstance';

const vendorService = {
  getDashboard: async () => {
    const response = await axiosInstance.get('/v1/vendor/dashboard');
    return response.data;
  },

  getInventory: async () => {
    const response = await axiosInstance.get('/v1/vendor/inventory');
    return response.data;
  },

  createItem: async (data) => {
    const response = await axiosInstance.post('/v1/vendor/items', data);
    return response.data;
  },

  updateItem: async (id, data) => {
    const response = await axiosInstance.put(`/v1/vendor/items/${id}`, data);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await axiosInstance.delete(`/v1/vendor/items/${id}`);
    return response.data;
  },

  getVendorBookings: async () => {
    const response = await axiosInstance.get('/v1/vendor/bookings');
    return response.data;
  },

  updateOrderStatus: async (id, data) => {
    const response = await axiosInstance.put(`/v1/vendor/bookings/${id}/status`, data);
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await axiosInstance.put('/v1/vendor/profile', data);
    return response.data;
  },
};

export default vendorService;
