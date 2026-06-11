const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for wallet payment
 * @param {number} amount - Amount in paise (multiply INR by 100)
 * @param {string} beauticianId - Beautician ID
 * @param {string} description - Payment description
 * @returns {Promise<Object>} Order details with id, amount, currency
 */
const createOrder = async (amount, beauticianId, description = "Wallet Recharge") => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `wallet_${beauticianId}_${Date.now()}`,
      description: description,
      notes: {
        beauticianId: beauticianId,
        type: "wallet_recharge",
      },
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature from client
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature Verification Error:", error);
    return false;
  }
};

/**
 * Verify webhook signature from Razorpay
 * @param {Object} body - Raw request body
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean} True if webhook signature is valid
 */
const verifyWebhookSignature = (body, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Webhook Signature Verification Error:", error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error("Fetch Payment Error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Fetch order details from Razorpay
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
const getOrderDetails = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error("Fetch Order Error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Refund a payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in paise (optional, defaults to full refund)
 * @returns {Promise<Object>} Refund details
 */
const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, options);
    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error("Refund Error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPaymentDetails,
  getOrderDetails,
  refundPayment,
};
