/**
 * Centralized storage for auth tokens. Kept in one module so the storage
 * mechanism (currently localStorage) can be swapped later without
 * touching consumers.
 */
const ACCESS_TOKEN_KEY = 'anuradha_tms_access_token';
const REFRESH_TOKEN_KEY = 'anuradha_tms_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
