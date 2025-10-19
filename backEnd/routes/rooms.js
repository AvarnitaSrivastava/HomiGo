const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/isloggedin");
const {
  getRooms,
  getRoomDetails,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controller/listing.controller");

// Get all rooms with filters
router.get("/", getRooms);

// Get single room details
router.get("/:id", getRoomDetails);

// Protected routes
router.post("/", isLoggedIn, createRoom);
router.put("/:id", isLoggedIn, updateRoom);
router.delete("/:id", isLoggedIn, deleteRoom);

module.exports = router;
