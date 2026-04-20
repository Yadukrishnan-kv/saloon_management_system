// Migration script: ServiceCategory -> Category & SubCategory
const mongoose = require('mongoose');
const ServiceCategory = require('../models/ServiceCategory');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const dotenv = require('dotenv');
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/saloon';

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Migrate top-level categories
  const oldCategories = await ServiceCategory.find();
  const categoryMap = {};
  for (const cat of oldCategories) {
    if (!cat.parentCategory) {
      const newCat = await Category.create({
        name: cat.name,
        image: cat.image,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      });
      categoryMap[cat._id.toString()] = newCat._id;
      console.log(`Category migrated: ${cat.name}`);
    }
  }

  // 2. Migrate subcategories
  for (const cat of oldCategories) {
    if (cat.parentCategory) {
      const parentId = categoryMap[cat.parentCategory.toString()];
      if (parentId) {
        await SubCategory.create({
          name: cat.name,
          category: parentId,
          isActive: cat.isActive,
          sortOrder: cat.sortOrder,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        });
        console.log(`SubCategory migrated: ${cat.name}`);
      } else {
        console.warn(`Parent category not found for subcategory: ${cat.name}`);
      }
    }
  }

  console.log('Migration complete!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
