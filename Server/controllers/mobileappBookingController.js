const Booking = require("../models/Booking");
const Service = require("../models/Service");
const ServiceAddon = require("../models/ServiceAddon");
const Beautician = require("../models/Beautician");
const Availability = require("../models/Availability");
const Notification = require("../models/Notification");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const { validateBookingCreate } = require("../utils/validators");
const { sendPushNotification } = require("../utils/pushNotification");
const { calculateDistance } = require("../utils/geolocation");
const { createOrder: createRazorpayOrder } = require("../services/razorpayService");

const PLATFORM_COMMISSION = 200; // ₹200 commission per booking
const CANCELLATION_FEE = 200; // ₹200 cancellation fee
const BUFFER_MINUTES = 30; // 30-min buffer between beautician tasks
const MAX_BOOKING_HOUR = 23; // No bookings after 11 PM
const BROADCAST_COUNT = 4; // Send booking to 3-4 beauticians
const RADIUS_KM = 5; // 5 km area restriction
const PAYOUT_DAYS = 4; // Pay beautician in 4 days
const TRAVEL_RATE_PER_KM = 10; // ₹10 per km concierge/travel fee

// ─── HELPER: Generate time slots ──────────────────────────────────────────────
const generateTimeSlots = (start, end, durationMinutes, breakStart, breakEnd) => {
  const slots = [];
  let current = parseTime(start);
  const endTime = parseTime(end);
  const breakS = breakStart ? parseTime(breakStart) : null;
  const breakE = breakEnd ? parseTime(breakEnd) : null;

  while (current + durationMinutes <= endTime) {
    const slotStart = formatTime(current);
    const slotEnd = formatTime(current + durationMinutes);

    // Skip break time
    if (breakS && breakE) {
      if (current >= breakS && current < breakE) {
        current = breakE;
        continue;
      }
    }

    slots.push({ start: slotStart, end: slotEnd });
    current += durationMinutes;
  }
  return slots;
};

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

// ─── CREATE BOOKING (Customer) with Payment Options ──────────────────────────
const createBooking = async (req, res) => {
  try {
    const { isValid, errors } = validateBookingCreate(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const { 
      serviceIds, 
      bookingDate, 
      bookingTime, 
      locationType, 
      address, 
      notes, 
      addonIds,
      paymentMethod,     // NEW: "upi", "wallet", "payOnSite"
      walletAmount = 0   // NEW: How much user wants to pay from wallet (if choosing wallet)
    } = req.body;

    // Validate paymentMethod
    if (!paymentMethod || !["upi", "wallet", "payOnSite"].includes(paymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment method. Must be 'upi', 'wallet', or 'payOnSite'" 
      });
    }

    // Validate serviceIds is an array with at least one service
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ success: false, message: "At least one service is required" });
    }

    // ── 11 PM restriction: No bookings after 11 PM ──
    const bookingHour = parseInt(bookingTime.split(":")[0], 10);
    if (bookingHour >= MAX_BOOKING_HOUR) {
      return res.status(400).json({ success: false, message: "Bookings are not accepted after 11:00 PM" });
    }

    // ── Advance booking: Accept bookings from today onwards ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookDate = new Date(bookingDate);
    bookDate.setHours(0, 0, 0, 0);

    if (bookDate < today) {
      return res.status(400).json({ success: false, message: "Bookings cannot be made for past dates. Please select today or a future date." });
    }

    // ── Fetch all services ──
    const services = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    if (services.length !== serviceIds.length) {
      return res.status(404).json({ success: false, message: "One or more services not found or inactive" });
    }

    // ── Build services array with prices and calculate totals ──
    let bookingServices = [];
    let totalServicePrice = 0;
    let totalDiscountAmount = 0;
    let totalDuration = 0;

    services.forEach((service) => {
      const discountedPrice = service.price - (service.price * service.discount) / 100;
      bookingServices.push({
        service: service._id,
        serviceName: service.name,
        price: discountedPrice,
        duration: service.duration,
      });
      totalServicePrice += discountedPrice;
      totalDiscountAmount += service.price - discountedPrice;
      totalDuration += service.duration;
    });

    // ── Calculate end time based on total duration ──
    const endTimeMinutes = parseTime(bookingTime) + totalDuration;
    const endTime = formatTime(endTimeMinutes);

    // ── Resolve add-ons ──
    let bookingAddons = [];
    let addonsTotal = 0;
    if (addonIds && addonIds.length > 0) {
      const addons = await ServiceAddon.find({ _id: { $in: addonIds }, isActive: true });
      bookingAddons = addons.map((a) => ({
        addon: a._id,
        addonName: a.name,
        price: a.price,
      }));
      addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
    }

    const finalAmount = totalServicePrice + addonsTotal;

    // ── PAYMENT PROCESSING ──
    let paymentData = {};
    let bookingStatus = "Requested";

    if (paymentMethod === "upi") {
      // Create Razorpay order for UPI payment
      const razorpayOrder = await createRazorpayOrder(finalAmount, req.user._id, `Booking for services on ${bookingDate}`);
      
      if (!razorpayOrder.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Failed to create payment order. Please try again." 
        });
      }

      paymentData.razorpayPayment = {
        orderId: razorpayOrder.orderId,
        paymentStatus: "pending",
      };
    } 
    else if (paymentMethod === "wallet") {
      // Check wallet balance
      const wallet = await Wallet.findOne({ user: req.user._id });
      
      if (!wallet) {
        return res.status(400).json({ 
          success: false, 
          message: "Wallet not found for your account" 
        });
      }

      if (wallet.balance >= finalAmount) {
        // Wallet has enough balance
        paymentData.walletPayment = {
          amountDeducted: finalAmount,
          deductedAt: new Date(),
        };
        bookingStatus = "Requested"; // Will proceed once booking is confirmed
      } 
      else if (wallet.balance > 0) {
        // Wallet has partial balance - offer to pay remaining via UPI or pay on site
        paymentData.partialPayment = {
          walletAmount: wallet.balance,
          remainingAmount: finalAmount - wallet.balance,
          remainingPaymentMethod: "", // Client will choose: "upi" or "payOnSite"
        };
      } 
      else {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient wallet balance. Please use UPI or Pay On Site option.",
          walletBalance: wallet.balance,
          requiredAmount: finalAmount
        });
      }
    } 
    else if (paymentMethod === "payOnSite") {
      // Pay on site - payment pending until service completion
      paymentData.payOnSite = {
        status: "pending",
        paymentMode: "", // Client will choose: "cash" or "upi" after service
      };
    }

    // ── CREATE BOOKING ──
    const booking = await Booking.create({
      customer: req.user._id,
      beautician: null,  // No beautician assigned yet - admin will assign
      services: bookingServices,
      addons: bookingAddons,
      bookingDate: new Date(bookingDate),
      timeSlot: {
        startTime: bookingTime,
        endTime,
      },
      status: bookingStatus,
      totalAmount: totalServicePrice + addonsTotal,
      discountAmount: totalDiscountAmount,
      addonsAmount: addonsTotal,
      travelFee: 0,
      finalAmount: finalAmount,
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === "payOnSite" ? "Pending" : "Pending",
      address: address
        ? {
            street: address.address,
            unit: address.unit || "",
            gateCode: address.gateCode || "",
            city: address.city,
            pincode: address.pincode,
            coordinates: {
              lat: address.latitude,
              lng: address.longitude,
            },
          }
        : undefined,
      notes: notes || "",
      broadcastedTo: [],
      platformPayment: {
        collectedByPlatform: false,
        platformCommission: PLATFORM_COMMISSION,
      },
      ...paymentData,
    });

    // ── Handle wallet deduction if payment method is wallet ──
    if (paymentMethod === "wallet" && paymentData.walletPayment?.amountDeducted) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (wallet) {
        wallet.balance -= paymentData.walletPayment.amountDeducted;
        wallet.transactions.push({
          type: "debit",
          amount: paymentData.walletPayment.amountDeducted,
          description: `Service booking on ${bookingDate}`,
          reference: {
            bookingId: booking._id,
            paymentMethod: "wallet",
          },
          status: "completed",
        });
        await wallet.save();
      }
    }

    // ── Notify admin about new booking request ──
    await createAdminNotification(
      "New Booking Request",
      `New booking request from customer for ${services.length} service(s) on ${bookingDate} at ${bookingTime}. Total: ₹${finalAmount} (Payment: ${paymentMethod}). Please assign a beautician.`,
      "booking",
      { bookingId: booking._id }
    );

    // ── Notify customer about booking confirmation ──
    await Notification.create({
      user: req.user._id,
      title: "Booking Confirmed",
      message: `Your booking request for ${services.length} service(s) has been received. Admin will assign a beautician shortly.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image");

    // Prepare response based on payment method
    let responseData = {
      success: true,
      message: "Booking request created. Admin will assign a beautician shortly.",
      booking: populatedBooking,
      totalServices: services.length,
      totalServicePrice,
      totalDiscount: totalDiscountAmount,
      addonsAmount: addonsTotal,
      estimatedTotalAmount: finalAmount,
      estimatedDuration: totalDuration,
      paymentMethod: paymentMethod,
    };

    // Add payment-specific response data
    if (paymentMethod === "upi") {
      responseData.razorpayOrderId = paymentData.razorpayPayment?.orderId;
      responseData.message = "Booking created. Please complete UPI payment to confirm.";
    } 
    else if (paymentMethod === "wallet") {
      if (paymentData.walletPayment?.amountDeducted) {
        responseData.message = "Booking confirmed! Amount deducted from wallet.";
        responseData.walletDeducted = paymentData.walletPayment.amountDeducted;
      } 
      else if (paymentData.partialPayment) {
        responseData.message = "Wallet balance is insufficient. Please choose to pay remaining via UPI or Pay On Site.";
        responseData.walletAmount = paymentData.partialPayment.walletAmount;
        responseData.remainingAmount = paymentData.partialPayment.remainingAmount;
      }
    } 
    else if (paymentMethod === "payOnSite") {
      responseData.message = "Booking created. Payment will be collected after service completion.";
    }

    res.status(201).json(responseData);

  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── MY BOOKINGS (Customer) ──────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { customer: req.user._id };

    if (status === "upcoming") {
      query.status = { $in: ["Requested", "Assigned", "Accepted"] };
      query.bookingDate = { $gte: new Date() };
    } else if (status === "completed") {
      query.status = "Completed";
    } else if (status === "cancelled") {
      query.status = { $in: ["Cancelled", "Rejected"] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image")
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      total,
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET BOOKING DETAILS ──────────────────────────────────────────────────────
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      customer: req.user._id,
    })
      .populate("beautician", "fullName phoneNumber rating profileImage location")
      .populate("services.service", "name price duration image category");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Build timeline
    const timeline = [];
    timeline.push({ status: "Requested", date: booking.createdAt });
    if (booking.assignedAt) timeline.push({ status: "Assigned", date: booking.assignedAt });
    if (booking.acceptedAt) timeline.push({ status: "Accepted", date: booking.acceptedAt });
    if (booking.startedAt) timeline.push({ status: "InProgress", date: booking.startedAt });
    if (booking.completedAt) timeline.push({ status: "Completed", date: booking.completedAt });
    if (booking.cancelledAt) timeline.push({ status: "Cancelled", date: booking.cancelledAt });

    res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        timeline,
      },
    });
  } catch (error) {
    console.error("Get booking details error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CANCEL BOOKING (Customer) ────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      customer: req.user._id,
    }).populate("beautician");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (["Completed", "Cancelled", "InProgress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is ${booking.status}`,
      });
    }

    // ─── CHECK 30-MINUTE BUFFER BEFORE SERVICE START ────────────────────
    const CANCELLATION_BUFFER_MINUTES = 30;
    
    // Parse booking date and time
    const bookingDateTime = new Date(booking.bookingDate);
    const [hours, minutes] = booking.timeSlot.startTime.split(":").map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    
    // Calculate the cancellation deadline (30 mins before service start)
    const cancellationDeadline = new Date(bookingDateTime.getTime() - CANCELLATION_BUFFER_MINUTES * 60000);
    const now = new Date();

    if (now >= cancellationDeadline) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking within 30 minutes of service start time. Service starts at ${booking.timeSlot.startTime}`,
        serviceStartTime: booking.timeSlot.startTime,
        cancellationDeadline: cancellationDeadline,
        currentTime: now,
      });
    }

    const { reason } = req.body;

    booking.status = "Cancelled";
    booking.cancellationReason = reason || "";
    booking.cancelledBy = "Customer";
    booking.cancelledAt = new Date();
    booking.cancellationFee = CANCELLATION_FEE;
    await booking.save();

    // ── Deduct ₹200 cancellation fee from customer wallet ──
    const customerWallet = await Wallet.findOne({ user: req.user._id });
    if (customerWallet) {
      customerWallet.balance -= CANCELLATION_FEE;
      customerWallet.transactions.push({
        type: "debit",
        amount: CANCELLATION_FEE,
        description: `Cancellation fee for booking #${booking.jobId}`,
        reference: { bookingId: booking._id },
        status: "completed",
      });
      await customerWallet.save();
    }

    // Calculate refund (refund minus cancellation fee)
    let refundAmount = 0;
    if (booking.paymentStatus === "Paid") {
      refundAmount = Math.max(0, booking.finalAmount - CANCELLATION_FEE);
      booking.paymentStatus = "Refunded";
      await booking.save();
    }

    // ── NOTIFY BEAUTICIAN ABOUT CANCELLATION ──────────────────────────────
    if (booking.beautician) {
      await Notification.create({
        user: booking.beautician.user,
        title: "Booking Cancelled",
        message: `A booking for ${booking.services[0]?.serviceName} has been cancelled by the customer.`,
        type: "booking",
        data: { bookingId: booking._id },
      });
    }

    // ── NOTIFY ADMIN ABOUT CANCELLATION ───────────────────────────────────
    const User = require("../models/User");
    const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] }, isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: "Booking Cancelled by Customer",
        message: `Booking #${booking.jobId} cancelled by customer. Reason: ${reason || "Not provided"}. Cancellation fee: ₹${CANCELLATION_FEE} charged.`,
        type: "booking",
        forAdmin: true,
        data: { bookingId: booking._id },
      });
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      cancellationFee: CANCELLATION_FEE,
      refundAmount,
      bookingStatus: "Cancelled",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RESCHEDULE BOOKING (Customer) ────────────────────────────────────────────
const rescheduleBooking = async (req, res) => {
  try {
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, message: "New date and time are required" });
    }

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (["Completed", "Cancelled", "InProgress"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a booking that is ${booking.status}`,
      });
    }

    const totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0);
    const endTimeMinutes = parseTime(newTime) + totalDuration;

    booking.bookingDate = new Date(newDate);
    booking.timeSlot = {
      startTime: newTime,
      endTime: formatTime(endTimeMinutes),
    };
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image");

    res.json({
      success: true,
      message: "Booking rescheduled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── AVAILABLE SLOTS ──────────────────────────────────────────────────────────
const getAvailableSlots = async (req, res) => {
  try {
    const { serviceId, beauticianId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ success: false, message: "Service ID and date are required" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    // Default working hours
    let workingHours = { start: "09:00", end: "18:00" };
    let breakTime = null;

    if (beauticianId) {
      const availability = await Availability.findOne({ beautician: beauticianId });
      if (availability) {
        workingHours = availability.workingHours;
        breakTime = availability.breakTime;

        // Check if date is on a working day
        const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
        if (!availability.workingDays.includes(dayOfWeek)) {
          return res.json({ success: true, availableSlots: [] });
        }

        // Check unavailable dates
        const isUnavailable = availability.unavailableDates.some(
          (ud) => new Date(ud.date).toDateString() === new Date(date).toDateString()
        );
        if (isUnavailable) {
          return res.json({ success: true, availableSlots: [] });
        }
      }
    }

    // Generate all possible slots
    const allSlots = generateTimeSlots(
      workingHours.start,
      workingHours.end,
      service.duration,
      breakTime?.start,
      breakTime?.end
    );

    // Find booked slots for that date and beautician
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const bookedQuery = {
      bookingDate: { $gte: dateStart, $lte: dateEnd },
      status: { $in: ["Requested", "Assigned", "Accepted", "InProgress"] },
    };
    if (beauticianId) bookedQuery.beautician = beauticianId;

    const bookedBookings = await Booking.find(bookedQuery);
    const bookedTimes = bookedBookings.map((b) => b.timeSlot.startTime);

    // Filter out booked slots
    const availableSlots = allSlots
      .filter((slot) => !bookedTimes.includes(slot.start))
      .map((slot) => slot.start);

    res.json({ success: true, availableSlots });
  } catch (error) {
    console.error("Available slots error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── COMPLETE BOOKING (Customer confirms) ─────────────────────────────────────
const customerCompleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      customer: req.user._id,
      status: "InProgress",
    }).populate("beautician");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not in progress" });
    }

    const COMMISSION_AMOUNT = 200; // ₹200 commission per booking

    booking.status = "Completed";
    booking.completedAt = new Date();
    booking.paymentStatus = "Paid";
    
    // ─── CALCULATE PAYOUT (Final Amount - Commission) ──────────────────────
    booking.platformPayment = {
      collectedByPlatform: true,
      collectedAt: new Date(),
      beauticianPayoutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // +4 days
      paidToBeautician: false,
      platformCommission: COMMISSION_AMOUNT,
      beauticianPayout: booking.finalAmount - COMMISSION_AMOUNT,
    };
    
    await booking.save();

    // ─── UPDATE BEAUTICIAN EARNINGS & TRACK LAST TASK ──────────────────────
    if (booking.beautician) {
      // Update last completed booking
      await Beautician.findByIdAndUpdate(booking.beautician._id, {
        lastCompletedBooking: {
          bookingId: booking._id,
          completedAt: new Date(),
        },
        $inc: {
          "earnings.totalEarnings": booking.finalAmount,
          "earnings.pendingPayout": booking.platformPayment.beauticianPayout,
        },
      });

      // ─── DEDUCT ₹200 COMMISSION FROM BEAUTICIAN'S WALLET ──────────────────
      const beauticianUser = await User.findById(booking.beautician.user);
      if (beauticianUser) {
        let wallet = await Wallet.findOne({ user: beauticianUser._id });
        if (wallet) {
          wallet.balance -= COMMISSION_AMOUNT;
          wallet.transactions.push({
            type: "debit",
            amount: COMMISSION_AMOUNT,
            description: `Commission deducted for booking #${booking.jobId}`,
            reference: { bookingId: booking._id },
            status: "completed",
          });
          await wallet.save();
        }
      }

      // Notify beautician
      await Notification.create({
        user: booking.beautician.user,
        title: "Booking Completed",
        message: `Your booking has been marked as completed. ₹${COMMISSION_AMOUNT} commission has been deducted from your wallet.`,
        type: "booking",
        data: { bookingId: booking._id },
      });
    }

    res.json({ success: true, message: "Booking marked as completed" });
  } catch (error) {
    console.error("Customer complete booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: TODAY'S BOOKINGS ─────────────────────────────────────────────
const beauticianTodayBookings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      beautician: req.beautician._id,
      bookingDate: { $gte: today, $lt: tomorrow },
      status: { $nin: ["Cancelled", "Rejected"] },
    })
      .populate("customer", "username email phoneNumber profileImage")
      .populate("services.service", "name price duration image")
      .sort({ "timeSlot.startTime": 1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Today bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: ASSIGNED BOOKINGS (Awaiting Response) ───────────────────────
const beauticianAssignedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      beautician: req.beautician._id,
      status: "Assigned",
    })
      .populate("customer", "username email phoneNumber profileImage tier")
      .populate("services.service", "name price duration image")
      .populate("addons.addon", "name price")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Assigned bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: UPCOMING BOOKINGS ───────────────────────────────────────────
const beauticianUpcomingBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find({
      beautician: req.beautician._id,
      bookingDate: { $gte: new Date() },
      status: { $in: ["Assigned", "Accepted"] },
    })
      .populate("customer", "username email phoneNumber profileImage")
      .populate("services.service", "name price duration image")
      .sort({ bookingDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({
      beautician: req.beautician._id,
      bookingDate: { $gte: new Date() },
      status: { $in: ["Assigned", "Accepted"] },
    });

    res.json({ success: true, bookings, total });
  } catch (error) {
    console.error("Upcoming bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: GET BOOKING DETAILS ──────────────────────────────────────────
const beauticianGetBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      beautician: req.beautician._id,
    })
      .populate("customer", "username email phoneNumber profileImage tier")
      .populate("services.service", "name price duration image category")
      .populate("addons.addon", "name price image");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      booking,
      // Expose customer contact for chat/call (design shows message & phone icons)
      customerContact: {
        name: booking.customer?.username,
        phone: booking.customer?.phoneNumber,
        email: booking.customer?.email,
        tier: booking.customer?.tier,
        profileImage: booking.customer?.profileImage,
      },
    });
  } catch (error) {
    console.error("Beautician get booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: ACCEPT BOOKING ──────────────────────────────────────────────
const beauticianAcceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      status: { $in: ["Assigned", "Requested"] },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or already processed" });
    }

    // For broadcast bookings, check if this beautician was in the broadcast list
    if (booking.broadcastedTo && booking.broadcastedTo.length > 0) {
      const broadcastEntry = booking.broadcastedTo.find(
        (b) => b.beautician.toString() === req.beautician._id.toString()
      );
      if (!broadcastEntry) {
        return res.status(403).json({ success: false, message: "You were not assigned this booking" });
      }
      // Check if someone else already accepted
      const alreadyAccepted = booking.broadcastedTo.find((b) => b.response === "accepted");
      if (alreadyAccepted) {
        return res.status(400).json({ success: false, message: "This booking has already been accepted by another beautician" });
      }
      // Mark this beautician as accepted, others as auto-declined
      booking.broadcastedTo = booking.broadcastedTo.map((b) => {
        if (b.beautician.toString() === req.beautician._id.toString()) {
          return { ...b.toObject(), response: "accepted", respondedAt: new Date() };
        }
        return { ...b.toObject(), response: "declined", respondedAt: new Date() };
      });
    } else if (booking.beautician && booking.beautician.toString() !== req.beautician._id.toString()) {
      return res.status(403).json({ success: false, message: "This booking is not assigned to you" });
    }

    // ── 30-min buffer check before accepting ──
    const totalDuration = booking.services.reduce((sum, s) => sum + s.duration, 0);
    const endTime = formatTime(parseTime(booking.timeSlot.startTime) + totalDuration);
    const hasConflict = await checkBeauticianBuffer(req.beautician._id, booking.bookingDate, booking.timeSlot.startTime, endTime, booking._id);
    if (hasConflict) {
      return res.status(400).json({ success: false, message: "Cannot accept - you have a task within 30 minutes of this booking" });
    }

    booking.beautician = req.beautician._id;
    booking.status = "Accepted";
    booking.acceptedAt = new Date();
    booking.assignedAt = new Date();
    await booking.save();

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: "Booking Accepted",
      message: `Your booking has been accepted by ${req.beautician.fullName}.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    // Notify other beauticians that this booking is taken (for broadcast)
    if (booking.broadcastedTo && booking.broadcastedTo.length > 0) {
      for (const bc of booking.broadcastedTo) {
        if (bc.beautician.toString() !== req.beautician._id.toString()) {
          const otherBeautician = await Beautician.findById(bc.beautician);
          if (otherBeautician) {
            await Notification.create({
              user: otherBeautician.user,
              title: "Booking No Longer Available",
              message: "A booking you were offered has been accepted by another beautician.",
              type: "booking",
              data: { bookingId: booking._id },
            });
          }
        }
      }
    }

    res.json({ success: true, message: "Booking accepted" });
  } catch (error) {
    console.error("Accept booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: DECLINE BOOKING ─────────────────────────────────────────────
const beauticianDeclineBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      beautician: req.beautician._id,
      status: "Assigned",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or already processed" });
    }

    // Update broadcast array to mark this beautician's response as declined
    if (booking.broadcastedTo && booking.broadcastedTo.length > 0) {
      booking.broadcastedTo = booking.broadcastedTo.map((b) => {
        if (b.beautician.toString() === req.beautician._id.toString()) {
          return { ...b.toObject(), response: "declined", respondedAt: new Date() };
        }
        return b;
      });
    }

    booking.status = "Rejected";
    booking.cancellationReason = reason || "Declined by beautician";
    booking.cancelledBy = "Beautician";
    booking.cancelledAt = new Date();
    // Unassign beautician so admin can reassign
    booking.beautician = null;
    booking.status = "Requested";
    await booking.save();

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: "Booking Update",
      message: "Your beautician was unable to take this booking. We are finding another beautician for you.",
      type: "booking",
      data: { bookingId: booking._id },
    });

    res.json({ success: true, message: "Booking declined" });
  } catch (error) {
    console.error("Decline booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: START BOOKING ────────────────────────────────────────────────
// ─── BEAUTICIAN: ON THE WAY ───────────────────────────────────────────────────
const beauticianOnTheWay = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      beautician: req.beautician._id,
      status: "Accepted",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not accepted" });
    }

    booking.status = "OnTheWay";
    booking.onTheWayAt = new Date();
    await booking.save();

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: "Stylist On The Way",
      message: `Your stylist ${req.beautician.fullName} is on the way!`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    res.json({ success: true, message: "Status updated to on the way" });
  } catch (error) {
    console.error("On the way error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const beauticianStartBooking = async (req, res) => {
  try {
    const { biometricToken, professionalNotes } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      beautician: req.beautician._id,
      status: { $in: ["Accepted", "OnTheWay"] },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not accepted" });
    }

    // Record biometric verification (verified client-side, token acts as confirmation)
    if (biometricToken) {
      booking.biometricVerification.startVerified = true;
      booking.biometricVerification.startVerifiedAt = new Date();
    }

    if (professionalNotes) {
      booking.professionalNotes = professionalNotes;
    }

    booking.status = "InProgress";
    booking.startedAt = new Date();
    await booking.save();

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: "Service Started",
      message: `Your beautician ${req.beautician.fullName} has started the service.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    res.json({
      success: true,
      message: "Booking marked as in-progress",
      biometricVerified: !!biometricToken,
    });
  } catch (error) {
    console.error("Start booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: COMPLETE BOOKING ─────────────────────────────────────────────
const beauticianCompleteBooking = async (req, res) => {
  try {
    const { biometricToken } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      beautician: req.beautician._id,
      status: "InProgress",
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not in progress" });
    }

    // Record biometric verification for completion
    if (biometricToken) {
      booking.biometricVerification.completeVerified = true;
      booking.biometricVerification.completeVerifiedAt = new Date();
    }

    booking.status = "Completed";
    booking.completedAt = new Date();
    if (req.body.notes) booking.notes = req.body.notes;

    // ── Platform payment: Mark as collected by platform ──
    booking.platformPayment.collectedByPlatform = true;
    booking.platformPayment.collectedAt = new Date();
    const payoutDate = new Date();
    payoutDate.setDate(payoutDate.getDate() + PAYOUT_DAYS);
    booking.platformPayment.beauticianPayoutDate = payoutDate;
    booking.platformPayment.platformCommission = PLATFORM_COMMISSION;
    booking.platformPayment.beauticianPayout = booking.finalAmount - PLATFORM_COMMISSION;
    await booking.save();

    // Update beautician earnings
    const beautician = await Beautician.findById(req.beautician._id);
    beautician.earnings.totalEarnings += booking.finalAmount;
    beautician.earnings.pendingPayout += (booking.finalAmount - PLATFORM_COMMISSION);
    beautician.earnings.totalCommissionPaid = (beautician.earnings.totalCommissionPaid || 0) + PLATFORM_COMMISSION;
    beautician.earnings.nextPayoutDate = payoutDate;
    await beautician.save();

    // ── Deduct ₹200 commission from beautician wallet ──
    const beauticianWallet = await Wallet.findOne({ user: beautician.user });
    if (beauticianWallet) {
      beauticianWallet.balance -= PLATFORM_COMMISSION;
      beauticianWallet.transactions.push({
        type: "debit",
        amount: PLATFORM_COMMISSION,
        description: `Platform commission for booking #${booking._id}`,
        reference: { bookingId: booking._id },
        status: "completed",
      });
      await beauticianWallet.save();
    }

    // Notify customer
    await Notification.create({
      user: booking.customer,
      title: "Service Completed",
      message: `Your service has been completed. Please rate your experience.`,
      type: "booking",
      data: { bookingId: booking._id },
    });

    // ── Notify admin about booking completion ──
    await createAdminNotification(
      "Booking Completed",
      `Booking #${booking._id} completed. Payout of ₹${booking.finalAmount - PLATFORM_COMMISSION} due on ${payoutDate.toDateString()}.`,
      "payout",
      { bookingId: booking._id }
    );

    res.json({
      success: true,
      message: "Booking completed",
      jobId: booking.jobId,
      paymentAmount: booking.finalAmount,
      platformCommission: PLATFORM_COMMISSION,
      beauticianPayout: booking.finalAmount - PLATFORM_COMMISSION,
      payoutDate: payoutDate,
      biometricVerified: !!biometricToken,
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN: BOOKING HISTORY ──────────────────────────────────────────────
const beauticianBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year } = req.query;
    const query = { beautician: req.beautician._id };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.bookingDate = { $gte: startDate, $lte: endDate };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate("customer", "username email phoneNumber profileImage")
      .populate("services.service", "name price duration")
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    // Calculate total earnings from completed bookings
    const earningsAgg = await Booking.aggregate([
      {
        $match: {
          beautician: req.beautician._id,
          status: "Completed",
          ...(month && year
            ? {
                bookingDate: {
                  $gte: new Date(parseInt(year), parseInt(month) - 1, 1),
                  $lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59),
                },
              }
            : {}),
        },
      },
      { $group: { _id: null, totalEarnings: { $sum: "$finalAmount" } } },
    ]);

    res.json({
      success: true,
      bookings,
      total,
      totalEarnings: earningsAgg[0]?.totalEarnings || 0,
    });
  } catch (error) {
    console.error("Booking history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── HELPER: Check 30-min buffer for beautician ──────────────────────────────
const checkBeauticianBuffer = async (beauticianId, bookingDate, startTime, endTime, currentBookingId = null) => {
  const dateStart = new Date(bookingDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(bookingDate);
  dateEnd.setHours(23, 59, 59, 999);

  const query = {
    beautician: beauticianId,
    bookingDate: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ["Assigned", "Accepted", "InProgress"] },
  };

  // Exclude the current booking being accepted/checked
  if (currentBookingId) {
    query._id = { $ne: currentBookingId };
  }

  const existingBookings = await Booking.find(query);

  const newStart = parseTime(startTime);
  const newEnd = parseTime(endTime);

  for (const existing of existingBookings) {
    const existStart = parseTime(existing.timeSlot.startTime);
    const existEnd = parseTime(existing.timeSlot.endTime);

    // Check if new booking overlaps with existing + 30-min buffer
    if (newStart < existEnd + BUFFER_MINUTES && newEnd + BUFFER_MINUTES > existStart) {
      return true; // Conflict found
    }
  }
  return false;
};

// ─── HELPER: Find nearby available beauticians for broadcast ──────────────────
const findNearbyAvailableBeauticians = async (address, bookingDate, bookingTime, endTime, service, preferredGender, customerTier) => {
  const query = { isVerified: true, status: "Active" };

  // Filter by service skill
  if (service.name) {
    query.skills = { $in: [service.name] };
  }

  // ── Tier filtering: Classic customers see only Classic beauticians, Premium see all ──
  if (customerTier === "Classic") {
    query.tier = "Classic";
  }

  let beauticians = await Beautician.find(query).populate("user", "username");

  // Filter by 5 km radius
  if (address && address.latitude && address.longitude) {
    beauticians = beauticians.filter((b) => {
      if (b.location?.coordinates?.lat && b.location?.coordinates?.lng) {
        const distance = calculateDistance(
          address.latitude,
          address.longitude,
          b.location.coordinates.lat,
          b.location.coordinates.lng
        );
        return distance <= RADIUS_KM;
      }
      return false;
    });
  }

  // Check 30-min buffer for each beautician
  const available = [];
  for (const b of beauticians) {
    const hasConflict = await checkBeauticianBuffer(b._id, bookingDate, bookingTime, endTime);
    if (!hasConflict) {
      available.push(b);
    }
  }

  // Sort by rating (highest first)
  available.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return available;
};

// ─── HELPER: Create admin notification ────────────────────────────────────────
const createAdminNotification = async (title, message, type, data) => {
  const admins = await User.find({ role: { $in: ["Admin", "SuperAdmin"] }, isActive: true });
  for (const admin of admins) {
    await Notification.create({
      user: admin._id,
      title,
      message,
      type,
      forAdmin: true,
      data,
    });
  }
};

// ─── BEAUTICIAN: GET BROADCAST BOOKINGS (bookings sent to this beautician) ────
const beauticianBroadcastBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      "broadcastedTo.beautician": req.beautician._id,
      "broadcastedTo.response": "pending",
      status: "Requested",
    })
      .populate("customer", "username email phoneNumber profileImage")
      .populate("services.service", "name price duration image")
      .sort({ bookingDate: 1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Broadcast bookings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── VERIFY UPI PAYMENT (Razorpay) ───────────────────────────────────────────
const verifyUPIPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Validate input
    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment verification fields" 
      });
    }

    // Find booking
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      customer: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Verify payment signature
    const { verifyPaymentSignature } = require("../services/razorpayService");
    const isSignatureValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isSignatureValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment signature verification failed" 
      });
    }

    // Update booking with payment details
    booking.razorpayPayment = {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
      paymentStatus: "completed",
      amountPaid: booking.finalAmount,
      paidAt: new Date(),
    };

    booking.paymentStatus = "Paid";
    booking.platformPayment.collectedByPlatform = true;
    booking.platformPayment.collectedAt = new Date();

    await booking.save();

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: "Payment Successful",
      message: `Payment of ₹${booking.finalAmount} received for your booking. Beautician will be assigned shortly.`,
      type: "payment",
      data: { bookingId: booking._id },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image");

    res.json({
      success: true,
      message: "Payment verified successfully. Booking confirmed.",
      booking: populatedBooking,
    });

  } catch (error) {
    console.error("Verify UPI payment error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── UPDATE PARTIAL PAYMENT (Wallet insufficient - choose UPI or Pay On Site) ─
const updatePartialPayment = async (req, res) => {
  try {
    const { bookingId, remainingPaymentMethod } = req.body;

    // Validate input
    if (!bookingId || !remainingPaymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: "Booking ID and payment method required" 
      });
    }

    if (!["upi", "payOnSite"].includes(remainingPaymentMethod)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment method. Must be 'upi' or 'payOnSite'" 
      });
    }

    // Find booking
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      customer: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Check if booking has partial payment data
    if (!booking.partialPayment || !booking.partialPayment.remainingAmount) {
      return res.status(400).json({ 
        success: false, 
        message: "This booking does not have partial payment pending" 
      });
    }

    const remainingAmount = booking.partialPayment.remainingAmount;
    let razorpayOrderId = null;

    if (remainingPaymentMethod === "upi") {
      // Create Razorpay order for remaining amount
      const razorpayOrder = await createRazorpayOrder(
        remainingAmount, 
        req.user._id, 
        `Partial payment for booking ${booking.jobId || booking._id}`
      );

      if (!razorpayOrder.success) {
        return res.status(400).json({ 
          success: false, 
          message: "Failed to create payment order for remaining amount",
          error: razorpayOrder.message,
        });
      }

      razorpayOrderId = razorpayOrder.orderId;
      booking.partialPayment.remainingPaymentMethod = "upi";
      booking.partialPayment.razorpayOrderId = razorpayOrderId;
    } 
    else if (remainingPaymentMethod === "payOnSite") {
      booking.partialPayment.remainingPaymentMethod = "payOnSite";
    }

    await booking.save();

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: "Partial Payment Updated",
      message: `Remaining ₹${remainingAmount} will be paid via ${remainingPaymentMethod === "upi" ? "UPI" : "on-site payment"}.`,
      type: "payment",
      data: { bookingId: booking._id },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image");

    const response = {
      success: true,
      message: `Remaining ₹${remainingAmount} payment method updated to ${remainingPaymentMethod === "upi" ? "UPI" : "Pay On Site"}.`,
      booking: populatedBooking,
      remainingAmount,
    };

    if (remainingPaymentMethod === "upi") {
      response.razorpayOrderId = razorpayOrderId;
      response.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    }

    res.json(response);

  } catch (error) {
    console.error("Update partial payment error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ─── VERIFY UPI PAYMENT FOR PARTIAL AMOUNT ───────────────────────────────────
const verifyPartialUPIPayment = async (req, res) => {
  try {
    const { bookingId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required payment verification fields" 
      });
    }

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      customer: req.user._id 
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Verify payment signature
    const { verifyPaymentSignature } = require("../services/razorpayService");
    const isSignatureValid = verifyPaymentSignature(
      booking.partialPayment.razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment signature verification failed" 
      });
    }

    const remainingAmount = booking.partialPayment.remainingAmount;
    const walletAmount = booking.partialPayment.walletAmount;

    // Update booking with partial UPI payment
    booking.partialPayment.razorpayPaymentId = razorpayPaymentId;
    booking.partialPayment.paidAt = new Date();

    // Update payment status
    booking.paymentStatus = "Paid";
    booking.platformPayment.collectedByPlatform = true;
    booking.platformPayment.collectedAt = new Date();

    await booking.save();

    // Notify customer
    await Notification.create({
      user: req.user._id,
      title: "Partial Payment Received",
      message: `Wallet: ₹${walletAmount} + UPI: ₹${remainingAmount} = Total ₹${walletAmount + remainingAmount} received. Booking confirmed.`,
      type: "payment",
      data: { bookingId: booking._id },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("beautician", "fullName phoneNumber rating profileImage")
      .populate("services.service", "name price duration image");

    res.json({
      success: true,
      message: "Partial payment verified successfully. Booking confirmed.",
      booking: populatedBooking,
    });

  } catch (error) {
    console.error("Verify partial UPI payment error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  verifyUPIPayment,
  updatePartialPayment,
  verifyPartialUPIPayment,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
  rescheduleBooking,
  getAvailableSlots,
  customerCompleteBooking,
  beauticianTodayBookings,
  beauticianAssignedBookings,
  beauticianUpcomingBookings,
  beauticianGetBooking,
  beauticianAcceptBooking,
  beauticianDeclineBooking,
  beauticianOnTheWay,
  beauticianStartBooking,
  beauticianCompleteBooking,
  beauticianBookingHistory,
  beauticianBroadcastBookings,
};
