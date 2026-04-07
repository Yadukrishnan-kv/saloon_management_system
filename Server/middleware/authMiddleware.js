const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Beautician = require("../models/Beautician");
const Role = require("../models/Role");

/**
 * Shared authentication middleware for both Web Admin and Mobile App
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: "Account is suspended" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
    }
    next();
  };
};

const authorizePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const role = await Role.findOne({ name: req.user.role, isActive: true });
      if (!role) {
        return res.status(403).json({ success: false, message: "Role is not configured or inactive" });
      }

      if (!role.permissions.includes(permission)) {
        return res.status(403).json({ success: false, message: "You do not have permission to perform this action" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
};

/**
 * Middleware to attach beautician profile to request (used by mobile beautician routes)
 */
const attachBeauticianProfile = async (req, res, next) => {
  try {
    if (req.user.role !== "Beautician") {
      return res.status(403).json({ success: false, message: "Not a beautician account" });
    }

    const beautician = await Beautician.findOne({ user: req.user._id });
    if (!beautician) {
      return res.status(404).json({ success: false, message: "Beautician profile not found" });
    }

    req.beautician = beautician;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { protect, authorizeRoles, authorizePermission, attachBeauticianProfile };
