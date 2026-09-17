import { api } from './api';

export const authService = {
  register: async (payload) => {
    const { data } = await api.post(
      '/auth/register',
      payload
    );

    return data;
  },

  login: async (payload) => {
    const { data } = await api.post(
      '/auth/login',
      payload
    );

    localStorage.setItem(
      'meditrust_access_token',
      data.access_token
    );

    localStorage.setItem(
      'meditrust_refresh_token',
      data.refresh_token
    );

    return data;
  },

  googleLogin: async (credential) => {
    const { data } = await api.post(
      '/auth/google',
      {
        credential,
      }
    );

    localStorage.setItem(
      'meditrust_access_token',
      data.access_token
    );

    localStorage.setItem(
      'meditrust_refresh_token',
      data.refresh_token
    );

    return data;
  },

  me: async () => {
    const { data } = await api.get('/auth/me');

    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(
        'meditrust_access_token'
      );

      localStorage.removeItem(
        'meditrust_refresh_token'
      );
    }
  },
};