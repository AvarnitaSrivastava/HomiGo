import api from './api';

const authService = {
  // Utility: get current user type (role)
  getUserType: () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        return user.role || null;
      }
    } catch (e) {}
    return null;
  },
  // Utility: check if current user is owner
  isOwner: () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        return user.role === 'owner';
      }
    } catch (e) {}
    return false;
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/auth/me');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user data'
      };
    }
  },
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  },

  enable2FA: async () => {
    try {
      const response = await api.post('/users/auth/2fa/enable');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to enable 2FA');
    }
  },

  disable2FA: async () => {
    try {
      const response = await api.post('/users/auth/2fa/disable');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  },

  configure2FA: async () => {
    try {
      const response = await api.get('/users/auth/2fa/setup');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to configure 2FA');
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/account');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete account'
      };
    }
  },

  // Register a new user
  register: async (userData) => {
    try {
      // If registering as owner, use the owner endpoint
      const isOwner = userData.role === 'owner';
      let endpoint = '/users/auth/register';
      let payload = userData;
      if (isOwner) {
        endpoint = '/owner/register';
        // Only send fields expected by Owner model
        payload = {
          fullname: userData.fullname,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          organization: userData.organization || '',
        };
      }
      const response = await api.post(endpoint, payload);

      // Handle successful registration
      if (response.data && response.data.success) {
        // Owner registration returns data.owner, user registration returns data.user
        const { accessToken, refreshToken, owner, user } = response.data.data;

        // Store tokens and user data
        if (accessToken && refreshToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          if (owner) {
            localStorage.setItem('user', JSON.stringify(owner));
          } else if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        }

        // Update axios default headers for subsequent requests
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        return {
          success: true,
          message: 'Registration successful',
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        };
      }
    } catch (error) {
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'Registration failed';
        return {
          success: false,
          message: errorMessage
        };
      } else if (error.request) {
        // No response received
        return {
          success: false,
          message: 'No response from server. Please check your internet connection.'
        };
      } else {
        // Request setup error
        return {
          success: false,
          message: 'Error setting up the request. Please try again.'
        };
      }
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      // If credentials.role is 'owner', use owner login endpoint
      const isOwner = credentials.role === 'owner';
      const endpoint = isOwner ? '/owner/login' : '/users/auth/login';
      const payload = { ...credentials };
      // Remove role from payload for backend cleanliness
      delete payload.role;
      const response = await api.post(endpoint, payload);
      
      if (response.data && response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        // Store tokens and user data
        if (accessToken && refreshToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        // Update axios default headers
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        return {
          success: true,
          message: 'Login successful',
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Login failed',
          error: error.response.data
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'No response from server. Please try again.'
        };
      } else {
        return {
          success: false,
          message: 'Something went wrong. Please try again.'
        };
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
  await api.post('/users/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },


  // Forgot password (request reset link)
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/users/auth/forgot-password', { email });
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send reset link'
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;
