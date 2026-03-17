const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "admin123";

const register = async (req, res) => {
  try {
    const { email, password, role = 'employee' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!['employee', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({ email, password, role });
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const isDefaultAdminLogin =
        email.toLowerCase() === DEFAULT_ADMIN_EMAIL &&
        password === DEFAULT_ADMIN_PASSWORD;

      if (!isDefaultAdminLogin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      user = await User.create({
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
        role: 'admin',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!['employee', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({ message: "User role updated", user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "employee") {
      return res.status(400).json({ message: "Only employee accounts can be removed" });
    }

    await User.deleteOne({ _id: userId });

    return res.status(200).json({
      message: "Employee account removed",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
  deleteEmployee,
};
