const Product = require("../models/Product");
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
      },
    );

    stream.end(fileBuffer);
  });
};

const createProduct = async (req, res) => {
  try {
    const { name, price, barcode, expiryDate, category } = req.body;
    const imageFile = req.file;

    if (!name || !barcode || !expiryDate || !category || !imageFile) {
      return res.status(400).json({ message: "Missing required product fields" });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid non-negative number" });
    }

    const uploadResult = await uploadImageToCloudinary(imageFile.buffer);

    const product = await Product.create({
      name,
      price: parsedPrice,
      barcode,
      expiryDate,
      imageUrl: uploadResult.secure_url,
      category,
      quantity: 0,
    });

    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Product barcode already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getAllProducts = async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, barcode, expiryDate, imageUrl, category } = req.body;
    const imageFile = req.file;

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Price must be a valid non-negative number" });
    }

    let nextImageUrl = imageUrl;
    if (imageFile) {
      const uploadResult = await uploadImageToCloudinary(imageFile.buffer);
      nextImageUrl = uploadResult.secure_url;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: parsedPrice,
        barcode,
        expiryDate,
        imageUrl: nextImageUrl,
        category,
      },
      { new: true, runValidators: true },
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ message: "Product updated", product });
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

    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLowStockProducts = async (_req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body;

    if (!action || quantity === undefined) {
      return res.status(400).json({ message: "Action and quantity are required" });
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({ message: "Quantity must be a valid non-negative number" });
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
      product.quantity += parsedQuantity;
    } else if (action === "removed" || action === "sold") {
      if (product.quantity < parsedQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      product.quantity -= parsedQuantity;
    } else if (action === "adjusted") {
      product.quantity = parsedQuantity;
    }

    await product.save();

    return res.status(200).json({
      message: "Stock updated",
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
