const express = require("express");
const {
	register,
	login,
	getProfile,
	getAllUsers,
	updateUserRole,
	deleteEmployee,
} = require("../controllers/auth.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getProfile);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/users/role", protect, authorize("admin"), updateUserRole);
router.delete("/users/:userId", protect, authorize("admin"), deleteEmployee);

module.exports = router;
