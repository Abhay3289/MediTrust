
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { authService } from '../services/authService';
import { apiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('meditrust_access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('meditrust_access_token');
        localStorage.removeItem('meditrust_refresh_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (payload) => {
    await authService.login(payload);

    const userData = await authService.me();

    setUser(userData);

    return userData;
  };

  const googleLogin = async (credential) => {
    await authService.googleLogin(credential);

    const userData = await authService.me();

    setUser(userData);

    return userData;
  };

  const register = async (payload) => {
    const userData = await authService.register(payload);

    await authService.login({
      identifier: payload.identifier,
      password: payload.password,
    });

    setUser(userData);

    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('meditrust_access_token');
      localStorage.removeItem('meditrust_refresh_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        error: apiError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

