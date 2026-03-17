const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      required: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

module.exports = mongoose.model("Product", productSchema);