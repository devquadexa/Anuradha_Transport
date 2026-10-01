import apiClient from '../../../services/apiClient';

export const rolesApi = {
  list: () => apiClient.get('/roles').then((res) => res.data.data),
};
