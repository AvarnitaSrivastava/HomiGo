const Message = require("../models/message.model");
const User = require("../models/user.models");
const ConnectionRequest = require("../models/connectionRequest.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

// Send a message
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user._id;

  if (!receiverId || !text) {
    throw new ApiError(400, "Receiver ID and message text are required");
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, "Receiver not found");
  }

  // Generate conversation ID
  const conversationId = Message.generateConversationId(senderId, receiverId);

  // Create message
  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    text,
  });

  // Populate sender details
  await message.populate("sender", "fullname username profilePicture");
  await message.populate("receiver", "fullname username profilePicture");

  res.status(201).json(
    new ApiResponse(201, message, "Message sent successfully")
  );
});

// Get conversation between two users
exports.getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Generate conversation ID
  const conversationId = Message.generateConversationId(currentUserId, userId);

  // Get all messages in this conversation
  const messages = await Message.find({ conversationId })
    .populate("sender", "fullname username profilePicture")
    .populate("receiver", "fullname username profilePicture")
    .sort({ createdAt: 1 });

  res.status(200).json(
    new ApiResponse(200, messages, "Conversation retrieved successfully")
  );
});

// Get all conversations for current user
exports.getAllConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  // Find all messages where user is sender or receiver
  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
  })
    .populate("sender", "fullname username profilePicture email location course")
    .populate("receiver", "fullname username profilePicture email location course")
    .sort({ createdAt: -1 });

  // Group messages by conversation and get the last message for each
  const conversationsMap = new Map();

  messages.forEach((message) => {
    const conversationId = message.conversationId;
    
    if (!conversationsMap.has(conversationId)) {
      // Determine the other user in the conversation
      const otherUser =
        message.sender._id.toString() === currentUserId.toString()
          ? message.receiver
          : message.sender;

      // Count unread messages
      const unreadCount = messages.filter(
        (m) =>
          m.conversationId === conversationId &&
          m.receiver._id.toString() === currentUserId.toString() &&
          !m.read
      ).length;

      conversationsMap.set(conversationId, {
        conversationId,
        otherUser: {
          _id: otherUser._id,
          fullname: otherUser.fullname,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture,
          email: otherUser.email,
          location: otherUser.location,
          course: otherUser.course,
        },
        lastMessage: {
          text: message.text,
          createdAt: message.createdAt,
          sender: message.sender._id,
        },
        unreadCount,
      });
    }
  });

  // Get all accepted connections for current user
  const connections = await ConnectionRequest.find({
    $or: [
      { sender: currentUserId, status: "accepted" },
      { receiver: currentUserId, status: "accepted" },
    ],
  })
    .populate("sender", "fullname username profilePicture email location course")
    .populate("receiver", "fullname username profilePicture email location course");

  // Add connected users who don't have messages yet
  connections.forEach((connection) => {
    const otherUser =
      connection.sender._id.toString() === currentUserId.toString()
        ? connection.receiver
        : connection.sender;

    const conversationId = Message.generateConversationId(currentUserId, otherUser._id);

    // Only add if not already in conversations map
    if (!conversationsMap.has(conversationId)) {
      conversationsMap.set(conversationId, {
        conversationId,
        otherUser: {
          _id: otherUser._id,
          fullname: otherUser.fullname,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture,
          email: otherUser.email,
          location: otherUser.location,
          course: otherUser.course,
        },
        lastMessage: {
          text: "Start a conversation...",
          createdAt: connection.updatedAt, // Use connection acceptance time
          sender: null,
        },
        unreadCount: 0,
      });
    }
  });

  const conversations = Array.from(conversationsMap.values());

  // Sort by last message time
  conversations.sort((a, b) => {
    return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
  });

  res.status(200).json(
    new ApiResponse(200, conversations, "Conversations retrieved successfully")
  );
});

// Mark messages as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const currentUserId = req.user._id;

  if (!conversationId) {
    throw new ApiError(400, "Conversation ID is required");
  }

  // Mark all messages in this conversation as read where current user is receiver
  const result = await Message.updateMany(
    {
      conversationId,
      receiver: currentUserId,
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  res.status(200).json(
    new ApiResponse(200, result, "Messages marked as read")
  );
});

// Delete a message
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const currentUserId = req.user._id;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  // Only sender can delete their message
  if (message.sender.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json(
    new ApiResponse(200, null, "Message deleted successfully")
  );
});

// Get unread message count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const unreadCount = await Message.countDocuments({
    receiver: currentUserId,
    read: false,
  });

  res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread count retrieved successfully")
  );
});
