const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
} = require("../controllers/mobileappComplaintController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.post("/create", createComplaint);
router.get("/my-complaints", getMyComplaints);
router.get("/:complaintId", getComplaintById);

module.exports = router;
