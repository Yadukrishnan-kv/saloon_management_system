const express = require("express");
const router = express.Router();
const {
  getWallet,
  addToWallet,
  usePoints,
  getTransactions,
  payForBooking,
  getReceipt,
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

// Transactions
router.get("/transactions", getTransactions);

// Booking payments
router.post("/booking/:bookingId/pay", payForBooking);
router.get("/booking/:bookingId/receipt", getReceipt);

// Beautician earnings
router.get("/earnings", authorizeRoles("Beautician"), beauticianEarnings);

module.exports = router;
