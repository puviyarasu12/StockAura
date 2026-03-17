const Product = require("../models/Product");
const InventoryLog = require("../models/InventoryLog");
const { cloudinary, ensureCloudinaryConfig } = require("../config/cloudinary");

const uploadImageToCloudinary = async (fileBuffer) => {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "inventory-products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

const createProduct = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: "Invalid or missing request body. Ensure Content-Type: application/json or multipart/form-data for file uploads" });
    }
    const { name, description, category, supplier, barcode, quantity, lowStockThreshold, expiryDate, price } = req.body;
    const imageFile = req.file;

    if (!name || !category || !supplier || quantity === undefined || !price) {
      return res.status(400).json({ message: "Name, category, supplier, quantity, and price are required" });
    }

    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(409).json({ message: "Product with this barcode already exists" });
      }
    }

    let imageUrl = null;
    if (imageFile) {
      const uploadResult = await uploadImageToCloudinary(imageFile.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const product = await Product.create({
      name,
      description,
      category,
      supplier,
      barcode,
      quantity,
      lowStockThreshold: lowStockThreshold || 10,
      expiryDate,
      price,
      imageUrl,
    });

    await product.populate(["category", "supplier"]);

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Product barcode already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate(["category", "supplier"]).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Products fetched successfully",
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate(["category", "supplier"]);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, lowStockThreshold, expiryDate, price } = req.body;
    const imageFile = req.file;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (quantity !== undefined) product.quantity = quantity;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (expiryDate) product.expiryDate = expiryDate;
    if (price) product.price = price;

    if (imageFile) {
      const uploadResult = await uploadImageToCloudinary(imageFile.buffer);
      product.imageUrl = uploadResult.secure_url;
    }

    await product.save();
    await product.populate(["category", "supplier"]);

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Product barcode already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }).populate(["category", "supplier"]);

    return res.status(200).json({
      message: "Low stock products fetched successfully",
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({ barcode }).populate(["category", "supplier"]);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity, reason } = req.body;

    if (!action || quantity === undefined) {
      return res.status(400).json({ message: "Action and quantity are required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const validActions = ["added", "removed", "sold", "adjusted"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const previousQuantity = product.quantity;

    if (action === "added") {
      product.quantity += quantity;
    } else if (action === "removed" || action === "sold") {
      if (product.quantity < quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      product.quantity -= quantity;
    } else if (action === "adjusted") {
      product.quantity = quantity;
    }

    await product.save();

    // Log the inventory change
    await InventoryLog.create({
      product: id,
      action,
      quantity,
      reason: reason || "",
      performedBy: req.user._id,
    });

    await product.populate(["category", "supplier"]);

    return res.status(200).json({
      message: "Stock updated successfully",
      product,
      previousQuantity,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getProductByBarcode,
  updateStock,
};
