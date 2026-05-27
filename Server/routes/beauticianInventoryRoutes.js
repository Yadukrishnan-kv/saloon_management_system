const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const beauticianInventoryController = require('../controllers/beauticianInventoryController');

// Beautician inventory APIs
router.get('/inventory', authMiddleware, beauticianInventoryController.listInventory);
router.post('/inventory/use', authMiddleware, beauticianInventoryController.useInventoryItem);
router.get('/inventory/history', authMiddleware, beauticianInventoryController.usageHistory);

// Admin inventory filter
router.get('/admin/inventory', authMiddleware, beauticianInventoryController.adminFilterInventory);

module.exports = router;
