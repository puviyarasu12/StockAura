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
const { upload } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/", protect, upload.single("image"), createProduct);
router.get("/", getAllProducts);
router.get("/low-stock", protect, getLowStockProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProductById);
router.put("/:id", protect, upload.single("image"), updateProduct);
router.put("/:id/stock", protect, updateStock);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
