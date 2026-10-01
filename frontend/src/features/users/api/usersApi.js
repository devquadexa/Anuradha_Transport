import apiClient from '../../../services/apiClient';

export const usersApi = {
  list: (params) => apiClient.get('/users', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/users/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/users', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/users/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/users/${id}`).then((res) => res.data),
};
