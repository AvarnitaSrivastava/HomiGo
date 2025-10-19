import React from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../services/useChatStore';

/**
 * MessageButton component - Use this button on any page to start a conversation
 * @param {Object} props
 * @param {string} props.userId - The ID of the user to message
 * @param {Object} props.userDetails - User details (fullname, username, profilePicture)
 * @param {string} props.className - Optional CSS class
 * @param {React.ReactNode} props.children - Button content
 */
const MessageButton = ({ userId, userDetails, className = '', children }) => {
  const navigate = useNavigate();
  const { fetchConversation, initializeSocket } = useChatStore();

  const handleStartConversation = async () => {
    // Ensure socket is connected
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

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

    // Store user ID if not already stored
    if (currentUser && currentUser._id) {
      localStorage.setItem('userId', currentUser._id);
    }

    // Initialize socket if not connected
    initializeSocket(token);

    // Navigate to messages page
    navigate('/messages');

    // Fetch or create conversation with the user
    setTimeout(() => {
      fetchConversation(userId, userDetails);
    }, 100);
  };

  return (
    <button
      className={`message-button ${className}`}
      onClick={handleStartConversation}
    >
      {children || '💬 Message'}
    </button>
  );
};

export default MessageButton;
