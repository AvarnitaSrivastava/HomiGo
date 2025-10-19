const Message = require("../models/message.model");
const jwt = require("jsonwebtoken");

// Store active users: userId -> socketId
const activeUsers = new Map();

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded._id;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Add user to active users
    activeUsers.set(socket.userId, socket.id);

    // Emit online status to all clients
    io.emit("userOnline", socket.userId);

    // Send online users to the newly connected user
    socket.emit("activeUsers", Array.from(activeUsers.keys()));

    // Handle sending messages
    socket.on("sendMessage", async (data) => {
      try {
        const { receiverId, text, conversationId } = data;

        // Create message in database
        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          receiver: receiverId,
          text,
        });

        // Populate sender and receiver details
        await message.populate("sender", "fullname username profilePicture");
        await message.populate("receiver", "fullname username profilePicture");

        // Send to receiver if online
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", message);
        }

        // Send confirmation back to sender
        socket.emit("messageSent", message);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("messageError", { error: error.message });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { receiverId, isTyping } = data;
      const receiverSocketId = activeUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("userTyping", {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // Handle marking messages as read
    socket.on("markAsRead", async (data) => {
      try {
        const { conversationId } = data;

        await Message.updateMany(
          {
            conversationId,
            receiver: socket.userId,
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        // Notify sender that messages were read
        const messages = await Message.find({ conversationId });
        if (messages.length > 0) {
          const senderId = messages[0].sender.toString() === socket.userId 
            ? messages[0].receiver.toString() 
            : messages[0].sender.toString();
          
          const senderSocketId = activeUsers.get(senderId);
          if (senderSocketId) {
            io.to(senderSocketId).emit("messagesRead", { conversationId });
          }
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
      activeUsers.delete(socket.userId);
      
      // Emit offline status to all clients
      io.emit("userOffline", socket.userId);
    });
  });
};

module.exports = { initializeSocket, activeUsers };
