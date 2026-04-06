const Booking = require("../models/Booking");
const Beautician = require("../models/Beautician");
const Service = require("../models/Service");
const { validateBooking } = require("../utils/validators");

const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    const query = {};

    // If customer, show only their bookings
    if (req.user.role === "Customer") {
      query.customer = req.user._id;
    }

    // If beautician, show only their assigned bookings
    if (req.user.role === "Beautician") {
      const beautician = await Beautician.findOne({ user: req.user._id });
      if (beautician) query.beautician = beautician._id;
    }

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.bookingDate = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate("customer", "username email phoneNumber")
      .populate("beautician", "fullName phoneNumber rating")
      .populate("services.service", "name price duration")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("customer", "username email phoneNumber")
      .populate("beautician", "fullName phoneNumber rating location")
      .populate("services.service", "name price duration category");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Customers can only see their own bookings
    if (req.user.role === "Customer" && booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createBooking = async (req, res) => {
  try {
    const { isValid, errors } = validateBooking(req.body);
    if (!isValid) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const { services, bookingDate, timeSlot, address, notes } = req.body;

    // Calculate totals
    let totalAmount = 0;
    let totalDuration = 0;
    const serviceDetails = [];

    for (const item of services) {
      const service = await Service.findById(item.serviceId);
      if (!service) {
        return res.status(400).json({ message: `Service ${item.serviceId} not found` });
      }
      const discountedPrice = service.price - (service.price * service.discount) / 100;
      totalAmount += discountedPrice;
      totalDuration += service.duration;
      serviceDetails.push({
        service: service._id,
        serviceName: service.name,
        price: discountedPrice,
        duration: service.duration,
      });
    }

    const booking = await Booking.create({
      customer: req.user._id,
      services: serviceDetails,
      bookingDate,
      timeSlot,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      address,
      notes,
    });

    const populated = await Booking.findById(booking._id)
      .populate("customer", "username email")
      .populate("services.service", "name price");

    res.status(201).json(populated);
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;

    if (status === "Assigned") booking.assignedAt = new Date();
    if (status === "Accepted") booking.acceptedAt = new Date();
    if (status === "InProgress") booking.startedAt = new Date();
    if (status === "Completed") {
      booking.completedAt = new Date();
      booking.paymentStatus = "Paid";
    }
    if (status === "Cancelled") {
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || "";
      booking.cancelledBy = req.user.role === "Customer" ? "Customer" : req.user.role === "Beautician" ? "Beautician" : "Admin";
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("customer", "username email")
      .populate("beautician", "fullName phoneNumber");

    res.json({ message: `Booking ${status.toLowerCase()} successfully`, booking: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (["Completed", "Cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: "Cannot cancel this booking" });
    }

    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || "";
    booking.cancelledBy = req.user.role === "Customer" ? "Customer" : "Admin";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const assignBeautician = async (req, res) => {
  try {
    const { beauticianId } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const beautician = await Beautician.findById(beauticianId);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    booking.beautician = beauticianId;
    booking.status = "Assigned";
    booking.assignedAt = new Date();
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("customer", "username email")
      .populate("beautician", "fullName phoneNumber");

    res.json({ message: "Beautician assigned successfully", booking: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "Assigned") {
      return res.status(400).json({ message: "Booking is not in assigned state" });
    }

    booking.status = "Accepted";
    booking.acceptedAt = new Date();
    await booking.save();

    res.json({ message: "Booking accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!["Accepted", "InProgress"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking cannot be completed in current state" });
    }

    booking.status = "Completed";
    booking.completedAt = new Date();
    booking.paymentStatus = "Paid";
    await booking.save();

    // Update beautician earnings
    if (booking.beautician) {
      await Beautician.findByIdAndUpdate(booking.beautician, {
        $inc: {
          "earnings.totalEarnings": booking.finalAmount,
          "earnings.pendingPayout": booking.finalAmount,
        },
      });
    }

    res.json({ message: "Booking completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getBookingsByStatus = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: req.params.status })
      .populate("customer", "username email")
      .populate("beautician", "fullName phoneNumber")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getTodayBookings = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      bookingDate: { $gte: start, $lte: end },
    })
      .populate("customer", "username email")
      .populate("beautician", "fullName phoneNumber")
      .sort({ "timeSlot.startTime": 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const reassignBooking = async (req, res) => {
  try {
    const { beauticianId } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (["Completed", "Cancelled"].includes(booking.status)) {
      return res.status(400).json({ message: "Cannot reassign completed or cancelled booking" });
    }

    const beautician = await Beautician.findById(beauticianId);
    if (!beautician) return res.status(404).json({ message: "Beautician not found" });

    booking.beautician = beauticianId;
    booking.status = "Assigned";
    booking.assignedAt = new Date();
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate("customer", "username email")
      .populate("beautician", "fullName phoneNumber");

    res.json({ message: "Booking reassigned successfully", booking: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  assignBeautician,
  acceptBooking,
  completeBooking,
  getBookingsByStatus,
  getTodayBookings,
  reassignBooking,
};
