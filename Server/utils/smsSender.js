/**
 * SMS Sender utility
 * Configure with your preferred SMS provider (Twilio, AWS SNS, MSG91, etc.)
 */


// --- Twilio Integration ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;
if (twilioAccountSid && twilioAuthToken) {
  twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);
}

const sendSMS = async ({ to, message }) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio credentials not set in environment variables.');
    }
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });
    return { success: true };
  } catch (error) {
    console.error("SMS sending failed:", error);
    return { success: false, error: error.message };
  }
};

const sendOTPSMS = async (phoneNumber, otp) => {
  const message = `Your Salon App verification code is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;
  return sendSMS({ to: phoneNumber, message });
};

module.exports = { sendSMS, sendOTPSMS };
