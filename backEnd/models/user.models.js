const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'owner'], default: 'student' },
  gender: { type: String },
  college: { type: String },
  course: { type: String },
  year: { type: String },
  budget: {
    min: { type: Number },
    max: { type: Number }
  },
  preferredRoommate: { type: String },
  preferences: {
    gender: { type: String },
    roommates: { type: Number },
    lifestyle: {
      smoking: { type: String },
      sleepSchedule: { type: String },
      cleanliness: { type: String },
      studyHabits: { type: String },
      social: { type: String }
    }
  },
  location: { type: String },
  profilePicture: { type: String, default: "" },
  refreshToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// check password
userSchema.methods.isPasswordCorrect = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// generate tokens
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
