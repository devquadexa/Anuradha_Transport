import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../features/auth/api/authApi';
import { tokenStorage } from '../utils/tokenStorage';

const AuthContext = createContext(null);

/**
 * Owns authentication state (current user + loading) for the whole app.
 * Login/logout mutate this context; ProtectedRoute and role-based
 * navigation read from it via useAuth().
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (credentials) => {
    const { accessToken, refreshToken, user: loggedInUser } = await authApi.login(credentials);
    tokenStorage.setTokens({ accessToken, refreshToken });
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // best-effort; clear local state regardless
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles) => !!user && roles.includes(user.role), [user]);
  const hasPermission = useCallback(
    (permission) => !!user && Array.isArray(user.permissions) && user.permissions.includes(permission),
    [user]
  );

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout, hasRole, hasPermission }),
    [user, isLoading, login, logout, hasRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
