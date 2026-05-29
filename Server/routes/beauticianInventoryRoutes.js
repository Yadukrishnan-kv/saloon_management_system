const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const beauticianInventoryController = require('../controllers/beauticianInventoryController');

// Beautician inventory APIs

router.get('/inventory', protect, beauticianInventoryController.listInventory);
router.post('/inventory/use', protect, beauticianInventoryController.useInventoryItem);
router.get('/inventory/history', protect, beauticianInventoryController.usageHistory);
// Admin inventory filter
router.get('/admin/inventory', protect, beauticianInventoryController.adminFilterInventory);

module.exports = router;
