const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { changePassword, register, login, logout, getMe, refreshToken, forgotPassword, resetPassword } = require("../controllers/authController");
// Change password (auth required)
router.post("/change-password", protect, changePassword);

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
