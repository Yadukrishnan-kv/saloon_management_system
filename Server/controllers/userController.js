const User = require("../models/User");
const Role = require("../models/Role");

const WEB_DISALLOWED_ROLES = ["Customer", "Beautician"];

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;

    const query = { role: { $nin: WEB_DISALLOWED_ROLES } };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "suspended") query.isSuspended = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const query = { role: "Customer" };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "suspended") query.isSuspended = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: "Customer" }).select("-password");
    if (!user) return res.status(404).json({ message: "Customer not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { username, email, phoneNumber } = req.body;

    const customer = await User.findOne({ _id: req.params.id, role: "Customer" });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (username) {
      const existing = await User.findOne({ username });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    customer.username = username ?? customer.username;
    customer.email = email ?? customer.email;
    customer.phoneNumber = phoneNumber ?? customer.phoneNumber;

    await customer.save();

    const safeCustomer = await User.findById(customer._id).select("-password");
    res.json(safeCustomer);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, role, phoneNumber } = req.body;

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    if (WEB_DISALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Customer/Beautician roles are mobile-app only" });
    }

    const roleExists = await Role.findOne({ name: role, isActive: true });
    if (!roleExists) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "Username or email already in use" });
    }

    const user = await User.create({ username, email, password, role, phoneNumber });
    const safeUser = await User.findById(user._id).select("-password");

    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username, email, role, phoneNumber } = req.body;

    if (role) {
      if (WEB_DISALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: "Customer/Beautician roles are mobile-app only" });
      }

      const roleExists = await Role.findOne({ name: role, isActive: true });
      if (!roleExists) {
        return res.status(400).json({ message: "Invalid role selected" });
      }
    }

    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, phoneNumber },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { action } = req.body; // activate, deactivate, suspend

    const updateFields = {};
    if (action === "activate") {
      updateFields.isActive = true;
      updateFields.isSuspended = false;
    } else if (action === "deactivate") {
      updateFields.isActive = false;
    } else if (action === "suspend") {
      updateFields.isSuspended = true;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `User ${action}d successfully`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("username email role phoneNumber profileImage");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { username, email, phoneNumber } = req.body;

    if (!username && !email && !phoneNumber) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const updateFields = {};
    if (username) updateFields.username = username.trim();
    if (phoneNumber) updateFields.phoneNumber = phoneNumber.trim();
    if (email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase() });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updateFields.email = email.trim().toLowerCase();
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    }).select("username email role phoneNumber profileImage");

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getMyProfile,
  updateMyProfile,
  changePassword,
};
