const User = require("../models/User");
const Role = require("../models/Role");

const defaultRoles = [
  {
    name: "SuperAdmin",
    description: "Full system access",
    isSystem: true,
    permissions: [
      "Dashboard",
      "User Management",
      "Customer Management",
      "Role",
      "Beauticians",
      "Beautician Verify",
      "Categories",
      "Services",
      "Bookings",
      "Banners",
      "Complaints",
      "Reviews",
      "Cosmetics",
      "Payouts",
      "Notifications",
      "Reports",
    ],
  },
  {
    name: "Admin",
    description: "Administrative operations",
    isSystem: true,
    permissions: [
      "Dashboard",
      "User Management",
      "Customer Management",
      "Role",
      "Beauticians",
      "Beautician Verify",
      "Categories",
      "Services",
      "Bookings",
      "Banners",
      "Complaints",
      "Reviews",
      "Cosmetics",
      "Payouts",
      "Notifications",
      "Reports",
    ],
  },
  {
    name: "Customer",
    description: "Customer access",
    isSystem: true,
    permissions: ["Customer Dashboard", "Browse Services", "Book Service", "My Bookings", "My Complaints", "Profile"],
  },
  {
    name: "Beautician",
    description: "Beautician access",
    isSystem: true,
    permissions: ["Beautician Dashboard", "My Schedule", "Service Requests", "Earnings", "Profile"],
  },
];

const seedAdmin = async () => {
  try {
    for (const role of defaultRoles) {
      const exists = await Role.findOne({ name: role.name });
      if (!exists) {
        await Role.create({
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          isActive: true,
        });
      } else if (role.isSystem) {
        const mergedPermissions = [...new Set([...(exists.permissions || []), ...role.permissions])];
        exists.permissions = mergedPermissions;
        exists.isSystem = true;
        exists.isActive = true;
        if (!exists.description) {
          exists.description = role.description;
        }
        await exists.save();
      }
    }

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
