const Wallet = require("../models/Wallet");
const Booking = require("../models/Booking");
const Beautician = require("../models/Beautician");
const Notification = require("../models/Notification");
const User = require("../models/User");
const crypto = require("crypto");

// ─── GET WALLET ───────────────────────────────────────────────────────────────
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    const MIN_BALANCE_FOR_WORK = 50;
    const isBeautician = req.user.role === "Beautician";

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        points: wallet.points,
        currency: wallet.currency,
      },
      // Work eligibility info (for beautician wallet screen)
      ...(isBeautician && {
        workEligibility: {
          isEligible: wallet.balance >= MIN_BALANCE_FOR_WORK,
          minimumRequired: MIN_BALANCE_FOR_WORK,
        },
      }),
    });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ADD MONEY TO WALLET ──────────────────────────────────────────────────────
const addToWallet = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    const transactionId = `TXN_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      type: "credit",
      amount: parseFloat(amount),
      description: `Wallet recharge via ${paymentMethod}`,
      reference: {
        paymentMethod,
        transactionId,
      },
      status: "completed",
    });

    await wallet.save();

    // TODO: Integrate actual payment gateway and return paymentUrl
    res.json({
      success: true,
      message: "Amount added to wallet",
      transactionId,
      paymentUrl: null, // Will be actual payment gateway URL
    });
  } catch (error) {
    console.error("Add to wallet error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── USE POINTS ───────────────────────────────────────────────────────────────
const usePoints = async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: "Valid points amount is required" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    if (wallet.points < points) {
      return res.status(400).json({ success: false, message: "Insufficient points" });
    }

    // 1 point = 1 INR (configurable)
    const discountAmount = points;

    wallet.points -= points;
    wallet.transactions.push({
      type: "debit",
      amount: discountAmount,
      description: `Redeemed ${points} points`,
      status: "completed",
    });

    await wallet.save();

    res.json({
      success: true,
      message: "Points redeemed successfully",
      discountAmount,
      remainingPoints: wallet.points,
    });
  } catch (error) {
    console.error("Use points error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET TRANSACTIONS ─────────────────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, period } = req.query;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.json({ success: true, transactions: [], total: 0 });
    }

    let transactions = wallet.transactions || [];

    if (type && type !== "all") {
      transactions = transactions.filter((t) => t.type === type);
    }

    // Period filter: "weekly" or "monthly" (design: Recent Transactions Weekly/Monthly tabs)
    if (period === "weekly") {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      transactions = transactions.filter((t) => new Date(t.date) >= weekStart);
    } else if (period === "monthly") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      transactions = transactions.filter((t) => new Date(t.date) >= monthStart);
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = transactions.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = transactions.slice(skip, skip + parseInt(limit));

    res.json({ success: true, transactions: paginated, total });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PAY FOR BOOKING ──────────────────────────────────────────────────────────
const payForBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, walletAmount } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({ success: false, message: "Booking already paid" });
    }

    const transactionId = `PAY_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    let remainingAmount = booking.finalAmount;

    // Deduct from wallet if specified
    if (walletAmount && walletAmount > 0) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet || wallet.balance < walletAmount) {
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      }

      const deductAmount = Math.min(walletAmount, remainingAmount);
      wallet.balance -= deductAmount;
      wallet.transactions.push({
        type: "debit",
        amount: deductAmount,
        description: `Payment for booking #${bookingId}`,
        reference: {
          bookingId: booking._id,
          paymentMethod: "wallet",
          transactionId,
        },
        status: "completed",
      });
      await wallet.save();
      remainingAmount -= deductAmount;
    }

    // TODO: Process remaining amount via payment gateway
    // if (remainingAmount > 0 && paymentMethod !== 'wallet') {
    //   // Integrate with payment gateway
    // }

    booking.paymentStatus = "Paid";

    // ── Mark payment as collected by platform ──
    booking.platformPayment.collectedByPlatform = true;
    booking.platformPayment.collectedAt = new Date();
    const payoutDate = new Date();
    payoutDate.setDate(payoutDate.getDate() + 4);
    booking.platformPayment.beauticianPayoutDate = payoutDate;
    await booking.save();

    // Award points (1% of amount)
    const pointsEarned = Math.floor(booking.finalAmount * 0.01);
    if (pointsEarned > 0) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (wallet) {
        wallet.points += pointsEarned;
        await wallet.save();
      }
    }

    res.json({
      success: true,
      message: "Payment successful",
      transactionId,
      receipt: {
        bookingId: booking._id,
        amount: booking.finalAmount,
        paymentMethod: paymentMethod || "wallet",
        date: new Date(),
        status: "Paid",
        pointsEarned,
      },
    });
  } catch (error) {
    console.error("Pay for booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET RECEIPT ──────────────────────────────────────────────────────────────
const getReceipt = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    })
      .populate("services.service", "name price duration")
      .populate("beautician", "fullName");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Find wallet transaction for this booking
    const wallet = await Wallet.findOne({ user: req.user._id });
    const transaction = wallet?.transactions.find(
      (t) => t.reference?.bookingId?.toString() === bookingId
    );

    res.json({
      success: true,
      receipt: {
        bookingId: booking._id,
        services: booking.services,
        beautician: booking.beautician,
        totalAmount: booking.totalAmount,
        discountAmount: booking.discountAmount,
        finalAmount: booking.finalAmount,
        paymentMethod: transaction?.reference?.paymentMethod || "N/A",
        transactionId: transaction?.reference?.transactionId || "N/A",
        date: booking.completedAt || booking.createdAt,
        status: booking.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Get receipt error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PAYMENT WEBHOOK ──────────────────────────────────────────────────────────
const paymentWebhook = async (req, res) => {
  try {
    // TODO: Verify webhook signature from payment gateway
    const { event, data } = req.body;

    console.log(`[Payment Webhook] Event: ${event}`, data);

    // Process based on event type
    // switch(event) {
    //   case 'payment.success': ...
    //   case 'payment.failed': ...
    //   case 'refund.success': ...
    // }

    res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Payment webhook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN EARNINGS SUMMARY ──────────────────────────────────────────────
const beauticianEarnings = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    // Get pending payouts (completed bookings where payout not yet made)
    const pendingPayouts = await Booking.find({
      beautician: beautician._id,
      status: "Completed",
      "platformPayment.paidToBeautician": false,
      "platformPayment.collectedByPlatform": true,
    }).select("finalAmount platformPayment completedAt");

    res.json({
      success: true,
      earnings: {
        totalEarnings: beautician.earnings.totalEarnings || 0,
        pendingPayout: beautician.earnings.pendingPayout || 0,
        totalCommissionPaid: beautician.earnings.totalCommissionPaid || 0,
        nextPayoutDate: beautician.earnings.nextPayoutDate,
        walletBalance: wallet?.balance || 0,
      },
      pendingPayouts: pendingPayouts.map((p) => ({
        bookingId: p._id,
        amount: p.platformPayment.beauticianPayout,
        payoutDate: p.platformPayment.beauticianPayoutDate,
        completedAt: p.completedAt,
      })),
    });
  } catch (error) {
    console.error("Beautician earnings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getWallet,
  addToWallet,
  usePoints,
  getTransactions,
  payForBooking,
  getReceipt,
  paymentWebhook,
  beauticianEarnings,
};
