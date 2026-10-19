import axiosInstance from '../../../lib/axiosInstance';

const itemService = {
  getCatalogItems: async (params = {}) => {
    const response = await axiosInstance.get('/v1/items', { params });
    return response.data;
  },

  getItemById: async (id) => {
    const response = await axiosInstance.get(`/v1/items/${id}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await axiosInstance.get('/v1/items/categories');
    return response.data;
  },

  getCities: async () => {
    const response = await axiosInstance.get('/v1/items/cities');
    return response.data;
  },
};

export default itemService;
