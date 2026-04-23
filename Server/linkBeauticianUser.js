// linkBeauticianUser.js
// Run: node linkBeauticianUser.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Replace with your actual MongoDB connection string
mongoose.connect('mongodb://localhost:27017/YOUR_DB_NAME', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Adjust the paths below if your models are in a different location
const User = require('./models/User');
const Beautician = require('./models/Beautician');

async function createAndLinkUser() {
  const phoneNumber = "12345123456";
  const plainPassword = "Anjush123";
  const hash = await bcrypt.hash(plainPassword, 10);

  // 1. Create User
  const user = await User.create({
    phoneNumber,
    password: hash,
    role: "Beautician",
    isActive: true,
    username: "anjusha", // or any username
    email: "anjusha@example.com", // required field
    // add other required fields if needed
  });

  // 2. Link Beautician
  await Beautician.updateOne(
    { phoneNumber },
    { $set: { user: user._id } }
  );

  console.log("User created and linked:", user);
  process.exit();
}

createAndLinkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
