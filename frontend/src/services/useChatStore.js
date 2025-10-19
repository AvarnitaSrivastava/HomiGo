import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  // State
  socket: null,
  isConnected: false,
  activeUsers: [],
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  isTyping: false,
  typingUsers: new Map(),

  // Initialize socket connection
  initializeSocket: (token) => {
    const socket = io(`${process.env.REACT_APP_API_URL.replace('/api', '')}`, {
      auth: { token },
      autoConnect: true,

    });

    socket.on('connect', () => {
      set({ isConnected: true, socket });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('activeUsers', (users) => {
      set({ activeUsers: users });
    });

    socket.on('userOnline', (userId) => {
      set((state) => ({
        activeUsers: [...new Set([...state.activeUsers, userId])],
      }));
    });

    socket.on('userOffline', (userId) => {
      set((state) => ({
        activeUsers: state.activeUsers.filter((id) => id !== userId),
      }));
    });

    socket.on('receiveMessage', (message) => {
      const { currentConversation, messages } = get();

      // Add message to current conversation if it matches
      if (
        currentConversation &&
        message.conversationId === currentConversation.conversationId
      ) {
        set({ messages: [...messages, message] });

        // Mark as read automatically if conversation is open
        get().markConversationAsRead(message.conversationId);
      }

      // Update conversations list
      get().fetchConversations();
      get().fetchUnreadCount();
    });

    socket.on('messageSent', (message) => {
      const { messages } = get();
      set({ messages: [...messages, message] });
    });

    socket.on('userTyping', ({ userId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);
        if (isTyping) {
          newTypingUsers.set(userId, true);
        } else {
          newTypingUsers.delete(userId);
        }
        return { typingUsers: newTypingUsers };
      });
    });

    socket.on('messagesRead', ({ conversationId }) => {
      const { currentConversation, messages } = get();

      if (currentConversation?.conversationId === conversationId) {
        const updatedMessages = messages.map((msg) => ({
          ...msg,
          read: true,
        }));
        set({ messages: updatedMessages });
      }
    });

    set({ socket });
  },

  // Disconnect socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // Fetch all conversations
  fetchConversations: async () => {
    try {
      const response = await api.get('/messages/conversations');
      set({ conversations: response.data.data || [] });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  },

  // Fetch conversation with a specific user
  fetchConversation: async (userId, otherUser) => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      const messages = response.data.data || [];

      // Get current user ID
      let currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user._id;
            localStorage.setItem('userId', currentUserId);
          }
        } catch (e) {
          console.error('Error getting user ID:', e);
          return;
        }
      }

      const conversationId = get().generateConversationId(currentUserId, userId);

      set({
        currentConversation: {
          conversationId,
          otherUser,
        },
        messages,
      });

      // Mark messages as read
      if (messages.length > 0) {
        get().markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  },

  // Send message via socket
  sendMessage: (text, receiverId) => {
    const { socket, currentConversation } = get();

    if (!socket || !currentConversation) return;

    const messageData = {
      receiverId,
      text,
      conversationId: currentConversation.conversationId,
    };

    socket.emit('sendMessage', messageData);
  },

  // Send typing indicator
  sendTypingIndicator: (receiverId, isTyping) => {
    const { socket } = get();
    if (!socket) return;

    socket.emit('typing', { receiverId, isTyping });
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId) => {
    const { socket } = get();

    try {
      await api.patch(`/messages/read/${conversationId}`);

      if (socket) {
        socket.emit('markAsRead', { conversationId });
      }

      // Update unread count
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  },

  // Fetch unread message count
  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/messages/unread-count');
      set({ unreadCount: response.data.data.unreadCount || 0 });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  // Clear current conversation
  clearCurrentConversation: () => {
    set({
      currentConversation: null,
      messages: [],
      typingUsers: new Map(),
    });
  },

  // Generate conversation ID (must match backend logic)
  generateConversationId: (userId1, userId2) => {
    return [userId1, userId2].sort().join('-');
  },

  // Check if user is online
  isUserOnline: (userId) => {
    const { activeUsers } = get();
    return activeUsers.includes(userId);
  },

  // Get typing status for current conversation
  isOtherUserTyping: () => {
    const { currentConversation, typingUsers } = get();
    if (!currentConversation) return false;

    return typingUsers.has(currentConversation.otherUser._id);
  },
}));

export default useChatStore;
