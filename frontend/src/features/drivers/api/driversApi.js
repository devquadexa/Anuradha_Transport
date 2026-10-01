import apiClient from '../../../services/apiClient';

export const driversApi = {
  list: (params) => apiClient.get('/drivers', { params }).then((res) => res.data),
  listActive: () => apiClient.get('/drivers/active').then((res) => res.data.data),
  getById: (id) => apiClient.get(`/drivers/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/drivers', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/drivers/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/drivers/${id}`).then((res) => res.data),
  listDriverUsers: () => apiClient.get('/drivers/linkable-users').then((res) => res.data.data),
};
