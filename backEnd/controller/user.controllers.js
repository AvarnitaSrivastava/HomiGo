const crypto = require('crypto');
const { sendResetEmail } = require("../utils/email");
// ----------------- FORGOT PASSWORD (Send Reset Link) -----------------
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Always return success for security, but do not send email
      return res.status(200).json({ success: true, message: 'If this email is registered, a reset link will be sent.' });
    }
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expires);
    await user.save({ validateBeforeSave: false });

    // Construct reset link (replace with your frontend URL)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetLink);

    return res.status(200).json({ success: true, message: 'If this email is registered, a reset link will be sent.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
const User = require("../models/user.models");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");

// ----------------- TOKEN UTILS -----------------
const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ----------------- REGISTER USER -----------------
const registerUser = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      phone,
      gender,
      college,
      course,
      year,
      budgetMin,
      budgetMax,
      preferredRoommate,
      preferences,
      location,
      role
    } = req.body;

    // Validate required fields
    if ([fullname, email, password, phone].some((field) => !field?.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: "Please fill in all required fields: full name, email, password, and phone number"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid email address"
      });
    }

    // Validate phone format (assuming 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide a valid 10-digit phone number"
      });
    }

    // Generate username from email
    const username = email.split('@')[0].toLowerCase();

    // Check for existing user
    const existedUser = await User.findOne({
      $or: [{ email }, { phone }],
    });
    if (existedUser) {
      return res.status(409).json({ 
        success: false, 
        message: existedUser.email === email ? 
          "This email is already registered. Please login or use a different email." : 
          "This phone number is already registered. Please use a different number."
      });
    }

    // Create new user
    const user = await User.create({
      fullname: fullname?.trim(),
      email: email?.toLowerCase().trim(),
      password,
      username,
      phone: phone?.trim(),
      gender,
      college,
      course,
      year,
      role: role || 'user',
      budget: (budgetMin !== undefined || budgetMax !== undefined) ? { min: budgetMin, max: budgetMax } : { min: undefined, max: undefined },
      preferredRoommate,
      preferences: preferences || {},
      location: location || '',
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Get user data without sensitive information
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { httpOnly: true, secure: true };

    // Send response with cookies
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Registration successful",
        data: {
          user: createdUser,
          accessToken,
          refreshToken
        },
      });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.code === 11000 ? 
        "This email or phone number is already registered" : 
        "Registration failed. Please try again later."
    });
  }
};

// ----------------- LOGIN USER -----------------
const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if email/username and password are provided
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required!" 
      });
    }

    if (!(email || username)) {
      return res.status(400).json({ 
        success: false, 
        message: "Email or username is required!" 
      });
    }

    // Validate email format if email is provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Please provide a valid email address" 
        });
      }
    }

    // Find user by email or username
    const user = await User.findOne({ 
      $or: [
        { email: email?.toLowerCase() }, 
        { username: username?.toLowerCase() }
      ] 
    });

    // If no user found, return specific message
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "This email is not registered. Please sign up first." 
      });
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Wrong password. Please check your password and try again. If you forgot your password, use the 'Forgot Password' option." 
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Get user data without sensitive information
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = { 
      httpOnly: true, 
      secure: true,
      sameSite: 'strict'  // Added security for cookies
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Login successful",
        data: { user: loggedInUser, accessToken, refreshToken },
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- LOGOUT USER -----------------
const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "User logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- REFRESH TOKEN -----------------
const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized request" });
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);
    if (!user) return res.status(401).json({ success: false, message: "Invalid refresh token" });

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token expired or used" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        success: true,
        message: "Access token refreshed",
        data: { accessToken, refreshToken: newRefreshToken },
      });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message || "Invalid refresh token" });
  }
};

// ----------------- UPDATE PASSWORD -----------------
const updateCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(req.user?._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "Wrong current password!" });

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- GET CURRENT USER -----------------
const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Current user fetched successfully",
      data: req.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- UPDATE ACCOUNT DETAILS -----------------
const updateAccountDetails = async (req, res) => {
  try {
    const {
      username,
      email,
      fullname,
      phone,
      gender,
      budget,
      preferredRoommate,
      preferences,
      location,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullname,
          email,
          username,
          phone,
          gender,
          budget,
          preferredRoommate,
          preferences,
          location,
        },
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- GET PROFILE -----------------
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- UPDATE PROFILE -----------------
const updateProfile = async (req, res) => {
  try {
    const {
      fullname,
      phone,
      gender,
      college,
      course,
      year,
      budgetMin,
      budgetMax,
      preferredRoommate,
      preferences,
      location,
    } = req.body;

    const updateFields = {
      fullname,
      phone,
      gender,
      college,
      course,
      year,
      preferredRoommate,
      preferences,
      location,
    };
    // Only set budget if min or max is provided
    if (budgetMin !== undefined || budgetMax !== undefined) {
      updateFields.budget = {
        min: budgetMin,
        max: budgetMax
      };
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: updateFields },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- UPLOAD PROFILE PICTURE -----------------
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const result = await cloudinary.uploader.upload(req.files.profilePicture.tempFilePath, {
      folder: "profile_pictures",
      width: 300,
      crop: "scale"
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.secure_url },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------- GET PREFERENCES -----------------
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("preferences");
    return res.status(200).json({
      success: true,
      data: user.preferences
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getPreferences,
  forgotPassword
};
