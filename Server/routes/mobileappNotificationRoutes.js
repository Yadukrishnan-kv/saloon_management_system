const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDevice,
  unregisterDevice,
  getSettings,
  updateSettings,
} = require("../controllers/mobileappNotificationController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/", getNotifications);
router.put("/:notificationId/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.post("/register-device", registerDevice);
router.delete("/unregister-device", unregisterDevice);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

module.exports = router;
