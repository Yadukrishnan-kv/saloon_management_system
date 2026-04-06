const express = require("express");
const router = express.Router();
const {
  customerRegister,
  verifyOTP,
  customerLogin,
  resendOTP,
  beauticianRegister,
  beauticianLogin,
  uploadDocuments,
  logout,
} = require("../controllers/mobileappAuthController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Customer auth
router.post("/customer/register", customerRegister);
router.post("/customer/verify-otp", verifyOTP);
router.post("/customer/login", customerLogin);
router.post("/customer/resend-otp", resendOTP);

// Beautician auth
router.post("/beautician/register", beauticianRegister);
router.post("/beautician/login", beauticianLogin);
router.post(
  "/beautician/upload-documents",
  protect,
  authorizeRoles("Beautician"),
  upload.array("documents", 5),
  uploadDocuments
);

// Common
router.post("/logout", protect, logout);

module.exports = router;
