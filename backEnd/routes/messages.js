const express = require("express");
const router = express.Router();
const messageController = require("../controller/message.controller");
const { isLoggedIn } = require("../middlewares/isloggedin");

// All routes require authentication
router.use(isLoggedIn);

// Send a message
router.post("/send", messageController.sendMessage);

// Get conversation with a specific user
router.get("/conversation/:userId", messageController.getConversation);

// Get all conversations
router.get("/conversations", messageController.getAllConversations);

// Mark messages as read
router.patch("/read/:conversationId", messageController.markAsRead);

// Get unread message count
router.get("/unread-count", messageController.getUnreadCount);

// Delete a message
router.delete("/:messageId", messageController.deleteMessage);

module.exports = router;
