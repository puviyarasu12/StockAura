const express = require("express");
const { getAllLogs, getLogsByProduct } = require("../controllers/inventoryLog.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getAllLogs);
router.get("/product/:productId", protect, getLogsByProduct);

module.exports = router;
