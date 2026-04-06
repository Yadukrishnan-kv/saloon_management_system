const crypto = require("crypto");

/**
 * Generate a numeric OTP of specified length
 */
const generateOTP = (length = 6) => {
  const digits = "0123456789";
  let otp = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
};

/**
 * Get OTP expiry time (default: 10 minutes)
 */
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, getOTPExpiry };
