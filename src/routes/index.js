const express = require("express");
const authRoutes = require("./auth.routes");
const categoryRoutes = require("./category.routes");
const productRoutes = require("./product.routes");
const supplierRoutes = require("./supplier.routes");
const inventoryLogRoutes = require("./inventoryLog.routes");
const restockRequestRoutes = require("./restockRequest.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/inventory-logs", inventoryLogRoutes);
router.use("/restock-requests", restockRequestRoutes);

module.exports = router;
