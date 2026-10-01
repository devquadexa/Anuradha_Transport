import apiClient from '../../../services/apiClient';

export const tripsApi = {
  list: (params) => apiClient.get('/trips', { params }).then((res) => res.data),
  // Fetch every trip matching the filters by paging through the capped pageSize.
  listAll: async (params = {}) => {
    const pageSize = 100; // backend max
    let page = 1;
    let all = [];
    let total = Infinity;
    while (all.length < total) {
      const res = await apiClient.get('/trips', { params: { ...params, page, pageSize } });
      const body = res.data;
      const rows = body?.data || [];
      total = body?.meta?.total ?? rows.length;
      all = all.concat(rows);
      if (rows.length === 0 || rows.length < pageSize) break;
      page += 1;
    }
    return all;
  },
  getById: (id) => apiClient.get(`/trips/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/trips', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/trips/${id}`, payload).then((res) => res.data.data),
  assign: (id, driverId) => apiClient.patch(`/trips/${id}/assign`, { driverId }).then((res) => res.data.data),
  updateStatus: (id, status, gps, extra = {}) => apiClient.patch(`/trips/${id}/status`, { status, ...gps, ...extra }).then((res) => res.data.data),
  updateStopDetails: (tripId, stopId, payload) => apiClient.patch(`/trips/${tripId}/stops/${stopId}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/trips/${id}`).then((res) => res.data),
  listPendingApproval: (params) => apiClient.get('/trips/pending-approval', { params }).then((res) => res.data),
  approveTrip: (id, payload) => apiClient.patch(`/trips/${id}/approve`, payload).then((res) => res.data.data),
  setEmergencyStop: (id, payload) => apiClient.patch(`/trips/${id}/emergency-stop`, payload).then((res) => res.data.data),
  reorderStops: (id, stops) => apiClient.patch(`/trips/${id}/reorder-stops`, { stops }).then((res) => res.data.data),
};
