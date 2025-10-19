import api from './api';

const authService = {
  login: async ({ email, password, role }) => {
    try {
      const endpoint = role === 'owner' ? '/owner/login' : '/users/auth/login';
      const payload = { email, password };
      const res = await api.post(endpoint, payload);

      if (res.data?.success) {
        const { accessToken, refreshToken, user, owner } = res.data.data;
        if (accessToken && refreshToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user || owner));
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'No response from server. Please check your internet connection.',
      };
    }
  },

  register: async (userData) => {
    try {
      const isOwner = userData.role === 'owner';
      const endpoint = isOwner ? '/owner/register' : '/users/auth/register';
      const payload = isOwner
        ? {
            fullname: userData.fullname,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            organization: userData.organization || '',
          }
        : userData;

      const res = await api.post(endpoint, payload);

      if (res.data?.success) {
        const { accessToken, refreshToken, user, owner } = res.data.data;
        if (accessToken && refreshToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user || owner));
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          'No response from server. Please check your internet connection.',
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/users/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.error(error);
    }
  },

  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
};

export default authService;
