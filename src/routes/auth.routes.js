const express = require("express");
const { register, login, getProfile, getAllUsers, updateUserRole } = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/role", protect, authorize("admin"), updateUserRole);

module.exports = router;
