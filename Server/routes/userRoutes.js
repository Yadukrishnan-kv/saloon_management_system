const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require("../controllers/userController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Personal profile routes
router.get("/my-profile", protect, getMyProfile);
router.put("/my-profile", protect, updateMyProfile);
router.put("/change-password", protect, changePassword);

// Admin: Manage all users
router.get("/getAllUsers", protect, authorizeRoles("SuperAdmin", "Admin"), getAllUsers);
router.get("/:id", protect, authorizeRoles("SuperAdmin", "Admin"), getUserById);
router.post("/createUser", protect, authorizeRoles("SuperAdmin", "Admin"), createUser);
router.put("/updateUser/:id", protect, authorizeRoles("SuperAdmin", "Admin"), updateUser);
router.delete("/deleteUser/:id", protect, authorizeRoles("SuperAdmin", "Admin"), deleteUser);
router.put("/:id/status", protect, authorizeRoles("SuperAdmin", "Admin"), updateUserStatus);

module.exports = router;
