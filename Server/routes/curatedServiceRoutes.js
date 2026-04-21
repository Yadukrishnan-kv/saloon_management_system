const express = require('express');
const router = express.Router();
const curatedServiceController = require('../controllers/curatedServiceController');
const upload = require('../middleware/uploadMiddleware');

// List all curated services
router.get('/', curatedServiceController.getAllCuratedServices);
// Get one curated service
router.get('/:id', curatedServiceController.getCuratedServiceById);
// Create curated service
router.post('/', upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), curatedServiceController.createCuratedService);
// Update curated service
router.put('/:id', upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), curatedServiceController.updateCuratedService);
// Delete curated service
router.delete('/:id', curatedServiceController.deleteCuratedService);

module.exports = router;
