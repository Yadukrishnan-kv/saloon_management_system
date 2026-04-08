const validator = require("validator");

// ===== WEB ADMIN VALIDATORS =====

const validateRegister = (data) => {
  const errors = {};

  if (!data.username || !data.username.trim()) {
    errors.username = "Username is required";
  } else if (data.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validator.isEmail(data.email)) {
    errors.email = "Please provide a valid email";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateBooking = (data) => {
  const errors = {};

  if (!data.services || !data.services.length) {
    errors.services = "At least one service is required";
  }

  if (!data.bookingDate) {
    errors.bookingDate = "Booking date is required";
  }

  if (!data.timeSlot || !data.timeSlot.startTime || !data.timeSlot.endTime) {
    errors.timeSlot = "Time slot is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ===== MOBILE APP VALIDATORS =====

const validateCustomerRegister = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Name is required";
  } else if (data.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validator.isEmail(data.email)) {
    errors.email = "Please provide a valid email";
  }

  // Phone is optional at signup (can be added later in profile)
  if (data.phone && data.phone.trim() && !/^\+?[1-9]\d{6,14}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.phone = "Please provide a valid phone number";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  // confirmPassword is optional (mobile app may validate client-side)
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateBeauticianRegister = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = "Name is required";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email is required";
  } else if (!validator.isEmail(data.email)) {
    errors.email = "Please provide a valid email";
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!data.experience && data.experience !== 0) {
    errors.experience = "Experience is required";
  }

  if (!data.skills || !data.skills.length) {
    errors.skills = "At least one skill is required";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateBookingCreate = (data) => {
  const errors = {};

  if (!data.serviceId) {
    errors.serviceId = "Service is required";
  }

  if (!data.bookingDate) {
    errors.bookingDate = "Booking date is required";
  }

  if (!data.bookingTime) {
    errors.bookingTime = "Booking time is required";
  }

  if (!data.locationType) {
    errors.locationType = "Location type is required";
  } else if (!["home", "office", "salon"].includes(data.locationType)) {
    errors.locationType = "Invalid location type";
  }

  if (data.locationType !== "salon" && !data.address) {
    errors.address = "Address is required for home/office service";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateReview = (data) => {
  const errors = {};

  if (!data.bookingId) {
    errors.bookingId = "Booking ID is required";
  }

  if (!data.rating) {
    errors.rating = "Rating is required";
  } else if (data.rating < 1 || data.rating > 5) {
    errors.rating = "Rating must be between 1 and 5";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const validatePasswordChange = (data) => {
  const errors = {};

  if (!data.currentPassword) {
    errors.currentPassword = "Current password is required";
  }

  if (!data.newPassword) {
    errors.newPassword = "New password is required";
  } else if (data.newPassword.length < 6) {
    errors.newPassword = "New password must be at least 6 characters";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Confirm password is required";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

module.exports = {
  validateRegister,
  validateBooking,
  validateCustomerRegister,
  validateBeauticianRegister,
  validateBookingCreate,
  validateReview,
  validatePasswordChange,
};
