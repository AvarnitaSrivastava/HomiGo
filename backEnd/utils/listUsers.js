const mongoose = require('mongoose');
const User = require('../models/user.models');
require('dotenv').config();

async function listUsers() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const users = await User.find({});
  console.log('All users in database:');
  users.forEach(user => {
    console.log({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      password: user.password,
      username: user.username,
      role: user.role
    });
  });
  mongoose.disconnect();
}

listUsers();
