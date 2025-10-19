import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import useChatStore from '../services/useChatStore';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get state and actions from chat store
  const {
    conversations,
    currentConversation,
    messages,
    isConnected,
    activeUsers,
    initializeSocket,
    disconnectSocket,
    fetchConversations,
    fetchConversation,
    sendMessage: sendSocketMessage,
    sendTypingIndicator,
    clearCurrentConversation,
    isUserOnline,
    isOtherUserTyping,
    fetchUnreadCount,
  } = useChatStore();

  // Initialize socket on mount
  useEffect(() => {
    const initializeMessaging = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
  // Initialize messaging system
      
      // Check authentication
      if (!token || !userStr) {
        navigate('/login');
        return;
      }

      let currentUser;
      try {
  currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/login');
        return;
      }

      // Store user ID for later use if not already stored
      if (currentUser && currentUser._id) {
        localStorage.setItem('userId', currentUser._id);
      }

      // Initialize socket connection
      initializeSocket(token);

      // Fetch initial data
      try {
        await Promise.all([
          fetchConversations(),
          fetchUnreadCount()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMessaging();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle auto-opening conversation from navigation state
  useEffect(() => {
    // Check if we have user data from navigation state (from Matches page)
    if (location.state && location.state.userId && location.state.otherUser && !isLoading) {
  const { userId, otherUser } = location.state;
      
      // Open conversation with this user
      fetchConversation(userId, otherUser);
      
      // Clear the navigation state to prevent re-opening on refresh
      navigate('/messages', { replace: true, state: {} });
    }
  }, [location.state, isLoading, fetchConversation, navigate]);

  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    await fetchConversation(conversation.otherUser._id, conversation.otherUser);
  };

  // Handle sending message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !currentConversation) return;

    sendSocketMessage(message, currentConversation.otherUser._id);
    setMessage('');

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(currentConversation.otherUser._id, false);
  };

  // Handle typing
  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!currentConversation) return;

    // Send typing indicator
    sendTypingIndicator(currentConversation.otherUser._id, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(currentConversation.otherUser._id, false);
    }, 1000);
  };

  // Format time
  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMs = now - messageDate;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return messageDate.toLocaleDateString();
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current user ID
  const getCurrentUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user._id;
          localStorage.setItem('userId', userId);
        }
      } catch (e) {
        console.error('Error getting user ID:', e);
      }
    }
    return userId;
  };

  const currentUserId = getCurrentUserId();

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="messages-page">
        {isLoading ? (
          <div className="messages-loading">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <div className="messages-container">
          {/* Contacts Sidebar */}
          <div className="contacts-sidebar">
            <div className="contacts-header">
              <h2>Messages</h2>
              {!isConnected && (
                <span className="connection-status disconnected" title="Disconnected">
                  🔴
                </span>
              )}
              {isConnected && (
                <span className="connection-status connected" title="Connected">
                  🟢
                </span>
              )}
            </div>
            
            <div className="search-boxx">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="contacts-list">
              {filteredConversations.length === 0 ? (
                <div className="no-conversations">
                  <p>No conversations yet</p>
                  <small>Start chatting with other users!</small>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.conversationId}
                    className={`contact-item ${
                      currentConversation?.conversationId === conversation.conversationId
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="contact-avatar">
                      {conversation.otherUser.profilePicture ? (
                        <img
                          src={conversation.otherUser.profilePicture}
                          alt={conversation.otherUser.fullname}
                        />
                      ) : (
                        <span>{conversation.otherUser.fullname.charAt(0).toUpperCase()}</span>
                      )}
                      {isUserOnline(conversation.otherUser._id) && (
                        <div className="online-indicator"></div>
                      )}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">{conversation.otherUser.fullname}</div>
                      <div className="contact-last-message">
                        {conversation.lastMessage.text.length > 30
                          ? conversation.lastMessage.text.substring(0, 30) + '...'
                          : conversation.lastMessage.text}
                      </div>
                    </div>
                    <div className="contact-meta">
                      <div className="contact-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="unread-badge">{conversation.unreadCount}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="chat-window">
            {currentConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-contact-info">
                    <div className="chat-avatar">
                      {currentConversation.otherUser.profilePicture ? (
                        <img
                          src={currentConversation.otherUser.profilePicture}
                          alt={currentConversation.otherUser.fullname}
                        />
                      ) : (
                        <span>
                          {currentConversation.otherUser.fullname.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {isUserOnline(currentConversation.otherUser._id) && (
                        <div className="online-indicator"></div>
                      )}
                    </div>
                    <div>
                      <div className="chat-contact-name">
                        {currentConversation.otherUser.fullname}
                      </div>
                      <div className="chat-contact-status">
                        {isUserOnline(currentConversation.otherUser._id)
                          ? isOtherUserTyping()
                            ? 'Typing...'
                            : 'Online'
                          : 'Offline'}
                      </div>
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button
                      className="chat-action-btn"
                      onClick={clearCurrentConversation}
                      title="Close conversation"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="messages-container-inner">
                  {messages.length === 0 ? (
                    <div className="no-messages">
                      <p>No messages yet</p>
                      <small>Start the conversation!</small>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message ${
                          msg.sender._id === currentUserId
                            ? 'message-sent'
                            : 'message-received'
                        }`}
                      >
                        <div className="message-bubble">
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {msg.sender._id === currentUserId && (
                              <span className="message-read-status">
                                {msg.read ? ' ✓✓' : ' ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-input-container" onSubmit={handleSendMessage}>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      value={message}
                      onChange={handleTyping}
                      placeholder="Type a message..."
                      className="message-input"
                      disabled={!isConnected}
                    />
                    <button
                      type="submit"
                      className="send-btn"
                      disabled={!message.trim() || !isConnected}
                    >
                      ➤
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <div className="no-chat-content">
                  <div className="no-chat-icon">💬</div>
                  <h3>Select a conversation</h3>
                  <p>Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
