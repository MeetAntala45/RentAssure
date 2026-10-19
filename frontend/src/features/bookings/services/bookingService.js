import axiosInstance from '../../../lib/axiosInstance';

const bookingService = {
  createBooking: async (data) => {
    const response = await axiosInstance.post('/v1/bookings', data);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await axiosInstance.get('/v1/bookings/my');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axiosInstance.get(`/v1/bookings/${id}`);
    return response.data;
  },

  requestReturn: async (id, data) => {
    const response = await axiosInstance.post(`/v1/bookings/${id}/return`, data);
    return response.data;
  },

  raiseDispute: async (id, data) => {
    const response = await axiosInstance.post(`/v1/bookings/${id}/dispute`, data);
    return response.data;
  },
};

export default bookingService;
