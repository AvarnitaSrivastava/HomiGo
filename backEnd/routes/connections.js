const express = require("express");
const router = express.Router();
const connectionController = require("../controller/connection.controller");
const { isLoggedIn } = require("../middlewares/isloggedin");

// All routes require authentication
router.use(isLoggedIn);

// Send a connection request
router.post("/send", connectionController.sendRequest);

// Accept a connection request
router.patch("/accept/:requestId", connectionController.acceptRequest);

// Reject a connection request
router.patch("/reject/:requestId", connectionController.rejectRequest);

// Cancel a sent request
router.delete("/cancel/:requestId", connectionController.cancelRequest);

// Get pending requests (received)
router.get("/pending", connectionController.getPendingRequests);

// Get sent requests
router.get("/sent", connectionController.getSentRequests);

// Get all connections
router.get("/connections", connectionController.getConnections);

// Check connection status with a user
router.get("/status/:userId", connectionController.checkConnectionStatus);

module.exports = router;
