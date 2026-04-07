const Role = require("../models/Role");
const User = require("../models/User");

const getAllRoles = async (req, res) => {
  try {
    const { search = "", includeMobileRoles = "false" } = req.query;
    const query = {};

    if (includeMobileRoles !== "true") {
      query.name = { $nin: ["Customer", "Beautician"] };
    }

    if (search.trim()) {
      query.name = {
        ...(query.name || {}),
        $regex: search.trim(),
        $options: "i",
      };
    }

    const roles = await Role.find(query).sort({ createdAt: -1 });
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description = "", permissions = [], isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    const role = await Role.create({
      name: name.trim(),
      description: description.trim(),
      permissions: Array.isArray(permissions) ? [...new Set(permissions)] : [],
      isActive: Boolean(isActive),
      isSystem: false,
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, description, permissions, isActive } = req.body;

    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (name && name.trim() !== role.name) {
      const existing = await Role.findOne({ name: name.trim() });
      if (existing && existing._id.toString() !== role._id.toString()) {
        return res.status(400).json({ message: "Role name already exists" });
      }
      role.name = name.trim();
    }

    if (description !== undefined) role.description = String(description).trim();
    if (Array.isArray(permissions)) role.permissions = [...new Set(permissions)];
    if (typeof isActive === "boolean") role.isActive = isActive;

    await role.save();
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (role.isSystem) {
      return res.status(400).json({ message: "System roles cannot be deleted" });
    }

    const usersUsingRole = await User.countDocuments({ role: role.name });
    if (usersUsingRole > 0) {
      return res.status(400).json({ message: "Cannot delete role assigned to users" });
    }

    await role.deleteOne();
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getMyRole = async (req, res) => {
  try {
    const role = await Role.findOne({ name: req.user.role, isActive: true });
    if (!role) {
      return res.json({ role: null, permissions: [] });
    }
    res.json({ role: role.name, permissions: role.permissions, description: role.description });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getMyRole,
};
