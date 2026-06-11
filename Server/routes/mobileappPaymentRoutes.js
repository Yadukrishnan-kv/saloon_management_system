const express = require("express");
const router = express.Router();
const {
  getWallet,
  addToWallet,
  usePoints,
  getTransactions,
  payForBooking,
  getReceipt,
  createWalletOrder,
  verifyWalletPayment,
  paymentWebhook,
  beauticianEarnings,
} = require("../controllers/mobileappPaymentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Webhook (no auth - verified by payment gateway signature)
router.post("/webhook", paymentWebhook);

// All other routes require authentication
router.use(protect);

// Wallet
router.get("/wallet", getWallet);
router.post("/wallet/add", addToWallet);
router.post("/wallet/use-points", usePoints);
// Razorpay wallet payment
router.post("/wallet/create-order", createWalletOrder);
router.post("/wallet/verify-payment", verifyWalletPayment);

// Transactions
router.get("/transactions", getTransactions);

// Booking payments
router.post("/booking/:bookingId/pay", payForBooking);
router.get("/booking/:bookingId/receipt", getReceipt);

// Beautician earnings
router.get("/earnings", authorizeRoles("Beautician"), beauticianEarnings);

module.exports = router;
