import apiClient from '../../../services/apiClient';

export const customersApi = {
  list: (params) => apiClient.get('/customers', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/customers/${id}`).then((res) => res.data.data),
  create: (payload) => apiClient.post('/customers', payload).then((res) => res.data.data),
  update: (id, payload) => apiClient.put(`/customers/${id}`, payload).then((res) => res.data.data),
  remove: (id) => apiClient.delete(`/customers/${id}`).then((res) => res.data),
  listDivisions: () => apiClient.get('/divisions').then((res) => res.data.data),
};
