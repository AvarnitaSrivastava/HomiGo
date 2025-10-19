const Owner = require("../models/owner.model");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshToken = async (ownerId) => {
  const owner = await Owner.findById(ownerId);
  const accessToken = owner.generateAccessToken();
  const refreshToken = owner.generateRefreshToken();

  owner.refreshToken = refreshToken;
  await owner.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerOwner = async (req, res) => {
  try {
    const { fullname, email, phone, password, organization } = req.body;

    if ([fullname, email, password, phone].some((field) => !field?.trim())) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const existedOwner = await Owner.findOne({
      $or: [{ email }, { phone }],
    });
    if (existedOwner) {
      return res.status(409).json({ success: false, message: "Email or phone already exists!" });
    }

    const owner = await Owner.create({
      fullname,
      email,
      password,
      phone,
      organization,
    });

    const createdOwner = await Owner.findById(owner._id).select("-password -refreshToken");

    return res.status(201).json({
      success: true,
      message: "Owner registered successfully",
      data: createdOwner,
    });
  } catch (error) {
    console.error('❌ Error in registerOwner:', error);
    if (error && error.stack) {
      console.error('❌ Error stack:', error.stack);
    }
    return res.status(500).json({ success: false, message: error.message, error: error.stack });
  }
};

const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const owner = await Owner.findOne({ email });
    if (!owner) return res.status(404).json({ success: false, message: "Owner does not exist" });

    const isPasswordValid = await owner.isPasswordCorrect(password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(owner._id);

    const loggedInOwner = await Owner.findById(owner._id).select("-password -refreshToken");

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "Login successful",
        data: { owner: loggedInOwner, accessToken, refreshToken },
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logoutOwner = async (req, res) => {
  try {
    await Owner.findByIdAndUpdate(req.owner._id, { $unset: { refreshToken: 1 } }, { new: true });

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "Owner logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized request" });
    }

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const owner = await Owner.findById(decodedToken?._id);
    if (!owner) return res.status(401).json({ success: false, message: "Invalid refresh token" });

    if (incomingRefreshToken !== owner?.refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token expired or used" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(owner._id);

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

const updateCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const owner = await Owner.findById(req.owner?._id);
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const isPasswordCorrect = await owner.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "Wrong current password!" });

    owner.password = newPassword;
    await owner.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentOwner = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Current owner fetched successfully",
      data: req.owner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAccountDetails = async (req, res) => {
  try {
    const { fullname, email, phone, organization } = req.body;

    const owner = await Owner.findByIdAndUpdate(
      req.owner?._id,
      {
        $set: {
          fullname,
          email,
          phone,
          organization,
        },
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Owner updated successfully",
      data: owner,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getOwnerListings = async (req, res) => {
  try {
    const ownerId = req.user._id; // Assuming authentication middleware sets req.user

    const owner = await Owner.findById(ownerId).populate({
      path: 'listings',
      model: 'Listing',
      populate: {
        path: 'owner',
        select: 'fullname email phone profilePicture',
      },
    });

    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    return res.status(200).json({ success: true, data: owner });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerOwner,
  loginOwner,
  logoutOwner,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentOwner,
  updateAccountDetails,
  getOwnerListings,
};