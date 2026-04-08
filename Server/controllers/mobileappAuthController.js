const User = require("../models/User");
const Beautician = require("../models/Beautician");
const OTP = require("../models/OTP");
const Wallet = require("../models/Wallet");
const { generateOTP, getOTPExpiry } = require("../utils/otpGenerator");
const { sendOTPSMS } = require("../utils/smsSender");
const sendEmail = require("../utils/emailSender");
const { generateToken } = require("../utils/tokenHelper");
const {
  validateCustomerRegister,
  validateBeauticianRegister,
} = require("../utils/validators");

// ─── CUSTOMER REGISTRATION ────────────────────────────────────────────────────
const customerRegister = async (req, res) => {
  try {
    const { isValid, errors } = validateCustomerRegister(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const { name, email, phone, password } = req.body;

    // Build duplicate check query — phone is optional at signup
    const orConditions = [{ email }];
    if (phone) orConditions.push({ phoneNumber: phone });

    const existing = await User.findOne({ $or: orConditions });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email or phone number already in use" });
    }

    const userData = {
      username: name,
      email,
      password,
      role: "Customer",
    };
    if (phone) userData.phoneNumber = phone;

    const user = await User.create(userData);

    // Generate and send OTP
    const otp = generateOTP();
    await OTP.create({
      user: user._id,
      otp,
      type: "email",
      purpose: "registration",
      expiresAt: getOTPExpiry(),
    });

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: "Verify Your Account - Salon App",
      html: `<h2>Welcome to Salon App!</h2><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    });

    // Send OTP via SMS only if phone provided
    if (phone) {
      await sendOTPSMS(phone, otp);
    }

    // Create wallet for customer
    await Wallet.create({ user: user._id });

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your account.",
      userId: user._id,
      requiresOTP: true,
    });
  } catch (error) {
    console.error("Customer register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── VERIFY OTP ────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp, type } = req.body;

    if (!userId || !otp || !type) {
      return res.status(400).json({ success: false, message: "userId, otp, and type are required" });
    }

    const otpRecord = await OTP.findOne({
      user: userId,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    // Mark email/phone as verified based on OTP type
    const verifyUpdate = {};
    if (type === "email") verifyUpdate.isEmailVerified = true;
    if (type === "phone") verifyUpdate.isPhoneVerified = true;

    const user = await User.findByIdAndUpdate(userId, verifyUpdate, { new: true }).select("-password");
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Verification successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── CUSTOMER LOGIN ────────────────────────────────────────────────────────────
const customerLogin = async (req, res) => {
  try {
    const { email, phone, username, password } = req.body;
    const loginField = email || phone || username;

    if (!loginField || !password) {
      return res.status(400).json({ success: false, message: "Email/username/phone and password are required" });
    }

    let query;
    if (email) {
      query = { email };
    } else if (phone) {
      query = { phoneNumber: phone };
    } else {
      query = { username };
    }
    const user = await User.findOne({ ...query, role: "Customer" }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact support." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "Account is suspended. Contact support." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const safeUser = await User.findById(user._id).select("-password");

    const profileComplete = !!(safeUser.username && safeUser.email && safeUser.phoneNumber);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser,
      profileComplete,
    });
  } catch (error) {
    console.error("Customer login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RESEND OTP ────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ success: false, message: "userId and type are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Invalidate previous OTPs
    await OTP.updateMany(
      { user: userId, type, isUsed: false },
      { isUsed: true }
    );

    const otp = generateOTP();
    await OTP.create({
      user: userId,
      otp,
      type,
      purpose: "registration",
      expiresAt: getOTPExpiry(),
    });

    if (type === "email") {
      await sendEmail({
        to: user.email,
        subject: "Your OTP Code - Salon App",
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
    } else {
      await sendOTPSMS(user.phoneNumber, otp);
    }

    res.json({ success: true, message: `OTP sent to your ${type}` });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN REGISTRATION ──────────────────────────────────────────────────
const beauticianRegister = async (req, res) => {
  try {
    const { isValid, errors } = validateBeauticianRegister(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const { name, email, phone, password, experience, skills } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phoneNumber: phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email or phone number already in use" });
    }

    const user = await User.create({
      username: name,
      email,
      password,
      phoneNumber: phone,
      role: "Beautician",
      isActive: false,
    });

    // Handle PCC document upload
    let pccDocument = {};
    if (req.files && req.files.pccDocument) {
      pccDocument = {
        documentUrl: `/uploads/${req.files.pccDocument[0].filename}`,
        isVerified: false,
        uploadedAt: new Date(),
      };
    } else if (req.file) {
      pccDocument = {
        documentUrl: `/uploads/${req.file.filename}`,
        isVerified: false,
        uploadedAt: new Date(),
      };
    }

    let beautician = await Beautician.findOne({ phoneNumber: phone });

    if (beautician && beautician.user) {
      return res.status(400).json({ success: false, message: "Beautician profile already linked to another account" });
    }

    if (beautician) {
      beautician.user = user._id;
      beautician.fullName = beautician.fullName || name;
      beautician.experience = experience || beautician.experience || 0;
      beautician.skills = (skills && skills.length) ? skills : beautician.skills;
      if (pccDocument.documentUrl) {
        beautician.pccDocument = pccDocument;
      }

      // Keep existing admin approval if already approved; otherwise keep pending.
      if (beautician.verificationStatus !== "Approved") {
        beautician.isVerified = false;
        beautician.verificationStatus = "Pending";
        beautician.status = "Inactive";
      }

      await beautician.save();
    } else {
      beautician = await Beautician.create({
        user: user._id,
        fullName: name,
        phoneNumber: phone,
        experience: experience || 0,
        skills: skills || [],
        isVerified: false,
        verificationStatus: "Pending",
        status: "Inactive",
        pccDocument,
      });
    }

    // Create wallet for beautician with ₹1000 initial balance
    const INITIAL_WALLET_BALANCE = 1000;
    await Wallet.create({
      user: user._id,
      balance: INITIAL_WALLET_BALANCE,
      initialBalanceLoaded: true,
      transactions: [
        {
          type: "credit",
          amount: INITIAL_WALLET_BALANCE,
          description: "Welcome bonus - Initial wallet balance",
          status: "completed",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Your account is pending admin verification.",
      beauticianId: beautician._id,
      requiresVerification: true,
      pccUploaded: !!pccDocument.documentUrl,
      walletBalance: INITIAL_WALLET_BALANCE,
    });
  } catch (error) {
    console.error("Beautician register error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── BEAUTICIAN LOGIN ─────────────────────────────────────────────────────────
const beauticianLogin = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const loginField = email || phone;

    if (!loginField || !password) {
      return res.status(400).json({ success: false, message: "Email/phone and password are required" });
    }

    const query = email ? { email } : { phoneNumber: phone };
    const user = await User.findOne({ ...query, role: "Beautician" }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact support." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "Account is suspended. Contact support." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const beautician = await Beautician.findOne({ user: user._id });
    const safeUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Login successful",
      token,
      beautician: {
        ...safeUser.toObject(),
        beauticianProfile: beautician,
      },
      verificationStatus: beautician?.verificationStatus || "Pending",
    });
  } catch (error) {
    console.error("Beautician login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── UPLOAD DOCUMENTS ──────────────────────────────────────────────────────────
const uploadDocuments = async (req, res) => {
  try {
    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const documents = req.files.map((file) => ({
      documentType: req.body.documentType || "certificate",
      documentUrl: `/uploads/${file.filename}`,
      isVerified: false,
    }));

    beautician.documents.push(...documents);
    await beautician.save();

    res.json({
      success: true,
      message: "Documents uploaded successfully",
    });
  } catch (error) {
    console.error("Upload documents error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    const query = email ? { email } : { phoneNumber: phone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this credential" });
    }

    // Invalidate previous password-reset OTPs
    await OTP.updateMany(
      { user: user._id, purpose: "password-reset", isUsed: false },
      { isUsed: true }
    );

    const otp = generateOTP();
    const type = email ? "email" : "phone";

    await OTP.create({
      user: user._id,
      otp,
      type,
      purpose: "password-reset",
      expiresAt: getOTPExpiry(),
    });

    if (type === "email") {
      await sendEmail({
        to: user.email,
        subject: "Password Reset OTP - Salon App",
        html: `<h2>Password Reset</h2><p>Your password reset code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
    } else {
      await sendOTPSMS(user.phoneNumber, otp);
    }

    res.json({
      success: true,
      message: `Password reset OTP sent to your ${type}`,
      userId: user._id,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword, confirmPassword } = req.body;

    if (!userId || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "userId, otp, newPassword, and confirmPassword are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const otpRecord = await OTP.findOne({
      user: userId,
      purpose: "password-reset",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. Please login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── LOGOUT ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // Invalidate refresh token
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  customerRegister,
  verifyOTP,
  customerLogin,
  resendOTP,
  forgotPassword,
  resetPassword,
  beauticianRegister,
  beauticianLogin,
  uploadDocuments,
  logout,
};
