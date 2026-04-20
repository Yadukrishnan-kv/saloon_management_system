const mongoose = require('mongoose');
const ServiceCategory = require('./Server/models/ServiceCategory');
require('dotenv').config({ path: './Server/.env' });
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    const category = await ServiceCategory.findOne({ name: 'Hair' });
    console.log('category', category ? category.toObject() : 'not found');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();