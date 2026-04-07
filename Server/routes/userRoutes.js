const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/userController");
const { protect, authorizePermission } = require("../middleware/authMiddleware");

// Personal profile routes
router.get("/my-profile", protect, getMyProfile);
router.put("/my-profile", protect, updateMyProfile);
router.put("/change-password", protect, changePassword);

// Admin: Manage all users
router.get("/getAllUsers", protect, authorizePermission("User Management"), getAllUsers);
router.get("/customers", protect, authorizePermission("Customer Management"), getAllCustomers);
router.get("/customers/:id", protect, authorizePermission("Customer Management"), getCustomerById);
router.put("/customers/:id", protect, authorizePermission("Customer Management"), updateCustomer);
router.put("/customers/:id/status", protect, authorizePermission("Customer Management"), updateUserStatus);
router.get("/:id", protect, authorizePermission("User Management"), getUserById);
router.post("/createUser", protect, authorizePermission("User Management"), createUser);
router.put("/updateUser/:id", protect, authorizePermission("User Management"), updateUser);
router.delete("/deleteUser/:id", protect, authorizePermission("User Management"), deleteUser);
router.put("/:id/status", protect, authorizePermission("User Management"), updateUserStatus);

module.exports = router;
