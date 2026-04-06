const jwt = require("jsonwebtoken");

/**
 * Shared token generation used by both web admin and mobile app auth
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d" });
};

module.exports = { generateToken, generateRefreshToken };
