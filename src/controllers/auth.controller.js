const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const register = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: "Invalid or missing request body. Ensure Content-Type: application/json" });
    }
    const { email, password, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
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
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: "Invalid or missing request body. Ensure Content-Type: application/json" });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
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

    if (!['user', 'admin'].includes(role)) {
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

module.exports = {
  register,
  login,
  getProfile,
  getAllUsers,
  updateUserRole,
};
