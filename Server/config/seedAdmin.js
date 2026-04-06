const User = require("../models/User");

const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ email: "admin@admin.com" });
    if (existingAdmin) return;

    await User.create({
      username: "Admin",
      email: "admin@admin.com",
      password: "123456",
      role: "SuperAdmin",
      isActive: true,
    });
    console.log("Default admin account created (admin@admin.com / 123456)");
  } catch (error) {
    console.error("Admin seed error:", error.message);
  }
};

module.exports = seedAdmin;
