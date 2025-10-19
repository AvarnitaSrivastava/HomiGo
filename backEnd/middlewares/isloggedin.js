const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/user.models");
const Owner = require("../models/owner.model");

const isLoggedIn = async (req, res, next) => {
  try {
    let token;
    // Get token from cookies OR Authorization header
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log("✅ Decoded token:", decoded);
    } catch (jwtErr) {
      console.error("❌ JWT verification error:", jwtErr);
      return res.status(401).json({ success: false, message: "Unauthorized - Invalid/Expired token", error: jwtErr.message });
    }

    // First try to find an owner
    let user = null;
    try {
      user = await Owner.findById(decoded._id).select("-password -refreshToken");
      if (user) {
        user.accountType = 'owner';
        console.log("✅ Found owner account:", user._id);
      }
    } catch (ownerErr) {
      console.error("❌ DB error when finding owner:", ownerErr);
      return res.status(401).json({ success: false, message: "Unauthorized - Error finding owner", error: ownerErr.message });
    }

    // If not an owner, try regular user
    if (!user) {
      try {
        user = await User.findById(decoded._id).select("-password -refreshToken");
        if (user) {
          user.accountType = 'user';
          console.log("✅ Found user account:", user._id);
        }
      } catch (userErr) {
        console.error("❌ DB error when finding user:", userErr);
        return res.status(401).json({ success: false, message: "Unauthorized - Error finding user", error: userErr.message });
      }
    }

    if (!user) {
      console.log("❌ No user or owner found for token");
      return res.status(401).json({ success: false, message: "Unauthorized - Account not found" });
    }

    // Attach user/owner to req
    req.user = user;
    console.log("✅ Account type:", user.accountType);
    next();
  } catch (error) {
    console.error("❌ isLoggedIn middleware unexpected error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized - Unexpected error in auth middleware", error: error.message });
  }
};

module.exports = { isLoggedIn };

module.exports = { isLoggedIn };
