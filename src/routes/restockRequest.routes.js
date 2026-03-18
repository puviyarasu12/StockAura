const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  createRestockRequest,
  listRestockRequests,
} = require("../controllers/restockRequest.controller");

const router = express.Router();

router.post("/", protect, authorize("admin"), createRestockRequest);
router.get("/", protect, authorize("admin"), listRestockRequests);


module.exports = router;

