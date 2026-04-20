const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const upload = require('../middleware/uploadMiddleware');

router.get('/', categoryController.getAllCategories);
router.post('/', upload.single('image'), categoryController.createCategory);
router.put('/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
