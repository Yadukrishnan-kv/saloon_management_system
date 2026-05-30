const express = require("express");
const router = express.Router();
const {
  getCosmeticItems,
  getCosmeticItemDetail,
  placeCosmeticOrder,
  getMyCosmeticOrders,
  getCosmeticOrderDetail,
  cancelCosmeticOrder,
} = require("../controllers/mobileappCosmeticController");
const deleteCosmeticOrder = require("../controllers/deleteCosmeticOrder");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Browse cosmetic items (authenticated beauticians)
router.get("/items", protect, authorizeRoles("Beautician"), getCosmeticItems);
router.get("/items/:itemId", protect, authorizeRoles("Beautician"), getCosmeticItemDetail);

// Order management

router.post("/orders", protect, authorizeRoles("Beautician"), placeCosmeticOrder);
router.get("/orders", protect, authorizeRoles("Beautician"), getMyCosmeticOrders);
router.get("/orders/:orderId", protect, authorizeRoles("Beautician"), getCosmeticOrderDetail);
router.put("/orders/:orderId/cancel", protect, authorizeRoles("Beautician"), cancelCosmeticOrder);
// Delete order and QR code
router.delete("/orders/:orderId", protect, authorizeRoles("Beautician"), deleteCosmeticOrder);

module.exports = router;
