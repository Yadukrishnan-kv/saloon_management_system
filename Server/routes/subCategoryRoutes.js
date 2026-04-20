const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');

router.get('/', subCategoryController.getAllSubCategories);
router.post('/', subCategoryController.createSubCategory);
router.put('/:id', subCategoryController.updateSubCategory);
router.delete('/:id', subCategoryController.deleteSubCategory);

module.exports = router;
