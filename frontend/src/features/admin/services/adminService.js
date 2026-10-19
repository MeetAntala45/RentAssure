import axiosInstance from '../../../lib/axiosInstance';

const adminService = {
  // ─── Dashboard & Metrics ──────────────────────────────────────────
  getStats: async () => {
    const response = await axiosInstance.get('/admin/dashboard/stats');
    return response.data;
  },

  getAudits: async (count = 50) => {
    const response = await axiosInstance.get(`/admin/dashboard/audits?count=${count}`);
    return response.data;
  },

  // ─── Vendors Operations ───────────────────────────────────────────
  getVendors: async ({ status, search, page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await axiosInstance.get(`/admin/vendors?${params.toString()}`);
    return response.data;
  },

  getVendorById: async (id) => {
    const response = await axiosInstance.get(`/admin/vendors/${id}`);
    return response.data;
  },

  approveVendor: async (id, adminNotes = '') => {
    const response = await axiosInstance.post(`/admin/vendors/${id}/approve`, {
      adminNotes,
    });
    return response.data;
  },

  rejectVendor: async (id, reason) => {
    const response = await axiosInstance.post(`/admin/vendors/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  suspendVendor: async (id, reason) => {
    const response = await axiosInstance.post(`/admin/vendors/${id}/suspend`, {
      reason,
    });
    return response.data;
  },

  updateVendorCommission: async (id, commissionRate) => {
    const response = await axiosInstance.put(`/admin/vendors/${id}/commission`, {
      commissionRate: commissionRate !== '' && commissionRate !== null ? Number(commissionRate) : null,
    });
    return response.data;
  },

  // ─── Disputes Adjudication ────────────────────────────────────────
  getDisputes: async ({ status, search, page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await axiosInstance.get(`/admin/disputes?${params.toString()}`);
    return response.data;
  },

  getDisputeById: async (id) => {
    const response = await axiosInstance.get(`/admin/disputes/${id}`);
    return response.data;
  },

  resolveDispute: async (id, { decision, refundToCustomerAmount, payoutToVendorAmount, adminNotes }) => {
    const response = await axiosInstance.post(`/admin/disputes/${id}/resolve`, {
      decision: Number(decision),
      refundToCustomerAmount: Number(refundToCustomerAmount) || 0,
      payoutToVendorAmount: Number(payoutToVendorAmount) || 0,
      adminNotes: adminNotes || 'Resolved by Administrator.',
    });
    return response.data;
  },

  // ─── Bookings & Escrow ────────────────────────────────────────────
  getBookings: async ({ status, search, page = 1, pageSize = 10 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await axiosInstance.get(`/admin/bookings?${params.toString()}`);
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await axiosInstance.get(`/admin/bookings/${id}`);
    return response.data;
  },

  // ─── Categories & Catalog ─────────────────────────────────────────
  getCategories: async () => {
    const response = await axiosInstance.get('/admin/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await axiosInstance.post('/admin/categories', {
      ...categoryData,
      commissionRate: Number(categoryData.commissionRate) || 10,
    });
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await axiosInstance.put(`/admin/categories/${id}`, {
      ...categoryData,
      commissionRate: Number(categoryData.commissionRate) || 10,
    });
    return response.data;
  },

  toggleCategoryStatus: async (id) => {
    const response = await axiosInstance.patch(`/admin/categories/${id}/toggle-status`);
    return response.data;
  },

  // ─── Platform Settings ────────────────────────────────────────────
  getSettings: async () => {
    const response = await axiosInstance.get('/admin/settings');
    return response.data;
  },

  updateSetting: async (settingKey, settingValue) => {
    const response = await axiosInstance.put('/admin/settings', {
      settingKey,
      settingValue,
    });
    return response.data;
  },
};

export default adminService;
