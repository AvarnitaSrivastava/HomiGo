const ConnectionRequest = require("../models/connectionRequest.model");
const User = require("../models/user.models");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const ApiError = require("../utils/apiError");

// Send a connection request
exports.sendRequest = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    throw new ApiError(400, "Receiver ID is required");
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new ApiError(404, "User not found");
  }

  // Don't allow sending request to yourself
  if (senderId.toString() === receiverId.toString()) {
    throw new ApiError(400, "Cannot send request to yourself");
  }

  // Check if request already exists
  const existingRequest = await ConnectionRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      throw new ApiError(400, "Request already sent");
    } else if (existingRequest.status === "accepted") {
      throw new ApiError(400, "Already connected");
    } else if (existingRequest.status === "rejected") {
      // Allow resending after rejection
      existingRequest.status = "pending";
      existingRequest.sender = senderId;
      existingRequest.receiver = receiverId;
      existingRequest.message = message || "";
      await existingRequest.save();

      await existingRequest.populate("sender", "fullname username profilePicture");
      await existingRequest.populate("receiver", "fullname username profilePicture");

      return res.status(200).json(
        new ApiResponse(200, existingRequest, "Request resent successfully")
      );
    }
  }

  // Create new request
  const request = await ConnectionRequest.create({
    sender: senderId,
    receiver: receiverId,
    message: message || "",
  });

  await request.populate("sender", "fullname username profilePicture");
  await request.populate("receiver", "fullname username profilePicture");

  res.status(201).json(
    new ApiResponse(201, request, "Request sent successfully")
  );
});

// Accept a connection request
exports.acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Only receiver can accept
  if (request.receiver.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You can only accept requests sent to you");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Request already processed");
  }

  request.status = "accepted";
  await request.save();

  await request.populate("sender", "fullname username profilePicture");
  await request.populate("receiver", "fullname username profilePicture");

  res.status(200).json(
    new ApiResponse(200, request, "Request accepted successfully")
  );
});

// Reject a connection request
exports.rejectRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Only receiver can reject
  if (request.receiver.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You can only reject requests sent to you");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Request already processed");
  }

  request.status = "rejected";
  await request.save();

  res.status(200).json(
    new ApiResponse(200, null, "Request rejected successfully")
  );
});

// Cancel a sent request
exports.cancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const currentUserId = req.user._id;

  const request = await ConnectionRequest.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Request not found");
  }

  // Only sender can cancel
  if (request.sender.toString() !== currentUserId.toString()) {
    throw new ApiError(403, "You can only cancel requests you sent");
  }

  if (request.status !== "pending") {
    throw new ApiError(400, "Can only cancel pending requests");
  }

  await ConnectionRequest.findByIdAndDelete(requestId);

  res.status(200).json(
    new ApiResponse(200, null, "Request cancelled successfully")
  );
});

// Get pending requests (received by current user)
exports.getPendingRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const requests = await ConnectionRequest.find({
    receiver: currentUserId,
    status: "pending",
  })
    .populate("sender", "fullname username profilePicture email college course")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, requests, "Pending requests retrieved successfully")
  );
});

// Get sent requests (sent by current user)
exports.getSentRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const requests = await ConnectionRequest.find({
    sender: currentUserId,
    status: "pending",
  })
    .populate("receiver", "fullname username profilePicture email college course")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, requests, "Sent requests retrieved successfully")
  );
});

// Get all connections (accepted requests)
exports.getConnections = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const connections = await ConnectionRequest.find({
    $or: [
      { sender: currentUserId, status: "accepted" },
      { receiver: currentUserId, status: "accepted" },
    ],
  })
    .populate("sender", "fullname username profilePicture email college course")
    .populate("receiver", "fullname username profilePicture email college course")
    .sort({ updatedAt: -1 });

  // Extract the other user from each connection
  const formattedConnections = connections.map((conn) => {
    const otherUser =
      conn.sender._id.toString() === currentUserId.toString()
        ? conn.receiver
        : conn.sender;

    return {
      connectionId: conn._id,
      user: otherUser,
      connectedAt: conn.updatedAt,
    };
  });

  res.status(200).json(
    new ApiResponse(200, formattedConnections, "Connections retrieved successfully")
  );
});

// Check connection status with a specific user
exports.checkConnectionStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const connection = await ConnectionRequest.findOne({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  });

  if (!connection) {
    return res.status(200).json(
      new ApiResponse(200, { status: "none", canSendRequest: true }, "No connection found")
    );
  }

  const isSender = connection.sender.toString() === currentUserId.toString();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: connection.status,
        requestId: connection._id,
        isSender,
        canSendRequest: connection.status === "rejected",
      },
      "Connection status retrieved"
    )
  );
});
