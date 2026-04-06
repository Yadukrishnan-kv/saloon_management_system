/**
 * SMS Sender utility
 * Configure with your preferred SMS provider (Twilio, AWS SNS, MSG91, etc.)
 */

const sendSMS = async ({ to, message }) => {
  try {
    // TODO: Integrate with SMS provider
    // Example with Twilio:
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: to,
    // });

    console.log(`[SMS] To: ${to}, Message: ${message}`);
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
