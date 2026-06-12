const crypto = require("crypto");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");
const razorpayService = require("../services/razorpayService");

/**
 * Handle Razorpay webhook events
 * Webhook events received from Razorpay:
 * - payment.captured
 * - payment.failed
 * - payment.authorized
 * - refund.created
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const body = JSON.stringify(req.body);
    const signature = req.headers["x-razorpay-signature"];

    // Verify webhook signature
    const isSignatureValid = razorpayService.verifyWebhookSignature(
      req.body,
      signature
    );

    if (!isSignatureValid) {
      console.warn(
        "[Razorpay Webhook] Invalid signature - Potential security threat"
      );
      // Still return 200 to prevent Razorpay from retrying
      return res.status(200).json({
        success: false,
        message: "Invalid signature - Event not processed",
      });
    }

    const event = req.body.event;
    const data = req.body.data;

    console.log(`[Razorpay Webhook] Processing event: ${event}`);

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(data);
        break;

      case "payment.failed":
        await handlePaymentFailed(data);
        break;

      case "refund.created":
        await handleRefundCreated(data);
        break;

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${event}`);
    }

    // Always return 200 OK for successful processing
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("[Razorpay Webhook] Error:", error);
    // Return 200 to prevent Razorpay from retrying
    res.status(200).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

/**
 * Handle payment.captured event
 * This is a backup handler in case client-side verification fails
 */
const handlePaymentCaptured = async (data) => {
  try {
    const { payment, order } = data;
    const razorpayPaymentId = payment.id;
    const razorpayOrderId = order.id;

    console.log(
      `[Payment Captured] Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}`
    );

    // Find wallet with pending order
    const wallet = await Wallet.findOne({
      "pendingOrders.razorpayOrderId": razorpayOrderId,
    });

    if (!wallet) {
      console.warn(
        `[Payment Captured] No wallet found for order: ${razorpayOrderId}`
      );
      return;
    }

    const pendingOrder = wallet.pendingOrders.find(
      (o) => o.razorpayOrderId === razorpayOrderId
    );

    if (!pendingOrder || pendingOrder.status !== "created") {
      console.warn(
        `[Payment Captured] Order already processed or not found: ${razorpayOrderId}`
      );
      return;
    }

    // Update order status
    pendingOrder.status = "paid";
    pendingOrder.razorpayPaymentId = razorpayPaymentId;

    // Credit wallet
    const creditAmount = pendingOrder.amount;
    wallet.balance += creditAmount;
    wallet.totalEarnings += creditAmount;

    // Add transaction
    wallet.transactions.push({
      type: "credit",
      amount: creditAmount,
      description: `Wallet recharge via Razorpay (Webhook)`,
      reference: {
        paymentMethod: "Razorpay",
        transactionId: `RZP_${razorpayPaymentId}`,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
      },
      status: "completed",
    });

    await wallet.save();

    // Create notification
    await Notification.create({
      user: wallet.user,
      type: "payment",
      title: "Wallet Credited",
      message: `₹${creditAmount} has been added to your wallet via Razorpay`,
      data: {
        amount: creditAmount,
        paymentId: razorpayPaymentId,
      },
    });

    console.log(
      `[Payment Captured] Successfully credited ₹${creditAmount} to wallet`
    );
  } catch (error) {
    console.error("[Payment Captured Handler] Error:", error);
  }
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (data) => {
  try {
    const { payment, order, error } = data;
    const razorpayPaymentId = payment.id;
    const razorpayOrderId = order.id;

    console.log(
      `[Payment Failed] Payment ID: ${razorpayPaymentId}, Reason: ${error.reason}`
    );

    // Find wallet with pending order
    const wallet = await Wallet.findOne({
      "pendingOrders.razorpayOrderId": razorpayOrderId,
    });

    if (!wallet) {
      console.warn(
        `[Payment Failed] No wallet found for order: ${razorpayOrderId}`
      );
      return;
    }

    const pendingOrder = wallet.pendingOrders.find(
      (o) => o.razorpayOrderId === razorpayOrderId
    );

    if (!pendingOrder) {
      console.warn(`[Payment Failed] Order not found: ${razorpayOrderId}`);
      return;
    }

    // Mark order as failed
    pendingOrder.status = "failed";

    await wallet.save();

    // Create notification
    await Notification.create({
      user: wallet.user,
      type: "payment_failed",
      title: "Payment Failed",
      message: `Your wallet recharge payment failed. Reason: ${error.reason}`,
      data: {
        paymentId: razorpayPaymentId,
        reason: error.reason,
      },
    });

    console.log(
      `[Payment Failed] Marked order as failed: ${razorpayOrderId}`
    );
  } catch (error) {
    console.error("[Payment Failed Handler] Error:", error);
  }
};

/**
 * Handle refund.created event
 */
const handleRefundCreated = async (data) => {
  try {
    const { refund, payment } = data;
    const razorpayRefundId = refund.id;
    const razorpayPaymentId = payment.id;
    const refundAmount = refund.amount / 100; // Convert from paise to rupees

    console.log(
      `[Refund Created] Refund ID: ${razorpayRefundId}, Amount: ₹${refundAmount}`
    );

    // Find wallet with this payment transaction
    const wallet = await Wallet.findOne({
      "transactions.reference.razorpayPaymentId": razorpayPaymentId,
    });

    if (!wallet) {
      console.warn(
        `[Refund Created] No wallet found for payment: ${razorpayPaymentId}`
      );
      return;
    }

    const transaction = wallet.transactions.find(
      (t) => t.reference?.razorpayPaymentId === razorpayPaymentId
    );

    if (!transaction) {
      console.warn(`[Refund Created] Transaction not found for payment`);
      return;
    }

    // Add refund transaction
    wallet.transactions.push({
      type: "debit",
      amount: refundAmount,
      description: `Refund for payment ${razorpayPaymentId}`,
      reference: {
        paymentMethod: "Razorpay",
        transactionId: `REF_${razorpayRefundId}`,
        razorpayPaymentId: razorpayPaymentId,
        razorpayRefundId: razorpayRefundId,
      },
      status: "completed",
    });

    // Deduct from wallet balance if refund is processed
    wallet.balance -= refundAmount;

    await wallet.save();

    // Create notification
    await Notification.create({
      user: wallet.user,
      type: "refund",
      title: "Refund Processed",
      message: `₹${refundAmount} has been refunded to your original payment method`,
      data: {
        refundId: razorpayRefundId,
        paymentId: razorpayPaymentId,
        amount: refundAmount,
      },
    });

    console.log(
      `[Refund Created] Successfully processed refund: ${razorpayRefundId}`
    );
  } catch (error) {
    console.error("[Refund Created Handler] Error:", error);
  }
};

module.exports = {
  handleRazorpayWebhook,
  handlePaymentCaptured,
  handlePaymentFailed,
  handleRefundCreated,
};
