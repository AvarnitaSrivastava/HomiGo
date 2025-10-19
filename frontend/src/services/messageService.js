import api from './api';

export const messageService = {
  // Send a message
  sendMessage: async (receiverId, text) => {
    try {
      const response = await api.post('/messages/send', {
        receiverId,
        text,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get conversation with a user
  getConversation: async (userId) => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all conversations
  getAllConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Mark messages as read
  markAsRead: async (conversationId) => {
    try {
      const response = await api.patch(`/messages/read/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default messageService;
