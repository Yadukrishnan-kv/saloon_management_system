const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getMyRole,
} = require("../controllers/roleController");
const { protect, authorizePermission } = require("../middleware/authMiddleware");

router.get("/me", protect, getMyRole);
router.get("/", protect, authorizePermission("Role"), getAllRoles);
router.get("/:id", protect, authorizePermission("Role"), getRoleById);
router.post("/", protect, authorizePermission("Role"), createRole);
router.put("/:id", protect, authorizePermission("Role"), updateRole);
router.delete("/:id", protect, authorizePermission("Role"), deleteRole);

module.exports = router;
