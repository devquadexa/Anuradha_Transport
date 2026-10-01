import apiClient from '../../../services/apiClient';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials).then((res) => res.data.data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((res) => res.data),
  me: () => apiClient.get('/auth/me').then((res) => res.data.data),
};
