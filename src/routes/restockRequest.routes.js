const express = require("express");
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  createRestockRequest,
  listRestockRequests,
  receiveRestockRequest,
} = require("../controllers/restockRequest.controller");

const router = express.Router();

router.post("/", protect, authorize("admin"), createRestockRequest);
router.get("/", protect, authorize("admin"), listRestockRequests);
router.post("/:id/receive", protect, authorize("admin"), receiveRestockRequest);

module.exports = router;

