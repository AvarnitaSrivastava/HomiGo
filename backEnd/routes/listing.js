const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/isloggedin");
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
} = require("../controller/listing.controller");

// Owner routes - must come before generic routes
router.get("/my-listings", isLoggedIn, getMyListings);// Public routes
router.get("/", getAllListings);
router.get("/:id", getListingById);

// Protected routes
router.post("/", isLoggedIn, createListing);
router.put("/:id", isLoggedIn, updateListing);
router.delete("/:id", isLoggedIn, deleteListing);

module.exports = router;
