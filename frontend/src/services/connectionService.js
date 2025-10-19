import api from './api';

export const connectionService = {
  // Send a connection request
  sendRequest: async (receiverId, message = '') => {
    try {
      const response = await api.post('/connections/send', {
        receiverId,
        message,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Accept a connection request
  acceptRequest: async (requestId) => {
    try {
      const response = await api.patch(`/connections/accept/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reject a connection request
  rejectRequest: async (requestId) => {
    try {
      const response = await api.patch(`/connections/reject/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancel a sent request
  cancelRequest: async (requestId) => {
    try {
      const response = await api.delete(`/connections/cancel/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get pending requests (received)
  getPendingRequests: async () => {
    try {
      const response = await api.get('/connections/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get sent requests
  getSentRequests: async () => {
    try {
      const response = await api.get('/connections/sent');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all connections
  getConnections: async () => {
    try {
      const response = await api.get('/connections/connections');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Check connection status with a user
  checkConnectionStatus: async (userId) => {
    try {
      const response = await api.get(`/connections/status/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default connectionService;
