const crypto = require("crypto");

/**
 * Generate a unique referral code
 * Format: Sidi + 4 alphanumeric characters
 */
const generateReferralCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "Sidi";
  
  // Generate 4 random alphanumeric characters
  for (let i = 0; i < 4; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

/**
 * Validate referral code format
 */
const validateReferralCode = (code) => {
  const referralCodeRegex = /^Sidi[A-Z0-9]{4}$/;
  return referralCodeRegex.test(code);
};

module.exports = { generateReferralCode, validateReferralCode };
