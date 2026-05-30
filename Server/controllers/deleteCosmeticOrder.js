const fs = require("fs");
const path = require("path");
const CosmeticOrder = require("../models/CosmeticOrder");
const Beautician = require("../models/Beautician");

// DELETE COSMETIC ORDER (Beautician or Admin)
const deleteCosmeticOrder = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    const order = await CosmeticOrder.findOne({
      _id: req.params.orderId,
      beautician: beautician?._id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Delete QR code file if exists
    if (order.qrCodePath) {
      const qrPath = path.resolve(order.qrCodePath);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }

    await order.deleteOne();
    res.json({ success: true, message: "Order and QR code deleted" });
  } catch (error) {
    console.error("Delete cosmetic order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = deleteCosmeticOrder;
