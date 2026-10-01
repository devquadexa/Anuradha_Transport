import apiClient from '../../../services/apiClient';

export const locationsApi = {
  list: (params) => apiClient.get('/locations', { params }).then((res) => res.data),
  listActive: (customerId) => apiClient.get('/locations/active', { params: customerId ? { customerId } : {} }).then((res) => res.data.data),
  getById: (id) => apiClient.get(`/locations/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/locations', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/locations/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/locations/${id}`).then((res) => res.data),
};
