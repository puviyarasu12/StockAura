const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  updateStock,
} = require("../controllers/product.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, authorize("admin"), createProduct);
router.get("/", getAllProducts);
router.get("/low-stock", protect, getLowStockProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProductById);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.put("/:id/stock", protect, updateStock);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
