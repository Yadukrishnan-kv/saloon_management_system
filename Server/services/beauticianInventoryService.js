const BeauticianInventory = require('../models/BeauticianInventory');
const CosmeticItem = require('../models/CosmeticItem');
const QRCode = require('qrcode');

/**
 * Create inventory items and QR codes for each product quantity in an order
 * @param {Object} order - CosmeticOrder document
 * @returns {Promise<Array>} - Array of created inventory items
 */
async function createInventoryForOrder(order) {
  const inventoryItems = [];
  for (const orderItem of order.items) {
    for (let i = 0; i < orderItem.quantity; i++) {
      // Generate unique QR code string: orderId-beauticianId-productId-serial
      const qrData = `${order._id.toString()}-${order.beautician.toString()}-${orderItem.item.toString()}-${i + 1}`;
      const qrImage = await QRCode.toDataURL(qrData);
      const inventory = await BeauticianInventory.create({
        beauticianId: order.beautician,
        productId: orderItem.item,
        orderId: order._id,
        qrCode: qrData,
        qrImage,
        status: 'AVAILABLE',
      });
      inventoryItems.push(inventory);
    }
  }
  return inventoryItems;
}

/**
 * Get beautician's available stock for a set of products
 * @param {String} beauticianId
 * @param {Array} productIds
 * @returns {Promise<Object>} - { productId: availableCount }
 */
async function getBeauticianStock(beauticianId, productIds) {
  const stock = {};
  for (const productId of productIds) {
    const count = await BeauticianInventory.countDocuments({
      beauticianId,
      productId,
      status: 'AVAILABLE',
    });
    stock[productId] = count;
  }
  return stock;
}

module.exports = {
  createInventoryForOrder,
  getBeauticianStock,
};
