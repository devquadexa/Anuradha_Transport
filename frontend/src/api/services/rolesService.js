import apiClient from '../client';

export const rolesApi = {
  list: () => apiClient.get('/roles').then((res) => res.data.data),
};
